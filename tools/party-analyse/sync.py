#!/usr/bin/env python3
"""
Bilnett Party-analyse: henter loggene fra telefonen når den er koblet til, og lager rapporten.

Kjøres hvert minutt av macOS (LaunchAgent, se install.sh). Gjør ingenting når telefonen ikke er
koblet til. Henter bare filer som er nye eller har endret størrelse.

Dataene havner i ~/Vibe-kode/Projects/Bilnett-AA-assets/party-analyse/ (aldri i git-repoet,
det er offentlig og loggene inneholder sangtitler).

Kjør for hånd:  python3 tools/party-analyse/sync.py [--open]
"""
import fcntl
import json
import os
import subprocess
import sys
import time

ADB = "/opt/homebrew/bin/adb"
PKG = "no.espen.bilnett.aa"
DATA = os.path.expanduser("~/Vibe-kode/Projects/Bilnett-AA-assets/party-analyse")
RAW = os.path.join(DATA, "raw")
STATE = os.path.join(DATA, "state.json")
REMOTE_DIRS = ["files/rave-analyse", "files/rave-analyse/fft"]
REMOTE_FILES = ["files/song-marks.json", "files/genre-book.json"]
VENV_PY = os.path.join(DATA, "venv", "bin", "python")
STYLE_BOOK = os.path.join(DATA, "style-book.json")
NOTIFY_EVERY_S = 10 * 60


def log(msg):
    os.makedirs(DATA, exist_ok=True)
    with open(os.path.join(DATA, "sync.log"), "a") as f:
        f.write(time.strftime("%Y-%m-%d %H:%M:%S ") + msg + "\n")


def adb(*args, timeout=60):
    return subprocess.run([ADB, *args], capture_output=True, timeout=timeout)


def device_ok():
    try:
        r = adb("get-state", timeout=25)  # the first call may start the adb server
        return r.returncode == 0 and r.stdout.strip() == b"device"
    except Exception:
        return False


def listing(remote_dir):
    """{name: size} for the files in a folder of the app (run-as works because the app is a debug build)."""
    r = adb("exec-out", "run-as", PKG, "ls", "-l", remote_dir)
    out = {}
    if r.returncode != 0:
        log(f"ls {remote_dir} feilet: {r.stderr.decode('utf-8', 'replace').strip()[:200]}")
        return out
    for line in r.stdout.decode("utf-8", "replace").splitlines():
        parts = line.split(None, 7)
        if len(parts) == 8 and parts[0].startswith("-"):
            try:
                out[parts[7]] = int(parts[4])
            except ValueError:
                pass
    return out


def pull(remote, local):
    r = adb("exec-out", "run-as", PKG, "cat", remote, timeout=300)
    if r.returncode != 0 or not r.stdout:
        return False
    os.makedirs(os.path.dirname(local), exist_ok=True)
    tmp = local + ".tmp"
    with open(tmp, "wb") as f:
        f.write(r.stdout)
    os.replace(tmp, local)
    return True


def line_count(path):
    try:
        with open(path, encoding="utf-8", errors="replace") as f:
            return sum(1 for line in f if not line.startswith("#"))
    except OSError:
        return 0


def notify(text):
    subprocess.run(["osascript", "-e", f'display notification "{text}" with title "Bilnett Party-analyse"'],
                   capture_output=True)


def teach_and_push(state, genre_book_changed):
    """Runs the teacher when the phone's song list changed, and pushes style-book.json when it is
    newer than the last successful push (a failed push is tried again next run)."""
    if not os.path.exists(VENV_PY):
        return
    here = os.path.dirname(os.path.abspath(__file__))
    if genre_book_changed:
        try:
            subprocess.run([VENV_PY, os.path.join(here, "style_teacher.py")], capture_output=True, timeout=1800)
        except Exception as e:
            log(f"stil-lærer feilet: {e!r}")
    if not os.path.exists(STYLE_BOOK) or os.path.getmtime(STYLE_BOOK) <= state.get("styleBookPushed", 0):
        return
    # Binary-safe and atomic: write a .tmp in the app's files, then rename (the app may read any time).
    with open(STYLE_BOOK, "rb") as f:
        # `adb shell` with stdin (no terminal) passes bytes unchanged (checked with shasum, incl. æøå);
        # `adb exec-in` did not run the run-as shell. Write a .tmp first, then rename (atomic).
        r = subprocess.run([ADB, "shell", f"run-as {PKG} sh -c 'cat > files/style-book.json.tmp && "
                                          "mv files/style-book.json.tmp files/style-book.json'"],
                           stdin=f, capture_output=True, timeout=60)
    # Trust the file on the phone, not the exit code: same size as ours?
    on_phone = listing("files").get("style-book.json")
    if r.returncode != 0 or on_phone != os.path.getsize(STYLE_BOOK):
        log(f"push av style-book feilet (rc {r.returncode}, {on_phone} byte på telefonen): "
            f"{r.stderr.decode('utf-8', 'replace').strip()[:200]}")
        return
    state["styleBookPushed"] = os.path.getmtime(STYLE_BOOK)
    log("style-book sendt til telefonen")


def main():
    os.makedirs(RAW, exist_ok=True)
    lock = open(os.path.join(DATA, ".lock"), "w")
    try:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except OSError:
        return  # a previous run is still busy
    if not device_ok():
        return

    try:
        state = json.load(open(STATE))
    except Exception:
        state = {}
    seen = state.get("sizes", {})
    sizes = {}
    pulled = 0
    for remote_dir in REMOTE_DIRS:
        local_dir = os.path.join(RAW, os.path.relpath(remote_dir, "files/rave-analyse"))
        for name, size in listing(remote_dir).items():
            remote = f"{remote_dir}/{name}"
            sizes[remote] = size
            local = os.path.normpath(os.path.join(local_dir, name))
            if os.path.exists(local) and os.path.getsize(local) == size:
                continue
            # The FFT recording of the song playing right now keeps growing (1–2 MB): fetch it only
            # once its size has stopped changing between two runs.
            if name.endswith(".fft.gz") and seen.get(remote) != size:
                continue
            if pull(remote, local):
                pulled += 1
    state["sizes"] = sizes
    gb_path = os.path.join(RAW, "genre-book.json")
    gb_before = open(gb_path, "rb").read() if os.path.exists(gb_path) else b""
    for remote in REMOTE_FILES:
        pull(remote, os.path.join(RAW, os.path.basename(remote)))
    gb_changed = os.path.exists(gb_path) and open(gb_path, "rb").read() != gb_before

    # Style teacher (Mac only): new songs in the phone's genre list → style + BPM → push to the phone.
    teach_and_push(state, gb_changed)
    if pulled == 0 and "--open" not in sys.argv:
        json.dump(state, open(STATE, "w"))
        return

    # Report (always rebuilt when something new came in).
    here = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, here)
    import report  # noqa: E402
    path = report.build(RAW, os.path.join(DATA, "rapport.html"))
    log(f"hentet {pulled} filer, rapport: {path}")

    # Notify only when there are new songs or new taps, and not more than every 10 minutes.
    songs = line_count(os.path.join(RAW, "sammendrag.txt"))
    taps = max(0, line_count(os.path.join(RAW, "feedback.csv")) - 1)
    new_songs = songs - state.get("songs", 0)
    new_taps = taps - state.get("taps", 0)
    if (new_songs > 0 or new_taps > 0) and time.time() - state.get("notified", 0) > NOTIFY_EVERY_S:
        notify(f"{max(new_songs, 0)} nye sanger og {max(new_taps, 0)} nye trykk. Rapporten er klar.")
        state.update(songs=songs, taps=taps, notified=time.time())
    json.dump(state, open(STATE, "w"))
    if "--open" in sys.argv:
        subprocess.run(["open", path])


if __name__ == "__main__":
    try:
        main()
    except Exception as e:  # never crash-loop under launchd
        log(f"feil: {e!r}")

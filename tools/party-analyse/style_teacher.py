#!/usr/bin/env python3
"""
Bilnett stil-lærer: lar en ferdigtrent AI (Essentia Discogs-EffNet, 400 Discogs-stiler) lytte på
30 s smakebiten av hver sang Espen har spilt med Party, og lagrer stil + BPM per sang.

Kjører bare på Mac-en (modellens lisens er CC BY-NC-SA – den skal aldri ligge i repoet/appen).
Telefonen får bare svaret: style-book.json (pushes av sync.py).

Krever venv:  ~/Vibe-kode/Projects/Bilnett-AA-assets/party-analyse/venv  (Python 3.12 + essentia-tensorflow)
Kjør:         <venv>/bin/python tools/party-analyse/style_teacher.py [--all]
"""
import json
import os
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request

DATA = os.path.expanduser("~/Vibe-kode/Projects/Bilnett-AA-assets/party-analyse")
RAW = os.path.join(DATA, "raw")
MODELS = os.path.join(DATA, "models")
PREVIEWS = os.path.join(DATA, "previews")
BOOK = os.path.join(DATA, "style-book.json")
RETRY_AFTER_S = 30 * 24 * 3600
VERSION_WORDS = ["slowed", "sped up", "speed up", "nightcore", "remix", "reverb", "live", "acoustic", "instrumental"]
UA = {"User-Agent": "bilnett-style-teacher/1.0"}
# Mood heads (Essentia, same Discogs-EffNet embedding): our key, model name, the «yes» class.
MOOD_HEADS = [("aggressive", "mood_aggressive", "aggressive"), ("happy", "mood_happy", "happy"),
              ("party", "mood_party", "party"), ("relaxed", "mood_relaxed", "relaxed"), ("sad", "mood_sad", "sad"),
              ("dance", "danceability", "danceable"), ("voice", "voice_instrumental", "voice"),
              ("bright", "timbre", "bright"), ("themes", "mtg_jamendo_moodtheme", None)]
HARD_STYLES = ["Hardstyle", "Hardcore", "Gabber", "Jumpstyle", "Speedcore", "Hard Trance", "Hands Up"]


def log(msg):
    print(msg, flush=True)


def get_json(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode("utf-8"))


def simple(s):
    s = unicodedata.normalize("NFKD", s or "").lower()
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def words(s):
    return set(simple(s).split())


def similar(a, b):
    """Share of the words in a that are also in b (0..1)."""
    wa, wb = words(a), words(b)
    return len(wa & wb) / len(wa) if wa else 0.0


def version_ok(phone_title, cand_title):
    """«slowed», «remix» … must match: never use the original for a slowed version or the other way round."""
    p, c = simple(phone_title), simple(cand_title)
    return all((w in p) == (w in c) for w in VERSION_WORDS)


def main_artist(artist):
    # The player adds badges like «Pop Smoke • Lossless» (2026-11-10): not part of the name.
    artist = re.sub(r"\s*[•·]\s*(hi-?res\s+)?(lossless|dolby atmos|atmos|spatial audio|hi-?res|explicit|e)\s*$", "",
                    artist or "", flags=re.I)
    return re.split(r",|&| feat\.? | ft\.? | x ", artist)[0].strip()


def candidates(title, artist):
    """(source, title, artist, durMs, previewUrl) from iTunes, then Deezer. None = network trouble
    (then the song is simply tried again next time, not marked as «no preview»)."""
    out = []
    errors = 0
    term = f"{main_artist(artist)} {re.sub(r'[(\\[].*?[)\\]]', ' ', title)}".strip()
    try:
        j = get_json("https://itunes.apple.com/search?" + urllib.parse.urlencode(
            {"term": term, "entity": "song", "limit": 15, "country": "NO"}))
        for r in j.get("results", []):
            if r.get("previewUrl"):
                out.append(("itunes", r.get("trackName", ""), r.get("artistName", ""), int(r.get("trackTimeMillis") or 0), r["previewUrl"]))
    except Exception as e:
        errors += 1
        log(f"  itunes feil: {e}")
    try:
        j = get_json("https://api.deezer.com/search?" + urllib.parse.urlencode({"q": term, "limit": 15}))
        for r in j.get("data", []):
            if r.get("preview"):
                out.append(("deezer", r.get("title", ""), (r.get("artist") or {}).get("name", ""), int(r.get("duration") or 0) * 1000, r["preview"]))
    except Exception as e:
        errors += 1
        log(f"  deezer feil: {e}")
    return None if errors == 2 else out


def strip_tags(t):
    """Title without (…)/[…] and without « - Hardstyle»-style suffixes."""
    t = re.sub(r"[(\[].*?[)\]]", " ", t or "")
    return re.split(r" - ", t)[0]


def pick(title, artist, dur_ms, cands):
    best, best_score = None, 0.0
    for c in cands:
        src, ct, ca, cd, url = c
        if not version_ok(title, ct):
            continue
        if dur_ms > 0 and cd > 0 and abs(cd - dur_ms) > 0.15 * dur_ms:
            continue
        # Title both ways (so «Darkness» ≠ «Angel Of Darkness»), and the artist must match too.
        pt, cc = strip_tags(title), strip_tags(ct)
        t_sim = min(similar(pt, cc), similar(cc, pt))
        a_sim = max(similar(main_artist(artist), ca), similar(main_artist(ca), artist))
        if t_sim < .6 or a_sim < .5:
            continue
        s = .6 * t_sim + .4 * a_sim
        if dur_ms > 0 and cd > 0:
            s += .2 * (1 - abs(cd - dur_ms) / (0.15 * dur_ms))
        if s > best_score:
            best, best_score = c, s
    return (best, best_score) if best and best_score >= .55 else (None, best_score)


_models = None


def models():
    global _models
    if _models is None:
        import essentia.standard as es
        emb = es.TensorflowPredictEffnetDiscogs(graphFilename=os.path.join(MODELS, "discogs-effnet-bs64-1.pb"),
                                                output="PartitionedCall:1")
        head = es.TensorflowPredict2D(graphFilename=os.path.join(MODELS, "genre_discogs400-discogs-effnet-1.pb"),
                                      input="serving_default_model_Placeholder", output="PartitionedCall:0")
        classes = json.load(open(os.path.join(MODELS, "genre_discogs400-discogs-effnet-1.json")))["classes"]
        # Mood heads on the same embedding: (our name, model, index of the «yes» class or None = all classes)
        moods = []
        for key, name, positive in MOOD_HEADS:
            meta = json.load(open(os.path.join(MODELS, f"{name}-discogs-effnet-1.json")))
            out = next(o["name"] for o in meta["schema"]["outputs"] if o.get("output_purpose") == "predictions")
            model = es.TensorflowPredict2D(graphFilename=os.path.join(MODELS, f"{name}-discogs-effnet-1.pb"),
                                           input=meta["schema"]["inputs"][0]["name"], output=out.rsplit(":", 1)[0])
            idx = meta["classes"].index(positive) if positive else None
            moods.append((key, model, idx, meta["classes"]))
        tempo = es.TempoCNN(graphFilename=os.path.join(MODELS, "deeptemp-k16-3.pb"))
        _models = (emb, head, classes, moods, tempo)
    return _models


def analyse(path):
    import essentia.standard as es
    import numpy as np
    emb, head, classes, mood_models, tempo_cnn = models()
    audio16 = es.MonoLoader(filename=path, sampleRate=16000, resampleQuality=4)()
    embeddings = emb(audio16)
    preds = head(embeddings).mean(axis=0)
    mood = {}
    for key, model, idx, mclasses in mood_models:
        p = model(embeddings).mean(axis=0)
        if idx is None:   # the 56 Jamendo themes: keep the 5 strongest
            mood[key] = [[mclasses[i], round(float(p[i]), 3)] for i in np.argsort(p)[::-1][:5]]
        else:
            mood[key] = round(float(p[idx]), 3)
    top = np.argsort(preds)[::-1][:5]
    styles = [[classes[i], round(float(preds[i]), 3)] for i in top]
    # Tempo: TempoCNN is the main answer (2026-11-10: right where RhythmExtractor was off – 107 vs 152,
    # 75 vs 150, 172 vs 87 – and equal elsewhere). RhythmExtractor is the cross-check: agreeing (also at
    # ×2/×½) = very sure; disagreeing = still trust the CNN, but less.
    cnn_bpm = float(tempo_cnn(es.MonoLoader(filename=path, sampleRate=11025)())[0])
    audio44 = es.MonoLoader(filename=path, sampleRate=44100)()
    re_bpm, _, re_conf, _, _ = es.RhythmExtractor2013(method="multifeature")(audio44)
    agree = any(abs(float(re_bpm) - cnn_bpm * f) <= .03 * cnn_bpm * f for f in (1, 2, .5))
    conf = max(float(re_conf), 2.0) if agree else 1.5
    return styles, round(cnn_bpm, 1), round(conf, 2), mood


def download(url, key):
    os.makedirs(PREVIEWS, exist_ok=True)
    ext = ".m4a" if ".m4a" in url else ".mp3"
    path = os.path.join(PREVIEWS, re.sub(r"[^a-z0-9]+", "_", key)[:80] + ext)
    if not os.path.exists(path):
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=30) as r, open(path + ".tmp", "wb") as f:
            f.write(r.read())
        os.replace(path + ".tmp", path)  # never reuse a half download
    return path


def songs():
    """Songs the phone has listed (with the phone's own key and length)."""
    try:
        book = json.load(open(os.path.join(RAW, "genre-book.json")))
    except Exception:
        return []
    return [(e["key"], e.get("title", ""), e.get("artist", ""), int(e.get("durMs") or 0)) for e in book if e.get("key")]


def csv_songs():
    """Check mode (--csv): songs from the analysis logs on the Mac, keyed «csv:artist – title».
    Only for testing the teacher; the phone looks songs up by its own key from genre-book.json."""
    import glob
    seen = {}
    for path in sorted(glob.glob(os.path.join(RAW, "*.csv"))):
        if os.path.basename(path) == "feedback.csv":
            continue
        with open(path, encoding="utf-8", errors="replace") as f:
            first = f.readline()
        if first.startswith("# ") and " – " in first:
            artist, title = first[2:].strip().split(" – ", 1)
            seen["csv:" + first[2:].strip()] = (title, artist)
    return [(k, t, a, 0) for k, (t, a) in seen.items()]


def save(out):
    tmp = BOOK + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    os.replace(tmp, BOOK)


def run(redo_all=False, use_csv=False):
    try:
        out = json.load(open(BOOK))
    except Exception:
        out = {}
    now = time.time()
    changed = 0
    for key, title, artist, dur in (csv_songs() if use_csv else songs()):
        old = out.get(key)
        if old and not redo_all and ((old.get("styles") and "mood" in old) or
                                     (not old.get("styles") and now - old.get("tried", 0) < old.get("retryS", RETRY_AFTER_S))):
            continue
        log(f"{artist} – {title}")
        cands = candidates(title, artist)
        if cands is None:
            log("  ingen nett, prøver neste gang")
            continue
        best, score = pick(title, artist, dur, cands)
        if not best:
            out[key] = {"styles": None, "tried": now, "why": f"ingen smakebit med samme versjon (beste {score:.2f})"}
            log(f"  ingen godkjent smakebit")
        else:
            src, ct, ca, cd, url = best
            try:
                styles, bpm, conf, mood = analyse(download(url, key))
                out[key] = {"styles": styles, "bpm": bpm, "bpmConf": conf, "mood": mood,
                            "match": {"src": src, "title": ct, "artist": ca, "durMs": cd, "score": round(score, 2)}, "at": now}
                log(f"  {styles[0][0]} {styles[0][1]:.2f} · {bpm} BPM · aggr {mood['aggressive']:.2f} glad {mood['happy']:.2f} "
                    f"tema {', '.join(t[0] for t in mood['themes'][:3])} ({src}: {ct})")
            except Exception as e:
                out[key] = {"styles": None, "tried": now, "retryS": 24 * 3600, "why": f"analyse feilet: {e}"}
                log(f"  analyse feilet: {e}")
        changed += 1
        save(out)  # after every song: nothing is lost if the run is stopped
        time.sleep(.3)  # be nice to the APIs
    log(f"ferdig: {changed} nye/oppdaterte, {sum(1 for v in out.values() if v.get('styles'))} sanger med stil")
    return changed


if __name__ == "__main__":
    run("--all" in sys.argv, "--csv" in sys.argv)

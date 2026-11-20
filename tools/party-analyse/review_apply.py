#!/usr/bin/env python3
"""
Gjør rettelsene fra rettings-verktøyet (corrections.json) til fasit: en CSV per sang med part_by=review og «# kilde: review»
(PartyReplayTest leser den som Espens fasit, uten reaksjonstid-forskyvningen som live-trykk får).

Originalen flyttes til raw/pre-review/ først, så ingenting går tapt. Data havner aldri i git.

  python3 tools/party-analyse/review_apply.py [corrections.json]      (standard: nyeste i ~/Downloads)
"""
import csv
import glob
import json
import os
import shutil
import sys

DATA = os.path.expanduser("~/Vibe-kode/Projects/Bilnett-AA-assets/party-analyse")
RAW = os.path.join(DATA, "raw")


def newest_corrections():
    files = sorted(glob.glob(os.path.expanduser("~/Downloads/corrections*.json")), key=os.path.getmtime)
    return files[-1] if files else None


def slots_for(song_id):
    """old-del og tittel per slag fra slots-all.csv (for auto_part-kolonnen)."""
    rows = [r for r in csv.DictReader(open(os.path.join(DATA, "slots-all.csv"))) if r["song"] == song_id]
    return rows


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else newest_corrections()
    if not path or not os.path.exists(path):
        sys.exit("Fant ingen corrections.json (lagre den fra rettings-verktøyet først).")
    data = json.load(open(path))
    os.makedirs(os.path.join(RAW, "pre-review"), exist_ok=True)
    written = skipped = 0
    for song_id, s in data["songs"].items():
        fft = os.path.join(RAW, "fft", song_id + ".fft.gz")
        if not os.path.exists(fft):
            print(f"hopper over {song_id}: finner ikke opptaket")
            continue
        if not s.get("edited"):
            skipped += 1  # «godta» alene er ikke menneskelig fasit (ellers blir læreren sin egen fasit)
            continue
        rows = slots_for(song_id)
        if len(rows) != len(s["t"]) or len(s["labels"]) != len(s["t"]):
            print(f"hopper over {song_id}: antall slag stemmer ikke ({len(rows)} mot {len(s['t'])}) – lag review.html på nytt")
            continue
        target = os.path.join(RAW, song_id + ".csv")
        if os.path.exists(target):
            backup = os.path.join(RAW, "pre-review", song_id + ".csv")
            if os.path.exists(backup):  # aldri overskriv en eldre sikkerhetskopi (den kan være Espens opprinnelige fasit)
                backup = os.path.join(RAW, "pre-review", f"{song_id}.{int(os.path.getmtime(target))}.csv")
            shutil.copy2(target, backup)
        with open(target, "w", encoding="utf-8") as f:
            f.write(f"# {s['title']}\n# kilde: review\n")
            f.write("pos_s,part,drop,genre,sub,fps,effects_on,auto_part,auto_drop,part_by\n")
            for r, t, part in zip(rows, s["t"], s["labels"]):
                if not part:
                    continue  # tomt forblir tomt (slag før første trykk er ikke merket)
                f.write(f"{t / 1000:.1f},{part},,,,60,1,{r['old']},,review\n")
        written += 1
    print(f"{written} sanger skrevet som fasit (part_by=review), {skipped} godkjent uten endring (ikke fasit). Neste: exportAllSlots + analyser.")


if __name__ == "__main__":
    main()

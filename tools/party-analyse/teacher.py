#!/usr/bin/env python3
"""
«Læreren» (steg C): ser HELE sangen i etterkant og gjetter delene (intro / build-up / drop / breakdown / outro).

Live-lytteren må gjette uten å se fremover. Offline kan vi se hele sangen, og da er struktur mye lettere:
  1. Målingene per slag (slots-all.csv fra PartyReplayTest.exportAllSlots) gjøres selvrelative: hvor høyt er dette i DENNE sangen.
  2. Foote-novelty på selvlikheten finner hvor sangen skifter karakter (del-grenser), snappet til frasenettet (8/16/32 takter).
  3. Hver del får fylde (den svakeste av sub og lys klang) målt mot sangens egne deler; fulle deler = drop,
     tomme deler rett før et drop med stigende lys klang/snare = build-up, ellers breakdown; før første drop = intro.
Ingen faste dB-grenser og ingen Essentia (modellene deres er CC BY-NC-SA) — bare våre egne målinger.

Lærerens svar er HINT (forslag til rettings-verktøyet og svake merker), aldri fasit. Den måles mot Espens merker:
  python3 teacher.py --eval          # tabell mot fasit (alle merkede sanger + drop-musikk spesielt)
  python3 teacher.py --write         # skriver teacher-slots.csv (en rad per slag: lærerens del + sikkerhet)
"""
import csv
import os
import sys
from collections import OrderedDict

import numpy as np

DATA = os.path.expanduser("~/Vibe-kode/Projects/Bilnett-AA-assets/party-analyse")
CLASSES = ["INTRO", "BUILDUP", "DROP", "BREAKDOWN"]
BANDS = [f"b{i}" for i in range(12)]


def load(path=None):
    rows = list(csv.DictReader(open(path or os.path.join(DATA, "slots-all.csv"))))
    songs = OrderedDict()
    for r in rows:
        songs.setdefault(r["song"], []).append(r)
    return songs


def col(rows, k):
    return np.array([float(r[k]) for r in rows])


def rel(x, lo=10, hi=90):
    """Selvrelativ posisjon mot sangens egne p10..p90 (0 = stille del, 1 = full del)."""
    a, b = np.percentile(x, [lo, hi])
    return np.clip((x - a) / max(b - a, 1e-3), -0.5, 1.5)


def smooth(x, k):
    if k <= 1:
        return x
    pad = np.pad(x, (k // 2, k - 1 - k // 2), mode="edge")
    return np.convolve(pad, np.ones(k) / k, mode="valid")


def features(rows):
    sub, air, pres = col(rows, "subDb"), col(rows, "airDb"), col(rows, "presDb")
    kick, snare = col(rows, "kicks"), col(rows, "snares")
    ps, pa, pp = rel(smooth(sub, 3)), rel(smooth(air, 3)), rel(smooth(pres, 3))
    bright = (pa + pp) / 2
    full = np.minimum(ps, bright)
    bands = np.stack([rel(smooth(col(rows, b), 3)) for b in BANDS], axis=1)
    return dict(ps=ps, pa=pa, pp=pp, bright=bright, full=full, kick=smooth(kick, 4), snare=smooth(snare, 4), bands=bands)


def novelty(F, kernel):
    """Foote: korrelasjon mellom «før» og «etter» langs diagonalen av selvlikhets-matrisen (høy = ny del starter)."""
    X = np.hstack([F["bands"], F["ps"][:, None], F["bright"][:, None], F["full"][:, None], F["kick"][:, None] / 4, F["snare"][:, None] / 4])
    X = (X - X.mean(0)) / (X.std(0) + 1e-6)
    n = len(X); h = kernel
    nov = np.zeros(n)
    for t in range(h, n - h):
        a, b = X[t - h:t], X[t:t + h]
        within = (np.linalg.norm(a - a.mean(0), axis=1).mean() + np.linalg.norm(b - b.mean(0), axis=1).mean()) / 2
        between = np.linalg.norm(a.mean(0) - b.mean(0))
        nov[t] = between / (within + 1e-3)
    return nov


def peaks(nov, min_dist, z=0.8):
    """Topper som skiller seg ut mot sangens egen novelty (snitt + z·std), med minste avstand."""
    thr = nov.mean() + z * nov.std()
    cand = [t for t in range(1, len(nov) - 1) if nov[t] >= thr and nov[t] >= nov[t - 1] and nov[t] >= nov[t + 1]]
    cand.sort(key=lambda t: -nov[t])
    keep = []
    for t in cand:
        if all(abs(t - k) >= min_dist for k in keep):
            keep.append(t)
    return sorted(keep)


def snap_to_phrases(bounds, n, bar=4, phrase=16):
    """Frasenettet (8/16 takter) stemmes av grensene selv: velg start som gir flest grenser nær et fraserutenett, flytt dem dit."""
    if len(bounds) < 3:
        return bounds
    best, off = -1, 0
    for o in range(phrase * bar):
        step = phrase * bar
        score = sum(1 for b in bounds if min((b - o) % step, step - (b - o) % step) <= 3)
        if score > best:
            best, off = score, o
    step = phrase * bar
    out = []
    for b in bounds:
        d = (b - off) % step
        near = b - d if d <= step - d else b + (step - d)
        out.append(int(near) if abs(near - b) <= 3 and 0 < near < n else b)
    return sorted(set(out))


def segments(F, n):
    nov = novelty(F, 8) + 0.5 * novelty(F, 16)
    bounds = peaks(nov, min_dist=12)
    bounds = snap_to_phrases(bounds, n)
    cuts = [0] + [b for b in bounds if 8 < b < n - 8] + [n]
    # slå sammen veldig korte deler
    merged = [cuts[0]]
    for c in cuts[1:]:
        if c - merged[-1] >= 8 or c == n:
            merged.append(c)
    if merged[-1] != n:
        merged.append(n)
    # Finjuster hver grense til slaget der fylden (sub + lys klang) faktisk hopper, innenfor ±1 takt.
    jump = np.zeros(n)
    for t in range(2, n - 2):
        jump[t] = F["full"][t:t + 2].mean() - F["full"][t - 2:t].mean()
    for i in range(1, len(merged) - 1):
        lo, hi = max(merged[i] - 4, merged[i - 1] + 4), min(merged[i] + 5, merged[i + 1] - 4)
        if hi > lo:
            merged[i] = lo + int(np.argmax(np.abs(jump[lo:hi])))
    return list(zip(merged[:-1], merged[1:])), nov


def otsu(vals, weights):
    """Skiller «full» fra «ikke full» ut fra delenes egne verdier (ingen fast grense)."""
    order = np.argsort(vals)
    v, w = np.array(vals)[order], np.array(weights, float)[order]
    best, thr = -1, np.median(v)
    for i in range(1, len(v)):
        w0, w1 = w[:i].sum(), w[i:].sum()
        if w0 == 0 or w1 == 0:
            continue
        m0, m1 = (v[:i] * w[:i]).sum() / w0, (v[i:] * w[i:]).sum() / w1
        between = w0 * w1 * (m1 - m0) ** 2
        if between > best:
            best, thr = between, (v[i - 1] + v[i]) / 2
    return thr


def slope(x):
    if len(x) < 4:
        return 0.0
    t = np.arange(len(x)) - (len(x) - 1) / 2
    return float((t * (x - x.mean())).sum() / (t * t).sum())


def teach(rows):
    """Returnerer (liste med del per slag, liste med sikkerhet 0..1 per slag, deler som (start, slutt, navn))."""
    n = len(rows)
    F = features(rows)
    segs, _ = segments(F, n)
    means = [float(F["full"][a:b].mean()) for a, b in segs]
    wts = [b - a for a, b in segs]
    spread = float(np.percentile(F["full"], 90) - np.percentile(F["full"], 10))
    labels = ["BREAKDOWN"] * len(segs); conf = [0.5] * len(segs)
    if len(segs) >= 2 and spread >= 0.15:
        thr = otsu(means, wts)
        for i, m in enumerate(means):
            if m >= thr:
                labels[i] = "DROP"; conf[i] = min(1.0, 0.5 + abs(m - thr) * 2)
            else:
                conf[i] = min(1.0, 0.5 + abs(m - thr) * 2)
    else:
        labels = ["INTRO"] * len(segs)  # ingen struktur å høre (jevn sang)
    # ikke-fulle deler: intro før første drop, build-up rett før drop når lav sub og stigende lys klang/snare
    first_drop = next((i for i, l in enumerate(labels) if l == "DROP"), None)
    final = []  # (start, slutt, navn, sikkerhet)
    for i, (a, b) in enumerate(segs):
        name = labels[i]
        if name != "DROP":
            nxt_drop = i + 1 < len(segs) and labels[i + 1] == "DROP"
            if first_drop is not None and i < first_drop and not nxt_drop:
                name = "INTRO"
            elif nxt_drop:
                # den siste delen (opptil 16 takter) før et drop: stiger det?
                tail = max(a, b - 64)
                rise = slope(F["bright"][tail:b]) * 16 + slope(F["snare"][tail:b]) * 8
                lowsub = F["ps"][tail:b].mean() < np.percentile(F["ps"], 60)
                if rise > 0.03 and lowsub:
                    if tail > a:
                        final.append((a, tail, "INTRO" if first_drop is not None and i < first_drop else "BREAKDOWN", conf[i] * 0.8))
                    final.append((tail, b, "BUILDUP", min(1.0, 0.5 + rise)))
                    continue
                name = "INTRO" if first_drop is not None and i < first_drop else "BREAKDOWN"
            elif first_drop is not None and i > max(j for j, l in enumerate(labels) if l == "DROP") and i == len(segs) - 1:
                name = "BREAKDOWN"
        final.append((a, b, name, conf[i]))
    part = ["BREAKDOWN"] * n; c = [0.5] * n
    for a, b, name, cf in final:
        for t in range(a, b):
            part[t] = name; c[t] = cf
    return part, c, final


# ---- Måling mot fasit (samme tanke som PartyReplayTest.evaluate) ----

def evaluate(songs, pick=lambda name: True, label="", predict=teach, lag_s=0.0):
    tot = {k: {} for k in CLASSES}
    found = extra = trueDrops = caught = sections = found3 = extra3 = 0
    secs = 0.0
    for name, rows in songs.items():
        if not pick(name):
            continue
        truth = [r["truth"] or "" for r in rows]
        truth = ["BREAKDOWN" if t == "OUTRO" else t for t in truth]
        if not any(truth):
            continue
        part = predict(rows)[0]
        pos = col(rows, "pos_ms"); slot = col(rows, "slot_ms")
        if lag_s:  # Espen trykker etter at delen starter: fasiten flyttes lag_s tidligere (samme for alle systemer)
            at = np.searchsorted(pos, pos + lag_s * 1000).clip(0, len(rows) - 1)
            truth = [truth[j] for j in at]
        dur = np.minimum(np.diff(np.append(pos, pos[-1] + slot[-1])), 2000) / 1000.0
        first = next(i for i, t in enumerate(truth) if t)
        bar = float(np.median(slot)) * 4
        for i in range(first, len(rows)):
            if truth[i] in CLASSES:
                tot[truth[i]][part[i] if part[i] in CLASSES else "BREAKDOWN"] = tot[truth[i]].get(part[i] if part[i] in CLASSES else "BREAKDOWN", 0) + dur[i]
        secs += dur[first:].sum()
        td = [pos[i] for i in range(first + 1, len(rows)) if truth[i] == "DROP" and truth[i - 1] != "DROP"]
        ad = [pos[i] for i in range(first, len(rows)) if part[i] == "DROP" and (i == 0 or part[i - 1] != "DROP")]
        trueDrops += len(td)
        found += sum(any(abs(a - d) <= bar for a in ad) for d in td)
        extra += sum(all(abs(a - d) > bar for d in td) for a in ad)
        found3 += sum(any(abs(a - d) <= 3000 for a in ad) for d in td)
        extra3 += sum(all(abs(a - d) > 3000 for d in td) for a in ad)
        i = first
        while i < len(rows):
            if truth[i] == "BUILDUP":
                j = i
                while j < len(rows) and truth[j] == "BUILDUP":
                    j += 1
                sections += 1
                caught += sum(dur[t] for t in range(i, j) if part[t] == "BUILDUP") >= 2.0
                i = j
            else:
                i += 1
    per = {k: tot[k].get(k, 0) / max(sum(tot[k].values()), 1e-9) for k in CLASSES}
    ok = sum(tot[k].get(k, 0) for k in CLASSES); allt = sum(sum(tot[k].values()) for k in CLASSES)
    print(f"{label:<26} enig {100*ok/max(allt,1e-9):3.0f} %  I {100*per['INTRO']:3.0f}  B {100*per['BUILDUP']:3.0f}  "
          f"D {100*per['DROP']:3.0f}  Br {100*per['BREAKDOWN']:3.0f}  drop ±1 takt {found}/{trueDrops} ±3 s {found3}/{trueDrops}  "
          f"falske(3 s) {extra3/max(secs/60,1e-9):.2f}/min ({extra3})  build-up {caught}/{sections}")
    return ok / max(allt, 1e-9)


def main():
    songs = load()
    if "--write" in sys.argv:
        out = open(os.path.join(DATA, "teacher-slots.csv"), "w")
        out.write("song,pos_ms,teacher,conf\n")
        for name, rows in songs.items():
            part, conf, _ = teach(rows)
            for r, p, c in zip(rows, part, conf):
                out.write(f"{name},{r['pos_ms']},{p},{c:.2f}\n")
        print("teacher-slots.csv skrevet")
        return
    hard = lambda n: "hardstyle" in n
    LAG = 1.6  # målt: median (Espens trykk − lærerens drop) på 12 drops, kvartiler 0,8–2,8 s
    old_pred = lambda rows: ([r["old"] if r["old"] in CLASSES else "BREAKDOWN" for r in rows], None)
    for lag in (0.0, LAG):
        print(f"\nDrop-musikk (hardstyle i navnet, samme 9 som baseline), fasit flyttet {lag:.1f} s:")
        evaluate(songs, hard, "gammel hjerne", old_pred, lag)
        evaluate(songs, hard, "læreren (offline)", lag_s=lag)
        print(f"Alle sanger med fasit, fasit flyttet {lag:.1f} s:")
        evaluate(songs, lambda n: True, "gammel hjerne", old_pred, lag)
        evaluate(songs, lambda n: True, "læreren (offline)", lag_s=lag)


if __name__ == "__main__":
    main()

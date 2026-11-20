#!/usr/bin/env python3
"""
Steg 3 (lettvekt): lærer build-up av Espens fasit, med målingene fra SongListener (selvrelative per sang).

Input:  listener-features.csv   (PartyReplayTest.exportListenerFeatures – ett slag per rad: fasit, gammel hjerne, målinger)
Test:   én sang utenfor om gangen (leave-one-song-out). Modellen får sannsynlighet for build-up per slag.
Hybrid: den gamle hjernen bestemmer alt, men der den ikke sier DROP og modellen er sikker nok → BUILDUP.
Output: tall (før/etter) til terminalen og hybrid.txt; hybrid-model.json (skalering + vekter) skrives bare med --save.

Kjør: <venv>/bin/python tools/party-analyse/train_listener.py [--save]
"""
import csv
import json
import os
import sys

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.preprocessing import StandardScaler

DATA = os.path.expanduser("~/Vibe-kode/Projects/Bilnett-AA-assets/party-analyse")
BASE = ["posSub", "posFull", "jump", "airRise", "presRise", "noiseRise", "centRise", "snareRatio", "subDelta",
        "airPos", "presPos", "level"]
LAGS = [2, 4, 8]       # slag tilbake (en takt = 4 slag)
CLASSES = ["INTRO", "BUILDUP", "DROP", "BREAKDOWN"]


def load():
    rows = list(csv.DictReader(open(os.path.join(DATA, "listener-features.csv"))))
    rows = [r for r in rows if float(r["range"]) > 0 and r["truth"] in CLASSES + ["OUTRO"]]
    song = np.array([int(r["song"]) for r in rows])
    truth = np.array([("BREAKDOWN" if r["truth"] == "OUTRO" else r["truth"]) for r in rows])
    old = np.array([r["old"] if r["old"] in CLASSES else "BREAKDOWN" for r in rows])
    dur = np.array([min(float(r["dur_ms"]), 2000.0) / 1000.0 for r in rows])
    pos = np.array([float(r["pos_ms"]) for r in rows])
    base = np.array([[float(r[k]) for k in BASE] for r in rows])
    # Lagrede verdier innenfor samme sang: «hvordan var det for 2/4/8 slag siden».
    feats = [base]
    for lag in LAGS:
        shifted = np.zeros_like(base)
        for s in np.unique(song):
            idx = np.where(song == s)[0]
            b = base[idx]
            sh = np.vstack([np.repeat(b[:1], lag, axis=0), b[:-lag]]) if len(idx) > lag else b
            shifted[idx] = sh[: len(idx)]
        feats.append(base - shifted)
    names = BASE + [f"{k}_d{l}" for l in LAGS for k in BASE]
    return names, np.hstack(feats), song, truth, old, dur, pos


def causal_smooth(p, song, k=4):
    out = p.copy()
    for s in np.unique(song):
        idx = np.where(song == s)[0]
        c = np.cumsum(np.insert(p[idx], 0, 0.0))
        for j in range(len(idx)):
            a = max(0, j - k + 1)
            out[idx[j]] = (c[j + 1] - c[a]) / (j + 1 - a)
    return out


def score(label, truth, pred, dur, song, pos):
    ok = sum(dur[(truth == c) & (pred == c)].sum() for c in CLASSES)
    tot = sum(dur[truth == c].sum() for c in CLASSES)
    per = {c: dur[(truth == c) & (pred == c)].sum() / max(dur[truth == c].sum(), 1e-9) for c in CLASSES}
    # build-up-avsnitt: sammenhengende BUILDUP i fasit; fanget hvis modellen sa BUILDUP i ≥ 2 s inni
    caught = sections = 0
    for s in np.unique(song):
        idx = np.where(song == s)[0]
        t = truth[idx]; i = 0
        while i < len(idx):
            if t[i] == "BUILDUP":
                j = i
                while j < len(idx) and t[j] == "BUILDUP":
                    j += 1
                sections += 1
                caught += dur[idx[i:j]][pred[idx[i:j]] == "BUILDUP"].sum() >= 2.0
                i = j
            else:
                i += 1
    # falsk build-up: sekunder der modellen sier BUILDUP men fasit er noe annet (utenom rett før et drop)
    false_s = dur[(pred == "BUILDUP") & (truth != "BUILDUP")].sum()
    print(f"{label:<28} enig {100*ok/tot:3.0f} %  I {100*per['INTRO']:3.0f}  B {100*per['BUILDUP']:3.0f}  "
          f"D {100*per['DROP']:3.0f}  Br {100*per['BREAKDOWN']:3.0f}  build-up fanget {caught}/{sections}  "
          f"falsk build-up {false_s:4.0f} s")
    return ok / tot, caught, sections, false_s


def main():
    names, X, song, truth, old, dur, pos = load()
    y = (truth == "BUILDUP").astype(int)
    print(f"{len(y)} slag, {len(np.unique(song))} sanger, {y.sum()} build-up-slag ({100*y.mean():.0f} %)\n")
    p = np.zeros(len(y))
    for s in np.unique(song):
        tr, te = song != s, song == s
        sc = StandardScaler().fit(X[tr])
        m = LogisticRegression(C=0.02, class_weight="balanced", max_iter=2000).fit(sc.transform(X[tr]), y[tr])
        p[te] = m.predict_proba(sc.transform(X[te]))[:, 1]
    ps = causal_smooth(p, song)
    try:
        print(f"AUC build-up (én sang utenfor): {roc_auc_score(y, p):.2f}, glattet {roc_auc_score(y, ps):.2f}\n")
    except ValueError:
        pass
    out = []
    out.append(score("gammel hjerne", truth, old, dur, song, pos))
    for thr in (.5, .6, .7, .8):
        hybrid = np.where((old != "DROP") & (ps >= thr), "BUILDUP", old)
        out.append(score(f"hybrid (build-up ≥ {thr:.1f})", truth, hybrid, dur, song, pos))
    if "--save" in sys.argv:
        sc = StandardScaler().fit(X)
        m = LogisticRegression(C=0.02, class_weight="balanced", max_iter=2000).fit(sc.transform(X), y)
        json.dump({"features": names, "mean": sc.mean_.tolist(), "scale": sc.scale_.tolist(),
                   "coef": m.coef_[0].tolist(), "bias": float(m.intercept_[0])},
                  open(os.path.join(DATA, "hybrid-model.json"), "w"))
        print("\nhybrid-model.json lagret")


if __name__ == "__main__":
    main()

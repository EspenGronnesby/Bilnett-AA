#!/usr/bin/env python3
"""
Fase C: vår egen del-modell (intro / build-up / drop / breakdown), trent på Espens svar.

Inspirert av drop-detector (felixmeyer6, GPL-3.0): målinger av «nå» og endringen fra sekundene før,
og en lærende modell i stedet for håndlagde terskler.

Input:  parts-features.csv (PartyReplayTest.exportPartFeatures – ett sekund per rad, Espens fasit)
Test:   én sang holdes utenfor om gangen (leave-one-song-out) – modellen må treffe sanger den ikke har sett.
Output: parts-model.json (skalering + vekter) når modellen slår reglene; ellers bare tall.

Kjør: <venv>/bin/python tools/party-analyse/train_parts.py
"""
import json
import os
import sys

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler

DATA = os.path.expanduser("~/Vibe-kode/Projects/Bilnett-AA-assets/party-analyse")
CLASSES = ["INTRO", "BUILDUP", "DROP", "BREAKDOWN"]


def load():
    import csv
    rows = list(csv.DictReader(open(os.path.join(DATA, "parts-features.csv"))))
    rows = [r for r in rows if r["truth"] in CLASSES]
    feats = [k for k in rows[0] if k not in ("song", "t", "rule", "truth")]
    X = np.array([[float(r[k]) for k in feats] for r in rows])
    y = np.array([CLASSES.index(r["truth"]) for r in rows])
    rule = np.array([CLASSES.index(r["rule"]) if r["rule"] in CLASSES else -1 for r in rows])
    song = np.array([int(r["song"]) for r in rows])
    return feats, X, y, rule, song


def smooth(pred_proba, k=4):
    """A part lasts many seconds: average the model's probabilities over the last k seconds (causal)."""
    out = np.copy(pred_proba)
    for i in range(len(out)):
        out[i] = pred_proba[max(0, i - k + 1):i + 1].mean(axis=0)
    return out


def scores(y, p):
    per = {c: float((p[y == i] == i).mean()) if (y == i).any() else float("nan") for i, c in enumerate(CLASSES)}
    return float((p == y).mean()), per


def main():
    feats, X, y, rule, song = load()
    print(f"{len(y)} sekunder, {len(set(song))} sanger, {len(feats)} målinger")
    rule_all, rule_per = scores(y, rule)
    pred = np.zeros_like(y)
    for s in sorted(set(song)):
        tr, te = song != s, song == s
        sc = StandardScaler().fit(X[tr])
        m = LogisticRegression(max_iter=2000, C=.3, class_weight="balanced").fit(sc.transform(X[tr]), y[tr])
        pred[te] = smooth(m.predict_proba(sc.transform(X[te]))).argmax(axis=1)
    model_all, model_per = scores(y, pred)
    fmt = lambda per: "  ".join(f"{c[:5]} {100 * v:3.0f}%" for c, v in per.items())
    print(f"Reglene i dag:      {100 * rule_all:3.0f} %   {fmt(rule_per)}")
    print(f"Egen modell (LOSO): {100 * model_all:3.0f} %   {fmt(model_per)}")
    better = model_all > rule_all and model_per["DROP"] >= rule_per["DROP"] - .05
    print("→ modellen slår reglene" if better else "→ ikke god nok ennå – trenger flere merkede sanger (særlig build-ups)")
    # Always fit on everything and save, so the app can be tried once it is good enough.
    sc = StandardScaler().fit(X)
    m = LogisticRegression(max_iter=2000, C=.3, class_weight="balanced").fit(sc.transform(X), y)
    json.dump({"features": feats, "classes": CLASSES, "mean": sc.mean_.tolist(), "scale": sc.scale_.tolist(),
               "coef": m.coef_.tolist(), "intercept": m.intercept_.tolist(), "smoothS": 4,
               "loso": {"model": model_all, "rules": rule_all, "perClass": model_per}, "better": bool(better)},
              open(os.path.join(DATA, "parts-model.json"), "w"), indent=1)
    top = np.argsort(-np.abs(m.coef_).max(axis=0))[:10]
    print("Viktigste målinger:", ", ".join(feats[i] for i in top))
    return 0 if better else 1


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""
Steg D: sammenligner modeller for build-up på målingene per slag, ærlig:
  - grupper = SANG (tittel; to opptak av samme sang er samme gruppe), alltid én sang utenfor om gangen
  - testes bare på sanger et menneske har merket (Espens live-merker eller rettelser)
  - lærerens svake merker (bare høy sikkerhet, vekt ≤ 0,3) kan hjelpe treningen, men er aldri med i testen

Input:  slots-all.csv (PartyReplayTest.exportAllSlots) og teacher-slots.csv (teacher.py --write)
Kjør:   <venv>/bin/python tools/party-analyse/train_models.py [--quick]
"""
import csv
import os
import sys
from collections import OrderedDict

import numpy as np
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler

DATA = os.path.expanduser("~/Vibe-kode/Projects/Bilnett-AA-assets/party-analyse")
CLASSES = ["INTRO", "BUILDUP", "DROP", "BREAKDOWN"]
BASE = ["posSub", "posFull", "jump", "airRise", "presRise", "noiseRise", "centRise", "snareRatio", "subDelta", "airPos", "presPos", "level"]
BANDS = [f"b{i}" for i in range(12)]
LAGS = [2, 4, 8]
WEAK_MIN_CONF = 0.7


def lagged(M, lags):
    parts = [M]
    for lag in lags:
        sh = np.vstack([np.repeat(M[:1], lag, axis=0), M[:-lag]])[: len(M)] if len(M) > lag else M
        parts.append(M - sh)
    return np.hstack(parts)


def load():
    rows = list(csv.DictReader(open(os.path.join(DATA, "slots-all.csv"))))
    teach = {}
    for r in csv.DictReader(open(os.path.join(DATA, "teacher-slots.csv"))):
        teach.setdefault(r["song"], []).append((r["teacher"], float(r["conf"])))
    songs = OrderedDict()
    for r in rows:
        songs.setdefault(r["song"], []).append(r)
    out = []
    drop_only = "--drop-only" in sys.argv
    for sid, rs in songs.items():
        if drop_only and any(r["truth"] for r in rs) and "hardstyle" not in sid:
            continue  # bare drop-musikk (hardstyle i navnet) i testen
        rs = [r for r in rs if float(r["range"]) > 0]  # etter oppstart, som i appen
        if len(rs) < 40:
            continue
        base = np.array([[float(r[k]) for k in BASE] for r in rs])
        bands = np.array([[float(r[k]) for k in BANDS] for r in rs])
        truth = ["BREAKDOWN" if r["truth"] == "OUTRO" else r["truth"] for r in rs]
        tl = teach.get(sid, [])
        # lærer-listen dekker alle slag; ta de samme radene (etter oppstart) ved å matche på posisjon
        tmap = {int(float(r["pos_ms"])): t for r, t in zip(songs[sid], tl)} if len(tl) == len(songs[sid]) else {}
        weak = [tmap.get(int(float(r["pos_ms"])), ("", 0.0)) for r in rs]
        out.append(dict(
            id=sid, group=rs[0]["title"], human=any(truth), truth=np.array(truth),
            old=np.array([r["old"] if r["old"] in CLASSES else "BREAKDOWN" for r in rs]),
            dur=np.array([float(r["slot_ms"]) for r in rs]) / 1000.0, base=lagged(base, LAGS),
            bands=lagged(bands, [4]), weak=np.array([w[0] for w in weak]), wconf=np.array([w[1] for w in weak]),
        ))
    return out


def make_model(kind):
    if kind == "logit":
        return LogisticRegression(C=0.02, max_iter=3000)
    if kind == "gboost":
        return HistGradientBoostingClassifier(max_depth=3, learning_rate=0.05, max_iter=150)
    return MLPClassifier(hidden_layer_sizes=(32, 16), alpha=1e-2, max_iter=600, random_state=0)


def causal_smooth(p, k=4):
    c = np.cumsum(np.insert(p, 0, 0.0))
    return np.array([(c[j + 1] - c[max(0, j - k + 1)]) / (j + 1 - max(0, j - k + 1)) for j in range(len(p))])


def run(songs, kind, with_bands, weak_w):
    human = [s for s in songs if s["human"]]
    groups = sorted({s["group"] for s in human})
    feats = lambda s: np.hstack([s["base"], s["bands"]]) if with_bands else s["base"]
    probs = {}
    for g in groups:
        test = [s for s in human if s["group"] == g]
        train = [s for s in human if s["group"] != g]
        # slag uten menneskemerke (før første trykk) er ikke «ikke build-up»: de er ukjente og holdes utenfor
        X = [feats(s)[s["truth"] != ""] for s in train]; y = [(s["truth"][s["truth"] != ""] == "BUILDUP").astype(int) for s in train]
        w = [np.ones(int((s["truth"] != "").sum())) for s in train]
        if weak_w > 0:  # lærerens sikre merker fra sanger uten menneskemerker (aldri fra testsangen)
            for s in songs:
                if s["human"] or s["group"] == g:
                    continue  # aldri et annet opptak av testsangen (samme lyd, bare uten menneskemerker)
                keep = (s["wconf"] >= WEAK_MIN_CONF) & (s["weak"] != "")
                if keep.sum() < 20:
                    continue
                X.append(feats(s)[keep]); y.append((s["weak"][keep] == "BUILDUP").astype(int)); w.append(np.full(keep.sum(), weak_w))
        X = np.vstack(X); y = np.concatenate(y); w = np.concatenate(w)
        pos, neg = (w * y).sum(), (w * (1 - y)).sum()
        w = np.where(y == 1, w * neg / max(pos, 1e-9), w)  # balansert
        sc = StandardScaler().fit(X)
        m = make_model(kind)
        try:
            m.fit(sc.transform(X), y, sample_weight=w)
        except TypeError:
            m.fit(sc.transform(X), y)
        for s in test:
            probs[s["id"]] = causal_smooth(m.predict_proba(sc.transform(feats(s)))[:, 1])
    return human, probs


def summarize(human, probs, thr):
    known = {s["id"]: s["truth"] != "" for s in human}
    allp = np.concatenate([probs[s["id"]][known[s["id"]]] for s in human]); ally = np.concatenate([(s["truth"][known[s["id"]]] == "BUILDUP").astype(int) for s in human])
    auc = roc_auc_score(ally, allp)
    ok = tot = fals = 0.0; caught = sections = 0
    for s in human:
        pred = np.where((s["old"] != "DROP") & (probs[s["id"]] >= thr), "BUILDUP", s["old"])
        t = s["truth"]; d = s["dur"]
        for c in CLASSES:
            m = t == c
            ok += d[m & (pred == c)].sum(); tot += d[m].sum()
        fals += d[(pred == "BUILDUP") & (t != "BUILDUP") & (t != "")].sum()
        i = 0
        while i < len(t):
            if t[i] == "BUILDUP":
                j = i
                while j < len(t) and t[j] == "BUILDUP":
                    j += 1
                sections += 1; caught += d[i:j][pred[i:j] == "BUILDUP"].sum() >= 2.0; i = j
            else:
                i += 1
    return auc, ok / tot, caught, sections, fals


def main():
    songs = load()
    human = [s for s in songs if s["human"]]
    print(f"{len(songs)} sanger med målinger, {len(human)} med menneskemerker ({len({s['group'] for s in human})} ulike sanger)\n")
    old_ok = old_tot = old_c = old_s = 0
    for s in human:
        t = s["truth"]; d = s["dur"]
        for c in CLASSES:
            old_ok += d[(t == c) & (s["old"] == c)].sum(); old_tot += d[t == c].sum()
    base = None
    print(f"{'modell':<8} {'spekter':<8} {'svake':<6} {'AUC':>5}   hybrid ≥0,7: enig  build-up  falsk(s)    hybrid ≥0,8: enig  build-up  falsk(s)")
    configs = [("logit", False, 0.0), ("logit", True, 0.0), ("logit", False, 0.2), ("gboost", False, 0.0), ("gboost", True, 0.0),
               ("gboost", False, 0.2), ("mlp", False, 0.0), ("mlp", True, 0.0), ("mlp", False, 0.2)]
    if "--quick" in sys.argv:
        configs = configs[:3]
    for kind, bands, ww in configs:
        h, p = run(songs, kind, bands, ww)
        a7 = summarize(h, p, 0.7); a8 = summarize(h, p, 0.8)
        if base is None:
            base = a7[0]
        print(f"{kind:<8} {'ja' if bands else 'nei':<8} {ww:<6} {a7[0]:5.2f}   {100*a7[1]:11.0f} %  {a7[2]:>3.0f}/{a7[3]:<3}  {a7[4]:7.0f}    {100*a8[1]:11.0f} %  {a8[2]:>3.0f}/{a8[3]:<3}  {a8[4]:7.0f}")
    print(f"\ngammel hjerne: enig {100*old_ok/old_tot:.0f} %")
    print("\nMERK: færre enn 10 ulike sanger og ~15 build-up-avsnitt. Forskjeller på 0,1 AUC er støy; terskel og modell er valgt på samme data.")
    print("Ingen modell tas i bruk av denne tabellen. Lærerens svake merker er ikke validert (læreren er ikke bedre enn gammel) – bruk med varsomhet.")


if __name__ == "__main__":
    main()

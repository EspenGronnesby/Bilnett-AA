#!/usr/bin/env python3
"""
Bilnett Party-analyse: lager en HTML-rapport av loggene fra telefonen.

  - Hvor ofte den automatiske analysen er enig med Espen (intro, build-up, drop, breakdown)
  - Hvilke drop den fant, og hvor langt unna den bommet
  - Følelses-trykk (for mye / for lite / bra) per sangdel
  - Effektstyrke per sangdel (skal stige: intro < breakdown < build-up < drop)

Kjør for hånd:  python3 tools/party-analyse/report.py  (bruker ~/Vibe-kode/Projects/Bilnett-AA-assets/party-analyse/raw)
"""
import csv
import glob
import html
import os
import sys
from collections import Counter, defaultdict

PARTS = ["INTRO", "BUILDUP", "DROP", "BREAKDOWN", "OUTRO"]
NAMES = {"INTRO": "Intro", "BUILDUP": "Build-up", "DROP": "Drop", "BREAKDOWN": "Breakdown",
         "GROOVE": "Mellom drops", "OUTRO": "Outro", "ANTI_CLIMAX": "Anti-climax", "VOCAL": "Breakdown"}
AUTO_COLS = ["INTRO", "BUILDUP", "DROP", "BREAKDOWN", "GROOVE", "OUTRO", "ANTI_CLIMAX"]


def norm(part):
    p = (part or "").strip().upper()
    return "BREAKDOWN" if p == "VOCAL" else p


def read_song_csv(path):
    title, rows = os.path.basename(path), []
    with open(path, encoding="utf-8", errors="replace") as f:
        lines = f.readlines()
    if lines and lines[0].startswith("# "):
        title = lines[0][2:].strip()
    data = [l for l in lines if not l.startswith("#")]
    for r in csv.DictReader(data):
        try:
            r["t"] = float(r.get("pos_s") or "nan")
        except ValueError:
            r["t"] = float("nan")
        rows.append(r)
    return title, rows


def fnum(r, k):
    try:
        return float(r.get(k) or 0)
    except ValueError:
        return 0.0


def drop_starts(rows, key):
    out, prev = [], None
    for r in rows:
        p = norm(r.get(key))
        if p == "DROP" and prev != "DROP" and r["t"] == r["t"]:
            out.append(r["t"])
        prev = p
    return out


def build(raw_dir, out_path):
    songs = []
    for path in sorted(glob.glob(os.path.join(raw_dir, "*.csv"))):
        if os.path.basename(path) == "feedback.csv":
            continue
        title, rows = read_song_csv(path)
        if rows:
            songs.append((os.path.basename(path), title, rows))

    feedback = []
    fb_path = os.path.join(raw_dir, "feedback.csv")
    if os.path.exists(fb_path):
        with open(fb_path, encoding="utf-8", errors="replace") as f:
            for row in csv.reader(f):
                if row and row[0] != "tid" and len(row) >= 8:
                    feedback.append(row)

    # --- A: bar by bar, Espen (truth) vs the automatic guess, only where Espen steered ---
    confusion = defaultdict(Counter)
    per_song = []
    effects = defaultdict(lambda: defaultdict(list))
    for fname, title, rows in songs:
        manual = [r for r in rows if r.get("part_by") == "espen" and r.get("auto_part")]
        agree = sum(1 for r in manual if norm(r["part"]) == norm(r["auto_part"]))
        for r in manual:
            confusion[norm(r["part"])][norm(r["auto_part"])] += 1
        for r in rows:
            part = norm(r.get("part"))
            if r.get("part_by") == "espen" and part in PARTS:
                effects[part]["shake"].append(fnum(r, "shake_px"))
                effects[part]["particles"].append(fnum(r, "particles"))
                effects[part]["strobe"].append(1.0 if fnum(r, "max_strobe") > 0 else 0.0)
                effects[part]["pi"].append(fnum(r, "pi"))
        # Drops: Espen's drop taps vs where the automatic analysis started a drop (±3 s)
        espen_drops = []
        for x in feedback:
            if x[8:9] == [fname] and x[3].lower() in ("rett_drop", "drop"):
                try:
                    espen_drops.append(float(x[2]))
                except ValueError:
                    pass
        # A drop Espen took back (DROP → BUILD-UP within 10 s) was a fake drop, not a drop.
        fakes = []
        for x in feedback:
            if x[8:9] == [fname] and x[3] == "fake_drop":
                try:
                    fakes.append(float(x[2]))
                except ValueError:
                    pass
        espen_drops = [d for d in espen_drops if not any(0 <= f - d <= 10.0 for f in fakes)]
        auto_key = "auto_part" if any(r.get("auto_part") for r in rows) else "part"
        auto_drops = drop_starts(rows, auto_key)
        hits = []
        for d in espen_drops:
            near = [a for a in auto_drops if abs(a - d) <= 3.0]
            hits.append(min(near, key=lambda a: abs(a - d)) - d if near else None)
        feel = Counter(x[3] for x in feedback if x[8:9] == [fname] and not x[3].startswith("rett_"))
        per_song.append(dict(file=fname, title=title, bars=len(rows), manual=len(manual), agree=agree, fakes=len(fakes),
                             espen_drops=len(espen_drops), found=sum(1 for h in hits if h is not None),
                             false_drops=sum(1 for a in auto_drops if all(abs(a - d) > 3.0 for d in espen_drops)) if espen_drops else None,
                             deltas=[h for h in hits if h is not None], feel=feel,
                             genre=Counter(r.get("genre", "") for r in rows).most_common(1)[0][0]))

    # --- B: what the app thought at the moment of each correction tap ---
    tap_hits = defaultdict(lambda: [0, 0])
    for x in feedback:
        if x[3].startswith("rett_") and len(x) >= 10 and x[9]:
            truth = norm(x[3][5:])
            tap_hits[truth][1] += 1
            if norm(x[9]) == truth:
                tap_hits[truth][0] += 1

    # --- C: feelings per part ---
    feel_part = defaultdict(Counter)
    for x in feedback:
        if x[3] in ("for_mye", "for_lite", "bra"):
            feel_part[norm(x[4])][x[3]] += 1

    total_manual = sum(s["manual"] for s in per_song)
    total_agree = sum(s["agree"] for s in per_song)
    total_drops = sum(s["espen_drops"] for s in per_song)
    total_found = sum(s["found"] for s in per_song)

    def pct(a, b):
        return f"{100 * a / b:.0f} %" if b else "–"

    def mean(xs):
        return sum(xs) / len(xs) if xs else 0.0

    h = []
    h.append(f"""<!doctype html><html lang="no"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Party-analyse</title>
<style>
:root{{--bg:#f7f5f0;--fg:#1a1a1a;--dim:#6b6b6b;--line:#e2ded6;--ok:#2f7d4f;--bad:#b3402e;--bar:#1a1a1a}}
@media (prefers-color-scheme:dark){{:root{{--bg:#111;--fg:#f2efe9;--dim:#9a968f;--line:#2a2826;--ok:#6fcf97;--bad:#ff8a73;--bar:#f2efe9}}}}
body{{background:var(--bg);color:var(--fg);font:15px/1.5 -apple-system,system-ui,sans-serif;margin:0;padding:24px 16px;}}
main{{max-width:980px;margin:auto}} h1{{font-size:26px;margin:0 0 4px}} h2{{font-size:18px;margin:32px 0 8px}}
.dim{{color:var(--dim)}} .kpis{{display:flex;flex-wrap:wrap;gap:12px;margin:16px 0}}
.kpi{{border:1px solid var(--line);border-radius:12px;padding:12px 16px;min-width:150px}}
.kpi b{{display:block;font-size:24px}} table{{border-collapse:collapse;width:100%;font-size:14px}}
th,td{{text-align:left;padding:6px 8px;border-bottom:1px solid var(--line);white-space:nowrap}}
td.num,th.num{{text-align:right}} .wrap{{overflow-x:auto}} .ok{{color:var(--ok)}} .bad{{color:var(--bad)}}
.meter{{display:inline-block;height:8px;background:var(--bar);border-radius:4px;vertical-align:middle}}
.diag{{font-weight:700}}
</style></head><body><main>
<h1>Party-analyse</h1><p class="dim">{len(songs)} sanger · {len(feedback)} trykk · oppdatert {html.escape(__import__('time').strftime('%Y-%m-%d %H:%M'))}</p>
<div class="kpis">
<div class="kpi"><b>{pct(total_agree, total_manual)}</b>takter appen var enig med deg</div>
<div class="kpi"><b>{total_found}/{total_drops}</b>av dine drop fant appen (±3 s)</div>
<div class="kpi"><b>{total_manual}</b>takter du har styrt</div>
</div>""")

    h.append("<h2>Hva appen trodde, når du sa …</h2><p class='dim'>Rad = det du sa. Kolonne = det appen ville sagt. Tallene er takter.</p><div class='wrap'><table><tr><th>Du sa</th>")
    for c in AUTO_COLS:
        h.append(f"<th class='num'>{NAMES[c]}</th>")
    h.append("<th class='num'>Treff</th></tr>")
    for p in PARTS:
        row = confusion.get(p, Counter())
        n = sum(row.values())
        h.append(f"<tr><td>{NAMES[p]}</td>")
        for c in AUTO_COLS:
            v = row.get(c, 0)
            h.append(f"<td class='num{' diag' if c == p else ''}'>{v or ''}</td>")
        h.append(f"<td class='num'>{pct(row.get(p, 0), n)}</td></tr>")
    h.append("</table></div>")

    h.append("<h2>I øyeblikket du rettet</h2><p class='dim'>Hvor ofte appen allerede var på riktig del da du trykket.</p><table><tr><th>Du sa</th><th class='num'>Trykk</th><th class='num'>Appen hadde rett</th></tr>")
    for p in PARTS:
        ok, n = tap_hits.get(p, [0, 0])
        h.append(f"<tr><td>{NAMES[p]}</td><td class='num'>{n}</td><td class='num'>{pct(ok, n)}</td></tr>")
    h.append("</table>")

    h.append("<h2>Effekter per del (der du styrte)</h2><p class='dim'>Skal stige fra intro til drop. Breakdown danser, men under dropet.</p><table><tr><th>Del</th><th class='num'>Risting (dp)</th><th class='num'>Partikler</th><th class='num'>Styrke</th><th class='num'>Strobe-takter</th><th></th></tr>")
    top = max([mean(effects[p]["particles"]) for p in PARTS] + [0.01])
    for p in ["INTRO", "BREAKDOWN", "BUILDUP", "DROP", "OUTRO"]:
        e = effects[p]
        h.append(f"<tr><td>{NAMES[p]}</td><td class='num'>{mean(e['shake']):.2f}</td><td class='num'>{mean(e['particles']):.2f}</td>"
                 f"<td class='num'>{mean(e['pi']):.2f}</td><td class='num'>{pct(sum(e['strobe']), len(e['strobe']))}</td>"
                 f"<td><span class='meter' style='width:{120 * mean(e['particles']) / top:.0f}px'></span></td></tr>")
    h.append("</table>")

    h.append("<h2>Følelse per del</h2><table><tr><th>Del (appen sa)</th><th class='num'>For mye</th><th class='num'>For lite</th><th class='num'>Bra</th></tr>")
    for p in sorted(feel_part, key=lambda k: AUTO_COLS.index(k) if k in AUTO_COLS else 99):
        c = feel_part[p]
        h.append(f"<tr><td>{NAMES.get(p, p)}</td><td class='num'>{c['for_mye'] or ''}</td><td class='num'>{c['for_lite'] or ''}</td><td class='num'>{c['bra'] or ''}</td></tr>")
    h.append("</table>")

    h.append("<h2>Sanger</h2><div class='wrap'><table><tr><th>Sang</th><th>Sjanger</th><th class='num'>Takter</th><th class='num'>Enig</th><th class='num'>Drop funnet</th><th class='num'>Ekstra drop</th><th class='num'>Fake drop</th><th class='num'>Bom (s)</th><th class='num'>Mye/lite/bra</th></tr>")
    for s in reversed(per_song):
        deltas = ", ".join(f"{d:+.1f}" for d in s["deltas"]) or ""
        found = f"{s['found']}/{s['espen_drops']}" if s["espen_drops"] else ""
        cls = "ok" if s["espen_drops"] and s["found"] == s["espen_drops"] else ("bad" if s["espen_drops"] else "")
        f = s["feel"]
        h.append(f"<tr><td>{html.escape(s['title'][:60])}<br><span class='dim'>{html.escape(s['file'][:15])}</span></td><td>{html.escape(s['genre'])}</td>"
                 f"<td class='num'>{s['bars']}</td><td class='num'>{pct(s['agree'], s['manual']) if s['manual'] else ''}</td>"
                 f"<td class='num {cls}'>{found}</td><td class='num'>{'' if s['false_drops'] is None else s['false_drops']}</td><td class='num'>{s['fakes'] or ''}</td>"
                 f"<td class='num'>{deltas}</td><td class='num'>{f['for_mye']}/{f['for_lite']}/{f['bra']}</td></tr>")
    h.append("</table></div>")
    h.append("<h2>🟢 Enkelt forklart</h2><p>Øverst ser du hvor ofte appen ville valgt det samme som deg. Tabellen «Hva appen trodde» viser hvilke deler den blander sammen, for eksempel om den kaller build-up for drop. «Drop funnet» er hvor mange av dine drop den fant selv innen 3 sekunder.</p>")
    h.append("</main></body></html>")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("".join(h))
    return out_path


if __name__ == "__main__":
    data = os.path.expanduser("~/Vibe-kode/Projects/Bilnett-AA-assets/party-analyse")
    print(build(sys.argv[1] if len(sys.argv) > 1 else os.path.join(data, "raw"), os.path.join(data, "rapport.html")))

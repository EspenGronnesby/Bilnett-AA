#!/usr/bin/env python3
"""
Rettings-verktøy: lager review.html (én fil, ingen server) der du RETTER lærerens forslag i stedet for å merke fra bunnen.

Hver sang vises som kurver (sub, lys klang, kick, snare) med tre rader: gammel hjerne, lærer og «Din» (det du retter).
Sangene er sortert etter uenighet (lærer mot gammel/dine live-merker): se først det modellene er usikre på.
Du hører sangen i Spotify og ser mm:ss i verktøyet. Smakebiten (30 s) spilles når den finnes.

  1. python3 tools/party-analyse/sync.py --web      # hent nye opptak (og tren: se CLAUDE.md «analyser»)
  2. ./gradlew testDebugUnitTest --tests '*PartyReplayTest.exportAllSlots'   # slots-all.csv
  3. venv/bin/python tools/party-analyse/teacher.py --write                  # teacher-slots.csv
  4. venv/bin/python tools/party-analyse/review.py --open                    # lager og åpner review.html
  5. Rett, trykk «Lagre» → corrections.json i Nedlastinger
  6. venv/bin/python tools/party-analyse/review_apply.py                     # rettelsene blir fasit (part_by=review)

Data havner aldri i git (repoet er offentlig).
"""
import csv
import json
import os
import subprocess
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import teacher as T  # noqa: E402

DATA = T.DATA
PREVIEWS = os.path.join(DATA, "previews")


def disagreement(teacher_labels, other):
    n = len(teacher_labels)
    return sum(1 for a, b in zip(teacher_labels, other) if a != b) / max(n, 1)


def build_data():
    songs = T.load()
    tfile = os.path.join(DATA, "teacher-slots.csv")
    if not os.path.exists(tfile):
        sys.exit("Mangler teacher-slots.csv: kjør  teacher.py --write  først.")
    teach = {}
    for r in csv.DictReader(open(tfile)):
        teach.setdefault(r["song"], []).append((r["teacher"], float(r["conf"])))
    previews = {f for f in os.listdir(PREVIEWS)} if os.path.isdir(PREVIEWS) else set()
    out = []
    for sid, rows in songs.items():
        if sid not in teach or len(teach[sid]) != len(rows):
            continue
        if (float(rows[-1]["pos_ms"]) - float(rows[0]["pos_ms"])) < 60_000:
            continue  # for korte opptak (testing/hopp) er ikke verdt å rette
        F = T.features(rows)
        pos = T.col(rows, "pos_ms")
        old = [r["old"] if r["old"] in T.CLASSES else "BREAKDOWN" for r in rows]
        truth = [("BREAKDOWN" if r["truth"] == "OUTRO" else r["truth"]) for r in rows]
        tl = [x[0] for x in teach[sid]]
        has_truth = any(truth)
        ref = truth if has_truth else old
        score = disagreement(tl, ref)
        title = rows[0]["title"]
        slug = "".join(c for c in title.lower() if c.isalnum())
        prev = next((p for p in previews if slug[:12] and slug[:12] in "".join(c for c in p.lower() if c.isalnum())), None)
        r2 = lambda a: [round(float(v), 2) for v in a]
        out.append(dict(
            id=sid, title=title, t=[int(v) for v in pos], ps=r2(F["ps"]), br=r2(F["bright"]), kick=r2(F["kick"]),
            snare=r2(F["snare"]), old=old, teacher=tl, conf=[round(c, 2) for _, c in teach[sid]],
            truth=truth if has_truth else [], score=round(score, 3), preview=prev,
        ))
    out.sort(key=lambda s: -s["score"])
    return out


HTML = r"""<!doctype html><html lang="nb"><head><meta charset="utf-8"><title>Rettings-verktøy</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
:root{--bg:#14121c;--fg:#ece9f5;--mut:#9a95ad;--card:#1e1b2b;--ln:#322e45;--sel:rgba(255,255,255,.14)}
@media (prefers-color-scheme: light){:root{--bg:#f6f4fb;--fg:#1b1830;--mut:#6a657e;--card:#fff;--ln:#d9d5e8;--sel:rgba(0,0,0,.12)}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.4 system-ui,sans-serif;display:grid;grid-template-columns:300px 1fr;height:100vh}
#list{overflow:auto;border-right:1px solid var(--ln);padding:10px}#main{overflow:auto;padding:16px}
.song{padding:8px 10px;border-radius:10px;cursor:pointer;display:flex;justify-content:space-between;gap:8px}
.song:hover{background:var(--card)}.song.on{background:var(--card);outline:1px solid var(--ln)}
.song small{color:var(--mut);white-space:nowrap}.ok{color:#5ad68a}
h2{margin:0 0 4px;font-size:18px}.sub{color:var(--mut);margin-bottom:12px}
canvas{width:100%;height:340px;background:var(--card);border-radius:12px;display:block;cursor:crosshair}
.btns{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0;align-items:center}
button{background:var(--card);color:var(--fg);border:1px solid var(--ln);border-radius:999px;padding:6px 14px;font:inherit;cursor:pointer}
button:hover{border-color:var(--fg)}button.p{background:var(--fg);color:var(--bg)}
.chip{padding:3px 10px;border-radius:999px;font-weight:600;color:#14121c}
.key{color:var(--mut);font-size:12px}
</style></head><body>
<div id="list"></div>
<div id="main"><h2 id="title"></h2><div class="sub" id="sub"></div>
<canvas id="cv" width="1400" height="420"></canvas>
<div class="btns" id="btns"></div>
<div class="key">Dra på «Din»-raden for å velge et tidsrom, trykk 1–5 for å sette del (1 Intro · 2 Build-up · 3 Drop · 4 Breakdown · 5 Outro).
  <b>A</b> godta lærerens forslag for hele sangen · <b>G</b> bruk gammel · <b>←/→</b> forrige/neste sang · <b>Z</b> angre · mellomrom: spill smakebit</div>
<audio id="au" controls style="margin-top:10px;width:100%;display:none"></audio></div>
<script>
const DATA=__DATA__;
const PARTS=['INTRO','BUILDUP','DROP','BREAKDOWN','OUTRO'];
const NAME={INTRO:'Intro',BUILDUP:'Build-up',DROP:'Drop',BREAKDOWN:'Breakdown',OUTRO:'Outro'};
const COL={INTRO:'#6aa5ff',BUILDUP:'#ffb347',DROP:'#ff4d6d',BREAKDOWN:'#8e7cff',OUTRO:'#7a7690'};
let store={};try{store=JSON.parse(localStorage.getItem('rave-review')||'{}')}catch(e){}
const save=()=>{try{localStorage.setItem('rave-review',JSON.stringify(store))}catch(e){}};
let cur=0,sel=null,drag=null,undo=[];
const cv=document.getElementById('cv'),cx=cv.getContext('2d');
const mmss=ms=>{const s=Math.max(0,Math.round(ms/1000));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
function mine(s){if(!store[s.id])store[s.id]={labels:null,done:false};return store[s.id]}
function labelsOf(s){const m=mine(s);return m.labels||(s.truth.length?s.truth.map(x=>x||'BREAKDOWN'):s.teacher.slice())}
function done(s){return mine(s).done}
function renderList(){const el=document.getElementById('list');el.innerHTML='';
  DATA.forEach((s,i)=>{const d=document.createElement('div');d.className='song'+(i===cur?' on':'');
    d.innerHTML='<span>'+(done(s)?'<span class="ok">✓ </span>':'')+s.title+'</span><small>'+Math.round(s.score*100)+'% uenig</small>';
    d.onclick=()=>{cur=i;sel=null;draw();renderList()};el.appendChild(d)})}
function geom(){const W=cv.width,H=cv.height;return{W,H,L:40,R:W-10,top:10,curveH:210,barH:34,gap:8}}
function xOf(s,t){const g=geom();return g.L+(t-s.t[0])/(s.t[s.t.length-1]-s.t[0])*(g.R-g.L)}
function tOf(s,x){const g=geom();return s.t[0]+(x-g.L)/(g.R-g.L)*(s.t[s.t.length-1]-s.t[0])}
function idxAt(s,t){let lo=0,hi=s.t.length-1;while(lo<hi){const m=(lo+hi)>>1;if(s.t[m]<t)lo=m+1;else hi=m}return lo}
function bar(s,y,labels,name,editable){const g=geom();
  cx.fillStyle='#9a95ad';cx.font='18px system-ui';cx.fillText(name,4,y+22);
  for(let i=0;i<s.t.length;i++){const x0=xOf(s,i?s.t[i-1]:s.t[0]),x1=xOf(s,s.t[i]);cx.fillStyle=COL[labels[i]]||'#555';cx.globalAlpha=editable?1:.75;cx.fillRect(x0,y,x1-x0+1,g.barH)}
  cx.globalAlpha=1}
function draw(){const s=DATA[cur];const g=geom();cx.clearRect(0,0,g.W,g.H);
  document.getElementById('title').textContent=s.title;
  const n=s.t.length,dur=s.t[n-1]-s.t[0];
  document.getElementById('sub').textContent=mmss(dur)+' lang · '+Math.round(s.score*100)+' % uenig mellom lærer og '+(s.truth.length?'dine live-merker':'gammel hjerne')+(done(s)?' · ✓ rettet':'');
  // kurver
  const curves=[['ps','#4aa3ff','sub'],['br','#ffb347','lys klang'],['kick','#aaaaaa','kick'],['snare','#5ad68a','snare']];
  cx.lineWidth=2;
  curves.forEach(([k,c],ci)=>{cx.strokeStyle=c;cx.beginPath();s[k].forEach((v,i)=>{const val=k==='kick'||k==='snare'?Math.min(v/4,1.2):v;const y=g.top+g.curveH-(Math.max(-.3,Math.min(1.3,val))+.3)/1.6*g.curveH;const x=xOf(s,s.t[i]);i?cx.lineTo(x,y):cx.moveTo(x,y)});cx.stroke()});
  cx.font='16px system-ui';curves.forEach(([k,c,nm],i)=>{cx.fillStyle=c;cx.fillText(nm,g.L+8+i*110,g.top+16)});
  // minutt-linjer
  cx.strokeStyle='rgba(150,150,170,.25)';cx.lineWidth=1;cx.fillStyle='#9a95ad';cx.font='16px system-ui';
  for(let m=0;m*60000<=s.t[n-1];m++){const x=xOf(s,m*60000);if(x<g.L)continue;cx.beginPath();cx.moveTo(x,g.top);cx.lineTo(x,g.H);cx.stroke();cx.fillText(m+':00',x+3,g.H-4)}
  const y0=g.top+g.curveH+g.gap;
  bar(s,y0,s.old,'Gammel',false);bar(s,y0+g.barH+g.gap,s.teacher,'Lærer',false);
  if(s.truth.length)bar(s,y0+2*(g.barH+g.gap),s.truth.map(x=>x||'BREAKDOWN'),'Live',false);
  const yMine=y0+(s.truth.length?3:2)*(g.barH+g.gap);bar(s,yMine,labelsOf(s),'Din',true);
  s._yMine=yMine;
  if(sel){const x0=xOf(s,s.t[sel[0]]),x1=xOf(s,s.t[sel[1]]);cx.fillStyle='rgba(255,255,255,.22)';cx.fillRect(x0,g.top,x1-x0,g.H-g.top)}
  renderBtns()}
function renderBtns(){const s=DATA[cur];const el=document.getElementById('btns');el.innerHTML='';
  PARTS.forEach((p,i)=>{const b=document.createElement('button');b.innerHTML='<span class="chip" style="background:'+COL[p]+'">'+(i+1)+'</span> '+NAME[p];b.onclick=()=>setPart(p);el.appendChild(b)});
  [['Godta lærerens forslag (A)',acceptTeacher,'p'],['Bruk gammel (G)',useOld],['Angre (Z)',doUndo],['Lagre alt til corrections.json',exportAll,'p']].forEach(([t,f,c])=>{const b=document.createElement('button');b.textContent=t;if(c)b.className=c;b.onclick=f;el.appendChild(b)})}
function commit(labels,markDone){const s=DATA[cur],m=mine(s);undo.push(m.labels?m.labels.slice():null);m.labels=labels;if(markDone)m.done=true;save();draw();renderList()}
function setPart(p){const s=DATA[cur];if(!sel)return;const l=labelsOf(s).slice();for(let i=sel[0];i<=sel[1];i++)l[i]=p;commit(l,true)}
function acceptTeacher(){const s=DATA[cur];commit(s.teacher.slice(),true)}
function useOld(){const s=DATA[cur];commit(s.old.slice(),true)}
function doUndo(){const s=DATA[cur],m=mine(s);if(!undo.length)return;m.labels=undo.pop();save();draw();renderList()}
function exportAll(){const out={generated:new Date().toISOString(),songs:{}};
  DATA.forEach(s=>{const m=mine(s);if(!m.done)return;const l=m.labels||labelsOf(s);const ch=[];l.forEach((p,i)=>{if(i===0||p!==l[i-1])ch.push([s.t[i],p])});out.songs[s.id]={title:s.title,t:s.t,labels:l,changes:ch}});
  const blob=new Blob([JSON.stringify(out)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='corrections.json';a.click();
  alert(Object.keys(out.songs).length+' sanger lagret i corrections.json (Nedlastinger). Kjør review_apply.py på Mac-en.')}
function px(ev){const r=cv.getBoundingClientRect();return(ev.clientX-r.left)*cv.width/r.width}
cv.addEventListener('mousedown',ev=>{const s=DATA[cur];const i=idxAt(s,tOf(s,px(ev)));drag=i;sel=[i,i];draw()});
cv.addEventListener('mousemove',ev=>{if(drag===null)return;const s=DATA[cur];const i=idxAt(s,tOf(s,px(ev)));sel=[Math.min(drag,i),Math.max(drag,i)];draw()});
addEventListener('mouseup',()=>{drag=null});
cv.addEventListener('mousemove',ev=>{const s=DATA[cur];const t=tOf(s,px(ev));cv.title=mmss(t)+' ('+(DATA[cur].teacher[idxAt(s,t)]||'')+')'});
addEventListener('keydown',ev=>{if(ev.metaKey||ev.ctrlKey)return;const k=ev.key.toLowerCase();
  if('12345'.includes(k)&&k.length===1){setPart(PARTS[+k-1]);ev.preventDefault()}
  else if(k==='a')acceptTeacher();else if(k==='g')useOld();else if(k==='z')doUndo();
  else if(k==='arrowright'){cur=Math.min(DATA.length-1,cur+1);sel=null;draw();renderList();ev.preventDefault()}
  else if(k==='arrowleft'){cur=Math.max(0,cur-1);sel=null;draw();renderList();ev.preventDefault()}
  else if(k===' '){const au=document.getElementById('au');if(au.src){au.paused?au.play():au.pause();ev.preventDefault()}}});
function loadAudio(){const s=DATA[cur],au=document.getElementById('au');if(au.dataset.sid===s.id)return;au.dataset.sid=s.id;if(s.preview){au.src='file://__PREVIEWS__/'+encodeURIComponent(s.preview);au.style.display='block'}else{au.removeAttribute('src');au.style.display='none'}}
const _draw=draw;draw=function(){_draw();loadAudio()};
renderList();draw();
</script></body></html>"""


def main():
    data = build_data()
    html = HTML.replace("__DATA__", json.dumps(data, ensure_ascii=False)).replace("__PREVIEWS__", PREVIEWS)
    path = os.path.join(DATA, "review.html")
    open(path, "w", encoding="utf-8").write(html)
    print(f"{len(data)} sanger → {path}")
    if "--open" in sys.argv:
        subprocess.run(["open", path])


if __name__ == "__main__":
    main()

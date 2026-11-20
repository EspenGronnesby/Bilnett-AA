import { useEffect, useRef, useState, type MutableRefObject } from 'react'
import type { Party } from './useParty'
import { analysis, MARK_LABEL, useAnalysis, type MarkPart } from './analysis'
import { timeline } from './timeline'
import { apprentice } from './trainerModel'

// «AI-trener»: egen visning som åpnes når Analyse er på. Du ser live hva hver «hjerne» tror og hvorfor, og retter den
// med store knapper (eller på tidslinjen, også bakover i tid). Alt du gjør lagres med en gang som fasit (se analysis.ts).

const PART_COL: Record<string, string> = {
  INTRO: '#6aa5ff', BUILDUP: '#ffb347', DROP: '#ff4d6d', BREAKDOWN: '#8e7cff', OUTRO: '#7a7690',
}
const PART_NAME: Record<string, string> = {
  INTRO: 'Intro', BUILDUP: 'Build-up', DROP: 'Drop', BREAKDOWN: 'Breakdown', OUTRO: 'Outro',
  VOCAL: 'Sang (breakdown)', GROOVE: 'Groove', ANTI_CLIMAX: 'Anti-klimaks', PENDING: 'Drop?',
}
const PARTS = Object.keys(MARK_LABEL) as MarkPart[]
const toMark = (p: string): MarkPart => (p === 'INTRO' || p === 'BUILDUP' || p === 'DROP' || p === 'OUTRO' ? p : 'BREAKDOWN')
const col = (p: string) => PART_COL[toMark(p)]
const GENRES = ['HARDSTYLE', 'EDM', 'RAP', 'ROCK', 'POP', 'REGGAE', 'REGGAETON', 'ROLIG']

const mmss = (ms: number) => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }
const pct = (x: number) => `${Math.round(Math.max(0, Math.min(1, x)) * 100)} %`
const f1 = (x: number) => x.toFixed(2).replace('.', ',')

/** Navn på modellens målinger på vanlig norsk (12 grunnmålinger + endring siste halvtakt/takt/2 takter). */
const WORD: Record<string, string> = {
  posSub: 'sub (bass)', posFull: 'fylde', jump: 'fylde-hopp', airRise: 'lys klang som stiger', presRise: 'nærvær som stiger',
  noiseRise: 'støy som stiger', centRise: 'klang som lysner', snareRatio: 'snare-trommerulle', subDelta: 'sub som endrer seg',
  airPos: 'lys klang', presPos: 'nærvær', level: 'fylde i sangen',
}
const LAG_WORD: Record<string, string> = { d2: ' (siste halvtakt)', d4: ' (siste takt)', d8: ' (siste 2 takter)' }
function featureWord(name: string) {
  const [base, lag] = name.split('_')
  return (WORD[base] ?? base) + (lag ? LAG_WORD[lag] ?? '' : '')
}

function useTick(ms: number) {
  const [, set] = useState(0)
  useEffect(() => { const id = window.setInterval(() => set(n => n + 1), ms); return () => clearInterval(id) }, [ms])
}

type Sel = { a: number; b: number; range: boolean } | null

/** Hva den nye lytteren «ser» akkurat nå, på vanlig norsk. */
function explain(party: Party): string[] {
  const e = party.engine
  const f = e.listenerFeatures
  const lvl = (x: number) => (x < 0.3 ? 'borte' : x < 0.6 ? 'lav' : 'full')
  const trend = (x: number) => (x > 0.15 ? 'stiger' : x < -0.15 ? 'faller' : 'er jevn')
  const out: string[] = []
  if (f[12] < 3) {
    out.push('Lytteren venter: sangen har ikke vist stor forskjell mellom svakt og sterkt ennå.')
    return out
  }
  out.push(`Sub (bass) er ${lvl(f[0])}. Lys klang ${trend(f[4])}, nærvær ${trend(f[5])}.`)
  out.push(`Fylde nå ${f1(f[1])} mot ${f1(f[2])} rett før: hopp ${f1(f[3])} (trenger ${f1(e.jumpNeeded)} for drop).`)
  out.push(`Snare: ${Math.round(f[8])} siste takt (${f[9].toFixed(1).replace('.', ',')}× mot før). Kick: ${f[10] > 0 ? 'ja' : 'nei'}.`)
  return out
}

/** Modellens tre viktigste grunner akkurat nå. */
function modelWhy(party: Party): string[] {
  const e = party.engine
  const c = e.modelContrib, names = e.modelFeatureNames
  if (!c.length || !names.length) return []
  const top = [...c].map((v, i) => ({ v, i })).sort((a, b) => Math.abs(b.v) - Math.abs(a.v)).slice(0, 3)
  return top.map(({ v, i }) => `${featureWord(names[i])} ${v >= 0 ? 'trekker mot build-up' : 'trekker mot IKKE build-up'} (${v >= 0 ? '+' : '−'}${f1(Math.abs(v))})`)
}

interface Props {
  party: Party
  title: string
  artist: string
  playing: boolean
  positionMs: () => number
  durationMs: number
  seek: (ms: number) => void
  next: () => void
  reaction: number
  setReaction: (seconds: number) => void
  onClose: () => void
}

export function Trainer({ party, title, artist, playing, positionMs, durationMs, seek, next, reaction, setReaction, onClose }: Props) {
  useAnalysis()
  useTick(250)
  const root = useRef<HTMLDivElement>(null)
  const selRef = useRef<Sel>(null)
  const [, redraw] = useState(0)
  const [chip, setChip] = useState(0)
  const [genreOpen, setGenreOpen] = useState(false)
  const [toast, setToast] = useState('')
  const e = party.engine

  const bar = Math.max(800, (e.slotLengthMs || 400) * 4)
  const offsets = [
    { label: 'Nå', ms: reaction * 1000 }, { label: '2 s', ms: 2000 }, { label: '4 s', ms: 4000 }, { label: '8 s', ms: 8000 },
    { label: '1 takt', ms: bar }, { label: '2 takter', ms: bar * 2 }, { label: '4 takter', ms: bar * 4 },
  ]
  const say = (t: string) => { setToast(t); window.setTimeout(() => setToast(s => (s === t ? '' : s)), 1600) }

  const apply = (p: MarkPart) => {
    if (!analysis.hasRecording) { say('Ingen opptak ennå – start en sang og vent til lyd mottas'); return }
    const sel = selRef.current
    if (sel?.range) analysis.setRange(p, Math.min(sel.a, sel.b), Math.max(sel.a, sel.b))
    else if (sel) analysis.setMark(p, sel.a)
    else analysis.setMark(p, positionMs() - offsets[chip].ms)
    selRef.current = null; setChip(0)
    say(`Lagret: ${MARK_LABEL[p]}`)
  }
  const log = (type: Parameters<typeof analysis.logEvent>[0], detail = '', msg = '') => { analysis.logEvent(type, detail); say(msg || 'Lagret') }
  const rate = (brain: string, part: string, ok: boolean) => log(ok ? 'riktig' : 'feil', `${brain}:${part}`, ok ? `Riktig: ${brain}` : `Feil: ${brain}`)
  const seekBack = () => { const to = Math.max(0, positionMs() - 10_000); seek(to); analysis.noteSeek(to); say('Spoler 10 s tilbake') }

  useEffect(() => { root.current?.focus({ preventScroll: true }) }, [])
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.metaKey || ev.ctrlKey || ev.altKey || ev.repeat) return
      const t = ev.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return
      const k = ev.key.toLowerCase()
      if (k === 'escape') { onClose(); ev.preventDefault() }
      else if (k >= '1' && k <= '5') { apply(PARTS[Number(k) - 1]); ev.preventDefault() }
      else if (k === 'z') { analysis.undo(); say('Angret'); ev.preventDefault() }
      else if (k === 'b') { log('bra', '', 'Bra!'); ev.preventDefault() }
      else if (k === 'arrowleft') { seekBack(); ev.preventDefault() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // Live treffsikkerhet siste minutt: der du har merket, hvor ofte stemte hver hjerne med deg?
  const nowPos = positionMs()
  const recent = timeline.points.filter(p => p.pos > nowPos - 60_000 && p.pos <= nowPos)
  const labelled = recent.filter(p => analysis.labelAt(p.pos) !== null)
  const agree = (pick: (p: (typeof recent)[number]) => string) =>
    labelled.length >= 5 ? pct(labelled.filter(p => toMark(pick(p)) === analysis.labelAt(p.pos)).length / labelled.length) : '–'

  const sel = selRef.current
  const target = sel?.range ? `tidsrommet ${mmss(Math.min(sel.a, sel.b))}–${mmss(Math.max(sel.a, sel.b))}`
    : sel ? `fra ${mmss(sel.a)} og utover` : `fra ${(offsets[chip].ms / 1000).toFixed(1).replace('.', ',')} s siden`
  const brainParts = { old: e.partName, nu: e.listenerPart }
  const status = party.listening ? (party.paused ? 'Pause' : party.listening.status()) : 'Ikke tilkoblet'
  const modelP = e.pBuildModel

  return (
    <div className="trainer" role="dialog" aria-label="AI-trener" tabIndex={-1} ref={root}>
      <div className="tr-head">
        <div>
          <div className="tr-title"><span className={analysis.hasRecording && playing ? 'tr-pulse on' : 'tr-pulse'} /> Trener AI-en</div>
          <div className="tr-sub">{title ? `${artist} – ${title}` : 'Ingen sang spilles'} · {mmss(nowPos)}{durationMs > 0 ? ` / ${mmss(durationMs)}` : ''} · {status}</div>
        </div>
        <div className="tr-head-btns">
          <label className="tr-react" title="Hvor mange sekunder før knappetrykket en del regnes å ha startet (din reaksjonstid)">
            Reaksjonstid {reaction.toFixed(1).replace('.', ',')} s
            <input type="range" min={0} max={3} step={0.1} value={reaction} onChange={ev => setReaction(Number(ev.currentTarget.value))} />
          </label>
          <button className={analysis.dirName ? 'chip small on' : 'chip small'} onClick={() => void analysis.pickDir()}
            title="Velg en mappe (Nedlastinger/rave-analyse): hver sang lagres dit av seg selv">{analysis.dirName ? `Mappe: ${analysis.dirName}` : 'Velg mappe'}</button>
          {analysis.savedCount > 0 && <button className="chip small" onClick={() => void analysis.exportAll()}>Eksporter ({analysis.savedCount})</button>}
          <button className="chip small" onClick={() => analysis.setEnabled(false)} title="Slå av analyse og lagre sangen">Stopp analyse</button>
          <button className="chip small on" onClick={onClose}>Lukk (Esc)</button>
        </div>
      </div>

      <div className="tr-cards">
        <Brain name="Gammel hjerne" part={brainParts.old} onRate={ok => rate('gammel', brainParts.old, ok)}
          lines={[`bygger opp: ${pct(e.hudBuild)}`, `takt ${e.hudBar} i frasen${e.hudReady ? ' · klar for drop' : ''}`]} />
        <Brain name="Ny lytter" part={brainParts.nu} onRate={ok => rate('ny', brainParts.nu, ok)}
          lines={[`fylde ${pct(e.listenerLevel)} · drop ${pct(e.pDrop)}`, `build (regel) ${pct(e.pBuild)} · drops ${e.listenerDrops}`]} />
        <Brain name="Build-up-modell" part={modelP >= 0.8 ? 'BUILDUP' : ''} big={pct(modelP)} sure={modelP >= 0.8} onRate={ok => rate('modell', modelP >= 0.8 ? 'BUILDUP' : 'IKKE', ok)}
          lines={[modelP >= 0.8 ? 'sier: build-up' : modelP >= 0.5 ? 'usikker' : 'sier: ikke build-up']} />
        <div className="tr-card" style={{ borderColor: '#5ad68a' }}>
          <div className="tr-card-name">Min lærling</div>
          <div className="tr-card-part" style={{ color: '#5ad68a' }}>{pct(apprentice.p)}</div>
          <div className="tr-card-sub">Grunnmodellen sier {pct(modelP)}</div>
          <div className="tr-card-sub">Har lært av {apprentice.updates} rettelser</div>
          <div className="tr-card-btns">
            <button className="chip small" onClick={() => { apprentice.reset(); say('Lærlingen er nullstilt') }}>Nullstill</button>
          </div>
        </div>
        <div className="tr-card tr-score">
          <div className="tr-card-name">Enige med deg siste minutt</div>
          <div className="tr-scoreline"><span>Ny lytter</span><b>{agree(p => p.listener)}</b></div>
          <div className="tr-scoreline"><span>Gammel hjerne</span><b>{agree(p => p.old)}</b></div>
          <div className="tr-card-sub">Merker i dag: {analysis.marksToday} · hendelser denne sangen: {analysis.events.length}</div>
        </div>
      </div>

      <LiveTimeline party={party} positionMs={positionMs} selRef={selRef} onPick={() => redraw(n => n + 1)} />

      <div className="tr-cols">
        <div className="tr-think">
          <div className="tr-h">Slik tenker den nå</div>
          <div className="tr-thought"><b style={{ color: col(e.listenerPart) }}>{PART_NAME[e.listenerPart] ?? e.listenerPart}</b> (ny lytter) · <b style={{ color: col(e.partName) }}>{PART_NAME[e.partName] ?? e.partName}</b> (gammel)</div>
          <ul>{explain(party).map((l, i) => <li key={i}>{l}</li>)}</ul>
          <div className="tr-h tr-h2">Modellen sier {pct(modelP)} build-up, fordi:</div>
          <ul>{modelWhy(party).map((l, i) => <li key={i}>{l}</li>)}</ul>
        </div>

        <div className="tr-actions">
          <div className="tr-h">Si hva som er riktig <span className="tr-target">· gjelder {target}</span></div>
          <div className="tr-row">
            {PARTS.map((p, i) => (
              <button key={p} className="tr-btn tr-part" style={{ borderColor: PART_COL[p] }} onClick={() => apply(p)}>
                <span className="tr-key" style={{ background: PART_COL[p] }}>{i + 1}</span> {MARK_LABEL[p]}
                {analysis.mark === p && <span className="tr-now"> ✓</span>}
              </button>
            ))}
          </div>
          <div className="tr-sublabel">Når startet det? (gjelder neste trykk)</div>
          <div className="tr-row">
            {offsets.map((o, i) => <button key={o.label} className={chip === i ? 'chip small on' : 'chip small'} onClick={() => { selRef.current = null; setChip(i) }}>{i === 0 ? `Nå (−${(o.ms / 1000).toFixed(1).replace('.', ',')} s)` : `for ${o.label} siden`}</button>)}
            <button className="chip small" onClick={() => { analysis.moveLastMark(-bar); say('Flyttet siste merke 1 takt tidligere') }}>‹ siste merke 1 takt tidligere</button>
            <button className="chip small" onClick={() => { analysis.moveLastMark(bar); say('Flyttet siste merke 1 takt senere') }}>1 takt senere ›</button>
          </div>
          <div className="tr-sublabel">Dette stemmer ikke / dette er sangen</div>
          <div className="tr-row">
            <button className="tr-btn" onClick={() => log('feil_na', `gammel=${e.partName};ny=${e.listenerPart}`, 'Lagret: det stemmer ikke nå')}>Det stemmer ikke nå</button>
            <button className="tr-btn" onClick={() => { log('fake_drop', '', 'Lagret: fake drop'); apply('BUILDUP') }}>Fake drop</button>
            <button className="tr-btn" onClick={() => log('ingen_drop', '', 'Lagret: ingen drop i denne sangen')}>Ingen drop i sangen</button>
            <button className="tr-btn" onClick={() => log('ikke_drop_sang', '', 'Lagret: ikke drop-musikk')}>Ikke drop-musikk</button>
          </div>
          <div className="tr-sublabel">Følelse</div>
          <div className="tr-row">
            <button className="tr-btn" onClick={() => log('bra', '', 'Bra! (B)')}>Bra! (B)</button>
            <button className="tr-btn" onClick={() => log('for_mye', e.partName, 'Lagret: for mye')}>For mye</button>
            <button className="tr-btn" onClick={() => log('for_lite', e.partName, 'Lagret: for lite')}>For lite</button>
            <button className={genreOpen ? 'tr-btn on' : 'tr-btn'} onClick={() => setGenreOpen(o => !o)}>Feil sjanger ({e.genreLabel})</button>
          </div>
          {genreOpen && <div className="tr-row">{GENRES.map(g => <button key={g} className="chip small" onClick={() => { log('feil_sjanger', g, `Lagret: sjangeren er ${g}`); setGenreOpen(false) }}>{g}</button>)}</div>}
          <div className="tr-row tr-tools">
            <button className="tr-btn" onClick={() => { analysis.undo(); say('Angret') }}>Angre (Z)</button>
            <button className="tr-btn" onClick={seekBack}>Spol tilbake 10 s (←)</button>
            <button className="tr-btn" onClick={next}>Neste sang</button>
          </div>
        </div>
      </div>
      {toast && <div className="tr-toast">{toast}</div>}
      {!analysis.enabled && <div className="tr-toast tr-off">Analyse er av – slå den på for å lagre</div>}
    </div>
  )
}

function Brain({ name, part, lines, onRate, big, sure }: { name: string; part: string; lines: string[]; onRate: (ok: boolean) => void; big?: string; sure?: boolean }) {
  const color = part ? col(part) : 'var(--faint)'
  return (
    <div className="tr-card" style={{ borderColor: sure === false ? undefined : color }}>
      <div className="tr-card-name">{name}</div>
      <div className="tr-card-part" style={{ color }}>{big ?? (PART_NAME[part] ?? part)}</div>
      {lines.map((l, i) => <div key={i} className="tr-card-sub">{l}</div>)}
      <div className="tr-card-btns">
        <button className="chip small" onClick={() => onRate(true)}>Riktig</button>
        <button className="chip small" onClick={() => onRate(false)}>Feil</button>
      </div>
    </div>
  )
}

const WIN_MS = 120_000

/** Tidslinjen: siste to minutter, spillehodet til høyre. Dra for å velge et tidsrom, klikk for «fra her og utover». */
function LiveTimeline({ party, positionMs: positionProp, selRef, onPick: onPickProp }: { party: Party; positionMs: () => number; selRef: MutableRefObject<Sel>; onPick: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  // Funksjonene får ny identitet ved hver render; effekten (og pekerhåndtererne) skal ikke startes på nytt midt i en drag.
  const posRef = useRef(positionProp); posRef.current = positionProp
  const pickRef = useRef(onPickProp); pickRef.current = onPickProp
  useEffect(() => {
    const positionMs = () => posRef.current()
    const onPick = () => pickRef.current()
    const c = ref.current
    const ctx = c?.getContext('2d')
    if (!c || !ctx) return
    let w = 1, h = 1
    const fit = () => {
      const r = c.getBoundingClientRect(), ratio = Math.min(window.devicePixelRatio || 1, 2)
      w = Math.max(1, Math.round(r.width)); h = Math.max(1, Math.round(r.height))
      c.width = w * ratio; c.height = h * ratio; ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    }
    fit()
    const ro = new ResizeObserver(fit); ro.observe(c)
    const style = getComputedStyle(c)
    const faint = style.getPropertyValue('--faint').trim() || 'rgba(255,255,255,.45)'
    const LANE = 15, GAP = 3, LANES = 4

    const draw = () => {
      const nowPos = positionMs()
      const xOf = (pos: number) => w * (1 - (nowPos - pos) / WIN_MS)
      ctx.clearRect(0, 0, w, h)
      const curvesBottom = h - LANES * (LANE + GAP) - 16
      const curvesTop = 18
      const yOf = (v: number) => curvesBottom - (Math.max(-0.2, Math.min(1.2, v)) + 0.2) / 1.4 * (curvesBottom - curvesTop)
      // tidsakse
      ctx.font = '11px system-ui'; ctx.fillStyle = faint; ctx.strokeStyle = 'rgba(150,150,170,.2)'; ctx.lineWidth = 1
      for (let t = Math.ceil((nowPos - WIN_MS) / 30_000) * 30_000; t <= nowPos; t += 30_000) {
        if (t < 0) continue
        const x = xOf(t); ctx.beginPath(); ctx.moveTo(x, curvesTop); ctx.lineTo(x, h - 14); ctx.stroke(); ctx.fillText(mmss(t), x + 3, h - 3)
      }
      const pts = timeline.points.filter(p => p.pos >= nowPos - WIN_MS - 5000 && p.pos <= nowPos + 2000)
      const line = (get: (p: (typeof pts)[number]) => number, color: string, width = 2) => {
        ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath()
        let seg = -1
        for (const p of pts) { const x = xOf(p.pos), y = yOf(get(p)); if (p.seg !== seg) { ctx.moveTo(x, y); seg = p.seg } else ctx.lineTo(x, y) }
        ctx.stroke()
      }
      line(p => p.sub, '#4aa3ff'); line(p => p.bright, '#ffb347'); line(p => Math.min(p.kick / 3, 1.1), 'rgba(170,170,170,.7)', 1.5)
      line(p => p.pModel, '#ffffff', 2); line(p => p.pApp, '#5ad68a', 2); line(p => p.pDrop, '#ff4d6d', 1.5)
      ctx.font = '12px system-ui'
      ;[['sub', '#4aa3ff'], ['lys klang', '#ffb347'], ['kick', '#aaa'], ['build-up (modell)', '#fff'], ['min lærling', '#5ad68a'], ['drop (lytter)', '#ff4d6d']].forEach(([n, cc], i) => { ctx.fillStyle = cc; ctx.fillText(n, 8 + i * 110, 12) })
      // felt: gammel, ny lytter, modell (≥ 80 %), Din
      const lanes: [string, (p: (typeof pts)[number]) => string | null][] = [
        ['Gammel', p => p.old], ['Ny', p => p.listener], ['Modell', p => (p.pModel >= 0.8 ? 'BUILDUP' : null)],
      ]
      lanes.forEach(([name, get], li) => {
        const y = curvesBottom + 6 + li * (LANE + GAP)
        ctx.fillStyle = faint; ctx.font = '11px system-ui'; ctx.fillText(name, 4, y + 11)
        pts.forEach((p, i) => {
          const v = get(p); if (!v) return
          const x0 = xOf(i ? pts[i - 1].pos : p.pos - 400), x1 = xOf(p.pos)
          if (i && p.seg !== pts[i - 1].seg) return
          ctx.globalAlpha = .8; ctx.fillStyle = col(v); ctx.fillRect(Math.max(x0, 0), y, Math.max(x1 - x0, 1) + 1, LANE); ctx.globalAlpha = 1
        })
      })
      const yMine = curvesBottom + 6 + 3 * (LANE + GAP)
      ctx.fillStyle = faint; ctx.font = '11px system-ui'; ctx.fillText('Din', 4, yMine + 11)
      const marks = analysis.marks
      marks.forEach((m, i) => {
        if (!m.part) return
        const end = i + 1 < marks.length ? marks[i + 1].pos : nowPos
        const x0 = Math.max(xOf(m.pos), 0), x1 = xOf(end)
        if (x1 < 0) return
        ctx.fillStyle = PART_COL[m.part]; ctx.fillRect(x0, yMine, Math.max(x1 - x0, 1), LANE)
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x0, yMine - 2); ctx.lineTo(x0, yMine + LANE + 2); ctx.stroke()
      })
      // valg
      const sel = selRef.current
      if (sel) {
        const xa = xOf(Math.min(sel.a, sel.b)), xb = xOf(Math.max(sel.a, sel.b))
        if (sel.range) { ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(xa, curvesTop, xb - xa, h - curvesTop - 14) }
        else { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(xa, curvesTop); ctx.lineTo(xa, h - 14); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = '#fff'; ctx.font = '12px system-ui'; ctx.fillText('fra her', xa + 4, curvesTop + 12) }
      }
      // spillehode
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(w - 1, curvesTop); ctx.lineTo(w - 1, h - 14); ctx.stroke()
    }
    const off = party.onFrame(draw)

    const posAt = (ev: PointerEvent) => { const r = c.getBoundingClientRect(); return positionMs() - (1 - (ev.clientX - r.left) / r.width) * WIN_MS }
    let down = false
    const onDown = (ev: PointerEvent) => { down = true; c.setPointerCapture(ev.pointerId); const p = posAt(ev); selRef.current = { a: p, b: p, range: false } }
    const onMove = (ev: PointerEvent) => { if (!down || !selRef.current) return; selRef.current.b = posAt(ev); selRef.current.range = Math.abs(selRef.current.b - selRef.current.a) >= 500 }
    const onUp = () => { if (!down) return; down = false; onPick() }
    c.addEventListener('pointerdown', onDown); c.addEventListener('pointermove', onMove); c.addEventListener('pointerup', onUp); c.addEventListener('pointercancel', onUp)
    return () => { off(); ro.disconnect(); c.removeEventListener('pointerdown', onDown); c.removeEventListener('pointermove', onMove); c.removeEventListener('pointerup', onUp); c.removeEventListener('pointercancel', onUp) }
  }, [party, selRef])
  return <canvas ref={ref} className="tr-timeline" aria-label="Live tidslinje" />
}

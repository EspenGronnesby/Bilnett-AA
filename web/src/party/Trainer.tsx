import { useEffect, useRef, useState, type CSSProperties, type MutableRefObject } from 'react'
import type { Party } from './useParty'
import { analysis, MARK_LABEL, useAnalysis, type MarkPart } from './analysis'
import { snapOnset, timeline } from './timeline'
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
const EMOJI: Record<string, string> = { INTRO: '🌅', BUILDUP: '🚀', DROP: '💥', BREAKDOWN: '🌊', OUTRO: '🌙' }
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

const reducedMotion = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false } }

/** Små «poff» av farget konfetti ut fra en knapp når du svarer (av ved «Ingen blinking» / reduser bevegelse). */
function burst(from: Element | null, host: HTMLElement | null, color: string, emoji?: string) {
  if (!from || !host) return
  const r = from.getBoundingClientRect()
  for (let i = 0; i < 16; i++) {
    const d = document.createElement('span')
    d.className = 'tr-conf'
    const big = emoji && i % 4 === 0
    if (big) d.textContent = emoji
    else d.style.background = i % 2 ? color : '#fff'
    d.style.left = `${r.left + r.width / 2}px`; d.style.top = `${r.top + r.height / 2}px`
    host.appendChild(d)
    const a = Math.random() * Math.PI * 2, dist = 60 + Math.random() * 110
    d.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
      { transform: `translate(calc(-50% + ${Math.cos(a) * dist}px), calc(-50% + ${Math.sin(a) * dist - 40}px)) scale(${big ? 1.3 : .4}) rotate(${Math.random() * 360}deg)`, opacity: 0 }],
      { duration: 650 + Math.random() * 450, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => d.remove()
  }
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
  /** Pause/spill (brukes når AI-treneren stopper sangen for å spørre). */
  togglePlay: () => void
  reaction: number
  setReaction: (seconds: number) => void
  onClose: () => void
  /** Coverbilde (URL) til bakgrunn og den pulserende lille coveret. */
  cover: string | null
}

export function Trainer({ party, title, artist, playing, positionMs, durationMs, seek, next, togglePlay, reaction, setReaction, onClose, cover }: Props) {
  useAnalysis()
  useTick(250)
  const root = useRef<HTMLDivElement>(null)
  const selRef = useRef<Sel>(null)
  const [, redraw] = useState(0)
  const [chip, setChip] = useState(0)
  const [genreOpen, setGenreOpen] = useState(false)
  const [toast, setToast] = useState('')
  // Rent som standard: «Hjernen» (hva den tenker) og «Flere valg» er lukket. Valget huskes.
  const flag = (key: string) => { try { return localStorage.getItem(key) === '1' } catch { return false } }
  const [brain, setBrain] = useState(() => flag('rave.trainer.brain'))
  const [more, setMore] = useState(() => flag('rave.trainer.more'))
  const flip = (key: string, v: boolean, set: (v: boolean) => void) => { set(!v); try { localStorage.setItem(key, v ? '0' : '1') } catch { /* ok */ } }
  // Finn starten automatisk (standard på): trykket justeres til der lyden faktisk skifter.
  const [snap, setSnap] = useState(() => { try { return localStorage.getItem('rave.trainer.snap') !== '0' } catch { return true } })
  const toggleSnap = () => { const v = !snap; setSnap(v); try { localStorage.setItem('rave.trainer.snap', v ? '1' : '0') } catch { /* ok */ } }
  // Ja/nei-spørsmål: kommer når den nye lytteren bytter del.
  const [prompt, setPrompt] = useState<{ part: string; pos: number; denied: boolean } | null>(null)
  const lastListener = useRef<{ part: string; pos: number } | null>(null)
  // «Stopp sangen og spør» (standard på): sangen settes på pause ved et bytte, du kan høre igjen, svarer, og den fortsetter der den stoppet.
  const [pauseAsk, setPauseAsk] = useState(() => { try { return localStorage.getItem('rave.trainer.pause') !== '0' } catch { return true } })
  const togglePause = () => { const v = !pauseAsk; setPauseAsk(v); try { localStorage.setItem('rave.trainer.pause', v ? '1' : '0') } catch { /* ok */ } }
  const live = useRef({ playing, pauseAsk, togglePlay, seek, positionMs })
  live.current = { playing, pauseAsk, togglePlay, seek, positionMs }
  const held = useRef<{ at: number } | null>(null)
  const lastPause = useRef(0)
  /** Fortsett sangen der vi stoppet den (om vi stoppet den). */
  const resume = () => {
    const h = held.current
    if (!h) return
    held.current = null
    live.current.seek(h.at)
    if (!live.current.playing) live.current.togglePlay()
  }
  const closePrompt = () => { setPrompt(null); resume() }
  const e = party.engine

  const bar = Math.max(800, (e.slotLengthMs || 400) * 4)
  const offsets = [
    { label: 'Nå', ms: reaction * 1000 }, { label: '2 s', ms: 2000 }, { label: '4 s', ms: 4000 }, { label: '8 s', ms: 8000 },
    { label: '1 takt', ms: bar }, { label: '2 takter', ms: bar * 2 }, { label: '4 takter', ms: bar * 4 },
  ]
  /** Konfetti fra knappen for [p] (eller en knapp med klassen [sel]). */
  const celebrate = (p: MarkPart | null, sel?: string) => {
    if (party.calm || reducedMotion()) return
    const el = sel ? root.current?.querySelector(sel) : root.current?.querySelector(`[data-part="${p}"]`)
    burst(el ?? null, root.current, p ? PART_COL[p] : '#5ad68a', p ? EMOJI[p] : '🎉')
  }
  const say = (t: string) => { setToast(t); window.setTimeout(() => setToast(s => (s === t ? '' : s)), 1600) }

  const apply = (p: MarkPart) => {
    if (!analysis.hasRecording) { say('Ingen opptak ennå – start en sang og vent til lyd mottas'); return }
    const sel = selRef.current
    let note = '', ok: boolean
    if (sel?.range) ok = analysis.setRange(p, Math.min(sel.a, sel.b), Math.max(sel.a, sel.b))
    else if (sel) ok = analysis.setMark(p, sel.a)
    else {
      const at = positionMs()
      const found = snap && chip === 0 ? snapOnset(timeline.points, at, 8000) : { pos: -1, snapped: false }
      if (found.snapped) { ok = analysis.setMark(p, found.pos); note = ` (startet for ${((at - found.pos) / 1000).toFixed(1).replace('.', ',')} s siden – funnet automatisk)` }
      else ok = analysis.setMark(p, at - offsets[chip].ms)
    }
    if (!ok) { say('Ikke lagret: posisjonen i sangen er ukjent ennå'); return }
    selRef.current = null; setChip(0); if (prompt) closePrompt()
    celebrate(p)
    say(`Lagret: ${MARK_LABEL[p]}${note}`)
  }
  /** «Ja»: den nye lytteren hadde rett. Starten settes der lyden skiftet rundt lytterens bytte (ellers litt før). */
  const confirmPrompt = () => {
    if (!prompt || !analysis.hasRecording) return
    const part = toMark(prompt.part)
    const found = snap ? snapOnset(timeline.points, prompt.pos + 1500, 6000) : { pos: -1, snapped: false }
    if (!analysis.setMark(part, found.snapped ? found.pos : prompt.pos - 1000)) { say('Ikke lagret: posisjonen i sangen er ukjent ennå'); return }
    analysis.logEvent('riktig', `ny:${prompt.part}`)
    celebrate(null, '.tr-yes')
    closePrompt(); say(`Lagret: ${MARK_LABEL[part]} stemte`)
  }
  /** Spol litt tilbake og spill, så du kan høre øyeblikket før du svarer. */
  const listenAgain = () => {
    if (!prompt) return
    const to = Math.max(0, prompt.pos - 6000)
    seek(to); analysis.noteSeek(to)
    if (!playing) togglePlay()
    say('Spiller siste sekunder på nytt')
  }
  const denyPrompt = () => {
    if (!prompt) return
    analysis.logEvent('feil', `ny:${prompt.part}`)
    setPrompt(p => (p ? { ...p, denied: true } : p))
  }
  const log = (type: Parameters<typeof analysis.logEvent>[0], detail = '', msg = '') => { analysis.logEvent(type, detail); say(msg || 'Lagret') }
  const rate = (brain: string, part: string, ok: boolean) => log(ok ? 'riktig' : 'feil', `${brain}:${part}`, ok ? `Riktig: ${brain}` : `Feil: ${brain}`)
  const seekBack = () => { const to = Math.max(0, positionMs() - 10_000); seek(to); analysis.noteSeek(to); say('Spoler 10 s tilbake') }

  useEffect(() => { root.current?.focus({ preventScroll: true }) }, [])
  // Oppdager bytte hos den nye lytteren (per slag) og spør «stemmer det?». Intro i starten og samme del på nytt gir ikke spørsmål.
  useEffect(() => {
    const id = window.setInterval(() => {
      const last = timeline.points[timeline.points.length - 1]
      if (!last || !analysis.enabled) return
      const prev = lastListener.current
      if (!prev || last.pos < prev.pos - 1500) { lastListener.current = { part: last.listener, pos: last.pos }; return } // første slag / spoling
      if (last.listener !== prev.part) {
        lastListener.current = { part: last.listener, pos: last.pos }
        setPrompt({ part: last.listener, pos: last.pos, denied: false })
        const L = live.current
        if (L.pauseAsk && L.playing && last.listener !== 'INTRO' && Date.now() - lastPause.current > 20_000) {
          held.current = { at: L.positionMs() }; lastPause.current = Date.now(); L.togglePlay()
        }
      } else lastListener.current = { part: prev.part, pos: last.pos }
    }, 250)
    return () => clearInterval(id)
  }, [])
  // Spørsmålet forsvinner av seg selv etter 10 s (uten å lagre noe).
  useEffect(() => {
    if (!prompt) return
    const id = window.setTimeout(() => { setPrompt(p => (p === prompt ? null : p)); resume() }, held.current ? 45_000 : 10_000)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt])
  // Lukkes visningen mens sangen står på pause for oss, fortsetter den.
  useEffect(() => () => { const h = held.current; if (h) { held.current = null; live.current.seek(h.at); if (!live.current.playing) live.current.togglePlay() } }, [])
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.metaKey || ev.ctrlKey || ev.altKey || ev.repeat) return
      const t = ev.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return
      if (document.querySelectorAll('[role=dialog]').length > 1) return // et annet vindu (Innstillinger) er over treneren
      const k = ev.key.toLowerCase()
      if (prompt && (k === ' ' || k === 'enter')) { confirmPrompt(); ev.preventDefault(); return }
      if (prompt && !prompt.denied && k === 'n') { denyPrompt(); ev.preventDefault(); return }
      if (k === 'escape') { onClose(); ev.preventDefault() }
      else if (k >= '1' && k <= '5') { apply(PARTS[Number(k) - 1]); ev.preventDefault() }
      else if (k === 'z') { say(analysis.undo() ? 'Angret' : 'Ingenting å angre'); ev.preventDefault() }
      else if (k === 'b') { log('bra', '', 'Bra!'); ev.preventDefault() }
      else if (k === 'arrowleft') { seekBack(); ev.preventDefault() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // Live treffsikkerhet siste minutt: der du har merket, hvor ofte stemte hver hjerne med deg?
  const nowPos = positionMs()
  const lastMarkAt = analysis.marks.length ? analysis.marks[analysis.marks.length - 1].pos : -1
  const recent = timeline.points.filter(p => p.pos > nowPos - 60_000 && p.pos <= nowPos)
  // Bare slag der du har merket og der merket er ferskt (ikke mer enn 20 s etter ditt siste merke): ellers måler vi mot en utdatert fasit.
  const labelled = recent.filter(p => analysis.labelAt(p.pos) !== null && p.pos <= lastMarkAt + 20_000)
  const agree = (pick: (p: (typeof recent)[number]) => string) =>
    labelled.length >= 5 ? pct(labelled.filter(p => toMark(pick(p)) === analysis.labelAt(p.pos)).length / labelled.length) : '–'

  const sel = selRef.current
  const target = sel?.range ? `tidsrommet ${mmss(Math.min(sel.a, sel.b))}–${mmss(Math.max(sel.a, sel.b))}`
    : sel ? `fra ${mmss(sel.a)} og utover` : `fra ${(offsets[chip].ms / 1000).toFixed(1).replace('.', ',')} s siden`
  const brainParts = { old: e.partName, nu: e.listenerPart }
  const status = party.listening ? (party.paused ? 'Pause' : party.listening.status()) : 'Ikke tilkoblet'
  const modelP = e.pBuildModel

  const guess = e.listenerPart
  return (
    <div className="trainer" role="dialog" aria-label="AI-trener" tabIndex={-1} ref={root}
      style={{ '--tr-accent': col(guess), '--tr-cover': cover ? `url("${cover}")` : 'none' } as CSSProperties}>
      <div className="tr-bg" aria-hidden />
      <div className="tr-head">
        <div className="tr-title">
          <span className={analysis.hasRecording && playing ? 'tr-pulse on' : 'tr-pulse'} />
          Trener AI-en
          <span className="tr-sub">{title ? `${artist} – ${title}` : 'Ingen sang spilles'} · {mmss(nowPos)}{durationMs > 0 ? ` / ${mmss(durationMs)}` : ''}</span>
        </div>
        <div className="tr-head-btns">
          <button className={brain ? 'chip small on' : 'chip small'} onClick={() => flip('rave.trainer.brain', brain, setBrain)}>Hjernen</button>
          <button className={more ? 'chip small on' : 'chip small'} onClick={() => flip('rave.trainer.more', more, setMore)}>Flere valg</button>
          <button className="chip small on" onClick={onClose}>Lukk</button>
        </div>
      </div>

      <div className="tr-hero">
        <CoverPulse party={party} cover={cover} />
        <div className="tr-hero-text">
          <span className="tr-hero-label">AI-en tror {status !== 'Mottar lyd' ? `· ${status}` : ''}</span>
          <span className="tr-hero-part" style={{ color: col(guess) }}>{EMOJI[toMark(guess)]} {PART_NAME[guess] ?? guess}</span>
        </div>
        <Equalizer party={party} />
      </div>

      <LiveTimeline party={party} positionMs={positionMs} selRef={selRef} detail={brain} onPick={() => redraw(n => n + 1)} />

      <div className="tr-row tr-parts">
        {PARTS.map((p, i) => (
          <button key={p} data-part={p} className={analysis.mark === p ? 'tr-btn tr-part on-part' : 'tr-btn tr-part'} style={{ '--pc': PART_COL[p] } as CSSProperties} onClick={() => apply(p)}>
            <span className="tr-emoji">{EMOJI[p]}</span> {MARK_LABEL[p]}<span className="tr-keyhint">{i + 1}</span>
          </button>
        ))}
      </div>
      <div className="tr-row tr-mini">
        <button className="chip small" onClick={() => say(analysis.undo() ? 'Angret' : 'Ingenting å angre')}>Angre</button>
        <button className={snap ? 'chip small on' : 'chip small'} onClick={toggleSnap} title="Starten settes der lyden faktisk skifter">Finn start selv</button>
        <button className={pauseAsk ? 'chip small on' : 'chip small'} onClick={togglePause} title="Sangen stopper ved et bytte og spør. Den fortsetter når du har svart.">Pause og spør</button>
        {(sel || chip > 0) && <span className="tr-hint">Neste trykk gjelder {target}</span>}
      </div>

      {brain && (
        <>
          <div className="tr-cards">
            <Brain name="Gammel hjerne" part={brainParts.old} onRate={ok => rate('gammel', brainParts.old, ok)}
              lines={[`bygger opp: ${pct(e.hudBuild)}`, `takt ${e.hudBar} i frasen${e.hudReady ? ' · klar for drop' : ''}`]} />
            <Brain name="Ny lytter" part={brainParts.nu} onRate={ok => rate('ny', brainParts.nu, ok)}
              lines={[`fylde ${pct(e.listenerLevel)} · drop ${pct(e.pDrop)}`, `build (regel) ${pct(e.pBuild)}`]} />
            <Brain name="Build-up-modell" part={modelP >= 0.8 ? 'BUILDUP' : ''} big={pct(modelP)} sure={modelP >= 0.8} onRate={ok => rate('modell', modelP >= 0.8 ? 'BUILDUP' : 'IKKE', ok)}
              lines={[modelP >= 0.8 ? 'sier build-up' : modelP >= 0.5 ? 'usikker' : 'sier ikke build-up']} />
            <div className="tr-card" style={{ borderColor: '#5ad68a' }}>
              <div className="tr-card-name">Min lærling</div>
              <div className="tr-card-part" style={{ color: '#5ad68a' }}>{pct(apprentice.p)}</div>
              <div className="tr-card-sub">Trent på {apprentice.updates} slag · lærer av deg</div>
              <div className="tr-card-btns"><button className="chip small" onClick={() => { apprentice.reset(); say('Nullstilt') }}>Nullstill</button></div>
            </div>
            <div className="tr-card tr-score">
              <div className="tr-card-name">Treffer det du merket</div>
              <div className="tr-scoreline"><span>Ny lytter</span><b>{agree(p => p.listener)}</b></div>
              <div className="tr-scoreline"><span>Gammel</span><b>{agree(p => p.old)}</b></div>
            </div>
          </div>
          <div className="tr-think">
            <div className="tr-thought"><b style={{ color: col(e.listenerPart) }}>{PART_NAME[e.listenerPart] ?? e.listenerPart}</b> (ny) · <b style={{ color: col(e.partName) }}>{PART_NAME[e.partName] ?? e.partName}</b> (gammel)</div>
            <ul>{[...explain(party), ...modelWhy(party)].map((l, i) => <li key={i}>{l}</li>)}</ul>
          </div>
        </>
      )}

      {more && (
        <div className="tr-more">
          <div className="tr-row">
            {offsets.map((o, i) => <button key={o.label} className={chip === i ? 'chip small on' : 'chip small'} onClick={() => { selRef.current = null; setChip(i) }}>{i === 0 ? 'Nå' : `for ${o.label} siden`}</button>)}
            <button className="chip small" onClick={() => say(analysis.moveLastMark(-bar) ? 'Flyttet' : 'Ingen merke å flytte')}>‹ 1 takt</button>
            <button className="chip small" onClick={() => say(analysis.moveLastMark(bar) ? 'Flyttet' : 'Ingen merke å flytte')}>1 takt ›</button>
          </div>
          <div className="tr-row">
            <button className="tr-btn" onClick={() => log('feil_na', `gammel=${e.partName};ny=${e.listenerPart}`, 'Lagret')}>Stemmer ikke nå</button>
            <button className="tr-btn" onClick={() => { log('fake_drop', '', 'Lagret'); apply('BUILDUP') }}>Fake drop</button>
            <button className="tr-btn" onClick={() => log('ingen_drop', '', 'Lagret')}>Ingen drop i sangen</button>
            <button className="tr-btn" onClick={() => log('ikke_drop_sang', '', 'Lagret')}>Ikke drop-musikk</button>
            <button className="tr-btn" onClick={() => log('bra', '', 'Bra!')}>Bra!</button>
            <button className="tr-btn" onClick={() => log('for_mye', e.partName, 'Lagret')}>For mye</button>
            <button className="tr-btn" onClick={() => log('for_lite', e.partName, 'Lagret')}>For lite</button>
            <button className={genreOpen ? 'tr-btn on' : 'tr-btn'} onClick={() => setGenreOpen(o => !o)}>Feil sjanger</button>
          </div>
          {genreOpen && <div className="tr-row">{GENRES.map(g => <button key={g} className="chip small" onClick={() => { log('feil_sjanger', g, 'Lagret'); setGenreOpen(false) }}>{g}</button>)}</div>}
          <div className="tr-row">
            <button className="tr-btn" onClick={seekBack}>Spol 10 s tilbake</button>
            <button className="tr-btn" onClick={next}>Neste sang</button>
            <label className="tr-react">Reaksjonstid {reaction.toFixed(1).replace('.', ',')} s
              <input type="range" min={0} max={3} step={0.1} value={reaction} onChange={ev => setReaction(Number(ev.currentTarget.value))} />
            </label>
            <button className="chip small" onClick={() => analysis.setEnabled(false)}>Stopp analyse</button>
          </div>
          <div className="tr-data">
            Sangene lagres i nettleseren av seg selv. {analysis.savedCount > 0 ? `${analysis.savedCount} venter på eksport (senere).` : ''}
            {analysis.savedCount > 0 && <button className="chip small" onClick={() => void analysis.exportAll()}>Eksporter</button>}
            <button className="chip small" onClick={() => void analysis.pickDir()}>{analysis.dirName ? `Mappe: ${analysis.dirName}` : 'Velg mappe'}</button>
          </div>
        </div>
      )}

      {prompt && analysis.enabled && (
        <div className="tr-prompt" role="group" aria-label="Stemmer det?" style={{ '--pc': col(prompt.part) } as CSSProperties}>
          <div className="tr-prompt-q">{EMOJI[toMark(prompt.part)]} <b style={{ color: col(prompt.part) }}>{PART_NAME[prompt.part] ?? prompt.part}</b> nå – stemmer det?</div>
          {!prompt.denied ? (
            <div className="tr-row">
              <button className="tr-btn tr-yes" onClick={confirmPrompt}>✔ Ja</button>
              <button className="tr-btn tr-no" onClick={denyPrompt}>✖ Nei</button>
              <button className="tr-btn" onClick={listenAgain}>▶ Hør igjen</button>
            </div>
          ) : (
            <>
              <div className="tr-row">{PARTS.map(p => <button key={p} data-part={p} className="tr-btn tr-part" style={{ '--pc': PART_COL[p] } as CSSProperties} onClick={() => apply(p)}><span className="tr-emoji">{EMOJI[p]}</span> {MARK_LABEL[p]}</button>)}</div>
              <button className="chip small" onClick={listenAgain}>▶ Hør igjen</button>
            </>
          )}
        </div>
      )}
      {toast && <div className="tr-toast">{toast}</div>}
      {!analysis.enabled && <div className="tr-toast tr-off">Analyse er av</div>}
    </div>
  )
}

/** Lite cover som pulserer på kicken. */
function CoverPulse({ party, cover }: { party: Party; cover: string | null }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (reducedMotion()) return
    return party.onFrame(() => {
      const el = ref.current; if (!el) return
      const k = party.calm ? 0 : party.engine.kick
      el.style.transform = `scale(${1 + k * 0.07})`
      el.style.boxShadow = `0 0 ${14 + k * 46}px color-mix(in srgb, var(--tr-accent) ${30 + k * 50}%, transparent)`
    })
  }, [party])
  return <div ref={ref} className="tr-cover" style={cover ? { backgroundImage: `url("${cover}")` } : undefined} />
}

/** Equalizer som danser med musikken (48 bånd), farget etter delen AI-en tror på. */
function Equalizer({ party }: { party: Party }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current, ctx = c?.getContext('2d')
    if (!c || !ctx) return
    let w = 1, h = 1
    const fit = () => { const r = c.getBoundingClientRect(), ratio = Math.min(window.devicePixelRatio || 1, 2); w = Math.max(1, Math.round(r.width)); h = Math.max(1, Math.round(r.height)); c.width = w * ratio; c.height = h * ratio; ctx.setTransform(ratio, 0, 0, ratio, 0, 0) }
    fit(); const ro = new ResizeObserver(fit); ro.observe(c)
    const still = reducedMotion()
    const off = party.onFrame(() => {
      ctx.clearRect(0, 0, w, h)
      const accent = getComputedStyle(c).getPropertyValue('--tr-accent').trim() || '#6aa5ff'
      const sp = party.engine.spectrum, n = sp.length || 48, bw = w / n
      const kick = party.calm ? 0 : party.engine.kick
      const g = ctx.createLinearGradient(0, h, 0, 0); g.addColorStop(0, accent); g.addColorStop(1, '#ffffff')
      ctx.fillStyle = g
      for (let i = 0; i < n; i++) {
        const v = still ? 0.15 : Math.pow(Math.min(1, sp[i] ?? 0), 0.85)
        const bh = Math.max(3, v * h * (0.82 + kick * 0.18))
        ctx.globalAlpha = 0.55 + 0.45 * v
        ctx.beginPath(); ctx.roundRect(i * bw + bw * 0.14, h - bh, bw * 0.72, bh, Math.min(bw * 0.36, 6)); ctx.fill()
      }
      ctx.globalAlpha = 1
    })
    return () => { off(); ro.disconnect() }
  }, [party])
  return <canvas ref={ref} className="tr-eq" aria-hidden />
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
function LiveTimeline({ party, positionMs: positionProp, selRef, detail, onPick: onPickProp }: { party: Party; positionMs: () => number; selRef: MutableRefObject<Sel>; detail: boolean; onPick: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  // Funksjonene får ny identitet ved hver render; effekten (og pekerhåndtererne) skal ikke startes på nytt midt i en drag.
  const posRef = useRef(positionProp); posRef.current = positionProp
  const pickRef = useRef(onPickProp); pickRef.current = onPickProp
  const detailRef = useRef(detail); detailRef.current = detail
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
    const LANE = 15, GAP = 3

    const draw = () => {
      const nowPos = positionMs()
      const xOf = (pos: number) => w * (1 - (nowPos - pos) / WIN_MS)
      ctx.clearRect(0, 0, w, h)
      const full = detailRef.current
      const LANES = full ? 4 : 2 // rent: bare «Ny» og «Din»; med Hjernen: alle
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
      // fylt «bølge» under bassen
      if (pts.length > 1) {
        const grad = ctx.createLinearGradient(0, curvesTop, 0, curvesBottom); grad.addColorStop(0, 'rgba(74,163,255,.38)'); grad.addColorStop(1, 'rgba(74,163,255,0)')
        ctx.fillStyle = grad; ctx.beginPath(); let started = false, lastX = 0, segId = -1
        for (const p of pts) {
          const x = xOf(p.pos), y = yOf(p.sub)
          if (p.seg !== segId) { if (started) { ctx.lineTo(lastX, curvesBottom); ctx.closePath(); ctx.fill(); ctx.beginPath() } ctx.moveTo(x, curvesBottom); ctx.lineTo(x, y); segId = p.seg; started = true } else ctx.lineTo(x, y)
          lastX = x
        }
        if (started) { ctx.lineTo(lastX, curvesBottom); ctx.closePath(); ctx.fill() }
      }
      line(p => p.sub, '#4aa3ff'); line(p => p.bright, '#ffb347')
      if (full) { line(p => Math.min(p.kick / 3, 1.1), 'rgba(170,170,170,.7)', 1.5); line(p => p.pModel, '#ffffff', 2); line(p => p.pApp, '#5ad68a', 2); line(p => p.pDrop, '#ff4d6d', 1.5) }
      ctx.font = '12px system-ui'
      const legend = full ? [['bass', '#4aa3ff'], ['lys klang', '#ffb347'], ['kick', '#aaa'], ['build-up (modell)', '#fff'], ['min lærling', '#5ad68a'], ['drop (lytter)', '#ff4d6d']] : [['bass', '#4aa3ff'], ['lys klang', '#ffb347']]
      legend.forEach(([n, cc], i) => { ctx.fillStyle = cc; ctx.fillText(n, 8 + i * 128, 12) })
      // felt: gammel, ny lytter, modell (≥ 80 %), Din
      const lanes: [string, (p: (typeof pts)[number]) => string | null][] = full
        ? [['Gammel', p => p.old], ['Ny', p => p.listener], ['Modell', p => (p.pModel >= 0.8 ? 'BUILDUP' : null)]]
        : [['AI', p => p.listener]]
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
      const yMine = curvesBottom + 6 + lanes.length * (LANE + GAP)
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
      ctx.save(); ctx.shadowColor = '#fff'; ctx.shadowBlur = 12; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(w - 1, curvesTop); ctx.lineTo(w - 1, h - 14); ctx.stroke(); ctx.restore()
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

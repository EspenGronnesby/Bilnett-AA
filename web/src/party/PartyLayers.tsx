import { analysis, MARK_LABEL, type MarkPart } from './analysis'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Rgb } from '../ui/colors'
import { SOURCE_LABEL, type PartySource } from './audio'
import type { Party } from './useParty'
import { drawGlow, drawPartyBackground, grainTile, hardPalette, OrbLayer, ParticleLayer, showPalette, volumeGain } from './visuals'

// Party's layers on the website, in the app's order (back to front): Party background (lights,
// strobe, flashes, dip, vignette) → video → particles and ripples → (content) with the ring and
// glow around the cover → film grain. Every layer draws from the engine on the shared frame loop.

const structureWeight = (v: number) => Math.min(Math.max((v - 0.25) / 0.25, 0), 1)

function fitCanvas(c: HTMLCanvasElement, w: number, h: number) {
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h }
}

/** Party background, drawn at 1/3 resolution (soft gradients, so it looks the same and costs a ninth). */
export function PartyScene({ party, palette, hasCover }: { party: Party; palette: Rgb[]; hasCover: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const pal = useRef({ palette, hasCover })
  pal.current = { palette, hasCover }
  useEffect(() => () => {
    const img = document.querySelector('.backdrop img') as HTMLElement | null
    if (img) img.style.filter = ''
  }, [])
  const graded = useRef({ img: null as HTMLElement | null, step: -1 })
  useEffect(() => party.onFrame(now => {
    const c = ref.current
    if (!c) return
    fitCanvas(c, Math.ceil(innerWidth / 3), Math.ceil(innerHeight / 3))
    const e = party.engine
    const hard = hardPalette(pal.current.palette, !pal.current.hasCover, e.warmth)
    const t = ((now % 8000) / 8000) * Math.PI * 2 // the app's light cycle is 8 s in Party
    drawPartyBackground(c.getContext('2d')!, c.width, c.height, e, pal.current.palette, hard, pal.current.hasCover, t, party.calm)
    // Colour grade on the blurred cover (muted in calm parts, vivid on the drop), as the app's gradeFilter.
    // Re-blurring a full-screen image is costly: only in 20 steps, and only when the step changes.
    const gr = graded.current
    if (!gr.img?.isConnected) { gr.img = document.querySelector('.backdrop img'); gr.step = -1 }
    const step = Math.round(e.grade * 20)
    if (gr.img && step !== gr.step) {
      gr.step = step
      const g = step / 20
      gr.img.style.filter = `blur(calc(40 * var(--u))) saturate(${1.1 * (1 + 0.35 * g)}) brightness(${1 + 0.12 * g})`
    }
  }), [party])
  return <canvas ref={ref} className="party-layer party-scene" data-shake="overscan" aria-hidden />
}

/** Particles and ripples coming out of the cover (HardstyleBackdrop). */
export function PartyParticles({ party, palette, hasCover, volume, video, dp }: {
  party: Party; palette: Rgb[]; hasCover: boolean; volume: number; video: boolean; dp: number
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const layer = useMemo(() => new ParticleLayer(), [])
  const live = useRef({ palette, hasCover, volume, video, dp })
  live.current = { palette, hasCover, volume, video, dp }
  const where = useRef({ at: -1e9, x: 0, y: 0, r: 0 })
  useEffect(() => party.onFrame(now => {
    const c = ref.current
    if (!c) return
    // At most ~2.5 million pixels (4K or a big portrait screen would be far more at full size).
    const ratio = Math.min(devicePixelRatio || 1, 1.5, Math.sqrt(2_500_000 / (innerWidth * innerHeight)))
    fitCanvas(c, Math.ceil(innerWidth * ratio), Math.ceil(innerHeight * ratio))
    const ctx = c.getContext('2d')!
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, c.width, c.height)
    // Where the cover is: measured a few times a second, not every frame (avoids layout work).
    const w = where.current
    if (now - w.at > 250) {
      w.at = now
      const cover = document.querySelector('[data-party-cover] .cover') as HTMLElement | null
      if (cover) {
        const r = cover.getBoundingClientRect()
        w.x = r.left + r.width / 2; w.y = r.top + r.height / 2; w.r = Math.min(r.width, r.height) * 0.5
      } else w.r = 0
    }
    if (!w.r) return
    const e = party.engine
    const l = live.current
    c.style.opacity = String(1 - (party.calm ? 0.3 : 0.85) * e.dip)
    const colors = showPalette(hardPalette(l.palette, !l.hasCover, e.warmth), e.dropLook)
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    layer.draw(ctx, innerWidth, innerHeight, e, colors, w.x, w.y, w.r, l.volume, l.video, l.dp, now, party.calm)
  }), [party, layer])
  return <canvas ref={ref} className="party-layer" data-shake="" aria-hidden />
}

/** The ring, its glow, the cover's pulse and the snare edge glow (ReactiveCover in the app). */
export function PartyCoverFx({ party, palette, hasCover, volume, dp }: {
  party: Party; palette: Rgb[]; hasCover: boolean; volume: number; dp: number
}) {
  const orbRef = useRef<HTMLCanvasElement>(null)
  const glowRef = useRef<HTMLCanvasElement>(null)
  const edgeRef = useRef<HTMLDivElement>(null)
  const orb = useMemo(() => new OrbLayer(), [])
  const live = useRef({ palette, hasCover, volume, dp })
  live.current = { palette, hasCover, volume, dp }
  useEffect(() => party.onFrame(now => {
    const host = orbRef.current?.parentElement
    const e = party.engine
    // The cover pulses with the kick and breathes with the bass; the ring grows with it, so the cover
    // never swells over the ring.
    const pulse = 1 + e.breath * 0.05 + e.kick * (0.045 + e.heavy * 0.09) * volumeGain(live.current.volume) * (0.4 + 0.6 * e.phaseLevel)
    // In the app the cover is 86 % of the box the ring lives in (Cover(size * .86f)).
    const l = { ...live.current, size: (host?.offsetWidth ?? 0) / 0.86 * pulse }
    if (!l.size) return
    const colors = showPalette(hardPalette(l.palette, !l.hasCover, e.warmth), e.dropLook)
    const ratio = Math.min(devicePixelRatio || 1, 2)
    // The ring's spikes reach ~1.1 × the cover from the centre: the canvas is 2.4 × the cover.
    const box = l.size * 2.4
    const c = orbRef.current
    if (c) {
      fitCanvas(c, Math.ceil(box * ratio), Math.ceil(box * ratio))
      c.style.width = c.style.height = `${box}px`
      const ctx = c.getContext('2d')!
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, c.width, c.height)
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      orb.draw(ctx, box / 2, box / 2, l.size, e, colors, l.volume, l.dp, now)
    }
    // Glow: half size, blurred by CSS, scaled up 2× (as the app does with RenderEffect).
    const g = glowRef.current
    if (g) {
      const gs = Math.ceil(l.size * 1.2)
      fitCanvas(g, gs, gs)
      g.style.width = g.style.height = `${gs * 2}px`
      // The app blurs 9 dp in the half-size layer (σ ≈ 5.7 dp), then scales it up 2×.
      g.style.filter = `blur(${11 * l.dp}px)`
      drawGlow(g.getContext('2d')!, gs, orb.shape, colors, l.volume, l.dp)
    }
    // The cover pulses with the kick and breathes with the bass.
    const cover = document.querySelector('[data-party-cover] .cover') as HTMLElement | null
    if (cover) cover.style.transform = `scale(${pulse})`
    const edge = edgeRef.current
    if (edge) edge.style.opacity = party.calm ? '0' : String(Math.min(0.55 * e.snare * structureWeight(e.vibe), 0.55))
  }), [party, orb])
  useEffect(() => () => {
    const cover = document.querySelector('[data-party-cover] .cover') as HTMLElement | null
    if (cover) cover.style.transform = ''
  }, [])
  return (
    <>
      <canvas ref={glowRef} className="party-glow" aria-hidden />
      <canvas ref={orbRef} className="party-orb" aria-hidden />
      <div ref={edgeRef} className="party-edge" aria-hidden />
    </>
  )
}

/** Shakes the scene (the app's sceneShake): background and video zoomed so edges never show. */
export function PartyShaker({ party, dp }: { party: Party; dp: number }) {
  const live = useRef(dp)
  live.current = dp
  useEffect(() => {
    let els: HTMLElement[] = []
    let foundAt = -1e9
    let last = ''
    const off = party.onFrame(now => {
      const e = party.engine
      const d = live.current
      const tx = +(e.shakeX * d).toFixed(1), ty = +((e.shakeY + e.bounceY) * d).toFixed(1), rot = +e.shakeRotation.toFixed(2)
      const key = `${tx},${ty},${rot}`
      // The elements are looked up twice a second (video and cover come and go), not every frame.
      if (now - foundAt > 500) { foundAt = now; els = [...document.querySelectorAll<HTMLElement>('[data-shake], .clip')]; last = '' }
      if (key === last) return
      last = key
      const minSide = Math.max(Math.min(innerWidth, innerHeight), 1)
      const zoom = 1 + (2 * Math.hypot(tx, ty)) / minSide + 0.02 * Math.abs(rot)
      els.forEach(el => {
        const overscan = el.dataset.shake === 'overscan' || el.classList.contains('clip')
        el.style.transform = tx || ty || rot ? `translate(${tx}px, ${ty}px) rotate(${rot}deg)${overscan ? ` scale(${zoom})` : ''}` : ''
      })
    })
    return () => {
      off()
      document.querySelectorAll<HTMLElement>('[data-shake], .clip').forEach(el => { el.style.transform = '' })
    }
  }, [party])
  return null
}

/** Film grain (Party only): a tiled noise texture, nudged ~15× a second, barely visible. */
export function PartyGrain() {
  const ref = useRef<HTMLDivElement>(null)
  const tile = useMemo(() => grainTile(), [])
  useEffect(() => {
    let step = 0
    const id = window.setInterval(() => {
      step++
      if (ref.current) ref.current.style.backgroundPosition = `${-((step * 73) % 128)}px ${-((step * 151) % 128)}px`
    }, 66)
    return () => clearInterval(id)
  }, [])
  return <div ref={ref} className="party-grain" style={{ backgroundImage: `url(${tile})` }} aria-hidden />
}

/** Short announcements, as the app's banner: PARTY ON/OFF, a new genre, a new song part. */
export function PartyBanner({ party }: { party: Party }) {
  const [text, setText] = useState<string | null>(null)
  const seen = useRef({ genreAt: 0, partAt: 0, on: party.on, first: true })
  useEffect(() => {
    const s = seen.current
    if (s.on !== party.on) {
      s.on = party.on
      setText(party.on ? 'PARTY ON' : 'PARTY OFF')
    }
  }, [party.on])
  useEffect(() => party.onFrame(() => {
    const e = party.engine
    const s = seen.current
    if (e.genreAnnouncedAt > s.genreAt) {
      s.genreAt = e.genreAnnouncedAt
      if (!s.first) setText(e.genreLabel)
      s.first = false
    }
    if (e.partLabelAt > s.partAt && e.partLabel) { s.partAt = e.partLabelAt; setText(e.partLabel) }
  }), [party])
  useEffect(() => {
    if (!text) return
    const t = setTimeout(() => setText(null), 1_800)
    return () => clearTimeout(t)
  }, [text])
  return text ? <div className="party-banner" key={text}>{text}</div> : null
}

/** Where Party listens, and the vibe slider (Auto or a fixed strength per genre, as in the app). */
export function PartyControls({ party, strength, setStrength, koko, setKoko }: {
  party: Party
  strength: number | undefined
  setStrength: (value: number | undefined) => void
  koko: boolean
  setKoko: (on: boolean) => void
}) {
  const [, redraw] = useState(0)
  // The genre label and live level change with the music: refresh the row a few times a second.
  useEffect(() => {
    const id = window.setInterval(() => redraw(n => n + 1), 400)
    return () => clearInterval(id)
  }, [])
  const e = party.engine
  const shown = strength ?? e.vibeLive
  return (
    <div className="party-controls">
      <div className="mode-buttons">
        <div data-audio-choice>
          {(['system', 'tab', 'mic'] as PartySource[]).map(source => <button key={source} className={party.listening?.source === source ? 'chip on' : 'chip'} onClick={() => party.listenTo(source)}>{SOURCE_LABEL[source]}</button>)}
        </div>
        <button className={koko ? 'chip on' : 'chip'} onClick={() => setKoko(!koko)}>Koko</button>
      </div>
      {/* Vibe, connection and genre on one row (the name of the shared sound shows on hover). */}
      <div className="vibe">
        <button className={strength === undefined ? 'chip small on' : 'chip small'} onClick={() => setStrength(undefined)}>Auto</button>
        <input type="range" min={0} max={100} step={1} aria-label="Vibe-styrke"
          value={Math.round(shown * 100)}
          onChange={ev => setStrength(Number(ev.currentTarget.value) / 100)} />
        <span className="chip info" title={party.listening?.label}>{party.connecting ? 'Kobler til …' : party.listening ? party.paused ? 'Pause' : party.listening.status() : 'Ikke tilkoblet'}</span>
        {party.listening && e.hearing && <span className="chip info">{e.genreLabel}</span>}
      </div>
      {party.error && <p className="notice">{party.error}</p>}
      <AnalysisPanel />
    </div>
  )
}

/** Analyse (steg 5): ta opp og merk hvor i sangen vi er; merkene brukes til å trene lytteren (eksporteres til Mac-en). */
function AnalysisPanel() {
  const [, redraw] = useState(0)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    void analysis.refreshCount()
    return analysis.subscribe(() => redraw(n => n + 1))
  }, [])
  const on = analysis.enabled
  return (
    <div className="analysis">
      <button className={on ? 'chip small on' : 'chip small'} onClick={() => analysis.setEnabled(!on)}
        title="Tar opp lyden og lar deg merke sangdelene. Lagres i nettleseren til du eksporterer.">Analyse {on ? 'på' : 'av'}</button>
      {on && <button className={analysis.trainerOpen ? 'chip small on' : 'chip small'} onClick={() => analysis.trainerOpen ? analysis.closeTrainer() : analysis.openTrainer()}>AI-trener</button>}
      {on && (Object.keys(MARK_LABEL) as MarkPart[]).map(p =>
        <button key={p} className={analysis.mark === p ? 'chip small on' : 'chip small'} onClick={() => analysis.setMark(p)}>{MARK_LABEL[p]}</button>)}
      {on && <button className={analysis.dirName ? 'chip small on' : 'chip small'} onClick={() => void analysis.pickDir()}
        title="Velg en mappe (for eksempel Nedlastinger/rave-analyse): hver sang lagres dit av seg selv, så du kan la en spilleliste gå uten å trykke noe.">
        {analysis.dirName ? `Mappe: ${analysis.dirName}` : 'Velg mappe'}</button>}
      {analysis.savedCount > 0 && (
        <button className="chip small" disabled={busy} onClick={async () => { setBusy(true); try { await analysis.exportAll() } finally { setBusy(false) } }}>
          Eksporter ({analysis.savedCount})</button>)}
      {on && analysis.note && <span className="chip info">{analysis.note}</span>}
    </div>
  )
}

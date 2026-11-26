import { analysis } from './analysis'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Rgb } from '../ui/colors'
import { SOURCE_LABEL, type PartySource } from './audio'
import type { Party } from './useParty'
import { coreSprite, drawGlow, drawOrb, drawPartyBackground, grainTile, hardPalette, ParticleLayer, showPalette } from './visuals'

// Party's layers on the website, in the app's order (back to front): Party background (lights,
// strobe, flashes, dip, vignette) → video → light dust and light waves → (content) with the aura and
// its glow around the cover → film grain. Every layer draws from the engine on the shared frame loop.

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
    const cycle = e.backlightCycleS * 1000
    const t = ((now % cycle) / cycle) * Math.PI * 2 // one slow round of the lights, in the aura's calm tempo
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

/** The sheen behind the cover, light waves and light dust floating out from the aura (HardstyleBackdrop). */
export function PartyParticles({ party, palette, hasCover, volume, video, dp }: {
  party: Party; palette: Rgb[]; hasCover: boolean; volume: number; video: boolean; dp: number
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const layer = useMemo(() => new ParticleLayer(), [])
  const live = useRef({ palette, hasCover, volume, video, dp })
  live.current = { palette, hasCover, volume, video, dp }
  const where = useRef({ at: -1e9, x: 0, y: 0, r: 0, corner: 0 })
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
        w.x = r.left + r.width / 2; w.y = r.top + r.height / 2; w.r = cover.offsetWidth * 0.5 // at rest (not the pulse)
        w.corner = Math.min(parseFloat(getComputedStyle(cover).borderTopLeftRadius) || 0, w.r)
      } else w.r = 0
    }
    if (!w.r) return
    const e = party.engine
    const l = live.current
    c.style.opacity = String(1 - (party.calm ? 0.3 : 0.85) * e.dip)
    const colors = showPalette(hardPalette(l.palette, !l.hasCover, e.warmth), e.dropLook)
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    layer.draw(ctx, innerWidth, innerHeight, e, colors, w.x, w.y, w.r, w.corner, l.volume, l.video, l.dp, now, party.calm)
  }), [party, layer])
  return <canvas ref={ref} className="party-layer" data-shake="" aria-hidden />
}

/** The bloom is drawn at this share of full size (it is blurred anyway; the page's own, not part of the look). */
const GLOW_SCALE = 0.5

/** The aura, its bloom, the cover's pulse and the snare edge glow (ReactiveCover in the app). */
export function PartyCoverFx({ party, palette, hasCover, dp }: {
  party: Party; palette: Rgb[]; hasCover: boolean; dp: number
}) {
  const orbRef = useRef<HTMLCanvasElement>(null)
  const glowRef = useRef<HTMLCanvasElement>(null)
  const edgeRef = useRef<HTMLDivElement>(null)
  const live = useRef({ palette, hasCover, dp })
  live.current = { palette, hasCover, dp }
  const sized = useRef({ side: 0, dp: 0, radius: 0, ratio: 0, checkedAt: -1e9, core: null as HTMLCanvasElement | null, blur: '', edge: '' })
  useEffect(() => party.onFrame(now => {
    const e = party.engine
    const l = live.current
    const cover = orbRef.current?.parentElement?.querySelector('.cover') as HTMLElement | null
    // The cover's own side at rest (offsetWidth ignores the pulse): the engine shapes the aura around it.
    const side = cover?.offsetWidth ?? 0
    if (!cover || !side) return
    const s = sized.current
    const ratio = Math.min(devicePixelRatio || 1, 2)
    // The cover's real corner radius: read when the size changes (and now and then, in case only it changed).
    if (s.side !== side || s.dp !== l.dp || s.ratio !== ratio || now - s.checkedAt > 1000) {
      const radius = Math.min(parseFloat(getComputedStyle(cover).borderTopLeftRadius) || 0, side / 2)
      s.checkedAt = now
      if (s.side !== side || s.dp !== l.dp || s.ratio !== ratio || s.radius !== radius) {
        s.side = side; s.dp = l.dp; s.ratio = ratio; s.radius = radius
        e.setOrbSize(side, radius)
        s.core = coreSprite(e, side, radius, l.dp, ratio)
      }
    }
    const colors = showPalette(hardPalette(l.palette, !l.hasCover, e.warmth), e.dropLook)
    // Exactly the room the aura can need, from the core's own numbers: the cover at its biggest pulse plus
    // the furthest the aura reaches (orbExtent, from the centre), and the bloom's blur. No bigger: every
    // pixel is cleared and blended each picture. Fixed size and never scaled by CSS, so the shapes stay
    // crisp; the engine has already put the cover's pulse into the points.
    const blurPx = e.bloomBlurDp * l.dp
    // Room for the softest glow («Skarphet» 0), so the canvas never changes size while the slider is dragged.
    const box = Math.ceil(side * e.orbExtent + e.bloomRoomBlurs * e.bloomRoomDp * l.dp) * 2
    const c = orbRef.current
    if (c) {
      const px = Math.round(box * ratio)
      if (c.width !== px) { c.width = c.height = px; c.style.width = c.style.height = `${box}px` }
      const ctx = c.getContext('2d')!
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, px, px)
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      drawOrb(ctx, box / 2, box / 2, box, e, colors, side, s.radius, s.core)
    }
    const g = glowRef.current
    if (g) {
      const gs = box * GLOW_SCALE
      if (g.width !== gs) {
        g.width = g.height = gs
        g.style.width = g.style.height = `${box}px`
      }
      // (Setting a filter makes the browser set the layer up again: only when the number changes.)
      const blur = `blur(${blurPx}px)`
      if (s.blur !== blur) { s.blur = blur; g.style.filter = blur }
      drawGlow(g.getContext('2d')!, gs, e, colors, l.dp, GLOW_SCALE)
    }
    // The cover pulses with the kick and breathes with the bass: the same scale the aura was shaped with.
    cover.style.transform = `scale(${e.coverScale})`
    const edge = edgeRef.current
    // The snare glow: soft and short, just outside the cover's edge, following the cover's pulse (eased by the engine).
    if (edge) {
      // Its look (a soft shadow in the core's colour) comes from the core's numbers; set once.
      const c = e.coreColor
      const shadow = `0 0 calc(${e.edgeGlowBlurDp} * var(--u)) calc(${e.edgeGlowSpreadDp} * var(--u)) rgb(${(c >> 16) & 255} ${(c >> 8) & 255} ${c & 255} / ${e.edgeGlowAlpha})`
      if (s.edge !== shadow) { s.edge = shadow; edge.style.boxShadow = shadow }
      edge.style.opacity = party.calm ? '0' : e.edgeGlow.toFixed(3)
      edge.style.transform = `scale(${e.coverScale})`
    }
  }), [party])
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

/** The only on-screen announcement: PARTY ON / PARTY OFF (no genre or song-part text: the AI trainer shows those). */
export function PartyBanner({ party }: { party: Party }) {
  const [text, setText] = useState<string | null>(null)
  const seen = useRef({ on: party.on })
  useEffect(() => {
    const s = seen.current
    if (s.on !== party.on) {
      s.on = party.on
      setText(party.on ? 'PARTY ON' : 'PARTY OFF')
    }
  }, [party.on])
  useEffect(() => {
    if (!text) return
    const t = setTimeout(() => setText(null), 1_800)
    return () => clearTimeout(t)
  }, [text])
  return text ? <div className="party-banner" key={text}>{text}</div> : null
}

/** Where Party listens, and the vibe slider (Auto or a fixed strength per genre, as in the app). */
export function PartyControls({ party, strength, setStrength, settingsOpen, onToggleSettings }: {
  party: Party
  strength: number | undefined
  setStrength: (value: number | undefined) => void
  /** «Party-innstillinger» (lysbølger, risting, strobe, hvite blink) er åpne. */
  settingsOpen: boolean
  onToggleSettings: () => void
}) {
  const [, redraw] = useState(0)
  // The genre label and live level change with the music: refresh the row a few times a second.
  useEffect(() => {
    const id = window.setInterval(() => redraw(n => n + 1), 400)
    return () => clearInterval(id)
  }, [])
  const e = party.engine
  const shown = strength ?? e.vibeLive
  // Tilkoblingen vises bare når noe er galt (ikke ved «Mottar lyd» eller pause).
  const status = party.connecting ? 'Kobler til …' : party.listening ? (party.paused ? 'Pause' : party.listening.status()) : 'Ikke tilkoblet'
  const connection = status === 'Mottar lyd' || status === 'Pause' ? '' : status
  return (
    <div className="party-controls">
      <div className="mode-buttons">
        <div data-audio-choice>
          {(['system', 'tab', 'mic'] as PartySource[]).map(source => <button key={source} className={party.listening?.source === source ? 'chip on' : 'chip'} onClick={() => party.listenTo(source)}>{SOURCE_LABEL[source]}</button>)}
        </div>
      </div>
      {/* Vibe and (only when something is off) the connection (the name of the shared sound shows on hover). */}
      <div className="vibe">
        <button className={strength === undefined ? 'chip small on' : 'chip small'} onClick={() => setStrength(undefined)}>Auto</button>
        <input type="range" min={0} max={100} step={1} aria-label="Vibe-styrke"
          value={Math.round(shown * 100)}
          onChange={ev => setStrength(Number(ev.currentTarget.value) / 100)} />
        {connection && <span className="chip info" title={party.listening?.label}>{connection}</span>}
      </div>
      {party.error && <p className="notice">{party.error}</p>}
      <AnalysisPanel>
        <button className={settingsOpen ? 'chip small on' : 'chip small'} aria-pressed={settingsOpen} onClick={onToggleSettings}>Innstillinger</button>
      </AnalysisPanel>
    </div>
  )
}

/** Analyse (steg 5): ta opp og merk hvor i sangen vi er; merkene brukes til å trene lytteren (eksporteres til Mac-en). */
function AnalysisPanel({ children }: { children?: ReactNode }) {
  const [, redraw] = useState(0)
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
      {children}
      {on && analysis.note && <span className="chip info">{analysis.note}</span>}
    </div>
  )
}

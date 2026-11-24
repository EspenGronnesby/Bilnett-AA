import type { WebPartyEngine } from '../core/generated/rave-core.mjs'
import { css, type Rgb } from '../ui/colors'

// Party drawing for the website, a port of the app's HardstyleVisuals.kt (HardstyleBackdrop,
// RippleBank, softDot) and the Party part of RaveActivity's background Canvas. Same numbers as the
// app; lengths in dp are multiplied by [dp] (CSS px per dp). The aura only draws what the shared
// engine has shaped (rave-core OrbGeometry). The look's numbers (strengths, sizes, colour mixes) live in
// rave-core (OrbGeometry.kt, FestivalShow.kt) and are read from the engine, so the app draws the same.

// ---------- volume curves (same as rave-core Volume.kt) ----------
export const volumeGain = (v: number) => 0.35 + 0.65 * Math.pow(Math.min(Math.max(v, 0), 1), 1.5)
export const loudRamp = (v: number) => Math.min(Math.max((v - 0.7) / 0.3, 0), 1)

const clamp = (x: number, lo: number, hi: number) => Math.min(Math.max(x, lo), hi)
const lerpRgb = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
const WHITE: Rgb = [255, 255, 255]

// ---------- palettes (RaveActivity: hardPalette / showPalette) ----------
function toHsv([r, g, b]: Rgb): [number, number, number] {
  const R = r / 255, G = g / 255, B = b / 255, max = Math.max(R, G, B), min = Math.min(R, G, B), d = max - min
  let h = 0
  if (d > 0) h = max === R ? 60 * (((G - B) / d) % 6) : max === G ? 60 * ((B - R) / d + 2) : 60 * ((R - G) / d + 4)
  if (h < 0) h += 360
  return [h, max === 0 ? 0 : d / max, max]
}
function fromHsv(h: number, s: number, v: number): Rgb {
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255]
}
const DEFAULT_HARD: Rgb[] = [[0, 255, 255], [170, 68, 255], [255, 68, 187]]
const WARMTH_PULL = 0.45

/** Cover colours pushed to strong, bright party colours; reggae pulls them toward red/gold/green. */
export function hardPalette(colors: Rgb[], isDefault: boolean, warmth: number): Rgb[] {
  const base = isDefault ? DEFAULT_HARD : colors
  const out = base.map(c => {
    const hsv = toHsv(c)
    hsv[1] = Math.max(hsv[1], 0.7); hsv[2] = Math.max(hsv[2], 0.85)
    if (warmth > 0) {
      const warm = [0, 45, 120].reduce((best, w) => (Math.abs(((hsv[0] - w + 540) % 360) - 180) < Math.abs(((hsv[0] - best + 540) % 360) - 180) ? w : best))
      const d = ((warm - hsv[0] + 540) % 360) - 180
      hsv[0] = (hsv[0] + d * WARMTH_PULL * warmth + 360) % 360
    }
    return fromHsv(hsv[0], hsv[1], hsv[2])
  })
  return out.length ? out : DEFAULT_HARD.slice(0, 2)
}
/** Drop look 2: the colours rotate one step, like a light desk switching palettes. */
export const showPalette = (hard: Rgb[], dropLook: number) => (dropLook === 2 && hard.length > 1 ? [...hard.slice(1), hard[0]] : hard)

// ---------- soft light sprites (drawn once per colour, then only stamped, added as light) ----------
const DOT = 64
const dotCache = new Map<string, HTMLCanvasElement>()
/** A soft, blurred point of light: bright in the middle, fading smoothly to nothing (no edge anywhere). */
function softDot(color: Rgb): HTMLCanvasElement {
  const key = color.map(Math.round).join(',')
  let c = dotCache.get(key)
  if (c) return c
  c = document.createElement('canvas')
  c.width = c.height = DOT
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(DOT / 2, DOT / 2, 0, DOT / 2, DOT / 2, DOT / 2)
  // Bell curve: exp(−4.5 r²), lifted to 0 at the rim.
  for (let k = 0; k <= 8; k++) {
    const r = k / 8
    grad.addColorStop(r, css(color, Math.max(Math.exp(-4.5 * r * r) - 0.0111, 0) / 0.9889))
  }
  g.fillStyle = grad
  g.fillRect(0, 0, DOT, DOT)
  if (dotCache.size > 64) dotCache.clear()
  dotCache.set(key, c)
  return c
}
const frac = (x: number) => x - Math.floor(x)

/** The warm, nearly white light of the aura's core (from rave-core); dust and waves are mixed toward it. */
let coreInt = -1
let coreRgbValue: Rgb = [255, 255, 255]
function coreColor(e: WebPartyEngine): Rgb {
  if (e.coreColor !== coreInt) { coreInt = e.coreColor; coreRgbValue = [(coreInt >> 16) & 255, (coreInt >> 8) & 255, coreInt & 255] }
  return coreRgbValue
}

// ---------- light dust, light waves and the northern-light sheen (HardstyleBackdrop + RippleBank) ----------
// The same light as the aura: the cover's colours, soft, added as light, no outlines. The numbers live
// in rave-core (FestivalShow.kt), so the app can draw the same thing in Compose: stamped soft dots
// (drawImage / drawCircle with a radial brush made once), a few wide rounded-rect strokes, BlendMode.Plus.
/** A wave is a handful of strokes on top of each other, narrow to wide: together a soft bell (cos²), no line. */
const waveStrokes = (n: number) => Array.from({ length: n }, (_, k) => Math.cos((Math.PI / 2) * (k / n)) ** 2 - Math.cos((Math.PI / 2) * ((k + 1) / n)) ** 2)
export class ParticleLayer {
  private clock = 0
  private lastAt = 0
  private mood = new Float32Array(6) // vocal, vocal hit, sparkle, highs, drop, backdrop swell
  private drift = 0
  private seed = 0
  private armed = true
  private flashes = new Float32Array(0)
  private lit = new Float32Array(0)
  private born = new Float64Array(0)
  private strength = new Float32Array(0)
  private strokes: number[] = []
  private next = 0
  private rippleArmed = true
  private lastSpawn = 0

  /** [cx], [cy]: the cover's centre; [half]: half its side (CSS px). The corner radius is unused since the waves are round. */
  draw(ctx: CanvasRenderingContext2D, w: number, h: number, e: WebPartyEngine, colors: Rgb[], cx: number, cy: number,
    half: number, _corner: number, volume: number, video: boolean, dp: number, now: number, calm = false) {
    const spectrum = e.spectrum
    const softness = e.softness
    const amount = clamp(e.particles, 0.4, 1.3)
    const gain = volumeGain(volume), ramp = loudRamp(volume)
    const span = Math.max(w, h), side = half * 2
    const dim = video ? e.videoLightDim : 1
    const white = coreColor(e)
    const waves = e.waveCount
    if (this.born.length !== waves) { this.born = new Float64Array(waves).fill(-100_000); this.strength = new Float32Array(waves) }
    if (this.strokes.length !== e.waveStrokes) this.strokes = waveStrokes(e.waveStrokes)
    const strokes = this.strokes
    const dt = this.lastAt === 0 ? 0 : clamp((now - this.lastAt) / 1000, 0, 0.1)
    this.lastAt = now
    const ease = (i: number, target: number, rise: number, fall: number) => {
      const tau = target > this.mood[i] ? rise : fall
      this.mood[i] += (target - this.mood[i]) * (1 - Math.exp(-dt / tau))
    }
    const hats = Math.max(e.snare, e.crash)
    if (hats < 0.3) this.armed = true
    const newHit = hats > 0.7 && this.armed
    if (newHit) { this.armed = false; this.seed++ }
    const flashDecay = Math.exp(-dt / e.dustTwinkleDecayS)
    ease(0, e.vocal, 0.15, 0.6)
    ease(1, e.vocalHit, 0.08, 0.5)
    ease(2, hats, 0.06, 0.3)
    ease(3, Math.max(e.highs, e.highMotion * 0.6, e.build * 0.6), 0.15, 0.5)
    ease(4, e.dropOn ? Math.max(e.heavy, 0.6) : e.heavy * 0.5, 0.4, 1.2)
    ease(5, Math.min(e.partyHit, 1.2) / 1.2, 0.05, 0.25) // already eased by the engine; a touch more for size
    const [vocal, vocalHit, twinkle, highs, drop, swell] = this.mood
    // One steady, slow drift: a little quicker in the drop, never in a hurry. Eased, so the pace never jumps.
    const driftGoal = (e.particleDrift * (0.8 + 0.2 * drop + 0.1 * vocal) * (0.85 + 0.15 * gain) * (0.7 + 0.3 * amount)) / e.dustDriftS
    this.drift += (driftGoal - this.drift) * (this.drift === 0 ? 1 : 1 - Math.exp(-dt / e.dustPaceEaseS))
    this.clock = (this.clock + dt * this.drift) % 10_000
    ctx.globalCompositeOperation = 'lighter'

    // The northern-light sheen behind the cover: two big soft lights in the cover's colours, slowly
    // circling it, swelling with the bass (the engine's eased partyHit).
    const round = ((now / 1000) % e.haloRoundS) / e.haloRoundS * Math.PI * 2
    const haloW = side * e.haloWidth * (1 + e.haloSwell * swell), haloH = side * e.haloHeight * (1 + e.haloSwell * swell)
    const haloAlpha = (e.haloRest + e.haloGain * swell * (e.haloGainCalm + (1 - e.haloGainCalm) * e.phaseLevel)) * dim
    for (let k = 0; k < 2; k++) {
      const a = round + k * Math.PI
      const hx = cx + Math.cos(a) * side * e.haloOffset, hy = cy + Math.sin(a) * side * e.haloOffset * e.haloSquash
      ctx.globalAlpha = clamp(haloAlpha, 0, 1)
      ctx.drawImage(softDot(colors[k % colors.length]), hx - haloW / 2, hy - haloH / 2, haloW, haloH)
    }

    // Light waves only in the drop, on lots of bass AND distortion together (zaag etc.), and not too often.
    const bass = e.bass, grit = e.grit
    if (bass < e.waveRearmBass) this.rippleArmed = true
    if (this.rippleArmed && e.dropOn && bass > e.waveBassFrom && grit > e.waveGritFrom && now - this.lastSpawn > e.rippleGapMs) {
      this.rippleArmed = false
      this.lastSpawn = now
      this.born[this.next] = now
      this.strength[this.next] = Math.min((0.4 + grit * 0.6) * bass * gain * (1 + ramp * 0.4), 1.4)
      this.next = (this.next + 1) % waves
    }
    // A wide, soft ring of light in the cover's own shape (rounded square, rounder as it grows), spreading
    // calmly out from the aura and fading away completely.
    const life = e.waveLifeMs
    ctx.lineJoin = 'round'
    for (let r = 0; r < waves; r++) {
      const age = now - this.born[r]
      const s = this.strength[r]
      if (s <= 0 || age < 0 || age >= life) continue
      const q = age / life
      const eased = 1 - (1 - q) ** e.waveSlowdown
      const out = side * (e.waveStart + e.waveReach * eased)
      const width = side * (e.waveWidthFrom + (e.waveWidthTo - e.waveWidthFrom) * eased)
      const fade = Math.min(q * e.waveFadeIn, 1) * (1 - q) ** e.waveFadeOutCurve * (0.5 + 0.5 * Math.min(s, 1)) * e.waveAlpha * dim
      if (fade < 0.004) continue
      ctx.strokeStyle = css(lerpRgb(colors[r % colors.length], white, e.waveWhiteMix))
      // Round (Espen 2026-11-24), drawn behind the cover like in the app.
      ctx.beginPath(); ctx.arc(cx, cy, half + out, 0, Math.PI * 2)
      for (let k = 0; k < strokes.length; k++) {
        ctx.globalAlpha = fade * strokes[k]
        ctx.lineWidth = (width * (k + 1)) / strokes.length
        ctx.stroke()
      }
    }

    // Light dust: born at the aura, floating slowly outward with a gentle sideways sway, fading long
    // before the edge. Mostly small; a few big, faint ones (depth); some nearly white.
    // Antallene står i rave-core (FestivalShow.kt: PARTICLES_BASE / PARTICLES_MAX).
    const base = e.particleBase, most = e.particleMax
    if (this.flashes.length !== most) { this.flashes = new Float32Array(most); this.lit = new Float32Array(most) }
    const baseCount = Math.trunc(base * e.density)
    const count = clamp(Math.trunc((base + (most - base) * ramp) * e.density), 12, most)
    // More of them show in the drop (they fade in, they are not born suddenly).
    const showing = count * (e.dustCalmShare + (1 - e.dustCalmShare) * drop)
    const up = 1 - Math.exp(-dt / e.dustAttackS), down = 1 - Math.exp(-dt / e.dustReleaseS)
    const rest = e.dustRest, sway = e.dustSway
    const sizeAll = (0.85 + 0.15 * gain) * (1 + ramp * 0.2) * (0.8 + 0.2 * softness) * dp
    const lift = e.energy * 0.45 + highs * 0.25 + vocal * 0.25 + vocalHit * 0.15 + drop * 0.35
    const whiteEvery = e.dustWhiteEvery, bigEvery = e.dustBigEvery
    const twinkleShare = e.dustTwinkleShare, twinkleMin = e.dustTwinkleMin, bandGain = e.dustBandGain, twinkleGain = e.dustTwinkleGain
    const fadeIn = e.dustFadeIn, fadeOut = e.dustFadeOutCurve, shimmerDepth = e.dustShimmer, bigAlpha = e.dustBigAlpha
    const startAt = e.dustStart, reach = span * e.dustReach, path = e.dustPathCurve, bigDp = e.dustBigDp, smallDp = e.dustSmallDp
    const whiteMix = e.dustWhiteMix, tintMix = e.dustTintMix
    for (let i = 0; i < count; i++) {
      const h1 = frac(i * 0.754877), h2 = frac(i * 0.569840), h3 = frac(i * 0.438579)
      const phase = frac(i * 0.618034 + this.clock * (0.7 + 0.6 * h1))
      if (newHit && !calm && frac(i * 0.618034 + this.seed * 0.381966) < twinkleShare) this.flashes[i] = Math.max(twinkle, twinkleMin)
      else this.flashes[i] *= flashDecay
      // Each grain lights up softly with its own band and the music, and dies out slowly.
      const goal = clamp(rest + (1 - rest) * (lift + spectrum[32 + (i % 16)] * bandGain + this.flashes[i] * twinkleGain), 0, 1)
      this.lit[i] += (goal - this.lit[i]) * (goal > this.lit[i] ? up : down)
      const shown = clamp((showing - i) / 10, 0, 1) * (i >= baseCount ? ramp : 1)
      const edgeFade = Math.min(phase * fadeIn, 1) * (1 - phase) ** fadeOut
      const big = i % bigEvery === 3
      const shimmer = 1 - shimmerDepth + shimmerDepth * Math.sin(this.clock * 45 * (0.6 + h2) + i * 1.7)
      const alpha = (edgeFade * this.lit[i] * shimmer * shown * (big ? bigAlpha : 1) * dim * (0.6 + 0.4 * amount)) / Math.sqrt(softness)
      if (alpha < 0.008) continue
      const angle = i * 2.399963 + sway * Math.sin(this.clock * 19 * (0.6 + 0.8 * h2) + i)
      const dx = Math.cos(angle), dy = Math.sin(angle)
      // From the cover's (square) edge, not from a circle inside it.
      const start = (half * startAt) / Math.max(Math.abs(dx), Math.abs(dy))
      const distance = start + reach * phase ** path
      const d = (big ? bigDp : smallDp) * (0.6 + 0.8 * h3) * (0.85 + 0.4 * phase) * sizeAll * 2
      const tone = colors[i % colors.length]
      ctx.globalAlpha = Math.min(alpha, 1)
      ctx.drawImage(softDot(lerpRgb(tone, white, i % whiteEvery === 1 ? whiteMix : tintMix)), cx + dx * distance - d / 2, cy + dy * distance - d / 2, d, d)
    }
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }
}

// ---------- the aura around the cover (shape from rave-core's OrbGeometry) ----------
// A filled, coloured sound spectrum round the cover (bass bulging at the top, brighter sounds down the
// sides), with a few slower, bigger layers of the same spectrum behind it. Filled with the cover's
// colours flowing round the ring, half transparent and added as light. No outlines: the edge of the
// fill IS the spectrum. A soft, nearly white core hugs the cover, and a bloom lies behind it all.

/** One layer's finished outline from the engine (closed curve through its points), around (cx, cy). */
function orbPath(ctx: CanvasRenderingContext2D, e: WebPartyEngine, layer: number, cx: number, cy: number, scale = 1) {
  const p = e.orbPoints(layer), c = e.orbCurves(layer)
  ctx.beginPath()
  ctx.moveTo(cx + p[0] * scale, cy + p[1] * scale)
  for (let o = 0; o < c.length; o += 6) {
    ctx.bezierCurveTo(cx + c[o] * scale, cy + c[o + 1] * scale, cx + c[o + 2] * scale, cy + c[o + 3] * scale,
      cx + c[o + 4] * scale, cy + c[o + 5] * scale)
  }
  ctx.closePath()
}

/**
 * The cover's colours flowing round the ring (the engine's auraColorRounds times round), as a small
 * picture AND its fill pattern, both made once per palette and layer shift: every picture only turns the
 * pattern (the slow drift) with one reused matrix. No gradient, pattern or matrix is made per layer per frame.
 */
const WHEEL = 256
/** The wheel is stretched this much past the canvas, so turning it never shows a corner (a conic sweep looks the same at any size). */
const WHEEL_OVERSCAN = 1.5
const wheels = new Map<string, CanvasPattern>()
const wheelMatrix = new DOMMatrix()
// The last palette, so the cache key (a string) is built once per picture, not once per layer.
let wheelColors: Rgb[] | null = null
let wheelKey = ''
function flowingColours(ctx: CanvasRenderingContext2D, cx: number, cy: number, box: number, colors: Rgb[], rounds: number, shift: number, turn: number): CanvasPattern {
  if (colors !== wheelColors) { wheelColors = colors; wheelKey = `${rounds}:${colors.map(c => c.map(Math.round).join(',')).join(';')}` }
  const key = `${shift}:${wheelKey}`
  let pattern = wheels.get(key)
  if (!pattern) {
    const wheel = document.createElement('canvas')
    wheel.width = wheel.height = WHEEL
    const g = wheel.getContext('2d')!
    const sweep = g.createConicGradient(0, WHEEL / 2, WHEEL / 2)
    const n = colors.length * rounds
    for (let k = 0; k <= n; k++) sweep.addColorStop(k / n, css(colors[(k + shift) % colors.length]))
    g.fillStyle = sweep
    g.fillRect(0, 0, WHEEL, WHEEL)
    // (A pattern belongs to its source picture, not to the canvas it was made through: one is enough.)
    pattern = ctx.createPattern(wheel, 'no-repeat')!
    if (wheels.size > 24) wheels.clear()
    wheels.set(key, pattern)
  }
  // Stretched over the whole canvas, centred on the cover: translate(cx, cy) · rotate(turn) · scale(k) · translate(−WHEEL/2, −WHEEL/2).
  const k = (box * WHEEL_OVERSCAN) / WHEEL, a = turn * Math.PI * 2
  const cos = Math.cos(a) * k, sin = Math.sin(a) * k
  wheelMatrix.a = cos; wheelMatrix.b = sin; wheelMatrix.c = -sin; wheelMatrix.d = cos
  wheelMatrix.e = cx - (cos - sin) * (WHEEL / 2); wheelMatrix.f = cy - (sin + cos) * (WHEEL / 2)
  pattern.setTransform(wheelMatrix)
  return pattern
}

/**
 * The soft white light along the cover's edge, drawn ONCE per cover size (many thin strokes of falling
 * strength = a smooth fade, no blur needed) and then just stamped every picture.
 */
export function coreSprite(e: WebPartyEngine, side: number, radius: number, dp: number, ratio: number): HTMLCanvasElement {
  const reach = e.coreReachDp * dp, size = Math.ceil(side + 2 * reach + 2)
  const c = document.createElement('canvas')
  c.width = c.height = Math.ceil(size * ratio)
  c.dataset.size = String(size)
  const g = c.getContext('2d')!
  g.setTransform(ratio, 0, 0, ratio, 0, 0)
  g.globalCompositeOperation = 'lighter'
  const steps = e.coreStrokes, o = (size - side) / 2
  for (let k = 1; k <= steps; k++) {
    // Strokes centred on the edge: the widest reaches [reach] out, and they pile up toward the edge.
    const t = k / steps
    g.lineWidth = 2 * reach * t * t
    g.strokeStyle = css(coreColor(e), e.coreDensity / steps)
    g.beginPath(); g.roundRect(o, o, side, side, radius); g.stroke()
  }
  return c
}

/**
 * The aura. Draws only what the engine has shaped (no maths of its own). The canvas lies above the
 * cover's shadow, so the cover's own area ([coverSide], [coverRadius], pulsing) is cut out exactly:
 * the cover stays sharp and the colour starts at its edge.
 */
export function drawOrb(ctx: CanvasRenderingContext2D, cx: number, cy: number, box: number, e: WebPartyEngine, colors: Rgb[],
  coverSide: number, coverRadius: number, core: HTMLCanvasElement | null) {
  const layers = e.orbLayers, drift = e.orbDrift, scale = e.coverScale, rounds = e.auraColorRounds
  ctx.globalCompositeOperation = 'lighter'
  // The slower, bigger layers first (behind), the main shape last.
  for (let l = layers - 1; l >= 0; l--) {
    const alpha = e.auraLayerAlpha(l) * e.orbAlpha(l)
    if (alpha < 0.005) continue
    orbPath(ctx, e, l, cx, cy)
    ctx.fillStyle = flowingColours(ctx, cx, cy, box, colors, rounds, e.auraLayerColorShift(l), e.auraLayerDrift(l) * drift)
    ctx.globalAlpha = Math.min(alpha, 1)
    ctx.fill()
  }
  if (core) {
    const shown = Number(core.dataset.size) * scale   // its size in CSS px, growing with the cover's pulse
    ctx.globalAlpha = Math.min(e.coreRest + e.coreGain * e.orbGlow, 1)
    ctx.drawImage(core, cx - shown / 2, cy - shown / 2, shown, shown)
  }
  ctx.globalAlpha = 1
  // (Half a pixel inside the edge: the two soft edges overlap instead of leaving a dark hairline.)
  const half = coverSide * 0.5 * scale - 0.5
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.roundRect(cx - half, cy - half, half * 2, half * 2, coverRadius * scale)
  ctx.fill()
  ctx.globalCompositeOperation = 'source-over'
}

/**
 * The bloom: the whole aura as one soft light (drawn at [scale] of full size, blurred by CSS), so the
 * light spills a little past the shapes without washing them out. Calm and tight around the cover
 * while the aura rests; follows the bass ([WebPartyEngine.orbGlow]) and how open the aura is.
 */
export function drawGlow(ctx: CanvasRenderingContext2D, size: number, e: WebPartyEngine, colors: Rgb[], dp: number, scale: number) {
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1
  ctx.clearRect(0, 0, size, size)
  const open = e.orbOpen, glow = e.orbGlow, c = size / 2
  const outer = e.orbLayers - 1
  ctx.globalCompositeOperation = 'lighter'
  const back = colors[e.bloomBackColor % colors.length], main = colors[e.bloomMainColor % colors.length]
  // The whole shape (the biggest layer), faintly, in the second cover colour…
  orbPath(ctx, e, outer, c, c, scale)
  ctx.fillStyle = css(back, Math.min(glow * (e.bloomBackAlpha + e.bloomBackOpen * open), 1))
  ctx.fill()
  // …and the main shape stronger in the first: the glow is brightest close to the cover.
  orbPath(ctx, e, 0, c, c, scale)
  ctx.fillStyle = css(main, Math.min(glow * (e.bloomMainAlpha + e.bloomMainOpen * open), 1))
  ctx.fill()
  // A soft rim on the main shape, so the resting aura is a glow hugging the cover.
  ctx.lineJoin = 'round'
  ctx.strokeStyle = css(main, Math.min(glow * e.bloomRimAlpha, 1))
  ctx.lineWidth = e.bloomRimDp * dp * scale
  ctx.stroke()
  ctx.globalCompositeOperation = 'source-over'
}

// ---------- Party background (RaveActivity background Canvas, Party part) ----------
/**
 * Lights that swell softly with the music (the engine eases partyHit and subGlow), strobe, flashes, the
 * drop hit, dip and vignette. [t]: one slow round of the lights (BACKLIGHT_CYCLE_S).
 * [calm] («Ingen blinking»): no strobe, white flashes or drop hit, and the dark dip is softened.
 */
export function drawPartyBackground(ctx: CanvasRenderingContext2D, w: number, h: number, e: WebPartyEngine, palette: Rgb[],
  hard: Rgb[], hasCover: boolean, t: number, calm = false) {
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1
  ctx.clearRect(0, 0, w, h)
  const base = Math.min(w, h), big = Math.max(w, h)
  const cx = w / 2, cy = h / 2
  const lightTravel = 0.4
  const partyHit = e.partyHit
  const blobAlpha = hasCover ? 0.55 : 1
  palette.forEach((paletteColor, i) => {
    const col = e.screechTint > 0.01 ? lerpRgb(paletteColor, palette[(i + 1) % palette.length], e.screechTint) : paletteColor
    const a = t + i * 2.1
    const hitAngle = i * 2.399963
    const px = w * (0.5 + lightTravel * Math.cos(a)) + Math.cos(hitAngle) * base * partyHit * e.backlightHitTravel
    const py = h * (0.5 + lightTravel * 0.9 * Math.sin(a * 1.3)) + Math.sin(hitAngle) * base * partyHit * e.backlightHitTravel
    const r = base * 0.6 * (1 + partyHit * 0.1) // the app's non-Party «energy» is 0 in Party
    const grad = ctx.createRadialGradient(px, py, 0, px, py, r)
    grad.addColorStop(0, css(col, clamp((0.45 + partyHit * 0.18 + e.subGlow) * blobAlpha, 0, 0.95)))
    grad.addColorStop(1, css(col, 0))
    ctx.fillStyle = grad
    ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill()
  })
  const radial = (r: number, stops: [number, string][]) => {
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    stops.forEach(([o, c]) => grad.addColorStop(o, c))
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
  }
  if (e.dip > 0.01) { ctx.fillStyle = `rgb(0 0 0 / ${(calm ? 0.3 : 0.85) * e.dip})`; ctx.fillRect(0, 0, w, h) }
  if (e.strobe > 0.03 && !calm) {
    const color = lerpRgb(hard[e.strobeColor % hard.length], WHITE, 0.45)
    ctx.fillStyle = css(color, Math.min(0.45 * e.strobe, 0.45)); ctx.fillRect(0, 0, w, h)
    radial(big * 0.6, [[0, `rgb(255 255 255 / ${0.35 * e.strobe})`], [1, 'rgb(255 255 255 / 0)']])
  }
  if (e.heavyFlash > 0.02 && !calm) radial(big * 0.9, [[0, `rgb(255 255 255 / ${0.25 * e.heavyFlash})`], [1, 'rgb(255 255 255 / 0)']])
  const g = e.grade
  if (g > 0.05) {
    ctx.globalCompositeOperation = 'screen'
    ctx.fillStyle = css(hard[0], 0.07 * g); ctx.fillRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'source-over'
  }
  const hit = e.dropHit
  if (hit > 0.02 && !calm) radial(big * 0.9, [[0, `rgb(255 255 255 / ${0.6 * hit})`], [0.5, css(hard[0], 0.3 * hit)], [1, css(hard[0], 0)]])
  radial(big * 0.8, [[0, 'rgb(0 0 0 / 0)'], [1, `rgb(0 0 0 / ${clamp(0.65 - g * 0.12, 0.5, 0.8)})`]])
}

/** Grey noise tile for the film grain (128×128, values 64–191, as in the app). */
export function grainTile(): string {
  const n = 128
  const c = document.createElement('canvas')
  c.width = c.height = n
  const g = c.getContext('2d')!
  const img = g.createImageData(n, n)
  let seed = 7
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff }
  for (let i = 0; i < n * n; i++) {
    const v = 64 + Math.floor(rnd() * 128)
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v
    img.data[i * 4 + 3] = 255
  }
  g.putImageData(img, 0, 0)
  return c.toDataURL()
}

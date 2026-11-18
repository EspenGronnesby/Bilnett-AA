import type { WebPartyEngine } from '../core/generated/rave-core.mjs'
import { css, type Rgb } from '../ui/colors'

// Party drawing for the website, a port of the app's HardstyleVisuals.kt (HardstyleBackdrop,
// HardstyleOrb, HardstyleOrbGlow, RippleBank, softDot) and the Party part of RaveActivity's
// background Canvas. Same numbers as the app; lengths in dp are multiplied by [dp] (CSS px per dp).

const BANDS = 48
const POINTS = 128

// ---------- volume curves (same as rave-core Volume.kt) ----------
export const volumeGain = (v: number) => 0.35 + 0.65 * Math.pow(Math.min(Math.max(v, 0), 1), 1.5)
export const maxVolumeBoost = (v: number) => 1 + (1 / 0.7 - 1) * Math.min(Math.max((v - 0.9) / 0.1, 0), 1)
export const loudRamp = (v: number) => Math.min(Math.max((v - 0.7) / 0.3, 0), 1)
export const loudness = (v: number) => Math.min(Math.max((v - 0.75) / 0.25, 0), 1)

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

// ---------- soft dot sprites (one per colour, blended as light) ----------
const dotCache = new Map<string, HTMLCanvasElement>()
function softDot(color: Rgb): HTMLCanvasElement {
  const key = color.map(Math.round).join(',')
  let c = dotCache.get(key)
  if (c) return c
  c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  // White dot tinted with the colour (Modulate): the colour with the white dot's alpha steps.
  grad.addColorStop(0, css(color, 1)); grad.addColorStop(0.25, css(color, 0x88 / 255))
  grad.addColorStop(0.6, css(color, 0x22 / 255)); grad.addColorStop(1, css(color, 0))
  g.fillStyle = grad
  g.beginPath(); g.arc(32, 32, 32, 0, Math.PI * 2); g.fill()
  if (dotCache.size > 64) dotCache.clear()
  dotCache.set(key, c)
  return c
}
function drawSoftDot(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, alpha: number, color: Rgb) {
  const d = Math.max(2, Math.trunc(radius * 2))
  ctx.globalAlpha = clamp(alpha, 0, 1)
  ctx.globalCompositeOperation = 'screen'
  ctx.drawImage(softDot(color), Math.trunc(x - d / 2), Math.trunc(y - d / 2), d, d)
}

// ---------- particles and ripples (HardstyleBackdrop + RippleBank) ----------
const RIPPLES = 8
export class ParticleLayer {
  private clock = 0
  private lastAt = 0
  private mood = new Float32Array(5) // vocal, vocal hit, sparkle, highs, drop
  private seed = 0
  private armed = true
  private flashes = new Float32Array(224)
  private born = new Float64Array(RIPPLES).fill(-100_000)
  private strength = new Float32Array(RIPPLES)
  private next = 0
  private rippleArmed = true
  private lastSpawn = 0

  draw(ctx: CanvasRenderingContext2D, w: number, h: number, e: WebPartyEngine, colors: Rgb[], cx: number, cy: number,
    coverRadius: number, volume: number, video: boolean, dp: number, now: number) {
    const spectrum = e.spectrum
    const particles = e.particles, density = e.density, softness = e.softness
    const intensity = e.audioIntensity
    const gain = volumeGain(volume), ramp = loudRamp(volume)
    const span = Math.max(w, h)
    let highActivity = 0
    for (let b = 32; b < BANDS; b++) highActivity += spectrum[b]
    highActivity = clamp(highActivity / 16, 0, 1)
    const shimmer = Math.max(e.highMotion, highActivity * 0.35)
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
    const flashDecay = Math.exp(-dt / 0.35)
    ease(0, e.vocal, 0.12, 0.6)
    ease(1, e.vocalHit, 0.05, 0.5)
    ease(2, hats, 0.03, 0.3)
    ease(3, Math.max(Math.max(e.highs, shimmer * 0.6), e.build * 0.6), 0.15, 0.5)
    ease(4, e.heavy, 0.15, 0.8)
    const [vocal, vocalHit, twinkle, highs, drop] = this.mood
    const speed = (0.07 + intensity * 0.1 + vocal * 0.16 + vocalHit * 0.22 + highs * 0.06 + drop * 0.18) *
      (0.6 + 0.4 * gain) * (1 + ramp * 0.3) * particles
    this.clock = (this.clock + dt * speed) % 10_000

    // Ripples only on lots of bass AND distortion together (zaag etc.).
    const bass = e.bass, grit = e.grit
    if (bass < 0.5) this.rippleArmed = true
    if (this.rippleArmed && bass > 0.72 && grit > 0.35 && now - this.lastSpawn > 160) {
      this.rippleArmed = false
      this.lastSpawn = now
      this.born[this.next] = now
      this.strength[this.next] = Math.min((0.4 + grit * 0.6) * bass * gain * (1 + ramp * 0.4), 1.4)
      this.next = (this.next + 1) % RIPPLES
    }
    const reach = span * 1.1
    ctx.lineCap = 'butt'
    for (let r = 0; r < RIPPLES; r++) {
      const age = now - this.born[r]
      const s = this.strength[r]
      const life = 1100 - Math.trunc(s * 250)
      if (s <= 0 || age < 0 || age >= life) continue
      const q = age / life
      const eased = 1 - (1 - q) ** 3
      const radius = coverRadius + reach * eased
      const fade = (1 - q) * (1 - q) * s
      const color = colors[r % colors.length]
      const ring = (alpha: number, width: number, c: Rgb, op: GlobalCompositeOperation) => {
        ctx.globalCompositeOperation = op
        ctx.globalAlpha = 1
        ctx.strokeStyle = css(c, Math.min(alpha, 1))
        ctx.lineWidth = width
        ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke()
      }
      ring(0.1 * fade, (10 * dp + 30 * dp * s) * (1 - q * 0.6), color, 'screen')
      ring(0.22 * fade, 5 * dp + 4 * dp * s, color, 'screen')
      ring(0.35 * fade, 1.2 * dp + 1.5 * dp * s, WHITE, 'source-over')
    }

    // Particles: born just beyond the cover, glide outward (growing), fade at the edge.
    const baseCount = Math.trunc(112 * density)
    const count = clamp(Math.trunc((112 + 112 * ramp) * density), 12, 224)
    const streak = (drop * drop * (1 + ramp)) / softness
    ctx.lineCap = 'round'
    for (let i = 0; i < count; i++) {
      const band = spectrum[32 + (i % 16)]
      const own = 0.8 + 0.4 * ((i * 0.754877) % 1)
      const phase = (i * 0.618034 + this.clock * own) % 1
      const angle = i * 2.399963
      const travel = 0.8 + vocalHit * 0.15 + (drop * 0.25) / softness
      const distance = coverRadius + span * phase * phase * travel
      const dx = Math.cos(angle), dy = Math.sin(angle)
      const px = cx + dx * distance, py = cy + dy * distance
      if (newHit && (i * 0.618034 + this.seed * 0.381966) % 1 < 0.17) this.flashes[i] = Math.max(this.flashes[i], Math.max(twinkle, 0.7))
      else this.flashes[i] *= flashDecay
      const flash = this.flashes[i]
      const musicalGlow = clamp(vocal * 0.45 + vocalHit * 0.3 + highs * 0.2 + band * 0.15 + flash * 0.6 + drop * 0.5 + e.energy * 0.2, 0, 1)
      const edgeFade = clamp(1 - phase, 0, 1) * Math.min(phase * 10, 1)
      const alpha = (edgeFade * (0.14 + musicalGlow * 0.76) * (video ? 0.72 : 1) * (i >= baseCount ? ramp : 1)) / softness
      if (alpha < 0.01) continue
      const depth = 0.45 + 1.1 * phase
      // Raw pixels in the app on the car screen (~1 px per dp there); × dp keeps the same size relative to the screen.
      const radius = (1.2 + vocal * 1.8 + vocalHit * 1.4 + flash * 2.2 + drop * 1.2) * (0.6 + 0.4 * gain) * (1 + ramp * 0.4) * softness * depth * dp
      const col = colors[i % colors.length]
      if (softness > 1.2) {
        drawSoftDot(ctx, px, py, radius * 2.2, alpha, col)
      } else {
        drawSoftDot(ctx, px, py, radius * 3, alpha * 0.45, col)
        ctx.globalCompositeOperation = 'screen'
        ctx.globalAlpha = 1
        if (streak > 0.15) {
          const tail = radius * 4 * streak * (0.5 + phase)
          ctx.strokeStyle = css(col, Math.min(alpha, 1))
          ctx.lineWidth = radius * 1.1
          ctx.beginPath(); ctx.moveTo(px - dx * tail, py - dy * tail); ctx.lineTo(px, py); ctx.stroke()
        } else {
          ctx.fillStyle = css(flash > 0.2 ? lerpRgb(col, WHITE, flash * 0.6) : col, Math.min(alpha, 1))
          ctx.beginPath(); ctx.arc(px, py, radius, 0, Math.PI * 2); ctx.fill()
        }
      }
    }
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }
}

// ---------- the ring around the cover (HardstyleOrb) ----------
const LAYER_DELAY_MS = [0, 45, 90, 140, 190]
const LAYER_EXPONENT = [1, 1.12, 1.3, 1.36, 1.5]
const LAYER_SMOOTH = [0, 1, 2, 2, 3]

/** Bounded timestamped spectrum history (port of SpectrumHistory) for the echo layers. */
class SpectrumHistory {
  private times = new Float64Array(64)
  private values = Array.from({ length: 64 }, () => new Float32Array(BANDS))
  private count = 0
  private head = -1
  push(now: number, spectrum: ArrayLike<number>) {
    if (this.head >= 0 && now < this.times[this.head]) { this.count = 0; this.head = -1 }
    if (this.head < 0 || this.times[this.head] !== now) {
      this.head = (this.head + 1) % 64
      this.count = Math.min(this.count + 1, 64)
    }
    this.times[this.head] = now
    for (let i = 0; i < BANDS; i++) this.values[this.head][i] = spectrum[i]
  }
  sampleInto(now: number, delayMs: number, out: Float32Array) {
    if (this.count === 0) { out.fill(0); return }
    const target = now - delayMs
    let newer = this.head
    for (let age = 1; age < this.count; age++) {
      const older = (this.head - age + 64) % 64
      if (this.times[older] <= target) {
        const fraction = clamp((target - this.times[older]) / Math.max(1, this.times[newer] - this.times[older]), 0, 1)
        for (let i = 0; i < BANDS; i++) out[i] = this.values[older][i] + (this.values[newer][i] - this.values[older][i]) * fraction
        return
      }
      newer = older
    }
    out.set(this.values[newer])
  }
}

function smoothBands(values: Float32Array, radius: number, scratch: Float32Array) {
  if (radius <= 0) return
  scratch.set(values)
  for (let i = 0; i < values.length; i++) {
    let sum = 0, weight = 0
    for (let k = -radius; k <= radius; k++) {
      const j = clamp(i + k, 0, values.length - 1)
      const w = radius + 1 - Math.abs(k)
      sum += scratch[j] * w; weight += w
    }
    values[i] = sum / weight
  }
}

/** Top → right → bottom → left → top, with a mirrored frequency arrangement. */
function mirrored(spectrum: Float32Array, point: number, segments = POINTS): number {
  const phase = (point % segments) / segments
  const position = (phase <= 0.5 ? phase * 2 : (1 - phase) * 2) * (spectrum.length - 1)
  const index = Math.floor(position)
  const next = Math.min(index + 1, spectrum.length - 1)
  return spectrum[index] + (spectrum[next] - spectrum[index]) * (position - index)
}

export interface OrbShape { points: Float32Array; ready: boolean; drive: number; bass: number; kick: number }

export class OrbLayer {
  private history = new SpectrumHistory()
  private layers = LAYER_DELAY_MS.map(() => new Float32Array(BANDS))
  private scratch = new Float32Array(BANDS)
  private volumeLayer = new Float32Array(BANDS)
  private points = new Float32Array((POINTS + 1) * 2)
  private layer0 = new Float32Array((POINTS + 1) * 2)
  /** The core outline, shared with the glow (relative to the centre). */
  readonly shape: OrbShape = { points: new Float32Array((POINTS + 1) * 2), ready: false, drive: 0, bass: 0, kick: 0 }

  /** Draws the ring around a cover of [side] px centred at (cx, cy); [intro] scales it in. */
  draw(ctx: CanvasRenderingContext2D, cx: number, cy: number, side: number, e: WebPartyEngine, colors: Rgb[],
    volume: number, dp: number, now: number) {
    const spectrum = e.spectrum
    this.history.push(now, spectrum)
    for (let l = 0; l < this.layers.length; l++) {
      this.history.sampleInto(now, LAYER_DELAY_MS[l], this.layers[l])
      smoothBands(this.layers[l], LAYER_SMOOTH[l], this.scratch)
    }
    const a = colors[0], b = colors[1 % colors.length], c = colors[2 % colors.length]
    const layerColors = [lerpRgb(a, WHITE, 0.55), a, b, c, lerpRgb(a, b, 0.5)]
    const base = side * 0.45
    const kick = e.kick, heavy = e.heavy
    const gain = volumeGain(volume)
    const drive = heavy * (0.7 + 0.3 * loudness(volume))
    const boost = maxVolumeBoost(volume)
    const kickExpansion = boost * kick * (0.035 + drive * 0.16) * gain
    const maxDisplacement = Math.min(36 * dp + drive * 70 * dp, side * (0.12 + drive * 0.22)) * gain * boost * e.spike
    const cap = side * 0.38 * boost
    const spikeCurve = 1 - drive * 0.5
    const radius = base * (1 + kickExpansion) * (1 + e.breath * 0.05)
    const pts = this.points
    const spike = (values: Float32Array, i: number, extra: number, exponent: number) => {
      let v = clamp(mirrored(values, i), 0, 1)
      if (exponent !== 1) v = Math.pow(v, exponent)
      const d = Math.pow(v, spikeCurve) * (1 + drive * v) * maxDisplacement * extra
      const knee = cap * 0.75
      return d <= knee ? d : knee + (cap - knee) * Math.tanh((d - knee) / (cap - knee))
    }
    const path = (values: Float32Array, extra = 1, exponent = 1): Path2D => {
      for (let i = 0; i <= POINTS; i++) {
        const angle = (i * 2 * Math.PI) / POINTS - Math.PI / 2
        const ca = Math.cos(angle), sa = Math.sin(angle)
        const contour = Math.pow(Math.abs(ca) ** 8 + Math.abs(sa) ** 8, -1 / 8) // rounded square
        const disp = spike(values, i, extra, exponent)
        const x = ca * radius * contour, y = sa * radius * contour
        const nx = Math.sign(x) * Math.abs(ca) ** 7, ny = Math.sign(y) * Math.abs(sa) ** 7
        const len = Math.max(Math.hypot(nx, ny), 0.0001)
        pts[i * 2] = cx + x + (nx / len) * disp
        pts[i * 2 + 1] = cy + y + (ny / len) * disp
      }
      const p = new Path2D()
      p.moveTo((pts[0] + pts[2]) / 2, (pts[1] + pts[3]) / 2)
      for (let i = 1; i <= POINTS; i++) {
        const n = i === POINTS ? 1 : i + 1
        p.quadraticCurveTo(pts[i * 2], pts[i * 2 + 1], (pts[i * 2] + pts[n * 2]) / 2, (pts[i * 2 + 1] + pts[n * 2 + 1]) / 2)
      }
      p.closePath()
      return p
    }
    ctx.lineJoin = 'round'
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
    // Extra line that fades in from 70 % to 100 % volume.
    const volumeLine = loudRamp(volume)
    if (volumeLine > 0.01) {
      this.history.sampleInto(now, 70, this.volumeLayer)
      const p = path(this.volumeLayer, 1.18)
      ctx.fillStyle = css(b, 0.06 * volumeLine); ctx.fill(p)
      ctx.strokeStyle = css(b, 0.85 * volumeLine); ctx.lineWidth = 2 * dp; ctx.stroke(p)
    }
    // Extra exploding outer layer on heavy drops.
    if (drive > 0.2) {
      const p = path(this.layers[0], 1.35)
      ctx.strokeStyle = css(colors[colors.length - 1], Math.min(drive * 0.6, 1)); ctx.lineWidth = 2.5 * dp; ctx.stroke(p)
    }
    const outer = clamp(Math.max(drive * 1.4, loudRamp(volume) * 0.5), 0, 1)
    for (let l = this.layers.length - 1; l >= 0; l--) {
      const presence = l >= 3 ? outer * (l === 4 ? 0.8 : 1) : 1
      if (presence < 0.02) continue
      const p = path(this.layers[l], 1, LAYER_EXPONENT[l])
      const color = layerColors[l]
      if (l === 0) {
        this.layer0.set(pts)
        for (let k = 0; k <= POINTS; k++) { this.shape.points[k * 2] = pts[k * 2] - cx; this.shape.points[k * 2 + 1] = pts[k * 2 + 1] - cy }
        this.shape.ready = true; this.shape.drive = drive; this.shape.bass = e.bass; this.shape.kick = kick
        const g = Math.min(0.6 + e.bass * 0.5 + drive * kick * 0.9, 1.6)
        const glow = colors[0]
        // Chromatic split on heavy kicks: red and blue copies pull apart.
        const split = e.aberration * dp
        if (split > 0.5) {
          ctx.globalCompositeOperation = 'screen'
          ctx.lineWidth = 2 * dp
          ctx.save(); ctx.translate(split, 0); ctx.strokeStyle = 'rgb(255 32 80 / 0.55)'; ctx.stroke(p); ctx.restore()
          ctx.save(); ctx.translate(-split, 0); ctx.strokeStyle = 'rgb(32 128 255 / 0.55)'; ctx.stroke(p); ctx.restore()
          ctx.globalCompositeOperation = 'source-over'
        }
        ctx.strokeStyle = css(glow, Math.min(0.16 * g, 1)); ctx.lineWidth = 4.5 * dp; ctx.stroke(p)
        ctx.fillStyle = css(color, 0.14); ctx.fill(p)
        ctx.lineCap = 'round'
        ctx.strokeStyle = css(color, 0.95); ctx.lineWidth = 1.6 * dp; ctx.stroke(p)
      } else {
        ctx.fillStyle = css(color, 0.08 * presence); ctx.fill(p)
        // Colour drift around the shape (the app's sweep gradient; conic starts at 3 o'clock too).
        const next = layerColors[(l % (layerColors.length - 1)) + 1]
        const sweep = ctx.createConicGradient(0, cx, cy)
        const mix = lerpRgb(color, next, 0.6)
        ;[color, mix, color, mix, color].forEach((s, k) => sweep.addColorStop(k / 4, css(s)))
        ctx.globalAlpha = (l <= 2 ? 0.6 : 0.5) * presence
        ctx.strokeStyle = sweep; ctx.lineWidth = 2 * dp; ctx.lineCap = 'round'; ctx.stroke(p)
        ctx.globalAlpha = 1
      }
    }
    // Light bursts on the biggest peaks.
    for (let i = 0; i < POINTS; i += 4) {
      const v = clamp(mirrored(this.layers[0], i), 0, 1)
      if (v <= 0.55) continue
      const strength = clamp(((v - 0.55) / 0.45) * (0.2 + drive * 0.65) * gain, 0, 1)
      const r = 8 * dp + v * 20 * dp * (1 + drive)
      drawSoftDot(ctx, this.layer0[i * 2], this.layer0[i * 2 + 1], r, strength, colors[i % colors.length])
    }
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
    const pulse = Math.max(kick, e.burst)
    if (pulse > 0.03) {
      ctx.strokeStyle = css(colors[0], Math.min(pulse * (0.4 + drive * 0.4) * gain, 1))
      ctx.lineWidth = 0.8 * dp + drive * pulse * 4 * dp
      ctx.beginPath(); ctx.arc(cx, cy, base * (1.1 + (1 - pulse) * (0.65 + drive * 0.5)), 0, Math.PI * 2); ctx.stroke()
    }
  }
}

/** Soft blurred glow behind the ring (HardstyleOrbGlow): drawn at half size, blurred, scaled up 2×. */
export function drawGlow(ctx: CanvasRenderingContext2D, size: number, shape: OrbShape, colors: Rgb[], volume: number, dp: number) {
  ctx.clearRect(0, 0, size, size)
  if (!shape.ready) return
  const c = size / 2
  const pts = shape.points
  const x = (i: number) => c + pts[i * 2] * 0.5
  const y = (i: number) => c + pts[i * 2 + 1] * 0.5
  const p = new Path2D()
  p.moveTo((x(0) + x(1)) / 2, (y(0) + y(1)) / 2)
  for (let i = 1; i <= POINTS; i++) {
    const n = i === POINTS ? 1 : i + 1
    p.quadraticCurveTo(x(i), y(i), (x(i) + x(n)) / 2, (y(i) + y(n)) / 2)
  }
  p.closePath()
  const g = Math.min((0.55 + shape.bass * 0.45 + shape.drive * shape.kick * 0.8) * volumeGain(volume), 1.4)
  ctx.lineJoin = 'round'
  ctx.strokeStyle = css(colors[0], Math.min(0.5 * g, 1))
  ctx.lineWidth = (4 * dp + shape.drive * shape.kick * 3 * dp) * 0.5
  ctx.stroke(p)
  ctx.fillStyle = css(colors[1 % colors.length], Math.min(0.12 * g, 1))
  ctx.fill(p)
}

// ---------- Party background (RaveActivity background Canvas, Party part) ----------
/** Lights that hit with the music, strobe, flashes, the drop hit, dip and vignette. [t]: 8 s cycle. */
export function drawPartyBackground(ctx: CanvasRenderingContext2D, w: number, h: number, e: WebPartyEngine, palette: Rgb[],
  hard: Rgb[], hasCover: boolean, t: number) {
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
    const px = w * (0.5 + lightTravel * Math.cos(a)) + Math.cos(hitAngle) * base * partyHit * 0.12
    const py = h * (0.5 + lightTravel * 0.9 * Math.sin(a * 1.3)) + Math.sin(hitAngle) * base * partyHit * 0.12
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
  if (e.dip > 0.01) { ctx.fillStyle = `rgb(0 0 0 / ${0.85 * e.dip})`; ctx.fillRect(0, 0, w, h) }
  if (e.strobe > 0.03) {
    const color = lerpRgb(hard[e.strobeColor % hard.length], WHITE, 0.45)
    ctx.fillStyle = css(color, Math.min(0.45 * e.strobe, 0.45)); ctx.fillRect(0, 0, w, h)
    radial(big * 0.6, [[0, `rgb(255 255 255 / ${0.35 * e.strobe})`], [1, 'rgb(255 255 255 / 0)']])
  }
  if (e.heavyFlash > 0.02) radial(big * 0.9, [[0, `rgb(255 255 255 / ${0.25 * e.heavyFlash})`], [1, 'rgb(255 255 255 / 0)']])
  const g = e.grade
  if (g > 0.05) {
    ctx.globalCompositeOperation = 'screen'
    ctx.fillStyle = css(hard[0], 0.07 * g); ctx.fillRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'source-over'
  }
  const hit = e.dropHit
  if (hit > 0.02) radial(big * 0.9, [[0, `rgb(255 255 255 / ${0.6 * hit})`], [0.5, css(hard[0], 0.3 * hit)], [1, css(hard[0], 0)]])
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

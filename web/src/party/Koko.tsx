import { useEffect, useMemo, useRef } from 'react'
import type { Party } from './useParty'
import { volumeGain } from './visuals'

// Koko the ghost (Snow-White, 1933) drops by in a bottom corner now and then and does his real
// St. James Infirmary glide — a port of the app's RaveDancer.kt (DancerDirector + drawing).
// 194 frames at 12.5 fps in /koko; each visit continues where the last one stopped.

const FRAMES = 194
const FPS = 12.5
const SLIDE_MS = 1200
const DANCE_MS = 8000
type Phase = 'hidden' | 'enter' | 'dance' | 'exit'

const easeOut = (t: number) => 1 - (1 - t) ** 3

/** When Koko is on screen: first after 30–45 s of music, then every 60–120 s, sooner on a heavy drop. */
class DancerDirector {
  phase: Phase = 'hidden'
  side = 1
  private phaseStart = 0
  private lastUpdate = 0
  private hiddenPlayedMs = 0
  private waitMs: number
  constructor(firstWaitMs = 30_000 + Math.random() * 15_000) { this.waitMs = firstWaitMs }

  update(now: number, playing: boolean, heavy: number): number {
    const dt = this.lastUpdate === 0 ? 0 : Math.min(Math.max(now - this.lastUpdate, 0), 500)
    this.lastUpdate = now
    switch (this.phase) {
      case 'hidden': {
        if (playing) this.hiddenPlayedMs += dt
        const dropShortcut = heavy > 0.6 && this.hiddenPlayedMs > 20_000
        if (playing && (this.hiddenPlayedMs >= this.waitMs || dropShortcut)) {
          this.side = Math.random() < 0.5 ? 1 : -1
          this.start('enter', now)
        }
        break
      }
      case 'enter': if (now - this.phaseStart >= SLIDE_MS) this.start('dance', now); break
      case 'dance': if (!playing || now - this.phaseStart >= DANCE_MS) this.start('exit', now); break
      case 'exit':
        if (now - this.phaseStart >= SLIDE_MS) {
          this.hiddenPlayedMs = 0
          this.waitMs = 60_000 + Math.random() * 60_000
          this.start('hidden', now)
        }
    }
    const p = Math.min(Math.max((now - this.phaseStart) / SLIDE_MS, 0), 1)
    return this.phase === 'hidden' ? 0 : this.phase === 'enter' ? easeOut(p) : this.phase === 'dance' ? 1 : 1 - easeOut(p)
  }

  private start(next: Phase, now: number) { this.phase = next; this.phaseStart = now }
}

let frames: HTMLImageElement[] | null = null
const loadFrames = () => (frames ??= Array.from({ length: FRAMES }, (_, i) => {
  const img = new Image()
  img.src = `/koko/${String(i).padStart(3, '0')}.webp`
  return img
}))

export function Koko({ party, playing, volume, dp, quick = false }: { party: Party; playing: boolean; volume: number; dp: number; quick?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const live = useRef({ playing, volume, dp })
  live.current = { playing, volume, dp }
  // Kept for as long as Koko is switched on (demo: first visit after 2 s).
  const director = useMemo(() => new DancerDirector(quick ? 2_000 : undefined), [quick])
  const dance = useRef({ position: 0, sway: 0, last: 0 })
  const { onFrame, engine } = party
  useEffect(() => {
    const imgs = loadFrames()
    const d = dance.current
    d.last = 0
    return onFrame(now => {
      const c = ref.current
      if (!c) return
      const l = live.current
      const dt = d.last === 0 ? 0 : Math.min((now - d.last) / 1000, 0.5)
      d.last = now
      const visible = director.update(now, l.playing, engine.heavy)
      if (director.phase !== 'hidden' && l.playing) {
        d.position = (d.position + dt * FPS) % FRAMES
        d.sway += dt
      }
      const { position, sway } = d
      const ratio = Math.min(devicePixelRatio || 1, 2)
      const w = innerWidth, h = innerHeight
      if (c.width !== Math.ceil(w * ratio) || c.height !== Math.ceil(h * ratio)) { c.width = Math.ceil(w * ratio); c.height = Math.ceil(h * ratio) }
      const ctx = c.getContext('2d')!
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, c.width, c.height)
      if (visible <= 0) return
      const img = imgs[Math.floor(position)]
      if (!img.complete || !img.naturalWidth) return
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      const figureHeight = Math.min(h * 0.34, w * 0.38)
      const figureWidth = (figureHeight * img.naturalWidth) / img.naturalHeight
      const margin = 16 * l.dp + figureWidth * 0.35
      const glide = Math.sin(sway * 2.4) * figureWidth * 0.05
      const feetX = (director.side > 0 ? w - margin : margin) + glide
      const feetY = h - 8 * l.dp + (1 - visible) * figureHeight * 1.15
      const tilt = (Math.sin(sway * 2.4 + 0.6) * 1.5 * Math.PI) / 180
      ctx.globalAlpha = Math.min(Math.max(0.75 + 0.25 * volumeGain(l.volume), 0), 1)
      ctx.translate(feetX, feetY)
      ctx.rotate(tilt)
      // Mirrored on the left side, so the dance mostly moves toward the middle.
      ctx.scale(director.side > 0 ? 1 : -1, 1)
      ctx.drawImage(img, -figureWidth / 2, -figureHeight, figureWidth, figureHeight)
      ctx.globalAlpha = 1
    })
  }, [onFrame, engine, director])
  return <canvas ref={ref} className="party-layer" aria-hidden />
}

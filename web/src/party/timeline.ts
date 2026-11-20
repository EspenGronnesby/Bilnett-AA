import type { WebPartyEngine } from '../core/generated/rave-core.mjs'

// Live-historikk til AI-treneren: ett punkt per slag (ett taktslag) fra lytteren, med det alle «hjernene» mente da.
// Fylles fra Party-løkken (også mens treneren er lukket), så tidslinjen er sammenhengende når du åpner den.

export interface TimePoint {
  /** Sangposisjon (ms) da slaget lukket. */
  pos: number
  /** Teller opp ved spoling/hopp, så kurvene ikke trekkes tvers over et hopp. */
  seg: number
  sub: number
  bright: number
  kick: number
  old: string
  listener: string
  pBuild: number
  pDrop: number
  pModel: number
  /** «Min lærling» (justerer seg av dine rettelser). */
  pApp: number
  level: number
}

const MAX_POINTS = 900

export class Timeline {
  points: TimePoint[] = []
  private lastSlots = -1
  private lastPos = -1
  private seg = 0

  reset() { this.points = []; this.lastSlots = -1; this.lastPos = -1; this.seg = 0 }

  /** Kalles hver ramme; legger til et punkt bare når lytteren har lukket et nytt slag. */
  feed(e: WebPartyEngine, posMs: number, pApp = 0) {
    const slots = e.listenerSlots
    if (slots === this.lastSlots) return
    if (slots < this.lastSlots) this.reset() // ny sang: lytteren startet på nytt
    this.lastSlots = slots
    if (posMs < 0) return
    if (this.lastPos >= 0 && (posMs < this.lastPos - 1500 || posMs > this.lastPos + 6000)) this.seg++
    this.lastPos = posMs
    const f = e.listenerFeatures, l = e.listenerLevels
    this.points.push({
      pos: posMs, seg: this.seg, sub: f[0], bright: (f[14] + f[15]) / 2, kick: l[3],
      old: e.partName, listener: e.listenerPart, pBuild: e.pBuild, pDrop: e.pDrop, pModel: e.pBuildModel, pApp, level: f[11],
    })
    if (this.points.length > MAX_POINTS) this.points.splice(0, this.points.length - MAX_POINTS)
  }
}

export const timeline = new Timeline()
// Bare i utviklermodus: lar tester sette inn kunstige punkter (demo-lyden får aldri den nye lytteren til å bytte del).
if (import.meta.env.DEV && typeof window !== 'undefined') (window as unknown as { __raveTimeline?: Timeline }).__raveTimeline = timeline

/**
 * Finner trolig starten på en ny del: det slaget i [endPos − windowMs, endPos] der fylden (svakeste av sub og lys klang)
 * hopper mest mellom to slag før og to slag etter. Gir pos = slutten av slaget før hoppet. snapped=false når ingen tydelig endring finnes
 * (da brukes reaksjonstiden).
 */
export function snapOnset(points: readonly TimePoint[], endPos: number, windowMs: number): { pos: number; snapped: boolean } {
  const pts = points.filter(p => p.pos >= endPos - windowMs && p.pos <= endPos)
  const full = (p: TimePoint) => Math.min(p.sub, p.bright)
  let best = 0, bestPos = -1
  for (let i = 2; i < pts.length - 1; i++) {
    if (pts[i - 2].seg !== pts[i + 1].seg) continue // ikke over et hopp i sangen
    const before = (full(pts[i - 2]) + full(pts[i - 1])) / 2, after = (full(pts[i]) + full(pts[i + 1])) / 2
    const jump = Math.abs(after - before)
    if (jump > best) { best = jump; bestPos = pts[i - 1].pos }
  }
  return best >= 0.2 && bestPos >= 0 ? { pos: bestPos, snapped: true } : { pos: -1, snapped: false }
}

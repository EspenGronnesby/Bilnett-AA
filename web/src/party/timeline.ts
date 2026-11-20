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
  feed(e: WebPartyEngine, posMs: number) {
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
      old: e.partName, listener: e.listenerPart, pBuild: e.pBuild, pDrop: e.pDrop, pModel: e.pBuildModel, level: f[11],
    })
    if (this.points.length > MAX_POINTS) this.points.splice(0, this.points.length - MAX_POINTS)
  }
}

export const timeline = new Timeline()

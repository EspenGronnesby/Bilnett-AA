import type { WebPartyEngine } from '../core/generated/rave-core.mjs'
import { analysis } from './analysis'

// «Min lærling»: en liten kopi av build-up-modellen som justerer seg av rettelsene dine, i nettleseren, mens du trener.
// Dette viser AT den lærer av deg (p-linjen flytter seg), ikke at den er bedre: ekte vurdering skjer på Mac-en
// (én sang utenfor om gangen). Vektene lagres bare i nettleseren (localStorage) og kan nullstilles.

const KEY = 'rave.trainer.model'
const LR = 0.03        // læringshastighet per eksempel
const POS_WEIGHT = 3   // build-up er sjeldent: telle et ja som tre nei
const PULL = 0.02      // drar vektene svakt tilbake mot startmodellen, så de ikke løper løpsk
const RING = 240       // slag vi husker, så rettelser satt BAKOVER i tid også lærer lærlingen

interface Remembered { pos: number; x: Float32Array; trained: -1 | 0 | 1 }

export class Apprentice {
  /** Lærlingens sannsynlighet for build-up på siste slag (0 før den er klar). */
  p = 0
  updates = 0
  private w0 = new Float64Array(0)
  private w = new Float64Array(0)
  private b0 = 0
  private b = 0
  private mean = new Float32Array(0)
  private scale = new Float32Array(1)
  private ready = false
  private lastSlots = -1
  private lastVersion = -1
  private ring: Remembered[] = []

  private init(e: WebPartyEngine) {
    this.w0 = Float64Array.from(e.modelCoef)
    this.mean = Float32Array.from(e.modelMean)
    this.scale = Float32Array.from(e.modelScale)
    this.b0 = e.modelBias
    this.w = Float64Array.from(this.w0); this.b = this.b0
    try {
      const s = JSON.parse(localStorage.getItem(KEY) ?? 'null')
      if (s && Array.isArray(s.w) && s.w.length === this.w.length) { this.w = Float64Array.from(s.w); this.b = Number(s.b) || this.b0; this.updates = Number(s.updates) || 0 }
    } catch { /* starter fra grunnmodellen */ }
    this.ready = true
  }

  private z(x: ArrayLike<number>) {
    let z = this.b
    for (let i = 0; i < this.w.length; i++) z += this.w[i] * ((x[i] - this.mean[i]) / this.scale[i])
    return z
  }
  private predict(x: ArrayLike<number>) { return 1 / (1 + Math.exp(-this.z(x))) }

  private train(x: ArrayLike<number>, y: number) {
    const p = this.predict(x), sw = y === 1 ? POS_WEIGHT : 1, g = (p - y) * sw
    for (let i = 0; i < this.w.length; i++) {
      const xs = (x[i] - this.mean[i]) / this.scale[i]
      this.w[i] -= LR * (g * xs + PULL * (this.w[i] - this.w0[i]))
    }
    this.b -= LR * g
    this.updates++
    if (this.updates % 20 === 0) this.save()
  }

  private save() {
    try { localStorage.setItem(KEY, JSON.stringify({ w: Array.from(this.w), b: this.b, updates: this.updates })) } catch { /* lagring er en bekvemmelighet */ }
  }

  /** Nullstill til grunnmodellen. */
  reset() {
    if (!this.ready) return
    this.w = Float64Array.from(this.w0); this.b = this.b0; this.updates = 0
    try { localStorage.removeItem(KEY) } catch { /* ok */ }
    // Merkene som finnes nå skal ikke læres på nytt rett etter nullstillingen (bare nye rettelser teller).
    for (const r of this.ring) { const lab = analysis.labelAt(r.pos); r.trained = lab === null ? -1 : lab === 'BUILDUP' ? 1 : 0 }
    const last = this.ring[this.ring.length - 1]
    this.p = last ? this.predict(last.x) : 0
  }

  /** Kalles hver ramme: beregner p på nye slag, og lærer av merker (også de satt bakover siden sist). */
  feed(e: WebPartyEngine, posMs: number) {
    const slots = e.listenerSlots
    const newSlot = slots !== this.lastSlots
    if (!newSlot && analysis.version === this.lastVersion) return
    if (!this.ready) this.init(e)
    if (newSlot) {
      if (slots < this.lastSlots) this.ring = [] // ny sang
      this.lastSlots = slots
      if (posMs >= 0) {
        const x = Float32Array.from(e.modelInput)
        this.p = this.predict(x)
        this.ring.push({ pos: posMs, x, trained: -1 })
        if (this.ring.length > RING) this.ring.shift()
      }
    }
    this.lastVersion = analysis.version
    if (!analysis.enabled) return
    for (const r of this.ring) {
      const lab = analysis.labelAt(r.pos)
      const target = lab === null ? -1 : lab === 'BUILDUP' ? 1 : 0
      if (target !== r.trained) { if (target >= 0) this.train(r.x, target); r.trained = target }
    }
  }
}

export const apprentice = new Apprentice()

// Party-analyse på nettsiden: tar opp lyden Party hører, og Espens merker, i samme format som appen.
// Filene kan spilles av i PartyReplayTest på Mac-en:
//   <stamp>-<navn>.fft.gz     = BNFFT1 (som FftRecorder.kt i appen)
//   <stamp>-<navn>.csv        = en rad per sekund + en rad ved hvert merke: pos_s, part, …, part_by=review, new_part, p_model
//                               («# kilde: review»: posisjonene er allerede justert av deg, testen trekker ikke fra reaksjonstid)
//   <stamp>-<navn>.events.csv = hendelser fra AI-treneren (feil nå, fake drop, bra, for mye …)
// Merker kan settes BAKOVER i tid («startet for 4 s siden», eller et tidsrom på tidslinjen). Rader bygges først ved lagring.
// Alt lagres i nettleseren (IndexedDB) til du eksporterer. Data skal aldri i git (repoet er offentlig).
import { useSyncExternalStore } from 'react'

export type MarkPart = 'INTRO' | 'BUILDUP' | 'DROP' | 'BREAKDOWN' | 'OUTRO'
export const MARK_LABEL: Record<MarkPart, string> = { INTRO: 'Intro', BUILDUP: 'Build-up', DROP: 'Drop', BREAKDOWN: 'Breakdown', OUTRO: 'Outro' }

interface SavedSong { id?: number; name: string; at: number; fft: Blob; csv: string; marks: number; exported?: boolean; events?: string }
/** Et merke: fra denne posisjonen (ms i sangen) gjelder delen, til neste merke. `part: null` = ikke merket (tilbake til auto). */
export interface Mark { pos: number; part: MarkPart | null }
export interface AnalysisEvent { pos: number; type: string; detail: string; auto: string; listener: string }
interface Row { pos: number; auto: string; listener: string; pModel: number; genre: string }
/** Hendelser AI-treneren kan logge (alt som ikke er en del-merking). */
export type EventType = 'feil_na' | 'fake_drop' | 'ingen_drop' | 'ikke_drop_sang' | 'bra' | 'for_mye' | 'for_lite' | 'feil_sjanger' | 'angre' | 'spol' | 'riktig' | 'feil'

const DB = 'rave-analyse'
const STORE = 'songs'
/** Opptak over denne størrelsen (rå bytes) stoppes, så fanen ikke går tom for minne. */
const MAX_RAW_BYTES = 60_000_000
const MAX_SAVED = 40

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}
const tx = <T,>(db: IDBDatabase, mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => { const r = run(db.transaction(STORE, mode).objectStore(STORE)); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error) })

function utf(s: string): Uint8Array {
  const b = new TextEncoder().encode(s)
  const out = new Uint8Array(2 + b.length)
  new DataView(out.buffer).setUint16(0, b.length)
  out.set(b, 2)
  return out
}

async function gzip(chunks: Uint8Array[]): Promise<Blob> {
  const stream = new Blob(chunks as BlobPart[]).stream().pipeThrough(new CompressionStream('gzip'))
  return new Response(stream).blob()
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9æøå]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60)
const stampOf = (t: number) => {
  const d = new Date(t), p = (n: number, w = 2) => String(n).padStart(w, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}

export class AnalysisRecorder {
  /** Analyse på: tar opp lyd og lar deg merke. Lagres i nettleseren. */
  enabled = false
  private chunks: Uint8Array[] = []
  private rawBytes = 0
  private artist = ''
  private title = ''
  private startedAt = 0
  private rows = new Map<number, Row>()
  private markList: Mark[] = []
  private eventList: AnalysisEvent[] = []
  private undoStack: Mark[][] = []
  /** Hva den gamle hjernen, den nye lytteren og modellen sier akkurat nå (for kolonnene auto_part, new_part, p_model). */
  autoPart: () => string = () => ''
  listenerPart: () => string = () => ''
  pModel: () => number = () => 0
  genre: () => string = () => ''
  positionMs: () => number = () => -1
  /** Hvor mange ms før knappetrykket «Nå» regnes (reaksjonstid). Justeres i AI-treneren. */
  reactionMs = 1000
  /** AI-trener-visningen er åpen, og om den åpnes av seg selv når Analyse slås på. */
  trainerOpen = false
  autoOpenTrainer = true
  openTrainer() { this.trainerOpen = true; this.emit() }
  closeTrainer() { this.trainerOpen = false; this.emit() }
  note = ''
  /** Endringstelling + lyttere: komponenter abonnerer med [subscribe] / [useAnalysis]. */
  version = 0
  private listeners = new Set<() => void>()
  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn) } }
  /** Bakoverkompatibelt: ett enkelt tilbakekall (gammelt panel). */
  onChange: () => void = () => {}
  private emit() { this.version++; this.listeners.forEach(f => f()); this.onChange() }
  /** Valgt mappe (Chrome): hver sang skrives dit med en gang, uten nedlasting og uten «Eksporter». */
  private dir: FileSystemDirectoryHandle | null = null
  dirName = ''

  /** Velg mappe for automatisk lagring (må kalles fra et klikk). Anbefalt: Nedlastinger/rave-analyse. */
  async pickDir(): Promise<boolean> {
    const pick = (window as unknown as { showDirectoryPicker?: (o?: object) => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker
    if (!pick) { this.note = 'Nettleseren kan ikke velge mappe (bruk Chrome)'; this.emit(); return false }
    try {
      this.dir = await pick({ mode: 'readwrite', id: 'rave-analyse' })
      this.dirName = this.dir.name; this.note = ''  // først nå (ny mappe valgt) fjernes en gammel feilmelding
      await this.writeUnexported()
    } catch { return false } finally { this.emit() }
    return true
  }

  private async writeFile(name: string, blob: Blob) {
    const fh = await this.dir!.getFileHandle(name, { create: true })
    const w = await fh.createWritable()
    await w.write(blob); await w.close()
  }

  /** Skriver sanger som ikke er eksportert til den valgte mappen og merker dem eksportert. */
  private async writeUnexported() {
    if (!this.dir) return
    const db = await openDb()
    try {
      const all = (await tx(db, 'readonly', s => s.getAll()) as SavedSong[]).filter(s => !s.exported)
      for (const s of all) {
        await this.writeFile(`${s.name}.fft.gz`, s.fft)
        await this.writeFile(`${s.name}.csv`, new Blob([s.csv], { type: 'text/csv' }))
        if (s.events) await this.writeFile(`${s.name}.events.csv`, new Blob([s.events], { type: 'text/csv' }))
        await tx(db, 'readwrite', st => st.put({ ...s, exported: true }))
      }
    } catch { this.note = 'Autolagring til mappen står stille – velg mappen på nytt (sangene ligger trygt i nettleseren til da)'; this.dir = null; this.dirName = '' } finally { db.close() }
    await this.refreshCount()
  }

  get savedCount() { return this.count }
  private count = 0

  async refreshCount() {
    try { const db = await openDb(); this.count = ((await tx(db, 'readonly', s => s.getAll())) as SavedSong[]).filter(s => !s.exported).length; db.close() } catch { this.count = 0 }
    this.emit()
  }

  setEnabled(on: boolean) {
    if (on === this.enabled) return
    if (!on) void this.finishSong()
    this.enabled = on
    if (on && this.title) this.begin()
    if (on && this.autoOpenTrainer) this.trainerOpen = true
    if (!on) this.trainerOpen = false
    this.emit()
  }

  startSong(artist: string, title: string) {
    void this.finishSong()
    this.artist = artist; this.title = title
    if (this.enabled) this.begin()
  }

  private begin() {
    this.chunks = []; this.rawBytes = 0; this.rows = new Map(); this.markList = []; this.eventList = []; this.undoStack = []
    this.startedAt = Date.now()
    this.chunks.push(utf('BNFFT1'), utf(`${this.artist} – ${this.title}`))
  }

  /** En FFT-ramme (Visualizer-bytes) fra Party. Kalles for hver ramme mens Party lytter. */
  frame(fft: Int8Array, rateHz: number, nowMs: number) {
    if (!this.enabled || !this.startedAt) return
    if (this.rawBytes > MAX_RAW_BYTES) { this.note = 'Opptaket er fullt – start neste sang'; return }
    const pos = Math.round(this.positionMs())
    const head = new Uint8Array(8 + 8 + 4 + 2)
    const v = new DataView(head.buffer)
    v.setBigInt64(0, BigInt(Math.round(nowMs))); v.setBigInt64(8, BigInt(pos)); v.setInt32(16, rateHz); v.setUint16(20, fft.length)
    this.chunks.push(head, new Uint8Array(fft.buffer, fft.byteOffset, fft.length).slice())
    this.rawBytes += head.length + fft.length
    // Én rad per hele sekund av sangen (spoles det tilbake, overskrives raden): fasiten leses som «siste merke før dette tidspunktet».
    if (pos >= 0) {
      const sec = Math.floor(pos / 1000)
      this.rows.set(sec, { pos, auto: this.autoPart(), listener: this.listenerPart(), pModel: this.pModel(), genre: this.genre() })
    }
  }

  // ---- Merker (kan settes bakover i tid) ----

  /** Merkene, sortert på posisjon. */
  get marks(): readonly Mark[] { return this.markList }
  get events(): readonly AnalysisEvent[] { return this.eventList }
  get hasRecording() { return this.startedAt > 0 }
  /** Det som gjelder i posisjon [pos] (ms): siste merke ≤ pos, ellers null (ikke merket). */
  labelAt(pos: number): MarkPart | null {
    let part: MarkPart | null = null
    for (const m of this.markList) { if (m.pos <= pos) part = m.part; else break }
    return part
  }
  /** Delen som gjelder nå. */
  get mark(): MarkPart | null { return this.labelAt(this.positionMs()) }

  private snapshot() { this.undoStack.push(this.markList.map(m => ({ ...m }))); if (this.undoStack.length > 50) this.undoStack.shift() }
  private bump(key: string) {
    try {
      const day = new Date().toISOString().slice(0, 10)
      const saved = JSON.parse(localStorage.getItem(key) ?? '{}')
      localStorage.setItem(key, JSON.stringify({ day, n: (saved.day === day ? saved.n : 0) + 1 }))
    } catch { /* telleren er bare en bekvemmelighet */ }
  }
  /** Merker du har satt i dag (alle sanger). */
  get marksToday(): number {
    try { const s = JSON.parse(localStorage.getItem('rave.trainer.marks') ?? '{}'); return s.day === new Date().toISOString().slice(0, 10) ? s.n : 0 } catch { return 0 }
  }

  /** «Fra [fromPos] gjelder X» (standard: nå minus reaksjonstid). Merker senere enn dette fjernes (det du sier nå gjelder siden da). */
  setMark(part: MarkPart, fromPos?: number) {
    const now = this.positionMs()
    if (now < 0 || !this.startedAt) return
    const from = Math.max(0, Math.round(fromPos ?? now - this.reactionMs))
    this.snapshot()
    this.markList = this.markList.filter(m => m.pos < from)
    this.markList.push({ pos: from, part })
    this.bump('rave.trainer.marks')
    this.emit()
  }

  /** «Fra [from] til [to] er det X»; etter [to] gjelder det som gjaldt der før. */
  setRange(part: MarkPart, from: number, to: number) {
    if (!this.startedAt) return
    const a = Math.max(0, Math.round(Math.min(from, to))), b = Math.round(Math.max(from, to))
    const after = this.labelAt(b)
    this.snapshot()
    this.markList = this.markList.filter(m => m.pos < a || m.pos > b)
    this.markList.push({ pos: a, part })
    if (after !== part) this.markList.push({ pos: b + 1, part: after })
    this.markList.sort((x, y) => x.pos - y.pos)
    this.bump('rave.trainer.marks')
    this.emit()
  }

  /** Flytter det siste merket [deltaMs] (negativt = tidligere). Brukes av «1 takt tidligere/senere». */
  moveLastMark(deltaMs: number) {
    const last = this.markList[this.markList.length - 1]
    if (!last || !this.startedAt) return false
    this.snapshot()
    last.pos = Math.max(0, Math.round(last.pos + deltaMs))
    this.markList.sort((x, y) => x.pos - y.pos)
    this.emit()
    return true
  }

  /** Angre siste endring av merker. */
  undo() {
    const prev = this.undoStack.pop()
    if (!prev) return false
    this.markList = prev
    this.logEvent('angre')
    return true
  }

  /** Logger en hendelse nå (feil nå, fake drop, bra, for mye …). */
  logEvent(type: EventType, detail = '') {
    if (!this.startedAt) return
    const pos = this.positionMs()
    this.eventList.push({ pos, type, detail, auto: this.autoPart(), listener: this.listenerPart() })
    this.emit()
  }

  /** Sangen hoppet (spoling): bare en hendelse, radene overskrives per sekund. */
  noteSeek(toPos: number) { this.logEvent('spol', String(Math.round(toPos))) }

  private buildCsv(): string {
    const head = `# ${this.artist} – ${this.title}\n# kilde: review\npos_s,part,drop,genre,sub,fps,effects_on,auto_part,auto_drop,part_by,new_part,p_model\n`
    const rows: { pos: number; row: Row }[] = [...this.rows.values()].map(r => ({ pos: r.pos, row: r }))
    // Merker som starter mellom to sekunder får sin egen rad (riktig tid på overgangen)
    for (const m of this.markList) {
      const near = [...this.rows.values()].reduce<Row | null>((best, r) => (!best || Math.abs(r.pos - m.pos) < Math.abs(best.pos - m.pos) ? r : best), null)
      rows.push({ pos: m.pos, row: near ? { ...near, pos: m.pos } : { pos: m.pos, auto: '', listener: '', pModel: 0, genre: '' } })
    }
    rows.sort((x, y) => x.pos - y.pos)
    const lines = rows.map(({ pos, row }) => {
      const lab = this.labelAt(pos)
      return `${(pos / 1000).toFixed(1)},${lab ?? row.auto},,${row.genre},,60,1,${row.auto},,${lab ? 'review' : 'auto'},${row.listener},${row.pModel.toFixed(2)}`
    })
    return head + lines.join('\n') + '\n'
  }

  private buildEvents(): string {
    if (!this.eventList.length) return ''
    return `# ${this.artist} – ${this.title}\npos_s,type,detail,auto_part,new_part\n` +
      this.eventList.map(e => `${(e.pos / 1000).toFixed(1)},${e.type},${e.detail.replace(/,/g, ' ')},${e.auto},${e.listener}`).join('\n') + '\n'
  }

  /** Lagrer sangen i nettleseren (hvis den har nok lyd og minst ett merke). */
  async finishSong() {
    if (!this.startedAt || this.chunks.length <= 2) { this.startedAt = 0; return }
    const chunks = this.chunks, marks = this.markList.length, at = this.startedAt, nRows = this.rows.size
    const name = `${stampOf(at)}-${slug(`${this.artist}-${this.title}`)}`
    const csv = this.buildCsv(), events = this.buildEvents()
    this.startedAt = 0; this.chunks = []; this.rows = new Map(); this.markList = []; this.eventList = []; this.undoStack = []
    if (nRows < 8) return
    try {
      const fft = await gzip(chunks)
      const db = await openDb()
      await tx(db, 'readwrite', s => s.add({ name, at, fft, csv, marks, ...(events ? { events } : {}) } satisfies SavedSong))
      const all = await tx(db, 'readonly', s => s.getAll()) as SavedSong[]
      // Når det er fullt, slettes bare sanger som allerede er eksportert (en ueksportert sang er aldri på spill å miste).
      const sorted = all.sort((a, b) => a.at - b.at)
      for (const old of sorted.filter(s => s.exported).slice(0, Math.max(0, sorted.length - MAX_SAVED))) await tx(db, 'readwrite', s => s.delete(old.id!))
      db.close()
    } catch { this.note = 'Fikk ikke lagret opptaket i nettleseren' }
    await this.writeUnexported()
  }

  /** Laster ned lagrede sanger som ikke er eksportert (.fft.gz + .csv, to filer per sang). De slettes ikke: eldste fjernes når det blir fullt. */
  async exportAll(): Promise<number> {
    await this.finishSong()
    const db = await openDb()
    const all = (await tx(db, 'readonly', s => s.getAll()) as SavedSong[]).filter(s => !s.exported).sort((a, b) => a.at - b.at)
    for (const s of all) {
      const files: [string, Blob][] = [[`${s.name}.fft.gz`, s.fft], [`${s.name}.csv`, new Blob([s.csv], { type: 'text/csv' })]]
      if (s.events) files.push([`${s.name}.events.csv`, new Blob([s.events], { type: 'text/csv' })])
      for (const [file, blob] of files) {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob); a.download = file
        document.body.appendChild(a); a.click(); a.remove()
        setTimeout(() => URL.revokeObjectURL(a.href), 10_000)
        await new Promise(r => setTimeout(r, 250))
      }
    }
    for (const s of all) await tx(db, 'readwrite', st => st.put({ ...s, exported: true }))
    db.close()
    await this.refreshCount()
    return all.length
  }
}

export const analysis = new AnalysisRecorder()

/** React-hook: tegner komponenten på nytt når opptaket endrer seg (merker, hendelser, lagring). */
export function useAnalysis() {
  useSyncExternalStore(analysis.subscribe, () => analysis.version)
  return analysis
}

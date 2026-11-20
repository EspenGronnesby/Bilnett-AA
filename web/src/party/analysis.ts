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

/** v2: «drafts» (metadata for sangen som tas opp nå) og «parts» (lyd-biter) sjekkpunktes underveis, så ingenting går tapt ved krasj/lukket fane. */
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 2)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true })
      if (!db.objectStoreNames.contains('drafts')) db.createObjectStore('drafts', { keyPath: 'rec' })
      if (!db.objectStoreNames.contains('parts')) db.createObjectStore('parts', { keyPath: 'id', autoIncrement: true })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}
const txs = <T,>(db: IDBDatabase, store: string, mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => { const r = run(db.transaction(store, mode).objectStore(store)); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error) })
const tx = <T,>(db: IDBDatabase, mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> => txs(db, STORE, mode, run)

/** Det som gjelder i posisjon [pos]: siste merke ≤ pos (merkelisten er sortert), ellers null. */
function labelIn(marks: readonly Mark[], pos: number): MarkPart | null {
  let part: MarkPart | null = null
  for (const m of marks) { if (m.pos <= pos) part = m.part; else break }
  return part
}

/**
 * Sang-CSV: rader per sekund + en rad ved hvert merke. Rader som er merket av deg har part_by=review. Et merke uten del
 * («her slutter det jeg merket») skrives som en review-rad med tom del, så fasiten ikke fortsetter ut over det du merket.
 */
function csvFrom(artist: string, title: string, rowMap: Iterable<Row>, marks: readonly Mark[]): string {
  const head = `# ${artist} – ${title}\n# kilde: review\npos_s,part,drop,genre,sub,fps,effects_on,auto_part,auto_drop,part_by,new_part,p_model\n`
  const all = [...rowMap]
  const rows: { pos: number; row: Row; end: boolean }[] = all.map(r => ({ pos: r.pos, row: r, end: false }))
  for (const m of marks) {
    const near = all.reduce<Row | null>((best, r) => (!best || Math.abs(r.pos - m.pos) < Math.abs(best.pos - m.pos) ? r : best), null)
    rows.push({ pos: m.pos, row: near ? { ...near, pos: m.pos } : { pos: m.pos, auto: '', listener: '', pModel: 0, genre: '' }, end: m.part === null })
  }
  rows.sort((x, y) => x.pos - y.pos || Number(x.end) - Number(y.end))
  const lines = rows.map(({ pos, row, end }) => {
    const lab = labelIn(marks, pos)
    const part = end ? '' : lab ?? row.auto
    return `${(pos / 1000).toFixed(1)},${part},,${row.genre.replace(/,/g, ' ')},,60,1,${row.auto},,${end || lab ? 'review' : 'auto'},${row.listener},${row.pModel.toFixed(2)}`
  })
  return head + lines.join('\n') + '\n'
}

function eventsFrom(artist: string, title: string, events: readonly AnalysisEvent[]): string {
  if (!events.length) return ''
  return `# ${artist} – ${title}\npos_s,type,detail,auto_part,new_part\n` +
    events.map(e => `${(e.pos / 1000).toFixed(1)},${e.type},${e.detail.replace(/,/g, ' ')},${e.auto},${e.listener}`).join('\n') + '\n'
}

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
    this.savedChunks = 2; this.partSeq = 0; this.lastEditPos = -1
    this.startedAt = Date.now()
    this.startCheckpoints()
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

  /** Posisjonen til merket du satte sist (setMark eller starten på et tidsrom), så «flytt siste merke» flytter riktig merke. */
  private lastEditPos = -1

  /** «Fra [fromPos] gjelder X» (standard: nå minus reaksjonstid). Merker senere enn dette fjernes (det du sier nå gjelder siden da). */
  setMark(part: MarkPart, fromPos?: number): boolean {
    const now = this.positionMs()
    if (now < 0 || !this.startedAt) return false
    const from = Math.max(0, Math.round(fromPos ?? now - this.reactionMs))
    this.snapshot()
    this.markList = this.markList.filter(m => m.pos < from)
    this.markList.push({ pos: from, part })
    this.lastEditPos = from
    this.bump('rave.trainer.marks')
    this.emit()
    return true
  }

  /** «Fra [from] til [to] er det X»; etter [to] gjelder det som gjaldt der før (eller en tom slutt hvis ingenting var merket). */
  setRange(part: MarkPart, from: number, to: number): boolean {
    if (!this.startedAt || this.positionMs() < 0) return false
    const a = Math.max(0, Math.round(Math.min(from, to))), b = Math.round(Math.max(from, to))
    const after = labelIn(this.markList, b)
    this.snapshot()
    this.markList = this.markList.filter(m => m.pos < a || m.pos > b)
    this.markList.push({ pos: a, part })
    // Etter tidsrommet: det som gjaldt der før. Var ingenting merket, skrives en tom slutt (null), ikke en gjetning.
    if (after !== part) this.markList.push({ pos: b + 1, part: after })
    this.markList.sort((x, y) => x.pos - y.pos)
    this.lastEditPos = a
    this.bump('rave.trainer.marks')
    this.emit()
    return true
  }

  /** Flytter merket du satte sist [deltaMs] (negativt = tidligere), men aldri forbi nabomerkene. */
  moveLastMark(deltaMs: number): boolean {
    if (!this.startedAt || this.lastEditPos < 0) return false
    const i = this.markList.findIndex(m => m.pos === this.lastEditPos)
    if (i < 0) return false
    this.snapshot()
    const lo = i > 0 ? this.markList[i - 1].pos + 1 : 0
    const hi = i + 1 < this.markList.length ? this.markList[i + 1].pos - 1 : Number.MAX_SAFE_INTEGER
    const pos = Math.min(Math.max(Math.round(this.markList[i].pos + deltaMs), lo), hi)
    this.markList[i] = { ...this.markList[i], pos }
    this.lastEditPos = pos
    this.emit()
    return true
  }

  /** Angre siste endring av merker. Returnerer false når det ikke er noe å angre. */
  undo(): boolean {
    const prev = this.undoStack.pop()
    if (!prev) return false
    this.markList = prev
    this.lastEditPos = -1
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

  private buildCsv(): string { return csvFrom(this.artist, this.title, this.rows.values(), this.markList) }
  private buildEvents(): string { return eventsFrom(this.artist, this.title, this.eventList) }

  // ---- Sjekkpunkter: merker, hendelser og lyd lagres underveis (hvert 20. sekund og når fanen skjules), ikke bare når sangen er ferdig ----
  private savedChunks = 2
  private partSeq = 0
  private checkpointTimer = 0
  private checkpointing = false

  /** Skriver det som har kommet til siden sist til IndexedDB (utkast). Feiler stille: sangen lagres uansett ved slutten. */
  async checkpoint() {
    if (!this.startedAt || this.checkpointing || this.chunks.length <= 2) return
    this.checkpointing = true
    const rec = this.startedAt
    try {
      const db = await openDb()
      const upTo = this.chunks.length
      const slice = this.chunks.slice(this.savedChunks, upTo)
      if (slice.length) {
        await txs(db, 'parts', 'readwrite', st => st.add({ rec, n: this.partSeq++, blob: new Blob(slice as BlobPart[]) }))
        this.savedChunks = upTo
      }
      await txs(db, 'drafts', 'readwrite', st => st.put({
        rec, artist: this.artist, title: this.title, rows: [...this.rows.values()], marks: this.markList, events: this.eventList, parts: this.partSeq,
      }))
      db.close()
    } catch { /* utkast er en bekvemmelighet */ } finally { this.checkpointing = false }
  }

  private startCheckpoints() {
    window.clearInterval(this.checkpointTimer)
    this.checkpointTimer = window.setInterval(() => void this.checkpoint(), 20_000)
  }
  private stopCheckpoints() { window.clearInterval(this.checkpointTimer); this.checkpointTimer = 0 }

  /** Gjør utkast fra tidligere (krasj, lukket fane) om til lagrede sanger. Kalles når siden åpnes. */
  async recover() {
    try {
      const db = await openDb()
      const drafts = await txs(db, 'drafts', 'readonly', st => st.getAll()) as { rec: number; artist: string; title: string; rows: Row[]; marks: Mark[]; events: AnalysisEvent[] }[]
      const parts = await txs(db, 'parts', 'readonly', st => st.getAll()) as { id: number; rec: number; n: number; blob: Blob }[]
      for (const d of drafts) {
        if (d.rec === this.startedAt) continue
        const mine = parts.filter(p => p.rec === d.rec).sort((a, b) => a.n - b.n)
        if (mine.length && d.rows.length >= 8) {
          const header = [utf('BNFFT1'), utf(`${d.artist} – ${d.title}`)]
          const fft = await gzip([...header, ...(await Promise.all(mine.map(async p => new Uint8Array(await p.blob.arrayBuffer()))))])
          const name = `${stampOf(d.rec)}-${slug(`${d.artist}-${d.title}`)}`
          const events = eventsFrom(d.artist, d.title, d.events)
          await txs(db, STORE, 'readwrite', st => st.add({ name, at: d.rec, fft, csv: csvFrom(d.artist, d.title, d.rows, d.marks), marks: d.marks.length, ...(events ? { events } : {}) } satisfies SavedSong))
        }
        for (const p of mine) await txs(db, 'parts', 'readwrite', st => st.delete(p.id))
        await txs(db, 'drafts', 'readwrite', st => st.delete(d.rec))
      }
      db.close()
    } catch { /* ingenting å berge */ }
    await this.writeUnexported()
    await this.refreshCount()
  }

  private async dropDraft(rec: number) {
    try {
      const db = await openDb()
      const parts = await txs(db, 'parts', 'readonly', st => st.getAll()) as { id: number; rec: number }[]
      for (const p of parts.filter(x => x.rec === rec)) await txs(db, 'parts', 'readwrite', st => st.delete(p.id))
      await txs(db, 'drafts', 'readwrite', st => st.delete(rec))
      db.close()
    } catch { /* ok */ }
  }

  /** Lagrer sangen i nettleseren (hvis den har nok lyd og minst ett merke). */
  async finishSong() {
    if (!this.startedAt || this.chunks.length <= 2) { this.startedAt = 0; return }
    const chunks = this.chunks, marks = this.markList.length, at = this.startedAt, nRows = this.rows.size
    this.stopCheckpoints()
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
      await this.dropDraft(at)
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

// Sjekkpunkt når fanen skjules/lukkes, og berging av utkast fra forrige gang siden ble åpnet.
if (typeof window !== 'undefined') {
  const flush = () => { void analysis.checkpoint() }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush() })
  window.addEventListener('pagehide', flush)
  void analysis.recover()
}

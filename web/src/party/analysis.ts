// Party-analyse på nettsiden (steg 5): tar opp lyden Party hører, og Espens merker («nå er det …»),
// i samme format som appen. Filene kan spilles av i PartyReplayTest på Mac-en:
//   <stamp>-<navn>.fft.gz  = BNFFT1 (som FftRecorder.kt i appen)
//   <stamp>-<navn>.csv     = en rad per sekund: pos_s, part (Espens merke), part_by=espen, auto_part …
// Alt lagres i nettleseren (IndexedDB) til du eksporterer. Data skal aldri i git (repoet er offentlig).

export type MarkPart = 'INTRO' | 'BUILDUP' | 'DROP' | 'BREAKDOWN' | 'OUTRO'
export const MARK_LABEL: Record<MarkPart, string> = { INTRO: 'Intro', BUILDUP: 'Build-up', DROP: 'Drop', BREAKDOWN: 'Breakdown', OUTRO: 'Outro' }

interface SavedSong { id?: number; name: string; at: number; fft: Blob; csv: string; marks: number; exported?: boolean }

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
  private rows: string[] = []
  private lastRowSec = -1
  private marks = 0
  /** Det Espen sist merket (tom til første trykk: da vet fasiten at han har begynt å styre). */
  mark: MarkPart | null = null
  /** Hva appens egen lytter sier akkurat nå (for auto_part-kolonnen). */
  autoPart: () => string = () => ''
  genre: () => string = () => ''
  positionMs: () => number = () => -1
  /** Kalles ved lagring/feil, så knappene kan vise hva som skjedde. */
  onChange: () => void = () => {}
  note = ''

  get savedCount() { return this.count }
  private count = 0

  async refreshCount() {
    try { const db = await openDb(); this.count = ((await tx(db, 'readonly', s => s.getAll())) as SavedSong[]).filter(s => !s.exported).length; db.close() } catch { this.count = 0 }
    this.onChange()
  }

  setEnabled(on: boolean) {
    if (on === this.enabled) return
    if (!on) void this.finishSong()
    this.enabled = on
    if (on && this.title) this.begin()
    this.onChange()
  }

  startSong(artist: string, title: string) {
    void this.finishSong()
    this.artist = artist; this.title = title
    if (this.enabled) this.begin()
  }

  private begin() {
    this.chunks = []; this.rawBytes = 0; this.rows = []; this.lastRowSec = -1; this.marks = 0; this.mark = null
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
    // En CSV-rad per sekund av sangen (fasiten leses som «siste merke før dette tidspunktet»).
    const sec = Math.floor(pos / 1000)
    if (pos >= 0 && sec !== this.lastRowSec) {
      this.lastRowSec = sec
      const part = this.mark ?? this.autoPart() ?? ''
      const by = this.mark ? 'espen' : 'auto'
      this.rows.push(`${(pos / 1000).toFixed(1)},${part},,${this.genre()},,60,1,${this.autoPart()},,${by}`)
    }
  }

  /** «Nå er det X»: gjelder fra nå og til du trykker en annen. */
  setMark(p: MarkPart) {
    this.mark = p; this.marks++
    // Rad med en gang, så merket får riktig tid selv om sekundet ikke har skiftet.
    const pos = this.positionMs()
    if (pos >= 0) this.rows.push(`${(pos / 1000).toFixed(1)},${p},,${this.genre()},,60,1,${this.autoPart()},,espen`)
    this.onChange()
  }

  /** Lagrer sangen i nettleseren (hvis den har nok lyd og minst ett merke). */
  async finishSong() {
    if (!this.startedAt || this.chunks.length <= 2) { this.startedAt = 0; return }
    const chunks = this.chunks, rows = this.rows, marks = this.marks, at = this.startedAt
    const name = `${stampOf(at)}-${slug(`${this.artist}-${this.title}`)}`
    const csv = `# ${this.artist} – ${this.title}\npos_s,part,drop,genre,sub,fps,effects_on,auto_part,auto_drop,part_by\n${rows.join('\n')}\n`
    this.startedAt = 0; this.chunks = []; this.rows = []
    if (rows.length < 8) return
    try {
      const fft = await gzip(chunks)
      const db = await openDb()
      await tx(db, 'readwrite', s => s.add({ name, at, fft, csv, marks } satisfies SavedSong))
      const all = await tx(db, 'readonly', s => s.getAll()) as SavedSong[]
      for (const old of all.sort((a, b) => a.at - b.at).slice(0, Math.max(0, all.length - MAX_SAVED))) await tx(db, 'readwrite', s => s.delete(old.id!))
      db.close()
      this.note = ''
    } catch { this.note = 'Fikk ikke lagret opptaket i nettleseren' }
    await this.refreshCount()
  }

  /** Laster ned lagrede sanger som ikke er eksportert (.fft.gz + .csv, to filer per sang). De slettes ikke: eldste fjernes når det blir fullt. */
  async exportAll(): Promise<number> {
    await this.finishSong()
    const db = await openDb()
    const all = (await tx(db, 'readonly', s => s.getAll()) as SavedSong[]).filter(s => !s.exported).sort((a, b) => a.at - b.at)
    for (const s of all) {
      for (const [file, blob] of [[`${s.name}.fft.gz`, s.fft], [`${s.name}.csv`, new Blob([s.csv], { type: 'text/csv' })]] as [string, Blob][]) {
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

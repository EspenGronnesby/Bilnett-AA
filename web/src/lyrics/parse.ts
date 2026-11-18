// Lyrics parsing and word timing — a line-by-line port of the app's LyricsSource.kt
// (app/src/main/java/com/kododake/aabrowser/rave/LyricsSource.kt). Keep the two in step.

/** One sung word with its own time window (ms into the song). */
export interface LyricWord { text: string; startMs: number; endMs: number; syllables: number }

/** One lyrics line. [text] is always the words joined by single spaces (or «♪» for an empty line). */
export interface LyricLine { startMs: number; endMs: number; text: string; words: LyricWord[] }

/** Where the word timing came from. */
export type LyricsTiming = 'words' | 'enhanced' | 'guessed'

/** A line from an LRC file; [words] is set only for «enhanced» LRC with <mm:ss.xx> per word. */
export interface LrcLine { startMs: number; text: string; words: [number, string][] | null }

const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u
const isBlank = (s: string) => s.trim().length === 0
const words = (s: string) => s.split(' ').filter(w => !isBlank(w))

/** Removes "(feat. …)", "- Remastered" and the like, which often make the search miss. */
export function cleanTitle(t: string): string {
  return t
    .replace(/\s*[([].*?(feat|with|remaster|version|edit|live).*?[)\]]/gi, '')
    .replace(/\s+-\s+.*(remaster|version|edit|live).*$/i, '')
    .trim()
}

export function norm(s: string): string {
  return s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
}

/** Vowel groups ≈ syllables (good enough for English, Norwegian and most rap). */
export function syllables(word: string): number {
  const w = Array.from(word.toLowerCase()).filter(c => /\p{L}/u.test(c)).join('')
  // Numbers: roughly one syllable per digit («18» = eigh-teen).
  if (w.length === 0) return Math.max(Array.from(word).filter(c => /\d/.test(c)).length, 1)
  let n = 0
  let prev = false
  for (const c of w) {
    const v = 'aeiouyæøåéèáàíóúäöü'.includes(c)
    if (v && !prev) n++
    prev = v
  }
  // Silent English «e» at the end (make, time) — but not «the», «be», «little».
  if (w.length > 3 && w.endsWith('e') && !w.endsWith('le') && !'aeiouy'.includes(w[w.length - 2]) && n > 1) n--
  return Math.max(n, 1)
}

const HOLD_WORDS = /^(o+h+|oh+|a+h+|ooh+|yeah+|ye+ah|woah+|whoa+|wo+|na+|la+|hey+|baby|love|night)$/

/** How long a word tends to be held, relative to a plain syllable. */
function weight(word: string, last: boolean): number {
  const clean = Array.from(word.toLowerCase()).filter(c => /\p{L}/u.test(c)).join('')
  let w = syllables(word)
  if (HOLD_WORDS.test(clean)) w *= 1.6
  if (/(.)\1\1/.test(clean)) w *= 1.8 // «sooo», «yeahhh»
  if (last) w *= 1.8 // singers hold the end of a line
  return w
}

/**
 * Repairs a common error in word timing: one word gets the time of the next («on» 1.77 s, «18» 0.09 s),
 * usually around numbers and slurred words. Their shared time is split again by syllables.
 */
export function fixSqueezed(ws: LyricWord[]): void {
  for (let k = 1; k < ws.length; k++) {
    const p = ws[k - 1]
    const w = ws[k]
    const perSylW = (w.endMs - w.startMs) / w.syllables
    const perSylP = (p.endMs - p.startMs) / p.syllables
    // Only the line's last word or a number; a quick «a» after a held word mid-line is left alone.
    if (k !== ws.length - 1 && !/\d/.test(w.text)) continue
    if (perSylW >= 100 || perSylP < 400 || perSylP < perSylW * 3) continue
    const total = w.endMs - p.startMs
    const wp = p.syllables
    const ww = w.syllables * (k === ws.length - 1 ? 1.8 : 1)
    const cut = p.startMs + Math.trunc((total * wp) / (wp + ww))
    ws[k - 1] = { ...p, endMs: cut }
    ws[k] = { ...w, startMs: cut }
  }
}

/** NetEase «yrc»: `[lineStart,lineDur](wordStart,wordDur,0)Word (…)word`; JSON lines are credits. */
export function parseYrc(text: string): LyricLine[] {
  const out: LyricLine[] = []
  for (const raw of text.split(/\r?\n/)) {
    const m = /^\[(\d+),(\d+)](.*)$/.exec(raw.trim())
    if (!m) continue
    const lineStart = Number(m[1])
    const lineDur = Number(m[2])
    const body = m[3]
    const tags = Array.from(body.matchAll(/\((\d+),(\d+),\d+\)/g))
    const ws: LyricWord[] = []
    let prevOpen = false // the previous token ended without a space (word continues)
    tags.forEach((t, i) => {
      const s = Number(t[1])
      const e = s + Number(t[2])
      const from = t.index! + t[0].length
      const rawTxt = body.substring(from, i + 1 < tags.length ? tags[i + 1].index! : body.length)
      const txt = rawTxt.trim()
      if (txt.length === 0) { prevOpen = false; return }
      // A token without letters belongs to the word before; so does a syllable glued to the last one.
      const glue = ws.length > 0 && (!LETTER_OR_DIGIT.test(txt) || (prevOpen && !/^\s/.test(rawTxt)))
      const parts = words(txt)
      const step = Math.trunc((e - s) / Math.max(parts.length, 1))
      parts.forEach((w, k) => {
        const s0 = s + k * step
        const e0 = s + (k + 1) * step
        if (k === 0 && glue) {
          const p = ws.pop()!
          const joined = p.text + w
          ws.push({ text: joined, startMs: p.startMs, endMs: Math.max(p.endMs, e0), syllables: syllables(joined) })
        } else {
          ws.push({ text: w, startMs: s0, endMs: e0, syllables: syllables(w) })
        }
      })
      prevOpen = !/\s$/.test(rawTxt)
    })
    if (ws.length === 0) continue
    fixSqueezed(ws)
    out.push({
      startMs: lineStart,
      endMs: Math.max(lineStart + lineDur, ws[ws.length - 1].endMs),
      text: ws.map(w => w.text).join(' '),
      words: ws,
    })
  }
  return out.sort((a, b) => a.startMs - b.startMs)
}

function ms(min: string, sec: string, fr: string | undefined): number {
  return Number(min) * 60000 + Number(sec) * 1000 + (fr ? Number(fr.padEnd(3, '0').slice(0, 3)) : 0)
}

export function parseLrc(text: string): LrcLine[] {
  const out: LrcLine[] = []
  for (const line of text.split(/\r?\n/)) {
    const times = Array.from(line.matchAll(/\[(\d+):(\d+)(?:[.:](\d+))?]/g))
    if (times.length === 0) continue
    const lastTime = times[times.length - 1]
    const rest = line.substring(lastTime.index! + lastTime[0].length)
    const tags = Array.from(rest.matchAll(/<(\d+):(\d+)(?:[.:](\d+))?>/g))
    let ws: [number, string][] | null = null
    if (tags.length > 0) {
      const list: [number, string][] = []
      tags.forEach((t, i) => {
        const w = rest.substring(t.index! + t[0].length, i + 1 < tags.length ? tags[i + 1].index! : rest.length).trim()
        if (w.length > 0) list.push([ms(t[1], t[2], t[3]), w])
      })
      ws = list.length > 0 ? list : null
    }
    const plainText = rest.replace(/<(\d+):(\d+)(?:[.:](\d+))?>/g, '').replace(/\s+/g, ' ').trim()
    for (const t of times) out.push({ startMs: ms(t[1], t[2], t[3]), text: plainText, words: ws })
  }
  return out.sort((a, b) => a.startMs - b.startMs)
}

const emptyLine = (start: number, next: number): LyricLine => ({ startMs: start, endMs: next, text: '♪', words: [] })

/**
 * Spreads each line's words over the time that is actually sung: the song's own speed (median ms
 * per syllable over lines that follow each other closely) decides how long a line takes. With a
 * known [bpm], word boundaries snap to 8th/16th notes.
 */
export function estimate(lrc: LrcLine[], durMs: number, bpm: number): LyricLine[] {
  const rates: number[] = []
  lrc.forEach((l, i) => {
    const next = lrc[i + 1]
    if (!next) return
    const syl = words(l.text).reduce((n, w) => n + syllables(w), 0)
    if (syl >= 3) rates.push((next.startMs - l.startMs) / syl)
  })
  rates.sort((a, b) => a - b)
  // The faster half = lines sung back to back (the slower half includes instrumental pauses).
  const fast = rates.slice(0, Math.trunc((rates.length + 1) / 2))
  const msPerSyl = Math.min(Math.max(fast.length === 0 ? 230 : fast[Math.trunc(fast.length / 2)], 120), 450)
  const beatMs = bpm >= 60 && bpm <= 220 ? 60_000 / bpm : 0

  return lrc.map((l, i) => {
    const next = lrc[i + 1]?.startMs ?? (durMs > l.startMs ? durMs : l.startMs + 5_000)
    const gap = Math.max(next - l.startMs, 200)
    const texts = words(l.text)
    if (texts.length === 0) return emptyLine(l.startMs, next)
    const weights = texts.map((w, k) => weight(w, k === texts.length - 1))
    const total = weights.reduce((a, b) => a + b, 0)
    const sung = Math.max(Math.max(Math.min(gap - 100, Math.trunc(total * msPerSyl * 1.25)), Math.min(gap - 50, 400)), 100)
    let acc = 0
    const bounds = new Array<number>(texts.length + 1)
    for (let k = 0; k < texts.length; k++) { bounds[k] = Math.trunc((sung * acc) / total); acc += weights[k] }
    bounds[texts.length] = sung
    // Rhythm: word lengths rounded to 8th/16th notes, counted from the line start.
    if (beatMs > 0) {
      const sylPerBeat = texts.reduce((n, w) => n + syllables(w), 0) / (sung / beatMs)
      const grid = sylPerBeat > 2.5 ? beatMs / 4 : beatMs / 2
      const snapped = bounds.map((b, k) => (k === 0 ? 0 : Math.trunc(Math.round(b / grid) * grid)))
      let ok = snapped[snapped.length - 1] <= gap - 60
      for (let k = 1; k < snapped.length && ok; k++) ok = snapped[k] - snapped[k - 1] >= Math.min(Math.trunc(grid), 90)
      if (ok) snapped.forEach((v, k) => { bounds[k] = v })
    }
    const ws = texts.map((w, k) => ({ text: w, startMs: l.startMs + bounds[k], endMs: l.startMs + bounds[k + 1], syllables: syllables(w) }))
    return { startMs: l.startMs, endMs: ws[ws.length - 1].endMs, text: ws.map(w => w.text).join(' '), words: ws }
  })
}

/** Enhanced LRC: each word runs until the next word starts (the last one until the next line, at most 1.5 s). */
export function fromEnhanced(lrc: LrcLine[], durMs: number): LyricLine[] {
  const wordLines = lrc.filter(l => l.words !== null)
  if (wordLines.length < Math.trunc(lrc.filter(l => !isBlank(l.text)).length / 2)) return estimate(lrc, durMs, 0)
  const guessed = estimate(lrc, durMs, 0)
  return lrc.map((l, i) => {
    const next = lrc[i + 1]?.startMs ?? (durMs > 0 ? durMs : l.startMs + 5_000)
    const tw = l.words
    if (!tw) return guessed[i] // a line without word tags keeps its text
    const ws: LyricWord[] = tw.flatMap(([s, w], k) => {
      const e = tw[k + 1]?.[0] ?? Math.min(next - 60, s + 1_500)
      const parts = words(w)
      const step = Math.trunc(Math.max(e - s, 60) / parts.length)
      return parts.map((p, j) => ({ text: p, startMs: s + j * step, endMs: s + (j + 1) * step, syllables: syllables(p) }))
    })
    fixSqueezed(ws)
    return { startMs: l.startMs, endMs: ws[ws.length - 1].endMs, text: ws.map(w => w.text).join(' '), words: ws }
  })
}

/**
 * NetEase may have another master of the song (other intro). Compare lines with the same text:
 * if NetEase is more than 1.5 s off LRCLIB in the median, its timing belongs to another version.
 */
export function sameVersion(ne: LyricLine[], lrc: LrcLine[]): boolean {
  if (lrc.length === 0) return true
  const byText = new Map<string, LrcLine[]>()
  for (const l of lrc) {
    const k = norm(l.text)
    byText.set(k, [...(byText.get(k) ?? []), l])
  }
  const diffs: number[] = []
  for (const l of ne) {
    const same = byText.get(norm(l.text))
    if (same) diffs.push(Math.min(...same.map(x => Math.abs(x.startMs - l.startMs))))
  }
  diffs.sort((a, b) => a - b)
  if (diffs.length < 3) return true
  return diffs[Math.trunc(diffs.length / 2)] <= 1_500
}

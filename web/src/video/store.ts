import type { VideoClip } from './apple'

// What the app keeps in RaveVideoCache, kept in this browser (localStorage): the video list per
// song (30 days; 3 days for short lists, so they get a new chance) and how long each clip was
// watched. The clip watched longest (≥ 15 s) becomes the song's first video next time.

const KEY = 'rave.video'
const LIST_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000
const SHORT_LIST_MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000
const SHORT_LIST = 3
const FAVOURITE_MIN_MS = 15_000
/** Bumped when the picker changes, so old lists are looked up again once. */
const LIST_VERSION = 1
/** At most this many songs are remembered (oldest first out). */
const MAX_SONGS = 400

interface Entry { v: number; at: number; clips?: VideoClip[]; watch?: Record<string, number> }

function load(): Record<string, Entry> {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, Entry> } catch { return {} }
}

function save(all: Record<string, Entry>) {
  const keys = Object.keys(all)
  if (keys.length > MAX_SONGS) {
    keys.sort((a, b) => all[a].at - all[b].at).slice(0, keys.length - MAX_SONGS).forEach(k => delete all[k])
  }
  try { localStorage.setItem(KEY, JSON.stringify(all)) } catch { /* full or blocked: just don't remember */ }
}

/** The stored list for a song, or null when none, made by an older picker, or too old. */
export function loadList(key: string): VideoClip[] | null {
  const e = load()[key]
  if (!e?.clips || e.clips.length === 0 || e.v < LIST_VERSION) return null
  const maxAge = e.clips.length <= SHORT_LIST ? SHORT_LIST_MAX_AGE_MS : LIST_MAX_AGE_MS
  return Date.now() - e.at > maxAge ? null : e.clips
}

export function saveList(key: string, clips: VideoClip[]) {
  if (clips.length === 0) return // nothing found (maybe offline): look again next time, as in the app
  const all = load()
  all[key] = { ...all[key], v: LIST_VERSION, at: Date.now(), clips }
  save(all)
}

/** A clip that will never play is left out of the stored list. */
export function removeClip(key: string, url: string) {
  const all = load()
  const e = all[key]
  if (!e?.clips) return
  e.clips = e.clips.filter(c => c.url !== url)
  save(all)
}

export function addWatch(key: string, url: string, ms: number) {
  const all = load()
  const e = all[key] ?? { v: LIST_VERSION, at: Date.now() }
  e.watch = { ...e.watch, [url]: (e.watch?.[url] ?? 0) + ms }
  all[key] = e
  save(all)
}

function favourite(key: string): string | null {
  const watch = load()[key]?.watch
  if (!watch) return null
  const [url, ms] = Object.entries(watch).sort((a, b) => b[1] - a[1])[0] ?? []
  return url && (ms ?? 0) >= FAVOURITE_MIN_MS ? url : null
}

/** The song's favourite clip first, the rest in the picker's order. */
export function favouriteFirst(key: string, clips: VideoClip[]): VideoClip[] {
  const fav = favourite(key)
  const i = fav ? clips.findIndex(c => c.url === fav) : -1
  return i <= 0 ? clips : [clips[i], ...clips.filter((_, j) => j !== i)]
}

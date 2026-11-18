import {
  cleanTitle, estimate, fromEnhanced, norm, parseLrc, parseYrc, sameVersion,
  type LrcLine, type LyricLine, type LyricsTiming,
} from './parse'

// Fetches lyrics with as exact timing as we can get (port of LyricsSource.load in the app):
// 1. NetEase «yrc» — a time for every word (via /api/netease, unofficial).
// 2. LRCLIB — usually only a time per line; then word timing is guessed from syllables,
//    the song's singing speed and the beat (BPM from Deezer via /api/deezer).

export interface LyricsResult { lines: LyricLine[]; plain: string | null; timing: LyricsTiming | null; bpm: number }

async function getJson(url: string, timeoutMs: number, tries = 1): Promise<unknown | null> {
  for (let attempt = 0; attempt < tries; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
      if (res.ok) return await res.json()
      if (res.status === 404 || res.status === 429) return null // not there / slow down: don't hammer
    } catch { /* timeout or network: try again */ }
    if (attempt + 1 < tries) await new Promise(r => setTimeout(r, 700 * (attempt + 1)))
  }
  return null
}

const firstArtistOf = (artist: string) => artist.split(/,|&| feat/)[0].trim()

// ---------- NetEase (word timing) ----------

interface NeSong { id: number; name: string; dt: number; ar?: { name: string }[] }

async function netease(clean: string, artist: string, durMs: number): Promise<LyricLine[] | null> {
  const wantTitle = norm(clean)
  const wantArtist = norm(artist)
  if (!wantArtist || !wantTitle) return null
  const found = await getJson(`/api/netease?op=search&s=${encodeURIComponent(`${artist} ${clean}`)}`, 5_000) as
    { result?: { songs?: NeSong[] } } | null
  const songs = found?.result?.songs ?? []
  const candidates = songs.filter(s => {
    const artistOk = (s.ar ?? []).some(a => {
      const n = norm(a.name ?? '')
      return n === wantArtist || (n.length > 2 && (n.includes(wantArtist) || wantArtist.includes(n)))
    })
    const name = norm(s.name ?? '')
    const titleOk = name === wantTitle || name.startsWith(wantTitle)
    // Another version (radio edit, extended mix) has other timestamps → must be close in length.
    const lenOk = durMs <= 0 || Math.abs((s.dt ?? 0) - durMs) <= 3_000
    return artistOk && titleOk && lenOk
  }).sort((a, b) => (durMs > 0 ? Math.abs(a.dt - durMs) - Math.abs(b.dt - durMs) : 0))
  for (const s of candidates.slice(0, 3)) {
    const lj = await getJson(`/api/netease?op=lyric&id=${s.id}`, 5_000) as { yrc?: { lyric?: string } } | null
    const lines = parseYrc(lj?.yrc?.lyric ?? '')
    if (lines.length >= 4) return lines
  }
  return null
}

// ---------- LRCLIB (line timing) ----------

interface LrclibHit { trackName?: string; duration?: number | null; syncedLyrics?: string | null; plainLyrics?: string | null }

/** Picks the hit with synced lyrics and the length closest to the song. */
function bestMatch(list: LrclibHit[] | null, dur: number): LrclibHit | null {
  if (!Array.isArray(list)) return null
  let best: LrclibHit | null = null
  let bestScore = Number.MAX_VALUE
  for (const o of list) {
    const synced = o.syncedLyrics != null
    const plain = o.plainLyrics != null
    if (!synced && !plain) continue
    const d = o.duration ?? -1
    let score = dur > 0 && d > 0 ? Math.abs(d - dur) : 30
    if (!synced) score += 1000
    if (score < bestScore) { bestScore = score; best = o }
  }
  return best
}

async function queryLrclib(clean: string, firstArtist: string, dur: number): Promise<[LrcLine[], string | null] | null> {
  const base = 'https://lrclib.net/api'
  let url = `${base}/get?track_name=${encodeURIComponent(clean)}&artist_name=${encodeURIComponent(firstArtist)}`
  if (dur > 0) url += `&duration=${dur}`
  let obj = (await getJson(url, 7_000, 3)) as LrclibHit | null
  if (!obj || obj.syncedLyrics == null) {
    const hit = bestMatch(await getJson(`${base}/search?track_name=${encodeURIComponent(clean)}&artist_name=${encodeURIComponent(firstArtist)}`, 7_000, 2) as LrclibHit[] | null, dur)
    if (hit) obj = hit
  }
  if (!obj || obj.syncedLyrics == null) {
    const hit = bestMatch(await getJson(`${base}/search?q=${encodeURIComponent(`${firstArtist} ${clean}`)}`, 7_000, 2) as LrclibHit[] | null, dur)
    if (hit && (!obj || hit.syncedLyrics != null)) obj = hit
  }
  if (!obj) return null
  const synced = obj.syncedLyrics ?? ''
  const plain = obj.plainLyrics && obj.plainLyrics.trim() ? obj.plainLyrics : null
  return [parseLrc(synced), plain]
}

// ---------- Deezer (tempo) ----------

interface DeezerHit { id: number; title?: string; duration?: number; artist?: { name?: string } }

/** The song's tempo in BPM from Deezer (0 = unknown), like DeezerLookup.track in the app. */
export async function deezerBpm(artist: string, title: string, durS: number): Promise<number> {
  const main = artist.split(/\s*(?:,|&| feat\.? | featuring )\s*/i)[0].trim()
  const clean = cleanTitle(title)
  if (!main || !clean) return 0
  const found = await getJson(`/api/deezer?op=search&q=${encodeURIComponent(`${main} ${clean}`)}`, 5_000) as { data?: DeezerHit[] } | null
  const hit = (found?.data ?? []).find(t => {
    const n = norm(t.artist?.name ?? '')
    const artistOk = n === norm(main) || n === norm(artist) || n.startsWith(norm(main) + ' ')
    return artistOk && norm(t.title ?? '').startsWith(norm(clean)) && (durS <= 0 || Math.abs((t.duration ?? 0) - durS) <= 3)
  })
  if (!hit) return 0
  const track = await getJson(`/api/deezer?op=track&id=${hit.id}`, 5_000) as { bpm?: number } | null
  return track?.bpm ?? 0
}

const withTimeout = <T,>(p: Promise<T>, ms: number, fallback: T) =>
  Promise.race([p, new Promise<T>(r => setTimeout(() => r(fallback), ms))])

/** [durMs] = song length from Spotify. Returns null when nothing was found at all. */
export async function loadLyrics(title: string, artist: string, durMs: number): Promise<LyricsResult | null> {
  const clean = cleanTitle(title)
  const firstArtist = firstArtistOf(artist)
  // Tempo in parallel; the word guessing waits at most 3 s for it.
  const bpmPromise = deezerBpm(artist, title, Math.round(durMs / 1000)).catch(() => 0)
  // Both lyric sources at once; NetEase gets at most ~9 s so it never holds the lyrics back long.
  const nePromise = withTimeout(netease(clean, firstArtist, durMs).catch(() => null), 9_000, null)
  const lrc = await queryLrclib(clean, firstArtist, Math.trunc(durMs / 1000)).catch(() => null)
  const ne = await nePromise

  if (ne && sameVersion(ne, lrc?.[0] ?? [])) return { lines: ne, plain: lrc?.[1] ?? null, timing: 'words', bpm: 0 }
  if (!lrc) return null
  const [synced, plain] = lrc
  if (synced.length === 0) return { lines: [], plain, timing: null, bpm: 0 }
  if (synced.some(l => l.words !== null)) return { lines: fromEnhanced(synced, durMs), plain, timing: 'enhanced', bpm: 0 }
  // Only guessed word timing needs the tempo (as in the app): wait at most 3 s for it.
  const bpm = await withTimeout(bpmPromise, 3_000, 0)
  return { lines: estimate(synced, durMs, bpm), plain, timing: 'guessed', bpm }
}

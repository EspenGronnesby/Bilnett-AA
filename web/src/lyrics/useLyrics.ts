import { useEffect, useState } from 'react'
import type { Track } from '../spotify/playback'
import type { LyricLine, LyricsTiming } from './parse'
import { loadLyrics } from './source'

export interface Lyrics {
  /** '' = no song, 'loading', 'ok' (lines and/or plain text), 'none' (nothing found). */
  state: '' | 'loading' | 'ok' | 'none'
  lines: LyricLine[]
  plain: string | null
  timing: LyricsTiming | null
  /** Tempo from Deezer (0 = unknown). */
  bpm: number
  /** Which song these lyrics belong to. */
  key: string
}

const EMPTY: Lyrics = { state: '', lines: [], plain: null, timing: null, bpm: 0, key: '' }
// Songs come back again (playlists, repeat): keep what was found during this visit.
const cache = new Map<string, Lyrics>()

export function useLyrics(track: Track | null): Lyrics {
  const key = track && track.kind === 'track' ? `${track.artist}|${track.title}` : ''
  const [lyrics, setLyrics] = useState<Lyrics>(EMPTY)

  useEffect(() => {
    if (!track || !key) { setLyrics(EMPTY); return }
    const cached = cache.get(key)
    if (cached) { setLyrics(cached); return }
    let stale = false
    setLyrics({ ...EMPTY, state: 'loading', key })
    loadLyrics(track.title, track.artist, track.durationMs)
      .catch(() => null)
      .then(res => {
        const found: Lyrics = !res || (res.lines.length === 0 && !res.plain?.trim())
          ? { ...EMPTY, state: 'none', key }
          : { state: 'ok', lines: res.lines, plain: res.plain, timing: res.timing, bpm: res.bpm, key }
        // «Nothing found» is kept only when we were online: a network failure gets a new try next time.
        if (found.state === 'ok' || navigator.onLine) cache.set(key, found)
        if (!stale) setLyrics(found)
      })
    return () => { stale = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  // Right after a song change (before the effect above has run) don't show the previous song's lyrics.
  return lyrics.key === key ? lyrics : key ? { ...EMPTY, state: 'loading', key } : EMPTY
}

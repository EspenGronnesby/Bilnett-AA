import { useCallback, useEffect, useRef, useState } from 'react'
import type { Track } from '../spotify/playback'
import { findAll, reserve, type VideoClip } from './apple'
import { addWatch, favouriteFirst, loadList, removeClip, saveList } from './store'

// Which silent video plays behind Rave for the current song — like fetchSpotifyVideo, dropVideo,
// fetchReserve and nextVideo in RaveActivity.kt. A clip that won't play is dropped and the next one
// takes its place; when none is left, videos with the same vibe are tried (at most 8 per song).

const MAX_VIDEO_TRIES = 8

export interface Videos {
  clips: VideoClip[]
  index: number
  current: VideoClip | null
  /** The current clip has shown its first frame. */
  shown: boolean
  onFrame: () => void
  /** [permanent] false = only no network now: skip it this time, keep it in the stored list. */
  onFail: (url: string, permanent: boolean) => void
  next: () => void
}

/** [watching] = the video is on screen and the music plays (only then does watch time count). */
export function useVideos(track: Track | null, watching: boolean, videoOn: boolean): Videos {
  const key = track && track.kind === 'track' ? `${track.artist}|${track.title}|${track.album}` : ''
  const [clips, setClips] = useState<VideoClip[]>([])
  const [index, setIndex] = useState(0)
  const [shown, setShown] = useState(false)
  const keyRef = useRef(key)
  keyRef.current = key
  const failed = useRef(new Set<string>())   // never plays (this visit)
  const skipped = useRef(new Set<string>())  // failed for lack of network: try again next song
  const tries = useRef(new Map<string, number>())
  const lookupDone = useRef(new Set<string>())
  /** The song whose reserve lookup is running (a finished old one must not clear a new one's flag). */
  const reserveRunning = useRef<string | null>(null)
  const usable = (c: VideoClip) => !failed.current.has(c.url) && !skipped.current.has(c.url)

  const fetchReserve = useCallback((k: string, title: string, artist: string) => {
    if (reserveRunning.current === k || !navigator.onLine) return
    const left = MAX_VIDEO_TRIES - (tries.current.get(k) ?? 0)
    if (left <= 0) return
    reserveRunning.current = k
    reserve(title, artist, new Set([...failed.current, ...skipped.current]), left)
      .catch(() => [] as VideoClip[])
      .then(list => {
        if (reserveRunning.current === k) reserveRunning.current = null
        if (keyRef.current !== k || list.length === 0) return
        setIndex(0)
        setClips(list.filter(usable))
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // New song: fresh tries, then the stored list or a new lookup (the first clip starts early).
  useEffect(() => {
    setClips([]); setIndex(0); setShown(false)
    skipped.current.clear()
    if (!key || !track) return
    tries.current.delete(key)
    const stored = loadList(key)
    if (stored) {
      setClips(favouriteFirst(key, stored).filter(usable))
      lookupDone.current.add(key)
      return
    }
    const active = () => keyRef.current === key
    findAll(track.title, track.artist, track.album, active, list => {
      if (active()) setClips(favouriteFirst(key, list).filter(usable))
    }).then(all => {
      if (!active()) return
      saveList(key, all) // only a complete lookup is remembered
      lookupDone.current.add(key)
      if (all.filter(usable).length === 0) fetchReserve(key, track.title, track.artist)
    }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const current = clips[index] ?? null
  const live = useRef({ clips, index })
  live.current = { clips, index }

  // Count how long each clip is actually watched (written every 10 s and when it changes).
  useEffect(() => {
    if (!current || !shown || !watching || !videoOn || !key) return
    let acc = 0
    const flush = () => { if (acc > 0) { addWatch(key, current.url, acc); acc = 0 } }
    const timer = window.setInterval(() => { acc += 1_000; if (acc >= 10_000) flush() }, 1_000)
    return () => { clearInterval(timer); flush() }
  }, [current, shown, watching, videoOn, key])

  // «Video» switched on again: a fresh player, so wait for its first picture before the veil.
  useEffect(() => { if (videoOn) setShown(false) }, [videoOn])

  const onFail = useCallback((url: string, permanent: boolean) => {
    const k = keyRef.current
    const { clips: list, index: idx } = live.current
    const i = list.findIndex(c => c.url === url)
    if (i < 0) return // already gone (a late second report): no extra try used
    if (permanent) { failed.current.add(url); removeClip(k, url) } else skipped.current.add(url)
    tries.current.set(k, (tries.current.get(k) ?? 0) + 1)
    const rest = list.filter((_, j) => j !== i)
    setShown(false)
    setClips(rest)
    // Next in line: the clip after the failed one (same index), or from the top after the last.
    setIndex(idx > i ? idx - 1 : idx >= rest.length ? 0 : idx)
    // Nothing left that plays: videos with the same vibe (only once the lookup has finished).
    if (rest.length === 0 && lookupDone.current.has(k) && track) fetchReserve(k, track.title, track.artist)
  }, [fetchReserve, track])

  const next = useCallback(() => {
    if (clips.length < 2) return
    setShown(false)
    setIndex(i => (i + 1) % clips.length)
  }, [clips.length])

  return { clips, index, current, shown, onFrame: () => setShown(true), onFail, next }
}

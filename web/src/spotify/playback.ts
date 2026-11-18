import { useEffect, useRef, useState } from 'react'
import { accessToken } from './auth'

// What Spotify plays right now, on any device (the web player on the PC or the app on the phone).
// Polls GET /v1/me/player every 3 s while playing (10 s when paused or the tab is hidden) and
// estimates the position in between, like positionMs() in RaveActivity.kt.

export interface Track {
  id: string
  title: string
  artist: string
  album: string
  coverUrl: string | null
  durationMs: number
  kind: 'track' | 'episode'
}

export interface Device { id: string | null; name: string; type: string; volume: number | null; supportsVolume: boolean }

export type Status = 'loading' | 'idle' | 'ad' | 'playing' | 'paused' | 'error' | 'loggedOut'

export interface Playback {
  status: Status
  track: Track | null
  device: Device | null
  /** Current position in ms, estimated between polls (call it while drawing). */
  positionMs: () => number
  /** Ask Spotify again right away (after a control call). */
  refresh: () => void
}

const POLL_PLAYING_MS = 3_000
const POLL_IDLE_MS = 10_000
/** Only move the anchor when the estimate is off by more than this, so lyrics don't jitter. */
const REANCHOR_MS = 250

interface Anchor { pos: number; at: number; playing: boolean }

export function usePlayback(enabled = true): Playback {
  const [status, setStatus] = useState<Status>('loading')
  const [track, setTrack] = useState<Track | null>(null)
  const [device, setDevice] = useState<Device | null>(null)
  const anchor = useRef<Anchor>({ pos: 0, at: performance.now(), playing: false })
  const trackId = useRef<string | null>(null)
  const pollNow = useRef<() => void>(() => {})

  const positionMs = () => {
    const a = anchor.current
    return a.playing ? a.pos + (performance.now() - a.at) : a.pos
  }

  useEffect(() => {
    if (!enabled) return
    let stopped = false
    let timer = 0

    const schedule = (ms: number) => {
      if (!stopped) timer = window.setTimeout(poll, ms)
    }

    let busy = false
    async function poll() {
      if (busy || stopped) return
      busy = true
      try { await pollOnce() } finally { busy = false }
    }

    async function pollOnce(retried = false) {
      let token: string | null
      try { token = await accessToken() } catch { return schedule(POLL_IDLE_MS) } // no network: try later
      if (!token) { setStatus('loggedOut'); return }
      const sentAt = performance.now()
      let res: Response
      try {
        res = await fetch('https://api.spotify.com/v1/me/player?additional_types=episode', {
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch {
        setStatus(s => (s === 'loading' ? 'error' : s))
        return schedule(POLL_IDLE_MS)
      }
      const rtt = performance.now() - sentAt
      if (res.status === 401) {
        // Token rejected early: renew once and try again; a second 401 means the login is gone.
        if (!retried) {
          let renewed: string | null = null
          try { renewed = await accessToken(true) } catch { return schedule(POLL_IDLE_MS) }
          if (renewed) return pollOnce(true)
        }
        setStatus('loggedOut'); return
      }
      if (res.status === 429) {
        const wait = Number(res.headers.get('Retry-After') ?? '5')
        return schedule(Math.max(wait, 1) * 1000)
      }
      if (res.status === 204) {
        // No active device: nothing is playing anywhere.
        anchor.current = { pos: 0, at: performance.now(), playing: false }
        setStatus('idle'); setDevice(null)
        return schedule(POLL_IDLE_MS)
      }
      if (!res.ok) {
        setStatus(s => (s === 'loading' ? 'error' : s))
        return schedule(POLL_IDLE_MS)
      }
      const json = await res.json()
      setDevice(json.device ? {
        id: json.device.id ?? null, name: json.device.name, type: json.device.type,
        volume: typeof json.device.volume_percent === 'number' ? json.device.volume_percent : null,
        supportsVolume: !!json.device.supports_volume,
      } : null)

      if (json.currently_playing_type === 'ad') {
        // Keep the last song on screen during ads.
        anchor.current = { ...anchor.current, playing: false }
        setStatus('ad')
        return schedule(POLL_PLAYING_MS)
      }
      const item = json.item
      if (!item) {
        setStatus('idle')
        return schedule(POLL_IDLE_MS)
      }

      const next: Track = item.type === 'episode'
        ? {
            id: item.id, title: item.name, artist: item.show?.name ?? '', album: '',
            coverUrl: item.images?.[0]?.url ?? item.show?.images?.[0]?.url ?? null,
            durationMs: item.duration_ms ?? 0, kind: 'episode',
          }
        : {
            id: item.id, title: item.name,
            artist: (item.artists ?? []).map((a: { name: string }) => a.name).join(', '),
            album: item.album?.name ?? '',
            coverUrl: item.album?.images?.[0]?.url ?? null,
            durationMs: item.duration_ms ?? 0, kind: 'track',
          }
      const playing = !!json.is_playing
      // The position was measured roughly halfway through the request.
      const measured = (json.progress_ms ?? 0) + (playing ? rtt / 2 : 0)
      const changed = next.id !== trackId.current
      const a = anchor.current
      const drift = Math.abs(positionMs() - measured)
      if (changed || playing !== a.playing || drift > REANCHOR_MS) {
        anchor.current = { pos: measured, at: performance.now(), playing }
      }
      if (changed) { trackId.current = next.id; setTrack(next) }
      setStatus(playing ? 'playing' : 'paused')
      schedule(playing && !document.hidden ? POLL_PLAYING_MS : POLL_IDLE_MS)
    }

    // Coming back to the tab: check right away instead of waiting up to 10 s.
    const onVisible = () => {
      if (!document.hidden) { clearTimeout(timer); poll() }
    }
    document.addEventListener('visibilitychange', onVisible)
    pollNow.current = () => { clearTimeout(timer); poll() }
    poll()
    return () => {
      stopped = true
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
      pollNow.current = () => {}
    }
  }, [enabled])

  return { status, track, device, positionMs, refresh: () => pollNow.current() }
}

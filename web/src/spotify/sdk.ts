import { useEffect, useRef, useState } from 'react'
import { accessToken } from './auth'
import { transfer } from './api'

// «Rave PC»: the page itself becomes a Spotify Connect speaker via the Web Playback SDK.
// Only one tab creates the player (navigator.locks), so two tabs never show up as two devices.

const SDK_URL = 'https://sdk.scdn.co/spotify-player.js'
/** If the player hasn't said «ready» by then, playing here doesn't work for this app (plan B). */
const CONNECT_TIMEOUT_MS = 20_000

let sdkPromise: Promise<void> | null = null

function loadSdk(): Promise<void> {
  if (sdkPromise) return sdkPromise
  sdkPromise = new Promise<void>((resolve, reject) => {
    if (window.Spotify) return resolve()
    window.onSpotifyWebPlaybackSDKReady = () => resolve()
    const script = document.createElement('script')
    script.src = SDK_URL
    script.async = true
    script.onerror = () => { sdkPromise = null; reject(new Error('sdk')) }
    document.head.appendChild(script)
  })
  return sdkPromise
}

/** Why playing here doesn't work right now, in a form the screen can explain. */
export type PlayerProblem = 'premium' | 'drm' | 'auth' | 'autoplay' | 'timeout' | 'offline' | null

export interface RavePlayer {
  /** Spotify's id for «Rave PC», once it is ready. */
  deviceId: string | null
  /** What plays on Rave PC, or null when another device (or nothing) plays. */
  state: Spotify.WebPlaybackState | null
  /** performance.now() when [state] was received, for estimating the position. */
  stateAt: number
  problem: PlayerProblem
  /** Another Rave tab already is «Rave PC». */
  otherTab: boolean
  player: Spotify.Player | null
}

export function useRavePlayer(enabled: boolean, volume = 0.8): RavePlayer {
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [state, setState] = useState<Spotify.WebPlaybackState | null>(null)
  const [problem, setProblem] = useState<PlayerProblem>(null)
  const [otherTab, setOtherTab] = useState(false)
  const playerRef = useRef<Spotify.Player | null>(null)
  const stateAt = useRef(performance.now())
  const volumeRef = useRef(volume)
  volumeRef.current = volume

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    let release = () => {}
    const held = new Promise<void>(r => { release = r })
    let timeout = 0
    let drift = 0

    const start = async () => {
      try { await loadSdk() } catch { if (!cancelled) setProblem('offline'); return }
      if (cancelled || !window.Spotify) return
      const player = new window.Spotify.Player({
        name: 'Rave PC',
        getOAuthToken: cb => { accessToken().then(t => { if (t) cb(t) }).catch(() => {}) },
        volume: volumeRef.current,
        enableMediaSession: true,
      })
      playerRef.current = player
      player.addListener('ready', ({ device_id }) => {
        clearTimeout(timeout)
        setDeviceId(device_id)
        setProblem(p => (p === 'timeout' || p === 'offline' ? null : p))
      })
      player.addListener('not_ready', () => setDeviceId(null))
      player.addListener('player_state_changed', s => {
        stateAt.current = performance.now()
        setState(s)
        if (s && !s.paused) setProblem(p => (p === 'autoplay' ? null : p))
      })
      player.addListener('autoplay_failed', () => setProblem('autoplay'))
      player.addListener('account_error', () => setProblem('premium'))
      player.addListener('initialization_error', () => setProblem('drm'))
      player.addListener('authentication_error', async () => {
        // Renew the token once; if that fails too, the user has to log in again.
        try { if (!(await accessToken(true))) setProblem('auth') } catch { /* no network: the SDK asks again */ }
      })
      player.addListener('playback_error', e => console.warn('Rave PC:', e.message))
      timeout = window.setTimeout(() => { if (!cancelled) setProblem(p => p ?? 'timeout') }, CONNECT_TIMEOUT_MS)
      const ok = await player.connect()
      if (cancelled) return
      if (!ok) setProblem(p => p ?? 'drm')
      // Events only come on changes; re-read now and then so the position never drifts, and so
      // the screen lets go when the music has moved to another device (state becomes null).
      drift = window.setInterval(async () => {
        const s = await player.getCurrentState()
        if (cancelled) return
        stateAt.current = performance.now()
        setState(s)
      }, 5_000)
    }

    // One «Rave PC» per browser: wait for the lock (another tab may hold it). If it isn't ours
    // within a moment, say so; the cleanup aborts the wait, so a quick re-run never deadlocks.
    const abort = new AbortController()
    let otherTabTimer = 0
    if (navigator.locks) {
      otherTabTimer = window.setTimeout(() => { if (!cancelled) setOtherTab(true) }, 1_500)
      navigator.locks.request('rave-player', { signal: abort.signal }, async () => {
        clearTimeout(otherTabTimer)
        if (cancelled) return
        setOtherTab(false)
        await start()
        await held // keep the lock as long as this page uses the player
      }).catch(() => { /* aborted by the cleanup */ })
    } else {
      start()
    }

    return () => {
      cancelled = true
      abort.abort()
      clearTimeout(otherTabTimer)
      setOtherTab(false)
      clearTimeout(timeout)
      clearInterval(drift)
      playerRef.current?.disconnect()
      playerRef.current = null
      setDeviceId(null)
      setState(null)
      release()
    }
  }, [enabled])

  return { deviceId, state, stateAt: stateAt.current, problem, otherTab, player: playerRef.current }
}

/**
 * Moves the music to «Rave PC». Must be called directly from a click: the browser only lets
 * a page start sound after the user did something, and activateElement() marks that moment.
 */
export function playHere(player: Spotify.Player | null, deviceId: string | null) {
  if (!player || !deviceId) return
  player.activateElement()
  transfer(deviceId, true).catch(() => {})
}

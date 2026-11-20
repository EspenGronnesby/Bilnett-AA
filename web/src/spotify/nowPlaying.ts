import { useRef } from 'react'
import * as api from './api'
import { usePlayback, type Device, type Status, type Track } from './playback'
import { playHere, useRavePlayer, type PlayerProblem } from './sdk'

// One «now playing» for the screen, whichever device plays:
// - local: «Rave PC» (this page) plays → exact state from the Web Playback SDK, no polling.
// - remote: the phone or another device plays → polling of /me/player (playback.ts).

export interface Controls {
  toggle: () => void
  next: () => void
  previous: () => void
  /** Hopp til et sted i sangen (ms). */
  seek: (ms: number) => void
  /** 0–100 */
  setVolume: (percent: number) => void
  /** Move the music to «Rave PC». Call straight from a click. */
  playHere: () => void
  /** Let the browser play sound after it blocked autoplay. Call straight from a click. */
  unlock: () => void
}

export interface NowPlaying {
  source: 'local' | 'remote'
  status: Status
  track: Track | null
  device: Device | null
  positionMs: () => number
  controls: Controls
  /** «Rave PC» is ready to play here. */
  playerReady: boolean
  /** Spotify's id for this page's «Rave PC» (null until ready). */
  raveDeviceId: string | null
  playerProblem: PlayerProblem
  otherTab: boolean
}

function biggestImage(images: Spotify.Image[]): string | null {
  if (!images?.length) return null
  return [...images].sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0].url
}

function trackFromSdk(s: Spotify.WebPlaybackState): Track {
  const t = s.track_window.current_track
  return {
    id: t.id ?? t.uri,
    title: t.name,
    artist: t.artists.map(a => a.name).join(', '),
    album: t.album?.name ?? '',
    coverUrl: biggestImage(t.album?.images ?? []),
    durationMs: s.duration ?? t.duration_ms ?? 0,
    kind: t.type === 'episode' ? 'episode' : 'track',
  }
}

/** After a control call, ask Spotify again shortly (calls are not applied instantly). */
const settle = (refresh: () => void) => setTimeout(refresh, 400)

export function useNowPlaying(enabled: boolean, playerOn: boolean, volume: number, onVolume: (p: number) => void): NowPlaying {
  const rave = useRavePlayer(enabled && playerOn, volume / 100)
  const local = rave.state !== null
  const remote = usePlayback(enabled && !local)
  // During an ad on Rave PC the SDK shows the ad, not the song: keep the last song on screen.
  const lastLocalTrack = useRef<Track | null>(null)

  if (local && rave.state) {
    const s = rave.state
    const at = rave.stateAt
    const isAd = s.track_window.current_track.type === 'ad'
    if (!isAd) lastLocalTrack.current = trackFromSdk(s)
    const player = rave.player
    return {
      source: 'local',
      status: isAd ? 'ad' : s.paused ? 'paused' : 'playing',
      track: isAd ? lastLocalTrack.current : trackFromSdk(s),
      device: { id: rave.deviceId, name: 'Rave PC', type: 'Computer', volume, supportsVolume: true },
      positionMs: () => (s.paused ? s.position : s.position + (performance.now() - at)),
      controls: {
        toggle: () => { player?.togglePlay() },
        next: () => { player?.nextTrack() },
        previous: () => { player?.previousTrack() },
        seek: ms => { player?.seek(Math.max(0, Math.round(ms))) },
        setVolume: p => { onVolume(p); player?.setVolume(p / 100) },
        playHere: () => {},
        unlock: () => { player?.activateElement(); player?.resume() },
      },
      playerReady: rave.deviceId !== null,
      raveDeviceId: rave.deviceId,
      playerProblem: rave.problem,
      otherTab: rave.otherTab,
    }
  }

  const deviceId = remote.device?.id ?? null
  const run = (call: () => Promise<unknown>) => { call().catch(() => {}).finally(() => settle(remote.refresh)) }
  return {
    source: 'remote',
    status: remote.status,
    track: remote.track,
    device: remote.device,
    positionMs: remote.positionMs,
    controls: {
      toggle: () => run(() => (remote.status === 'playing' ? api.pause(deviceId) : api.play(deviceId))),
      next: () => run(() => api.next(deviceId)),
      previous: () => run(() => api.previous(deviceId)),
      seek: ms => run(() => api.seek(ms, deviceId)),
      setVolume: p => run(() => api.setVolume(p, deviceId)),
      playHere: () => { playHere(rave.player, rave.deviceId); settle(remote.refresh) },
      unlock: () => { rave.player?.activateElement(); rave.player?.resume() },
    },
    playerReady: rave.deviceId !== null,
    raveDeviceId: rave.deviceId,
    playerProblem: rave.problem,
    otherTab: rave.otherTab,
  }
}

// Minimal types for the Spotify Web Playback SDK (https://sdk.scdn.co/spotify-player.js).
// Only what Rave uses; written by hand so no extra package is needed.

declare namespace Spotify {
  interface Image { url: string; height?: number | null; width?: number | null }
  interface Artist { name: string; uri: string }
  interface WebPlaybackTrack {
    id: string | null
    uri: string
    type: 'track' | 'episode' | 'ad'
    name: string
    duration_ms?: number
    album: { name: string; uri: string; images: Image[] }
    artists: Artist[]
  }
  interface WebPlaybackState {
    paused: boolean
    position: number
    duration?: number
    timestamp?: number
    track_window: { current_track: WebPlaybackTrack; previous_tracks: WebPlaybackTrack[]; next_tracks: WebPlaybackTrack[] }
    disallows: Record<string, boolean>
  }
  interface Error { message: string }
  interface ReadyEvent { device_id: string }

  interface PlayerInit {
    name: string
    getOAuthToken: (cb: (token: string) => void) => void
    volume?: number
    enableMediaSession?: boolean
  }

  class Player {
    constructor(init: PlayerInit)
    connect(): Promise<boolean>
    disconnect(): void
    addListener(event: 'ready' | 'not_ready', cb: (e: ReadyEvent) => void): boolean
    addListener(event: 'player_state_changed', cb: (state: WebPlaybackState | null) => void): boolean
    addListener(event: 'autoplay_failed', cb: () => void): boolean
    addListener(event: 'initialization_error' | 'authentication_error' | 'account_error' | 'playback_error', cb: (e: Error) => void): boolean
    getCurrentState(): Promise<WebPlaybackState | null>
    activateElement(): Promise<void>
    togglePlay(): Promise<void>
    pause(): Promise<void>
    resume(): Promise<void>
    nextTrack(): Promise<void>
    previousTrack(): Promise<void>
    setVolume(volume: number): Promise<void>
    getVolume(): Promise<number>
    seek(positionMs: number): Promise<void>
  }
}

interface Window {
  onSpotifyWebPlaybackSDKReady?: () => void
  Spotify?: typeof Spotify
}

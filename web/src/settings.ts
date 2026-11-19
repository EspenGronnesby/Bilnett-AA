import { useCallback, useEffect, useState } from 'react'

// Rave's settings, kept in this browser (localStorage). Shared between tabs: a change in one
// tab shows up in the others through the «storage» event.

export const PORTRAIT_LAYOUTS = { poster: 'Original (musikkplakat)', original: 'Tidligere original', lyrics: 'Tekstfokus', party: 'Party-scene', cinema: 'Filmvisning' } as const
/** What choosing a portrait layout switches on/off (can be changed afterwards as usual). */
const LAYOUT_PRESETS: Partial<Record<keyof typeof PORTRAIT_LAYOUTS, Partial<Settings>>> = {
  cinema: { videoOn: true, showLyrics: true, lyricsGlass: false },
  lyrics: { showLyrics: true },
  party: { videoOn: false },
}
export interface Settings {
  portraitLayout: keyof typeof PORTRAIT_LAYOUTS
  portraitLayoutVersion: number
  /** Layout: follow the window, or force landscape / portrait. */
  orientation: 'auto' | 'landscape' | 'portrait'
  /** Keep the screen from sleeping while Rave is open. */
  keepAwake: boolean
  /** Hide buttons and the mouse pointer after a few seconds without movement. */
  autoHide: boolean
  /** Go full screen on the first click or key press after the page opens (browsers allow no more). */
  autoFullscreen: boolean
  /** Volume for «Rave PC», 0–100. */
  volume: number
  /** Let this page be a Spotify speaker («Rave PC»). */
  player: boolean
  /** Lyrics on/off (the «Tekst» button). */
  showLyrics: boolean
  /** Lyrics style, as in the app (swipe or ←/→ to change). */
  lyricsStyle: LyricsStyle
  /** Lyrics on frosted glass (true) or open without a box. Double-click the lyrics to switch. */
  lyricsGlass: boolean
  /** Lyrics sync in ms per kind of device (the phone lags differently than this PC). */
  lyricsOffsets: Record<string, number>
  /** Silent music video behind everything (the «Video» button). */
  videoOn: boolean
  /** Party mode (5 taps on the cover, or the Party button). */
  party: boolean
  /** Where Party listens: the PC's sound (screen sharing), this tab, or a microphone. */
  partySource: 'system' | 'tab' | 'mic'
  /** Vibe slider per genre, as the app's «styrke_<GENRE>»; missing = Auto. */
  partyStrength: Record<string, number>
  /** Koko the dancing ghost in Party (off by default, as in the app). */
  koko: boolean
  /** Calm Party: no strobe or white flashes (ring, particles and shake stay). */
  noFlash: boolean
  /** Size of the lyrics text in % (80–150); the buttons under the lyrics keep their size. */
  lyricsScale: number
  /** How dark the background behind the text is, 0–100 (50 = the original look). */
  dim: number
  /** Seconds before the mouse pointer hides (3, 6 or 10); the buttons stay half that after the mouse leaves. */
  hideAfter: number
  /** «Ren visning»: only the cover and the visuals (title, buttons and lyrics hidden). Key H. */
  clean: boolean
  /** A small clock in the top-left corner. */
  clock: boolean
}

export const LYRICS_STYLES = [
  { id: 'scroll', label: 'Myk rulling' },
  { id: 'words', label: 'Ord for ord' },
  { id: 'karaoke', label: 'Karaoke-fyll' },
  { id: 'big', label: 'Én stor linje' },
  { id: 'bass', label: 'Bass-puls' },
] as const
export type LyricsStyle = typeof LYRICS_STYLES[number]['id']

const KEY = 'rave.settings'
const DEFAULTS: Settings = {
  portraitLayoutVersion: 1, portraitLayout: 'poster', orientation: 'auto', keepAwake: true, autoHide: true, autoFullscreen: false, volume: 80, player: true,
  showLyrics: true, lyricsStyle: 'scroll', lyricsGlass: true, lyricsOffsets: {}, videoOn: true,
  party: false, partySource: 'system', partyStrength: {}, koko: false, noFlash: false, lyricsScale: 100, dim: 50, hideAfter: 3, clean: false, clock: false,
}

function read(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULTS
    const saved = JSON.parse(raw) as Partial<Settings>
    const next = { ...DEFAULTS, ...saved }
    if (saved.portraitLayoutVersion !== 1) {
      if (!saved.portraitLayout || saved.portraitLayout === 'original') next.portraitLayout = 'poster'
      next.portraitLayoutVersion = 1
      try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* keep settings in memory */ }
    }
    return next
  } catch { return DEFAULTS }
}

export function useSettings(): [Settings, (change: Partial<Settings>) => void] {
  const [settings, setSettings] = useState<Settings>(read)

  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) setSettings(read()) }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const update = useCallback((change: Partial<Settings>) => {
    setSettings(prev => {
      const preset = change.portraitLayout ? LAYOUT_PRESETS[change.portraitLayout] ?? {} : {}
      const next = { ...prev, ...preset, ...change }
      try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* private mode: keep in memory */ }
      return next
    })
  }, [])

  return [settings, update]
}

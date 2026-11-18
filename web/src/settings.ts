import { useCallback, useEffect, useState } from 'react'

// Rave's settings, kept in this browser (localStorage). Shared between tabs: a change in one
// tab shows up in the others through the «storage» event.

export interface Settings {
  /** Layout: follow the window, or force landscape / portrait. */
  orientation: 'auto' | 'landscape' | 'portrait'
  /** Keep the screen from sleeping while Rave is open. */
  keepAwake: boolean
  /** Hide buttons and the mouse pointer after a few seconds without movement. */
  autoHide: boolean
  /** Volume for «Rave PC», 0–100. */
  volume: number
  /** Let this page be a Spotify speaker («Rave PC»). */
  player: boolean
}

const KEY = 'rave.settings'
const DEFAULTS: Settings = { orientation: 'auto', keepAwake: true, autoHide: true, volume: 80, player: true }

function read(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) } : DEFAULTS
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
      const next = { ...prev, ...change }
      try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* private mode: keep in memory */ }
      return next
    })
  }, [])

  return [settings, update]
}

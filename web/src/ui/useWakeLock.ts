import { useEffect } from 'react'

/** Keeps the screen from sleeping while [enabled]. Asks again when the tab becomes visible. */
export function useWakeLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    let stopped = false
    const request = async () => {
      if (stopped || document.hidden) return
      try {
        const l = await navigator.wakeLock.request('screen')
        if (stopped) { l.release().catch(() => {}); return }
        lock = l
      } catch { /* battery saver or not allowed */ }
    }
    const onVisible = () => { if (!document.hidden) request() }
    document.addEventListener('visibilitychange', onVisible)
    request()
    return () => {
      stopped = true
      document.removeEventListener('visibilitychange', onVisible)
      lock?.release().catch(() => {})
    }
  }, [enabled])
}

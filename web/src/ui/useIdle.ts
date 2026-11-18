import { useEffect, useState } from 'react'

/** True after [ms] without mouse, keyboard or touch (only while [enabled]). */
export function useIdle(enabled: boolean, ms = 3_000): boolean {
  const [idle, setIdle] = useState(false)
  useEffect(() => {
    if (!enabled) { setIdle(false); return }
    let timer = 0
    const wake = () => {
      setIdle(false)
      clearTimeout(timer)
      timer = window.setTimeout(() => setIdle(true), ms)
    }
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel'] as const
    events.forEach(e => window.addEventListener(e, wake, { passive: true }))
    wake()
    return () => {
      clearTimeout(timer)
      events.forEach(e => window.removeEventListener(e, wake))
    }
  }, [enabled, ms])
  return idle
}

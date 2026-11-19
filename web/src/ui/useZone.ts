import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

/**
 * A group of buttons that only shows while the mouse is over its own area (not when the mouse
 * moves anywhere on the screen). It stays a moment after the mouse leaves, so it doesn't flicker.
 * Spread [handlers] on the area's element and give it the class «zone» (+ «awake» while shown).
 */
/** How long (ms) a zone stays after the mouse leaves; from «Skjul knappene etter» (App.tsx). */
export const ZoneLinger = createContext(1_500)

export function useZone(): [boolean, { onPointerEnter: () => void; onPointerMove: () => void; onPointerLeave: () => void }] {
  const lingerMs = useContext(ZoneLinger)
  const [awake, setAwake] = useState(false)
  const timer = useRef(0)
  const wake = useCallback(() => { clearTimeout(timer.current); setAwake(true) }, [])
  const leave = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setAwake(false), lingerMs)
  }, [lingerMs])
  useEffect(() => () => clearTimeout(timer.current), [])
  return [awake, { onPointerEnter: wake, onPointerMove: wake, onPointerLeave: leave }]
}

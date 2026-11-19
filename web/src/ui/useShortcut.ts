import { useEffect, useRef } from 'react'

/**
 * Calls [handler] when one of [keys] is pressed (e.key, case-insensitive) — not while typing in a
 * text field, not with Ctrl/Cmd/Alt, not on key repeat, and not while a dialog (settings) is open.
 * Same rules as the F key in useFullscreen.
 */
export function useShortcut(keys: string[], handler: (e: KeyboardEvent) => void, enabled = true) {
  const live = useRef(handler)
  live.current = handler
  const list = keys.map(k => k.toLowerCase()).join('|')
  useEffect(() => {
    if (!enabled) return
    const wanted = list.split('|')
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && e.target.closest('input:not([type=range]), textarea, select')
      if (typing || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return
      if (document.querySelector('[role=dialog]')) return
      if (wanted.includes(e.key.toLowerCase())) live.current(e)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [list, enabled])
}

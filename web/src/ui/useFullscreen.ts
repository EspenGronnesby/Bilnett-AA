import { useCallback, useEffect, useState } from 'react'

/** The automatic full screen has been used this visit (Esc afterwards is respected). */
let autoDone = false

/**
 * Full screen on/off (button or the F key). The browser only allows it after a click or key, so
 * [auto] = go full screen on the first click or key press after the page opened (once per visit,
 * so leaving full screen with Esc is respected until the page is opened again).
 */
export function useFullscreen(auto = false): [boolean, () => void] {
  const [full, setFull] = useState(() => document.fullscreenElement !== null)
  const toggle = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(e => window.dispatchEvent(new CustomEvent('rave-fullscreen-error', { detail: String(e) })))
    else document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(e => window.dispatchEvent(new CustomEvent('rave-fullscreen-error', { detail: String(e) })))
  }, [])

  useEffect(() => {
    const onChange = () => setFull(document.fullscreenElement !== null)
    const onKey = (e: KeyboardEvent) => {
      // Not while typing in a text field (the volume slider doesn't count as typing).
      const typing = e.target instanceof HTMLElement && e.target.closest('input:not([type=range]), textarea, select')
      if (!typing && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey && e.key.toLowerCase() === 'f') toggle()
    }
    document.addEventListener('fullscreenchange', onChange)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      window.removeEventListener('keydown', onKey)
    }
  }, [toggle])

  useEffect(() => {
    if (!auto || autoDone || document.fullscreenElement) return
    const go = (e: Event) => {
      // Not when the click is on a button or the key is F: those handle full screen themselves.
      if (e instanceof KeyboardEvent && (e.key.toLowerCase() === 'f' || e.key === 'Escape')) return
      if (e.target instanceof Element && e.target.closest('[data-fullscreen], [data-audio-choice]')) return
      autoDone = true
      remove()
      if (!document.fullscreenElement) document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(e => window.dispatchEvent(new CustomEvent('rave-fullscreen-error', { detail: String(e) })))
    }
    const remove = () => { window.removeEventListener('pointerdown', go, true); window.removeEventListener('keydown', go, true) }
    window.addEventListener('pointerdown', go, true)
    window.addEventListener('keydown', go, true)
    return remove
  }, [auto])

  return [full, toggle]
}

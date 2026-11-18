import { useCallback, useEffect, useState } from 'react'

/** Full screen on/off (button or the F key). The browser only allows it after a click or key. */
export function useFullscreen(): [boolean, () => void] {
  const [full, setFull] = useState(() => document.fullscreenElement !== null)
  const toggle = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    else document.documentElement.requestFullscreen().catch(() => {})
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

  return [full, toggle]
}

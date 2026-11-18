import { useEffect, useState } from 'react'

/**
 * Same scale as raveScaleFor() in RaveActivity.kt: 720×480 (the car screen) = 1.0.
 * Landscape: min(h/400, w/720). Portrait: min(w/400, h/720). Limited to 0.7–2.2.
 * Written to the CSS variable --u, so sizes are written as calc(N * var(--u)).
 */
export function raveScale(w: number, h: number, wide = w > h): number {
  const scale = wide ? Math.min(h / 400, w / 720) : Math.min(w / 400, h / 720)
  return Math.min(Math.max(scale, 0.7), 2.2)
}

export interface Screen { width: number; height: number; wide: boolean; scale: number }

/** [orientation] from the settings can force landscape or portrait layout. */
export function useScreen(orientation: 'auto' | 'landscape' | 'portrait' = 'auto'): Screen {
  const read = (): Screen => {
    const width = window.innerWidth, height = window.innerHeight
    const wide = orientation === 'auto' ? width > height : orientation === 'landscape'
    return { width, height, wide, scale: raveScale(width, height, wide) }
  }
  const [screen, setScreen] = useState(read)
  useEffect(() => {
    const onResize = () => setScreen(read())
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orientation])
  useEffect(() => {
    document.documentElement.style.setProperty('--u', `${screen.scale}px`)
  }, [screen.scale])
  return screen
}

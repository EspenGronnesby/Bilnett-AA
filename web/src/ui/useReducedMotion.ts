import { useEffect, useState } from 'react'

/** True when Windows/macOS is set to «reduce motion» (follows changes while the page is open). */
export function useReducedMotion(): boolean {
  const query = '(prefers-reduced-motion: reduce)'
  const [reduce, setReduce] = useState(() => matchMedia(query).matches)
  useEffect(() => {
    const m = matchMedia(query)
    const onChange = () => setReduce(m.matches)
    m.addEventListener('change', onChange)
    return () => m.removeEventListener('change', onChange)
  }, [])
  return reduce
}

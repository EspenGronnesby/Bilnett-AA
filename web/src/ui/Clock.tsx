import { useEffect, useState } from 'react'

/** A small HH:MM in the top-left corner. Updates right after each minute turns; never moves. */
export function Clock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    let timer = 0
    const next = () => { timer = window.setTimeout(() => { setNow(new Date()); next() }, 60_000 - (Date.now() % 60_000) + 50) }
    next()
    return () => clearTimeout(timer)
  }, [])
  return <div className="clock" aria-label="Klokke">{now.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}</div>
}

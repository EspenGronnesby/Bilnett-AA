import { useEffect, useRef, useState } from 'react'
import { LYRICS_STYLES, type LyricsStyle, type Settings } from '../settings'
import type { Rgb } from '../ui/colors'
import { useZone } from '../ui/useZone'
import { LyricsView, StyleDots } from './LyricsView'
import type { Lyrics } from './useLyrics'

// The lyrics panel and its buttons, like the app: frosted glass (double-click to switch),
// swipe or ←/→ to change style, «Tekst» on/off and the sync buttons.

const OFFSET_STEP_MS = 50
const OFFSET_LIMIT_MS = 1_500

export function stepStyle(current: LyricsStyle, dir: number): LyricsStyle {
  const all = LYRICS_STYLES.map(s => s.id)
  return all[(all.indexOf(current) + dir + all.length) % all.length]
}

const labelOf = (s: LyricsStyle) => LYRICS_STYLES.find(x => x.id === s)?.label ?? ''

interface PanelProps {
  lyrics: Lyrics
  positionMs: () => number
  offsetMs: number
  settings: Settings
  update: (change: Partial<Settings>) => void
  accent: Rgb
  pulse: () => number
  align: 'center' | 'start'
  /** Extra content under the lyrics (the mode buttons in landscape). */
  footer?: React.ReactNode
}

export function LyricsPanel({ lyrics, positionMs, offsetMs, settings, update, accent, pulse, align, footer }: PanelProps) {
  const [toast, setToast] = useState<string | null>(null)
  // The buttons under the lyrics show while the mouse is over the panel.
  const [awake, zone] = useZone()
  const [dragX, setDragX] = useState(0)
  const drag = useRef<{ x: number; id: number } | null>(null)
  const toastTimer = useRef(0)

  const show = (text: string) => {
    setToast(text)
    clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 1_200)
  }
  const pick = (s: LyricsStyle) => { update({ lyricsStyle: s }); show(labelOf(s)) }
  const step = (dir: number) => pick(stepStyle(settings.lyricsStyle, dir))

  // ←/→ change the style (not while typing or dragging the volume slider).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.altKey || e.metaKey || e.ctrlKey) return
      // Not while typing, using a slider or a button group, or with the settings sheet open.
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select, [role=radio], [role=dialog]')) return
      if (document.querySelector('[role=dialog]')) return
      if (e.key === 'ArrowRight') step(1)
      else if (e.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const threshold = () => 64 * (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--u')) || 1)

  return (
    <div
      className={`lyrics-panel zone${settings.lyricsGlass ? ' glass' : ''}${awake ? ' awake' : ''}`}
      {...zone}
      onPointerDown={e => {
        if (e.button !== 0 || (e.target as HTMLElement).closest('button')) return
        const startX = e.clientX
        const id = e.pointerId
        drag.current = { x: startX, id }
        // Listen on the whole window, so letting go outside the panel still ends the swipe.
        const move = (ev: PointerEvent) => { if (ev.pointerId === id) setDragX(ev.clientX - startX) }
        const end = (ev: PointerEvent) => {
          if (ev.pointerId !== id) return
          window.removeEventListener('pointermove', move)
          window.removeEventListener('pointerup', end)
          window.removeEventListener('pointercancel', end)
          drag.current = null
          setDragX(0)
          const dx = ev.type === 'pointerup' ? ev.clientX - startX : 0
          if (dx < -threshold()) step(1)
          else if (dx > threshold()) step(-1)
        }
        window.addEventListener('pointermove', move)
        window.addEventListener('pointerup', end)
        window.addEventListener('pointercancel', end)
      }}
      onDoubleClick={e => {
        // Quick taps on the buttons inside the panel (sync −/+, dots) must not switch the glass.
        if ((e.target as HTMLElement).closest('button')) return
        update({ lyricsGlass: !settings.lyricsGlass })
        show(settings.lyricsGlass ? 'Åpen, uten boks' : 'Frostet glass')
      }}
    >
      <div className="lyrics-body" style={dragX ? { transform: `translateX(${dragX * 0.6}px)`, opacity: 1 - Math.min(Math.abs(dragX) / 500, 0.6) } : undefined}>
        <LyricsView lyrics={lyrics} positionMs={positionMs} offsetMs={offsetMs} style={settings.lyricsStyle}
          accent={accent} pulse={pulse} align={align} />
      </div>
      {toast && <div className="ly-toast">{toast}</div>}
      <div className="lyrics-foot hideable">
        {lyrics.state === 'ok' && lyrics.lines.length > 0 && <StyleDots current={settings.lyricsStyle} onPick={pick} />}
        {footer}
      </div>
    </div>
  )
}

/** «Tekst» on/off and, while lyrics show, the sync buttons (− 0 ms +) for this kind of device. */
export function ModeButtons({ settings, update, deviceType, hasLyrics, children }: {
  settings: Settings
  update: (change: Partial<Settings>) => void
  deviceType: string
  hasLyrics: boolean
  /** More buttons after these (the video buttons). */
  children?: React.ReactNode
}) {
  const offset = settings.lyricsOffsets[deviceType] ?? 0
  // The latest values, so a held button keeps counting from where it is now (not a stale copy).
  const latest = useRef({ settings, deviceType, update })
  latest.current = { settings, deviceType, update }
  const setOffset = (value: number) => {
    const { settings: st, deviceType: dt, update: up } = latest.current
    up({ lyricsOffsets: { ...st.lyricsOffsets, [dt]: Math.min(Math.max(value, -OFFSET_LIMIT_MS), OFFSET_LIMIT_MS) } })
  }
  const nudge = (dir: number) => {
    const { settings: st, deviceType: dt } = latest.current
    setOffset((st.lyricsOffsets[dt] ?? 0) + dir * OFFSET_STEP_MS)
  }
  // Hold − or + : one step at once, then steady steps after a short moment (50 ms each, as in the app).
  const hold = useRef<{ wait: number; repeat: number }>({ wait: 0, repeat: 0 })
  const stop = () => { clearTimeout(hold.current.wait); clearInterval(hold.current.repeat) }
  const start = (dir: number) => {
    stop()
    nudge(dir)
    hold.current.wait = window.setTimeout(() => { hold.current.repeat = window.setInterval(() => nudge(dir), 70) }, 400)
  }
  useEffect(() => stop, [])
  const stepButton = (dir: number, label: string, text: string) => (
    <button aria-label={label}
      onPointerDown={e => { if (e.button === 0) start(dir) }}
      onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop}
      // Keyboard (Enter/Space) still gives one step per press.
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nudge(dir) } }}>{text}</button>
  )
  return (
    <div className="mode-buttons">
      <button className={settings.showLyrics ? 'chip on' : 'chip'} onClick={() => update({ showLyrics: !settings.showLyrics })}>Tekst</button>
      {settings.showLyrics && hasLyrics && (
        <div className="chip sync" title="Tekst-synk: + viser ordene senere. Hold inne for å gå raskt, trykk på tallet for 0.">
          {stepButton(-1, 'Tekst tidligere', '−')}
          <button className="sync-value" title="Trykk for å nullstille" onClick={() => setOffset(0)}>{offset > 0 ? '+' : ''}{offset} ms</button>
          {stepButton(1, 'Tekst senere', '+')}
        </div>
      )}
      {children}
    </div>
  )
}

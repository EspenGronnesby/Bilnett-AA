import { memo, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { LYRICS_STYLES, type LyricsStyle } from '../settings'
import { css, type Rgb } from '../ui/colors'
import type { LyricLine } from './parse'
import type { Lyrics } from './useLyrics'

// Synced lyrics in the chosen style — port of LyricsView (RaveActivity.kt) and LyricsStyles.kt.
// The timing rules and constants are the app's (FestivalShow.kt).

/** The next line appears this much before its first word, so it can be read in time. */
const LINE_LEAD_MS = 150
/** Music-note pause: shown this long after a line's last word ends (exact / guessed word timing)… */
const PAUSE_AFTER_MS = 700
const PAUSE_AFTER_GUESSED_MS = 2_000
/** …and hidden again this long before the next line. */
const PAUSE_BEFORE_NEXT_MS = 1_500

const lineText = (lines: LyricLine[], i: number) => {
  const l = lines[i]
  return l ? (l.text.trim() ? l.text : '♪') : null
}

interface Props {
  lyrics: Lyrics
  positionMs: () => number
  /** + shows the words later (when the sound lags behind). */
  offsetMs: number
  style: LyricsStyle
  accent: Rgb
  /** 0..1 «hit» in the music (bass/kick) while the sound is analysed; 0 otherwise. */
  pulse: () => number
  align: 'center' | 'start'
}

/** Re-renders every animation frame while [on], so the lyrics follow the song smoothly. */
function useFrame(on: boolean) {
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!on) return
    let id = 0
    const loop = () => { setTick(t => (t + 1) % 1_000_000); id = requestAnimationFrame(loop) }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [on])
}

export function LyricsView({ lyrics, positionMs, offsetMs, style, accent, pulse, align }: Props) {
  const { state, lines, plain, timing } = lyrics
  const synced = state === 'ok' && lines.length > 0
  useFrame(synced)
  const [hiddenFor, setHiddenFor] = useState('')

  // «Fant ingen tekst»: shown briefly, then it fades away.
  useEffect(() => {
    if (state !== 'none') return
    const t = setTimeout(() => setHiddenFor(lyrics.key), 3_000)
    return () => clearTimeout(t)
  }, [state, lyrics.key])

  const cls = `lyrics align-${align}`
  if (state === 'loading') return <div className={cls}><p className="ly-status">Henter tekst …</p></div>
  if (!synced && plain) return <div className={`${cls} ly-plain`}><p>{plain}</p></div>
  if (state === 'none') {
    return <div className={cls}><p className={hiddenFor === lyrics.key ? 'ly-status gone' : 'ly-status'}>Fant ingen tekst til denne sangen</p></div>
  }
  if (!synced) return <div className={cls}><p className="ly-status">Spill av en sang for å se teksten</p></div>

  const now = positionMs() - offsetMs
  let idx = 0
  for (let i = lines.length - 1; i >= 0; i--) if (lines[i].startMs <= now + LINE_LEAD_MS) { idx = i; break }
  // A known pause: the line is sung out and the next one is still a while away (or intro / outro).
  const cur = lines[idx]
  const nextStart = lines[idx + 1]?.startMs
  const after = timing === 'guessed' ? PAUSE_AFTER_GUESSED_MS : PAUSE_AFTER_MS
  const farFromNext = nextStart === undefined || nextStart - now > PAUSE_BEFORE_NEXT_MS
  const intro = now + LINE_LEAD_MS < lines[0].startMs
  const pause = intro ? lines[0].startMs - now > PAUSE_BEFORE_NEXT_MS
    : farFromNext && (cur.words.length === 0 || now > cur.endMs + after)
  const upcoming = intro ? lines[0].text : lines[idx + 1]?.text
  // The scrolling list keeps its own context, so it gets no pause note.
  const showPause = pause && style !== 'scroll'
  const vars = { '--accent-ly': css(accent) } as CSSProperties

  return (
    <div className={cls} style={vars}>
      <div className="ly-fade" key={showPause ? 'pause' : style}>
        {showPause ? <PauseNote upcoming={upcoming && upcoming !== '♪' ? upcoming : null} pulse={pulse} />
          : style === 'scroll' ? <Scroll lines={lines} idx={idx} />
          : style === 'words' ? <Words lines={lines} idx={idx} now={now} pulse={pulse} />
          : style === 'karaoke' ? <Karaoke lines={lines} idx={idx} now={now} />
          : style === 'big' ? <Big lines={lines} idx={idx} />
          : <Bass lines={lines} idx={idx} accent={accent} pulse={pulse} />}
      </div>
    </div>
  )
}

/** A pause in the singing: a music note that breathes (and bounces gently with the beat). */
function PauseNote({ upcoming, pulse }: { upcoming: string | null; pulse: () => number }) {
  const k = Math.min(Math.max(pulse(), 0), 1)
  return (
    <div className="ly-pause">
      <svg className="ly-note" viewBox="0 0 24 24" aria-hidden
        style={{ transform: `translateY(${-k * 10}px) scale(${1 + k * 0.12})` }}>
        <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
      </svg>
      {upcoming && <p className="ly-next faint">{upcoming}</p>}
    </div>
  )
}

/** Apple Music-like: the list glides up, lines far from the current one get faint and blurry. */
const Scroll = memo(function Scroll({ lines, idx }: { lines: LyricLine[]; idx: number }) {
  const box = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const [shift, setShift] = useState(0)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setHeight(el.clientHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Put the middle of the current line in the middle of the box (wrapped lines too).
  useLayoutEffect(() => {
    const line = list.current?.children[idx] as HTMLElement | undefined
    if (line && height) setShift(height / 2 - (line.offsetTop + line.offsetHeight / 2))
  }, [idx, lines, height])

  return (
    <div className="ly-scroll" ref={box}>
      <div className="ly-scroll-list" ref={list} style={{ transform: `translateY(${shift}px)` }}>
        {lines.map((_, i) => {
          const d = Math.abs(i - idx)
          return (
            <p key={i} className="ly-scroll-line" style={{
              opacity: d === 0 ? 1 : Math.max(0.5 - d * 0.1, 0.12),
              filter: d === 0 ? 'none' : `blur(${Math.min(d * 1.4, 5)}px)`,
              transform: d === 0 ? 'none' : 'scale(0.94)',
            }}>{lineText(lines, i)}</p>
          )
        })}
      </div>
    </div>
  )
})

/**
 * TikTok-like: words pop in one by one; the longest word gets the cover colour.
 * A word that lands on a hard hit in the music grows a little.
 */
function Words({ lines, idx, now, pulse }: { lines: LyricLine[]; idx: number; now: number; pulse: () => number }) {
  const timed = lines[idx]?.words ?? []
  const ws = timed.length ? timed.map(w => w.text) : ['♪']
  const longest = Math.max(...ws.map(w => w.length))
  // Loudness when each word appeared (-1 = not yet), and a slow average so «hard» is relative.
  const hits = useRef<{ idx: number; v: number[]; avg: number }>({ idx: -1, v: [], avg: 0.4 })
  if (hits.current.idx !== idx) hits.current = { idx, v: ws.map(() => -1), avg: hits.current.avg }
  return (
    <div className="ly-words" key={idx}>
      {ws.map((w, k) => {
        const w0 = timed[k]
        const shown = !w0 || now >= w0.startMs - 40
        const holding = !!w0 && w0.endMs - w0.startMs > 700 && now >= w0.startMs && now <= w0.endMs
        const h = hits.current
        if (shown && h.v[k] < 0) {
          const v = Math.min(Math.max(pulse(), 0), 1)
          h.v[k] = v
          h.avg = h.avg * 0.85 + v * 0.15
        }
        const extra = h.v[k] > 0.5 ? Math.min(Math.max((h.v[k] - h.avg - 0.15) / 0.4, 0), 1) * 0.15 : 0
        const accent = holding || (w.length === longest && ws.length > 1)
        return (
          <span key={k} className={`ly-word${shown ? ' shown' : ''}${accent ? ' accent' : ''}`}
            style={shown && extra > 0 ? { transform: `scale(${1 + extra})` } : undefined}>{w}</span>
        )
      })}
    </div>
  )
}

/**
 * Karaoke: the line fills with colour word by word, each word over exactly the time it is sung.
 * A small ball lands on each word as it starts and hops to the next one just before it begins.
 */
function Karaoke({ lines, idx, now }: { lines: LyricLine[]; idx: number; now: number }) {
  const ws = lines[idx]?.words ?? []
  const refs = useRef<(HTMLSpanElement | null)[]>([])
  const box = useRef<HTMLDivElement>(null)
  const ballEl = useRef<HTMLSpanElement>(null)

  let cur = -1
  for (let k = ws.length - 1; k >= 0; k--) if (ws[k].startMs <= now) { cur = k; break }

  // The ball: on the word while it is sung, hopping during the last ≤ 300 ms before the next word.
  // Moved directly on the element (no React state), so it can follow every frame cheaply.
  useLayoutEffect(() => {
    const b = ballEl.current
    if (ws.length === 0 || !box.current || !b) return
    const base = box.current.getBoundingClientRect()
    const spot = (k: number) => {
      const r = refs.current[k]?.getBoundingClientRect()
      return r ? { x: r.left + r.width / 2 - base.left, y: r.top - base.top } : null
    }
    const k = Math.max(cur, 0)
    const from = spot(k)
    if (!from) return
    const next = ws[k + 1]
    const t = !next || now < ws[0].startMs ? 0 : (() => {
      const hop = Math.max(Math.min(300, next.startMs - ws[k].startMs), 1)
      return Math.min(Math.max((now - (next.startMs - hop)) / hop, 0), 1)
    })()
    const to = (next && spot(k + 1)) || from
    const unit = parseFloat(getComputedStyle(box.current).getPropertyValue('--u')) || 1
    const jump = 22 * unit
    const x = from.x + (to.x - from.x) * t
    const y = from.y + (to.y - from.y) * t - jump * 4 * t * (1 - t)
    b.style.transform = `translate(${x}px, ${y}px)`
    b.style.opacity = '1'
  })

  if (ws.length === 0) {
    return <div className="ly-karaoke"><p className="ly-k-line">{lineText(lines, idx)}</p><p className="ly-next dim">{lineText(lines, idx + 1)}</p></div>
  }
  return (
    <div className="ly-karaoke">
      <div className="ly-k-box" ref={box}>
        <p className="ly-k-line">
          {ws.map((w, k) => {
            const f = k < cur ? 1 : k > cur ? 0 : Math.min(Math.max((now - w.startMs) / Math.max(w.endMs - w.startMs, 1), 0), 1)
            const n = Math.floor(w.text.length * f)
            return (
              <span key={k}>
                <span ref={el => { refs.current[k] = el }}>
                  <span className="k-done">{w.text.slice(0, n)}</span>{w.text.slice(n)}
                </span>{k < ws.length - 1 ? ' ' : ''}
              </span>
            )
          })}
        </p>
        <span className="k-ball" ref={ballEl} />
      </div>
      <p className="ly-next dim">{lineText(lines, idx + 1)}</p>
    </div>
  )
}

/** Only the line being sung, big; it glides in from below. Easiest to read from a distance. */
const Big = memo(function Big({ lines, idx }: { lines: LyricLine[]; idx: number }) {
  return (
    <div className="ly-big">
      <p className="ly-big-line" key={idx}>{lineText(lines, idx)}</p>
      <p className="ly-next faint small">{lineText(lines, idx + 1)}</p>
    </div>
  )
})

/** Trap Nation-like: big capitals in the middle that glow, grow and shake with the bass. */
function Bass({ lines, idx, accent, pulse }: { lines: LyricLine[]; idx: number; accent: Rgb; pulse: () => number }) {
  const k = Math.min(Math.max(pulse(), 0), 1)
  const glow = css(accent.map(c => Math.round(c + (255 - c) * 0.25)) as Rgb)
  const text = (lineText(lines, idx) ?? '').toUpperCase()
  const jitter = () => (Math.random() - 0.5) * k * 14
  return (
    <div className="ly-bass">
      <div className="ly-bass-stack" style={{ transform: `translate(${jitter()}px, ${jitter()}px) scale(${1 + k * 0.07})` }}>
        <p className="ly-bass-line glow" style={{ opacity: k, textShadow: `0 0 calc(50 * var(--u) / 2) ${glow}` }}>{text}</p>
        <p className="ly-bass-line" style={{ textShadow: `0 0 calc(12 * var(--u) / 2) ${glow}` }}>{text}</p>
      </div>
      <p className="ly-bass-next">{(lineText(lines, idx + 1) ?? '').toUpperCase()}</p>
    </div>
  )
}

/** Small dots that show which style is chosen (click one to pick it). */
export function StyleDots({ current, onPick }: { current: LyricsStyle; onPick: (s: LyricsStyle) => void }) {
  return (
    <div className="style-dots" role="radiogroup" aria-label="Tekststil">
      {LYRICS_STYLES.map(s => (
        <button key={s.id} role="radio" aria-checked={s.id === current} aria-label={s.label} title={s.label}
          className={s.id === current ? 'dot on' : 'dot'} onClick={() => onPick(s.id)} />
      ))}
    </div>
  )
}

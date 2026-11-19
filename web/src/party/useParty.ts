import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { WebPartyEngine } from '../core/generated/rave-core.mjs'
import type { Track } from '../spotify/playback'
import { appleGenreInfo } from '../video/apple'
import { startListening, type PartyListener, type PartySource } from './audio'

// Party on the website: one shared engine (rave-core), the sound input, and one animation-frame
// loop that ticks the engine and then lets every Party layer draw from its outputs.

export interface Party {
  paused: boolean
  on: boolean
  engine: WebPartyEngine
  /** Where it listens now (null = not listening). */
  listening: PartyListener | null
  error: string | null
  connecting: boolean
  /** Turn Party on/off. Call from a click (screen sharing needs one). */
  toggle: () => void
  /** Listen through another source. Call from a click. */
  listenTo: (kind: PartySource) => void
  /** Run [draw] after every engine tick; returns an unsubscribe function. */
  onFrame: (draw: (now: number) => void) => () => void
}

interface Options {
  enabled: boolean
  source: PartySource
  playing: boolean
  track: Track | null
  positionMs: () => number
  /** 0..1 */
  volume: number
  /** Saved vibe strength for the current genre (undefined = Auto). */
  strengthFor: (genre: string) => number | undefined
  setEnabled: (on: boolean) => void
  setSource: (kind: PartySource) => void
  /** Demo only: feed a made-up hardstyle track (build-up, then a distorted drop) instead of real sound. */
  demoSound?: boolean
}

let shared: WebPartyEngine | null = null
const engineOnce = () => (shared ??= new WebPartyEngine(2048))

function explain(e: unknown, kind: PartySource): string {
  if (e instanceof Error && e.message === 'no-system-audio') return 'Ingen lyd ble delt. Velg «Hele skjermen» og kryss av for «Del systemlyd».'
  if (e instanceof Error && e.message === 'no-audio') return 'Ingen lyd ble delt. Kryss av for å dele lyd i dialogen.'
  if (e instanceof DOMException && e.name === 'NotAllowedError') return kind === 'mic' ? 'Mikrofonen ble ikke tillatt.' : 'Delingen ble avbrutt.'
  return 'Fikk ikke tak i lyd.'
}

export function useParty(o: Options): Party {
  const engine = engineOnce()
  const [listening, setListening] = useState<PartyListener | null>(null)
  const [connecting, setConnecting] = useState(false)
  const activeListener = useRef<PartyListener | null>(null)
  const [error, setError] = useState<string | null>(null)
  const listeners = useRef(new Set<(now: number) => void>())
  const live = useRef(o)
  live.current = o

  // Each request gets a number: an answer that arrives after Party was switched off (or a newer
  // request) is closed at once instead of being left open in the background.
  const request = useRef(0)
  useEffect(() => () => { request.current++ }, [])
  const stopListening = useCallback(() => {
    request.current++
    activeListener.current?.stop()
    activeListener.current = null
    setConnecting(false)
    setListening(null)
  }, [])

  // Open the sound; if the PC's sound can't be shared, fall back to the microphone (Espen's choice).
  const listenTo = useCallback((kind: PartySource) => {
    setError(null)
    const mine = ++request.current
    setConnecting(true)
    const keep = (l: PartyListener) => {
      if (mine !== request.current || !live.current.enabled) { l.stop(); return false }
      activeListener.current?.stop()
      activeListener.current = l
      l.activate()
      setConnecting(false)
      setListening(l)
      return true
    }
    const lost = () => { if (activeListener.current?.status() === 'Deling avsluttet') { activeListener.current = null; setListening(null); setError('Deling avsluttet') } }
    // The choice Espen makes is remembered. The automatic microphone fallback is not: next time
    // Party tries the PC's sound again.
    startListening(kind, engine, lost)
      .then(l => { if (keep(l)) live.current.setSource(kind) })
      .catch(e => {
        if (mine !== request.current) return
        // Cancelled in the sharing dialog: respect that, don't ask for the microphone instead.
        const cancelled = e instanceof DOMException && e.name === 'NotAllowedError'
        if (kind === 'mic' || cancelled) { setConnecting(false); setError(explain(e, kind)); return }
        setError(`${explain(e, kind)} Bruker mikrofonen.`)
        startListening('mic', engine, lost)
          .then(keep)
          .catch(e2 => {
            if (mine !== request.current) return
            setConnecting(false)
            setError(explain(e2, 'mic'))
          })
      })
  }, [engine])

  const toggle = useCallback(() => {
    const on = !live.current.enabled
    live.current.setEnabled(on)
    if (on && !live.current.demoSound) listenTo(live.current.source)
    else { stopListening(); setError(null) }
  }, [listenTo, stopListening])

  // Party switched off elsewhere (another tab, settings): let go of the sound.
  useEffect(() => { if (!o.enabled) stopListening() }, [o.enabled, stopListening])
  useEffect(() => () => { listening?.stop() }, [listening])

  // New song: fresh analysis, then what Apple says about the genre (as the app's updateMeta).
  const trackKey = o.track ? `${o.track.artist}|${o.track.title}` : ''
  useEffect(() => {
    if (!trackKey || !o.track) return
    engine.newTrack(performance.now())
    let stale = false
    const { title, artist } = o.track
    appleGenreInfo(title, artist).then(g => {
      if (!stale) engine.setMetadata(g.name, g.exact, [], performance.now())
    }).catch(() => {})
    return () => { stale = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackKey])

  // One loop: tick the engine, then every layer draws.
  useEffect(() => {
    if (!o.enabled) return
    let id = 0
    let last = performance.now()
    let genre = ''
    const loop = (now: number) => {
      const c = live.current
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      if (engine.genre !== genre) {
        genre = engine.genre
        const saved = c.strengthFor(genre)
        engine.setStrength(saved ?? null)
      }
      engine.tick(now, dt, c.playing, c.positionMs(), c.track?.durationMs ?? -1, c.volume)
      listeners.current.forEach(draw => draw(now))
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [o.enabled, engine])

  // Demo: 150 BPM kicks, quiet build-up for 12 s, then a loud, distorted drop (for screenshots/tests).
  useEffect(() => {
    if (!o.enabled || !o.demoSound) return
    const rate = 44_100, hop = engine.hop
    let t = 0
    const id = window.setInterval(() => {
      const chunks = Math.round((rate * 0.05) / hop) || 1
      for (let c = 0; c < chunks; c++) {
        const buf = new Float32Array(hop)
        for (let k = 0; k < hop; k++) {
          const s = t++ / rate, beat = s % (60 / 150)
          const drop = (s % 30) > 12
          const kick = Math.sin(2 * Math.PI * (50 + 80 * Math.exp(-beat * 30)) * beat) * Math.exp(-beat * (drop ? 4 : 9))
          const raw = drop ? Math.tanh(kick * 6) * 0.8 : kick * 0.3
          const lead = 0.15 * Math.sin(2 * Math.PI * 440 * s) * (0.5 + 0.5 * Math.sin(2 * Math.PI * 0.5 * s))
          const hats = (s % (60 / 300)) < 0.01 ? (Math.random() - 0.5) * 0.4 : 0
          buf[k] = raw + lead + hats + 0.02 * (Math.random() - 0.5)
        }
        engine.pushPcm(buf, rate, performance.now())
      }
    }, 50)
    return () => clearInterval(id)
  }, [o.enabled, o.demoSound, engine])

  const onFrame = useCallback((draw: (now: number) => void) => {
    listeners.current.add(draw)
    return () => { listeners.current.delete(draw) }
  }, [])

  // Stable object: the layers subscribe once, and Koko keeps his place between Spotify polls.
  return useMemo(() => ({ paused: !o.playing, on: o.enabled, engine, listening, error, connecting, toggle, listenTo, onFrame }),
    [o.playing, o.enabled, engine, listening, error, connecting, toggle, listenTo, onFrame])
}

import { useEffect, useRef, useState } from 'react'

// Party step P0: can the page hear the music? Spotify's own player in the page is copy-protected,
// so Party has to listen through screen sharing (system sound / this tab) or a microphone.
// Open /?lydtest, pick a source, play music, and see whether the meter moves.

type Source = 'system' | 'tab' | 'mic'

const LABEL: Record<Source, string> = {
  system: 'Systemlyd (hele PC-en)',
  tab: 'Denne fanen (Rave PC)',
  mic: 'Mikrofon',
}

/** No processing: the app's microphone also listens «unprocessed». */
const RAW_AUDIO = { echoCancellation: false, noiseSuppression: false, autoGainControl: false }

const BANDS = 48

export function LydTest() {
  const [source, setSource] = useState<Source | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string>('')
  const [level, setLevel] = useState(0)
  const [heard, setHeard] = useState(false)
  const canvas = useRef<HTMLCanvasElement>(null)
  const session = useRef<{ stream: MediaStream; ctx: AudioContext; raf: number } | null>(null)

  const stop = () => {
    const s = session.current
    if (!s) return
    cancelAnimationFrame(s.raf)
    s.stream.getTracks().forEach(t => t.stop())
    s.ctx.close().catch(() => {})
    session.current = null
    setSource(null); setLevel(0); setHeard(false)
  }
  useEffect(() => stop, [])

  const start = async (kind: Source) => {
    stop()
    setError(null)
    let stream: MediaStream
    try {
      if (kind === 'mic') {
        stream = await navigator.mediaDevices.getUserMedia({ audio: RAW_AUDIO })
      } else {
        // Chrome needs video in the request; the picture is thrown away right after.
        const options = {
          video: true,
          audio: RAW_AUDIO,
          systemAudio: 'include',
          ...(kind === 'tab' ? { preferCurrentTab: true, selfBrowserSurface: 'include' } : { selfBrowserSurface: 'exclude' }),
        } as unknown as DisplayMediaStreamOptions // Chrome-only options (systemAudio, preferCurrentTab) are not in the TS types
        stream = await navigator.mediaDevices.getDisplayMedia(options)
        stream.getVideoTracks().forEach(t => t.stop())
      }
    } catch (e) {
      setError(e instanceof DOMException && e.name === 'NotAllowedError' ? 'Du avbrøt, eller nettleseren sa nei.' : `Fikk ikke tak i lyd (${String(e)})`)
      return
    }
    const track = stream.getAudioTracks()[0]
    if (!track) {
      stream.getTracks().forEach(t => t.stop())
      setError(kind === 'system'
        ? 'Ingen lyd ble delt. Velg «Hele skjermen» og kryss av for «Del systemlyd» nederst i dialogen.'
        : 'Ingen lyd ble delt. Kryss av for «Del også fanelyd» i dialogen.')
      return
    }
    const settings = track.getSettings()
    setInfo(`${track.label || 'lyd'} · ${settings.sampleRate ?? '?'} Hz · ${settings.channelCount ?? '?'} kanal(er)`)
    track.addEventListener('ended', stop)

    const ctx = new AudioContext()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 2048
    analyser.smoothingTimeConstant = 0.5
    ctx.createMediaStreamSource(stream).connect(analyser)
    const time = new Float32Array(analyser.fftSize)
    const freq = new Float32Array(analyser.frequencyBinCount)
    let peak = 0
    let lastSound = 0

    const draw = () => {
      analyser.getFloatTimeDomainData(time)
      analyser.getFloatFrequencyData(freq)
      let sum = 0
      for (const v of time) sum += v * v
      const rms = Math.sqrt(sum / time.length)
      const db = rms > 0 ? 20 * Math.log10(rms) : -100
      const l = Math.min(Math.max((db + 60) / 60, 0), 1) // −60 dB → 0, 0 dB → 1
      peak = Math.max(l, peak * 0.97)
      setLevel(peak)
      if (db > -50) lastSound = performance.now()
      setHeard(performance.now() - lastSound < 1_000)

      const c = canvas.current
      const g = c?.getContext('2d')
      if (c && g) {
        g.clearRect(0, 0, c.width, c.height)
        const nyquist = ctx.sampleRate / 2
        const w = c.width / BANDS
        for (let b = 0; b < BANDS; b++) {
          // Log-spaced bands 40 Hz–16 kHz, as in the app's spectrum.
          const lo = 40 * Math.pow(16000 / 40, b / BANDS), hi = 40 * Math.pow(16000 / 40, (b + 1) / BANDS)
          const i0 = Math.floor((lo / nyquist) * freq.length), i1 = Math.max(i0 + 1, Math.floor((hi / nyquist) * freq.length))
          let m = -140
          for (let i = i0; i < i1 && i < freq.length; i++) m = Math.max(m, freq[i])
          const h = Math.min(Math.max((m + 100) / 70, 0), 1) * c.height
          g.fillStyle = `hsl(${280 - b * 4} 80% 60%)`
          g.fillRect(b * w + 1, c.height - h, w - 2, h)
        }
      }
      if (session.current) session.current.raf = requestAnimationFrame(draw)
    }
    session.current = { stream, ctx, raf: requestAnimationFrame(draw) }
    setSource(kind)
  }

  return (
    <div className="screen center">
      <div className="stack lydtest">
        <h1 className="title">Lydtest for Party</h1>
        <p className="muted">Spill musikk, velg en kilde under, og se om måleren slår ut.</p>
        <div className="mode-buttons">
          {(['system', 'tab', 'mic'] as Source[]).map(k => (
            <button key={k} className={source === k ? 'chip on' : 'chip'} onClick={() => start(k)}>{LABEL[k]}</button>
          ))}
          {source && <button className="chip" onClick={stop}>Stopp</button>}
        </div>
        {error && <p className="notice">{error}</p>}
        {source && (
          <>
            <p className={heard ? 'lt-heard yes' : 'lt-heard'}>{heard ? 'Hører lyd: JA' : 'Hører lyd: nei'}</p>
            <div className="lt-meter"><div style={{ width: `${Math.round(level * 100)}%` }} /></div>
            <canvas ref={canvas} className="lt-spectrum" width={960} height={240} />
            <p className="device">{LABEL[source]} · {info}</p>
          </>
        )}
        <p className="device">Tips: «Systemlyd» virker på Windows (velg «Hele skjermen» og «Del systemlyd»). «Denne fanen» tester om lyden fra Rave PC kan høres.</p>
      </div>
    </div>
  )
}

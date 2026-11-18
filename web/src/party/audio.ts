import type { WebPartyEngine } from '../core/generated/rave-core.mjs'

// Party's ears on the website (step P4). Spotify's own player in the page is copy-protected, so
// Party listens through screen sharing (the PC's system sound, or this tab) or a microphone.
// A tiny AudioWorklet (plain JS, no Kotlin inside) only collects samples and posts them to the
// page, where the shared core turns them into exactly the app's FFT frames (PcmFft) and analysis.

export type PartySource = 'system' | 'tab' | 'mic'

export const SOURCE_LABEL: Record<PartySource, string> = {
  system: 'Systemlyd',
  tab: 'Denne fanen',
  mic: 'Mikrofon',
}

/** The app's microphone runs at 44.1 kHz; asking for the same rate keeps the bands the same. */
const RATE = 44_100
/** No processing (the app's microphone also listens «unprocessed»). */
const RAW_AUDIO = { echoCancellation: false, noiseSuppression: false, autoGainControl: false }

const WORKLET = `
class RaveTap extends AudioWorkletProcessor {
  constructor(options) {
    super()
    this.hop = options.processorOptions.hop
    this.buf = new Float32Array(this.hop)
    this.n = 0
  }
  process(inputs) {
    const input = inputs[0]
    if (!input || input.length === 0) return true
    const frames = input[0].length
    for (let i = 0; i < frames; i++) {
      let v = 0
      for (let c = 0; c < input.length; c++) v += input[c][i]
      this.buf[this.n++] = v / input.length
      if (this.n === this.hop) {
        this.port.postMessage(this.buf)
        this.buf = new Float32Array(this.hop)
        this.n = 0
      }
    }
    return true
  }
}
registerProcessor('rave-tap', RaveTap)
`

export interface PartyListener {
  source: PartySource
  /** Name of the shared sound / microphone, for the screen. */
  label: string
  stop: () => void
}

async function openStream(kind: PartySource): Promise<MediaStream> {
  if (kind === 'mic') return navigator.mediaDevices.getUserMedia({ audio: RAW_AUDIO })
  // Chrome needs video in the request; the picture is thrown away right after.
  const options = {
    video: true,
    audio: RAW_AUDIO,
    systemAudio: 'include',
    ...(kind === 'tab' ? { preferCurrentTab: true, selfBrowserSurface: 'include' } : { selfBrowserSurface: 'exclude' }),
  } as unknown as DisplayMediaStreamOptions // Chrome-only options are not in the TS types
  const stream = await navigator.mediaDevices.getDisplayMedia(options)
  stream.getVideoTracks().forEach(t => t.stop())
  return stream
}

/**
 * Starts listening and feeds every [engine.hop] samples into the engine. Must be called from a
 * click (screen sharing and sound both need one). Throws when nothing could be opened or no sound
 * was shared. [onEnded]: the user stopped the sharing (Chrome's «Stop sharing»).
 */
export async function startListening(kind: PartySource, engine: WebPartyEngine, onEnded: () => void): Promise<PartyListener> {
  const stream = await openStream(kind)
  const track = stream.getAudioTracks()[0]
  if (!track) {
    stream.getTracks().forEach(t => t.stop())
    throw new Error(kind === 'system' ? 'no-system-audio' : 'no-audio')
  }
  let ctx: AudioContext | null = null
  let source: MediaStreamAudioSourceNode | null = null
  let tap: AudioWorkletNode | null = null
  let stopped = false
  const stop = () => {
    if (stopped) return
    stopped = true
    if (tap) tap.port.onmessage = null
    source?.disconnect()
    tap?.disconnect()
    stream.getTracks().forEach(t => t.stop())
    ctx?.close().catch(() => {})
  }
  try {
    ctx = new AudioContext({ sampleRate: RATE })
    await ctx.resume()
    const url = URL.createObjectURL(new Blob([WORKLET], { type: 'text/javascript' }))
    try { await ctx.audioWorklet.addModule(url) } finally { URL.revokeObjectURL(url) }
    if (track.readyState === 'ended') throw new Error('no-audio')
    source = ctx.createMediaStreamSource(stream)
    tap = new AudioWorkletNode(ctx, 'rave-tap', { processorOptions: { hop: engine.hop }, numberOfOutputs: 0 })
    const rate = ctx.sampleRate
    tap.port.onmessage = (e: MessageEvent<Float32Array>) => {
      // One clock for sound and picture: performance.now() (like SystemClock.uptimeMillis in the app).
      engine.pushPcm(e.data, rate, performance.now())
    }
    source.connect(tap)
    track.addEventListener('ended', () => { stop(); onEnded() }, { once: true })
    return { source: kind, label: track.label || SOURCE_LABEL[kind], stop }
  } catch (e) {
    stop()
    throw e
  }
}

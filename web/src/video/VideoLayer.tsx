import { useEffect, useRef } from 'react'

// One silent, looping video behind everything (like SilentClipView in the app): Apple music videos
// (.m4v) and animated covers (.m3u8, played with hls.js where the browser can't play HLS itself).
// Fills the screen like «center crop». Gives up after 12 s without a picture.

const START_TIMEOUT_MS = 12_000

interface Props {
  url: string
  playing: boolean
  visible: boolean
  onFrame: () => void
  /** permanent = the clip is broken; false = only the network failed (keep it for later). */
  onFail: (url: string, permanent: boolean) => void
}

export function VideoLayer({ url, playing, visible, onFrame, onFail }: Props) {
  const ref = useRef<HTMLVideoElement>(null)
  const cb = useRef({ onFrame, onFail, playing })
  cb.current = { onFrame, onFail, playing }
  const armTimer = useRef<() => void>(() => {})
  const disarmTimer = useRef<() => void>(() => {})

  useEffect(() => {
    const video = ref.current
    if (!video) return
    let done = false
    let destroyHls: (() => void) | null = null
    const fail = (permanent: boolean) => {
      if (done) return
      done = true
      cb.current.onFail(url, permanent)
    }
    let pictured = false
    // Gives up only while the music plays: a paused clip never sends «playing» and is not broken.
    let timeout = 0
    const armTimeout = () => {
      if (pictured) return
      clearTimeout(timeout)
      timeout = window.setTimeout(() => { console.warn('Rave video: no picture after 12 s'); fail(false) }, START_TIMEOUT_MS)
    }
    armTimer.current = armTimeout
    disarmTimer.current = () => clearTimeout(timeout)
    if (cb.current.playing) armTimeout()
    // The first picture is there (also when paused: then it shows the first frame).
    const onPlaying = () => { pictured = true; clearTimeout(timeout); cb.current.onFrame() }
    video.addEventListener('loadeddata', onPlaying)
    // MEDIA_ERR_NETWORK (2) = no connection, worth another try later; anything else = broken clip.
    const onError = () => { console.warn('Rave video:', video.error?.code, video.error?.message); fail(video.error?.code !== 2) }
    video.addEventListener('playing', onPlaying)
    video.addEventListener('error', onError)

    if (!url.includes('.m3u8')) {
      video.src = url
    } else {
      // HLS: hls.js whenever the browser has Media Source (Chrome says it can play HLS itself,
      // but fails on these streams); the browser's own player only where hls.js can't run (Safari).
      import('hls.js').then(({ default: Hls }) => {
        if (done) return
        if (!Hls.isSupported()) {
          if (video.canPlayType('application/vnd.apple.mpegurl')) video.src = url
          else fail(true)
          return
        }
        const hls = new Hls({ maxBufferLength: 20 })
        let recovered = false
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (!data.fatal) return
          // A decoding hiccup: hls.js can often recover once before we give up on the clip.
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR && !recovered) { recovered = true; hls.recoverMediaError(); return }
          console.warn('Rave video (hls):', data.type, data.details)
          fail(data.type !== Hls.ErrorTypes.NETWORK_ERROR)
        })
        hls.loadSource(url)
        hls.attachMedia(video)
        destroyHls = () => hls.destroy()
      }).catch(() => fail(false))
    }
    return () => {
      done = true
      clearTimeout(timeout)
      video.removeEventListener('playing', onPlaying)
      video.removeEventListener('loadeddata', onPlaying)
      armTimer.current = () => {}
      disarmTimer.current = () => {}
      video.removeEventListener('error', onError)
      destroyHls?.()
      video.removeAttribute('src')
      video.load()
    }
  }, [url])

  // Follows Spotify: the video pauses with the music.
  useEffect(() => {
    const video = ref.current
    if (!video) return
    if (playing) {
      armTimer.current() // only now may it fail for «no picture» (if it hasn't shown one yet)
      video.play().catch(() => { /* not allowed yet / not loaded: tried again on change */ })
    } else {
      disarmTimer.current()
      video.pause()
    }
  }, [playing, url])

  return (
    <video
      ref={ref}
      className={visible ? 'clip shown' : 'clip'}
      muted
      loop
      playsInline
      autoPlay={playing}
      preload="auto"
      // A loop that ends anyway (some HLS streams): start it again.
      onEnded={e => { e.currentTarget.currentTime = 0; e.currentTarget.play().catch(() => {}) }}
    />
  )
}

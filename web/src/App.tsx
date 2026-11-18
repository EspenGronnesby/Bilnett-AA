import { useEffect, useState, type ReactNode } from 'react'
import { CLIENT_ID, handleCallback, isLoggedIn, login, needsNewPermissions } from './spotify/auth'
import { useNowPlaying, type NowPlaying as Now } from './spotify/nowPlaying'
import type { Track } from './spotify/playback'
import { useSettings } from './settings'
import { Controls, playerProblemText } from './ui/Controls'
import { useScreen } from './ui/scale'
import { SettingsSheet } from './ui/Settings'
import { useFullscreen } from './ui/useFullscreen'
import { useIdle } from './ui/useIdle'
import { useWakeLock } from './ui/useWakeLock'

export default function App() {
  const [ready, setReady] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  // Finish the Spotify login first if we just came back from it.
  useEffect(() => {
    handleCallback().then(err => { setLoginError(err); setReady(true) })
  }, [])

  // Dev only: /?demo shows a made-up song, to check the layout without logging in.
  if (import.meta.env.DEV && new URLSearchParams(location.search).has('demo')) return <NowPlaying demo />
  if (!CLIENT_ID) {
    return <Message title="Mangler Spotify-nøkkel" text="Legg inn VITE_SPOTIFY_CLIENT_ID i web/.env.local og start på nytt." />
  }
  if (!ready) return <div className="screen" />
  if (!isLoggedIn()) {
    return <Login error={loginError ?? (needsNewPermissions() ? 'Rave trenger ny tilgang for å kunne spille musikk. Logg inn én gang til.' : null)} />
  }
  return <NowPlaying />
}

function Login({ error }: { error: string | null }) {
  useScreen()
  return (
    <div className="screen center">
      <div className="stack">
        <h1 className="title">Rave</h1>
        {error && <p className="muted">{error}</p>}
        <button className="pill" onClick={() => login()}>Logg inn med Spotify</button>
      </div>
    </div>
  )
}

function Message({ title, text, action }: { title: string; text: string; action?: { label: string; run: () => void } }) {
  useScreen()
  return <MessageBody title={title} text={text} action={action} />
}

function MessageBody({ title, text, action }: { title: string; text: string; action?: { label: string; run: () => void } }) {
  return (
    <div className="center fill">
      <div className="stack">
        <h1 className="title">{title}</h1>
        <p className="muted">{text}</p>
        {action && <button className="pill" onClick={action.run}>{action.label}</button>}
      </div>
    </div>
  )
}

const DEMO_COVER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'%3E%3Cdefs%3E%3ClinearGradient id='g' x2='1' y2='1'%3E%3Cstop stop-color='%23ff3d7f'/%3E%3Cstop offset='1' stop-color='%23402aff'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='10' height='10' fill='url(%23g)'/%3E%3C/svg%3E"
const noop = () => {}
const DEMO: Now = {
  source: 'remote',
  status: 'playing',
  track: { id: 'demo', title: 'Nothing Like The Oldschool', artist: 'D-Sturb, Sefa', album: '', coverUrl: DEMO_COVER, durationMs: 200_000, kind: 'track' },
  device: { id: 'phone', name: 'Pixel 9', type: 'Smartphone', volume: 70, supportsVolume: true },
  positionMs: () => 0,
  controls: { toggle: noop, next: noop, previous: noop, setVolume: noop, playHere: noop, unlock: noop },
  playerReady: true,
  raveDeviceId: null,
  playerProblem: null,
  otherTab: false,
}

function NowPlaying({ demo = false }: { demo?: boolean }) {
  const [settings, updateSettings] = useSettings()
  const live = useNowPlaying(!demo, settings.player, settings.volume, volume => updateSettings({ volume }))
  const now = demo ? DEMO : live
  const { status, track } = now
  const { wide } = useScreen(settings.orientation)
  const [fullscreen, toggleFullscreen] = useFullscreen()
  const [settingsOpen, setSettingsOpen] = useState(() => demo && new URLSearchParams(location.search).has('settings'))
  useWakeLock(settings.keepAwake)
  const idle = useIdle(settings.autoHide && !settingsOpen)
  const problem = playerProblemText(now)

  if (status === 'loggedOut') return <Login error="Innloggingen gikk ut. Logg inn igjen." />
  if (status === 'loading') return <div className="screen" />

  // Everything below shares the settings button and sheet.
  const shell = (content: ReactNode, cover: string | null = null) => (
    <div className={idle ? 'screen idle' : 'screen'}>
      <Backdrop url={cover} />
      {content}
      <button className="icon-pill corner hideable" aria-label="Innstillinger" title="Innstillinger" onClick={() => setSettingsOpen(true)}>
        <svg viewBox="0 0 24 24" aria-hidden><path d={GEAR} /></svg>
      </button>
      {settingsOpen && (
        <SettingsSheet now={now} settings={settings} update={updateSettings}
          fullscreen={fullscreen} toggleFullscreen={toggleFullscreen} onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  )

  if (status === 'error' && !track) {
    return shell(<MessageBody title="Får ikke kontakt med Spotify" text="Sjekk nettet." action={{ label: 'Prøv igjen', run: () => location.reload() }} />)
  }
  if (!track || status === 'idle') {
    return shell(now.playerReady
      ? <MessageBody title="Spill noe i Spotify" text="Velg «Rave PC» i Spotify, eller trykk Spill her." action={{ label: 'Spill her', run: now.controls.playHere }} />
      : <MessageBody title="Spill noe i Spotify" text={problem ?? 'Rave viser det som spilles på PC-en eller telefonen.'} />)
  }

  return shell(
    <>
      <main className={wide ? 'stage wide' : 'stage tall'}>
        <section className="hero">
          <Cover url={track.coverUrl} />
          <Info track={track} compact={wide} />
          <div className="hideable"><Controls now={now} /></div>
          {problem && <p className="notice hideable">{problem}</p>}
        </section>
      </main>
      {now.playerProblem === 'autoplay' && (
        <button className="pill banner" onClick={now.controls.unlock}>Trykk for å starte lyden</button>
      )}
    </>,
    track.coverUrl,
  )
}

const GEAR = 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z' // Material «settings» icon (Apache-2.0)

/** Blurred, dimmed album cover behind everything (still, no drifting). */
function Backdrop({ url }: { url: string | null }) {
  if (!url) return null
  return (
    <div className="backdrop" aria-hidden>
      <img src={url} alt="" />
    </div>
  )
}

function Cover({ url }: { url: string | null }) {
  return (
    <div className="cover">
      {url ? <img src={url} alt="" /> : <div className="cover-empty">♪</div>}
    </div>
  )
}

function Info({ track, compact }: { track: Track; compact: boolean }) {
  return (
    <div className={compact ? 'info compact' : 'info'}>
      <h1 className="song">{track.title}</h1>
      {track.artist && <p className="artist">{track.artist}</p>}
    </div>
  )
}

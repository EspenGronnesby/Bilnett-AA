import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { CLIENT_ID, handleCallback, isLoggedIn, login, needsNewPermissions } from './spotify/auth'
import { useNowPlaying, type NowPlaying as Now } from './spotify/nowPlaying'
import type { Track } from './spotify/playback'
import { LyricsPanel, ModeButtons } from './lyrics/LyricsPanel'
import { useLyrics } from './lyrics/useLyrics'
import { LANDSCAPE_LAYOUTS, PORTRAIT_LAYOUTS, useSettings } from './settings'
import { accentOf, css, useCoverColors, type Rgb } from './ui/colors'
import { useVideos } from './video/useVideos'
import { VideoLayer } from './video/VideoLayer'
import { Controls, playerProblemText } from './ui/Controls'
import { useScreen } from './ui/scale'
import { LydTest } from './party/LydTest'
import { SettingsSheet } from './ui/Settings'
import { useFullscreen } from './ui/useFullscreen'
import { useIdle } from './ui/useIdle'
import { useWakeLock } from './ui/useWakeLock'
import { useReducedMotion } from './ui/useReducedMotion'
import { useShortcut } from './ui/useShortcut'
import { Clock } from './ui/Clock'
import { ShortcutsSheet } from './ui/Shortcuts'
import { PartyBanner, PartyControls, PartyCoverFx, PartyGrain, PartyParticles, PartyScene, PartyShaker } from './party/PartyLayers'
import { useParty, type Party } from './party/useParty'
import { Trainer } from './party/Trainer'
import { useAnalysis } from './party/analysis'
import { Koko } from './party/Koko'
import { useZone, ZoneLinger } from './ui/useZone'

export default function App() {
  const [ready, setReady] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  // Finish the Spotify login first if we just came back from it.
  useEffect(() => {
    handleCallback().then(err => { setLoginError(err); setReady(true) })
  }, [])

  // Party step P0: /?lydtest checks whether the page can hear the music (works on the live site).
  if (new URLSearchParams(location.search).has('lydtest')) return <LydTestScreen />
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

function LydTestScreen() {
  useScreen()
  return <LydTest />
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
  // ?song=hard → a hardstyle track (Party tests), else a well-known pop song with lyrics.
  track: new URLSearchParams(location.search).get('song') === 'hard'
    ? { id: 'demo-hard', title: 'Nothing Like The Oldschool', artist: 'D-Sturb, Sefa', album: '', coverUrl: DEMO_COVER, durationMs: 240_000, kind: 'track' }
    : { id: 'demo', title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', coverUrl: DEMO_COVER, durationMs: 200_040, kind: 'track' },
  device: { id: 'phone', name: 'Pixel 9', type: 'Smartphone', volume: 70, supportsVolume: true },
  // Starts a minute into the song (or ?at=<seconds>) and runs in real time.
  positionMs: (() => { const t0 = performance.now(); const at = Number(new URLSearchParams(location.search).get('at') ?? 60) * 1000; return () => at + performance.now() - t0 })(),
  controls: { toggle: noop, next: noop, previous: noop, seek: noop, setVolume: noop, playHere: noop, unlock: noop },
  playerReady: true,
  raveDeviceId: null,
  playerProblem: null,
  otherTab: false,
}

function NowPlaying({ demo = false }: { demo?: boolean }) {
  const [stored, updateSettings] = useSettings()
  // Demo only: ?style=karaoke etc. picks the lyrics style for screenshots.
  const demoStyle = demo ? new URLSearchParams(location.search).get('style') : null
  const demoParams = demo ? new URLSearchParams(location.search) : null
  const settings = {
    ...stored,
    ...(demoStyle ? { lyricsStyle: demoStyle as typeof stored.lyricsStyle } : {}),
    // Demo only: ?party turns Party on with made-up sound, ?novideo hides the video.
    ...(demoParams?.has('party') ? { party: true } : {}),
    ...(demoParams?.has('novideo') ? { videoOn: false } : {}),
  }
  const live = useNowPlaying(!demo, settings.player, settings.volume, volume => updateSettings({ volume }))
  const now = demo ? DEMO : live
  const { status, track } = now
  const { wide, scale: dp } = useScreen(settings.orientation)
  const [fullscreen, toggleFullscreen] = useFullscreen(settings.autoFullscreen)
  const [settingsOpen, setSettingsOpen] = useState(() => demo && new URLSearchParams(location.search).has('settings'))
  useWakeLock(settings.keepAwake)
  // The mouse pointer hides after 3 s still; the buttons only show over their own area.
  const idle = useIdle(settings.autoHide && !settingsOpen, settings.hideAfter * 1000)
  const autoHide = settings.autoHide && !settingsOpen
  const problem = playerProblemText(now)
  const lyrics = useLyrics(track)
  const coverColors = useCoverColors(track?.coverUrl ?? null)
  const accent = accentOf(coverColors)
  const videos = useVideos(track, status === 'playing', settings.videoOn)
  const showVideo = settings.videoOn && videos.current !== null && videos.shown
  // Party: the volume that drives it (Rave PC's own, or the playing device's), as the phone volume in the app.
  const partyVolume = now.source === 'local' ? settings.volume / 100 : (now.device?.volume ?? 100) / 100
  const reduceMotion = useReducedMotion()
  const party = useParty({
    enabled: settings.party, source: settings.partySource, playing: status === 'playing', track,
    positionMs: now.positionMs, volume: partyVolume,
    strengthFor: g => settings.partyStrength[g],
    setEnabled: on => updateSettings({ party: on }),
    setSource: kind => updateSettings({ partySource: kind }),
    demoSound: demo,
    calm: settings.noFlash || reduceMotion,
    trainerAuto: settings.trainerAuto, trainerReaction: settings.trainerReaction,
  })
  const trainer = useAnalysis()
  const zoneHeight = useZoneHeight()
  const dockHeight = useDockHeight()
  // Each layout remembers its lyrics style: saved when it changes, restored when the layout changes
  // (choosing another layout or turning the screen).
  const layoutKey = wide ? `l:${settings.landscapeLayout}` : `p:${settings.portraitLayout}`
  const updateFromLyrics = (change: Partial<typeof settings>) => updateSettings(change.lyricsStyle
    ? { ...change, lyricsStyleByLayout: { ...settings.lyricsStyleByLayout, [layoutKey]: change.lyricsStyle } }
    : change)
  useEffect(() => {
    const saved = settings.lyricsStyleByLayout[layoutKey]
    if (saved && saved !== settings.lyricsStyle) updateSettings({ lyricsStyle: saved })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutKey])
  const [keysOpen, setKeysOpen] = useState(false)
  useShortcut(['?'], () => setKeysOpen(true))
  // «Ren visning»: H switches it, Esc leaves it.
  useShortcut(['h'], () => updateSettings({ clean: !settings.clean }))
  useShortcut(['Escape'], () => updateSettings({ clean: false }), settings.clean)
  // The troubleshooting box (browser, full screen, sound) only with /?debug.
  const [debug] = useState(() => new URLSearchParams(location.search).has('debug'))
  const [fullscreenError, setFullscreenError] = useState('')
  useEffect(() => {
    const onError = (e: Event) => setFullscreenError((e as CustomEvent<string>).detail)
    window.addEventListener('rave-fullscreen-error', onError)
    return () => window.removeEventListener('rave-fullscreen-error', onError)
  }, [])
  const [offerFullscreen, setOfferFullscreen] = useState(false)
  useEffect(() => {
    setOfferFullscreen(!!party.listening && party.listening.source !== 'mic' && !document.fullscreenElement)
  }, [party.listening])
  useEffect(() => { if (fullscreen) setOfferFullscreen(false) }, [fullscreen])
  // Demo only: let automated tests read the engine (window.__raveParty).
  if (demo) (window as unknown as { __raveParty?: unknown }).__raveParty = party.engine
  const hasCover = !!track?.coverUrl

  if (status === 'loggedOut') return <Login error="Innloggingen gikk ut. Logg inn igjen." />
  if (status === 'loading') return <div className="screen" />

  // Everything below shares the settings button and sheet.
  const shell = (content: ReactNode, cover: string | null = null) => (
    <ZoneLinger.Provider value={Math.max(1_500, settings.hideAfter * 500)}>
    <div className={`screen${wide ? ` landscape-${settings.landscapeLayout}` : ` portrait-${settings.portraitLayout}`}${idle ? ' idle' : ''}${autoHide ? ' autohide' : ''}${settings.clean ? ' clean' : ''}${settings.clock ? ' with-clock' : ''}`}
      style={{ '--u-page': `${dp}px`, '--u-lyrics': `${dp * settings.lyricsScale / 100}px`, '--lyrics-scale': settings.lyricsScale / 100, '--dim': settings.dim / 50 } as CSSProperties}>
      <Backdrop url={cover} colors={coverColors} covered={showVideo} party={party.on} />
      {party.on && <PartyScene party={party} palette={coverColors} hasCover={hasCover} />}
      {settings.videoOn && videos.current && (
        <VideoLayer key={videos.current.url} url={videos.current.url} playing={status === 'playing'}
          visible={videos.shown} onFrame={videos.onFrame} onFail={videos.onFail} />
      )}
      {/* Dark veil over the video so cover, lyrics and buttons stay readable (as in the app). */}
      {showVideo && <div className="veil" aria-hidden />}
      {party.on && <PartyParticles party={party} palette={coverColors} hasCover={hasCover} volume={partyVolume} video={showVideo} dp={dp} />}
      {party.on && <PartyShaker party={party} dp={dp} />}
      {party.on && (settings.koko || demoParams?.has('koko')) && <Koko party={party} playing={status === 'playing'} volume={partyVolume} dp={dp} quick={!!demoParams?.has('koko')} />}
      {party.on && <PartyGrain />}
      {content}
      <PartyBanner party={party} />
      {settings.clock && <Clock />}
      {settingsOpen && debug && <details style={{ position: 'fixed', bottom: 8, left: 8, zIndex: 20, background: '#111', maxWidth: '90vw' }}><summary>Feilsøking</summary>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify({ browser: navigator.userAgent, fullscreen: !!document.fullscreenElement, window: [innerWidth, innerHeight], screen: [screen.width, screen.height], audio: party.listening?.diagnostics(), error: party.error, fullscreenError }, null, 2)}</pre>
      </details>}
      {fullscreenError && <div className="banner" style={{ zIndex: 8, background: '#111', padding: 12 }}>Fullskjerm ble avvist. Prøv F11 i Chrome. <button onClick={() => setFullscreenError('')}>Lukk</button></div>}
      {party.on && party.listening && offerFullscreen && !fullscreen && (
        <div className="banner party-fullscreen-prompt">
          <button className="pill" data-fullscreen onClick={toggleFullscreen}>Lyden er tilkoblet – gå til fullskjerm</button>
          <button className="text-button" aria-label="Lukk fullskjermtips" onClick={() => setOfferFullscreen(false)}>Senere</button>
        </div>
      )}
      <Zone className="corner-zone">
      <div className="corner-buttons hideable">
        {settings.clean && <button className="chip on" title="Avslutt ren visning (H eller Esc)" onClick={() => updateSettings({ clean: false })}>Vis alt</button>}
        {wide
          ? <select className="portrait-picker chip" aria-label="Liggende oppsett" value={settings.landscapeLayout} onChange={e => { updateSettings({ landscapeLayout: e.target.value as typeof settings.landscapeLayout }); e.currentTarget.blur() }}>
              {Object.entries(LANDSCAPE_LAYOUTS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          : <select className="portrait-picker chip" aria-label="Stående oppsett" value={settings.portraitLayout} onChange={e => { updateSettings({ portraitLayout: e.target.value as typeof settings.portraitLayout }); e.currentTarget.blur() }}>
              {Object.entries(PORTRAIT_LAYOUTS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>}
        <button className={party.on ? 'icon-pill small-icon on' : 'icon-pill small-icon'} aria-label={party.on ? 'Slå av Party' : 'Party'}
          title={party.on ? 'Slå av Party' : 'Party (eller 5 trykk på coveret)'} data-audio-choice onClick={party.toggle}>
          <svg viewBox="0 0 24 24" aria-hidden><path d={PARTY_ICON} /></svg>
        </button>
        <button className="icon-pill small-icon" data-fullscreen aria-label={fullscreen ? 'Avslutt fullskjerm' : 'Fullskjerm'}
          title={fullscreen ? 'Avslutt fullskjerm (F)' : 'Fullskjerm (F)'} onClick={toggleFullscreen}>
          <svg viewBox="0 0 24 24" aria-hidden><path d={fullscreen ? EXIT_FULL : ENTER_FULL} /></svg>
        </button>
      <button className="icon-pill small-icon" aria-label="Innstillinger" title="Innstillinger" onClick={() => setSettingsOpen(true)}>
        <svg viewBox="0 0 24 24" aria-hidden><path d={GEAR} /></svg>
      </button>
      </div>
      </Zone>
      {keysOpen && <ShortcutsSheet onClose={() => setKeysOpen(false)} />}
      {party.on && trainer.trainerOpen && (
        <Trainer party={party} title={track?.title ?? ''} artist={track?.artist ?? ''} playing={status === 'playing'} positionMs={now.positionMs}
          durationMs={track?.durationMs ?? -1} seek={now.controls.seek} next={now.controls.next} togglePlay={now.controls.toggle}
          reaction={settings.trainerReaction} setReaction={trainerReaction => updateSettings({ trainerReaction })}
          onClose={() => trainer.closeTrainer()} cover={track?.coverUrl ?? null} />
      )}
      {settingsOpen && (
        <SettingsSheet now={now} settings={settings} update={updateSettings} wide={wide}
          onClose={() => setSettingsOpen(false)} />
      )}
    </div>
    </ZoneLinger.Provider>
  )

  if (status === 'error' && !track) {
    return shell(<MessageBody title="Får ikke kontakt med Spotify" text="Sjekk nettet." action={{ label: 'Prøv igjen', run: () => location.reload() }} />)
  }
  if (!track || status === 'idle') {
    return shell(now.playerReady
      ? <MessageBody title="Spill noe i Spotify" text="Velg «Rave PC» i Spotify, eller trykk Spill her." action={{ label: 'Spill her', run: now.controls.playHere }} />
      : <MessageBody title="Spill noe i Spotify" text={problem ?? 'Rave viser det som spilles på PC-en eller telefonen.'} />)
  }

  const deviceType = now.device?.type ?? 'Computer'
  const offsetMs = settings.lyricsOffsets[deviceType] ?? 0
  const hasLyrics = lyrics.state === 'ok' && lyrics.lines.length > 0
  const lyricsOn = settings.showLyrics && track.kind === 'track'
  const modes = (
    <ModeButtons settings={settings} update={updateSettings} deviceType={deviceType} hasLyrics={hasLyrics}>
      <button className="chip" title="Ren visning: bare cover og visualisering (H)" onClick={() => updateSettings({ clean: true })}>Ren</button>
      {videos.current && (
        <button className={settings.videoOn ? 'chip on' : 'chip'} onClick={() => updateSettings({ videoOn: !settings.videoOn })}>Video</button>
      )}
      {settings.videoOn && videos.clips.length > 1 && videos.current && (
        <button className="chip" onClick={videos.next}>
          Neste · {videos.index + 1}/{videos.clips.length}
        </button>
      )}
    </ModeButtons>
  )
  // «Bass-puls» and the word hits follow the music while Party listens (as the app's lyricsPulse).
  const pulse = () => (party.on ? Math.max(party.engine.kick, party.engine.bass * 0.6) : 0)
  const panel = (align: 'center' | 'start') => (
    <LyricsPanel lyrics={lyrics} positionMs={now.positionMs} offsetMs={offsetMs} settings={settings}
      update={updateFromLyrics} accent={accent} pulse={pulse} align={align} />
  )
  const partyControls = party.on && (
    <div className="hideable dock-party">
      <PartyControls party={party} strength={settings.partyStrength[party.engine.genre]}
        setStrength={v => {
          const next = { ...settings.partyStrength }
          if (v === undefined) delete next[party.engine.genre]; else next[party.engine.genre] = v
          updateSettings({ partyStrength: next })
          party.engine.setStrength(v ?? null)
        }} />
    </div>
  )
  const cover = (
    <Cover url={track.coverUrl} party={party}
      fx={party.on && <PartyCoverFx party={party} palette={coverColors} hasCover={hasCover} volume={partyVolume} dp={dp} />} />
  )

  return shell(
    <>
      {wide && settings.landscapeLayout === 'party' ? (
        // Landscape Party-scene: title | the cover, big, in the middle of the screen | lyrics.
        <main data-layout="party" className={lyricsOn ? 'stage wide with-lyrics' : 'stage wide'}>
          <section className="side side-info">
            <Info track={track} compact={false} />
            {problem && <p className="notice">{problem}</p>}
          </section>
          <section className="party-center">{cover}</section>
          <section className="side side-lyrics">{lyricsOn && panel('start')}</section>
        </main>
      ) : wide ? (
        // Landscape: cover with title and buttons; lyrics in a panel on the right (as in the car).
        // Tekstfokus: narrow left column; Filmvisning: no cover, the video behind.
        <main data-layout={settings.landscapeLayout} className={lyricsOn ? 'stage wide split' : 'stage wide'}>
          <HeroColumn autoHide={autoHide} clean={settings.clean}
            top={<>{settings.landscapeLayout !== 'cinema' && cover}<Info track={track} compact /></>}
            rest={problem && <p className="notice hideable">{problem}</p>} />
          {lyricsOn && panel('start')}
        </main>
      ) : (
        // Portrait: cover on top (smaller with lyrics), title, lyrics filling the middle, buttons.
        <main ref={zoneHeight} data-layout={settings.portraitLayout} className={lyricsOn ? 'stage tall with-lyrics' : 'stage tall'}>
          <section className="hero">
            {settings.portraitLayout !== 'cinema' && cover}
            <Info track={track} compact={false} />
          </section>
          {lyricsOn && panel('center')}
          <Zone className="hero">
            {problem && <p className="notice hideable">{problem}</p>}
          </Zone>
        </main>
      )}
      {/* Every layout: Party's controls (when on), the view buttons (Tekst, sync, Ren, Video) and the play
          controls in the same place at the bottom of the screen; they show and hide together. Its height
          (--dock-h) is kept free by the layouts. */}
      <div ref={dockHeight} className="dock">
        <Zone className="dock-zone">
          {partyControls}
          <div className="hideable dock-modes">{modes}</div>
          <div className="hideable dock-controls"><Controls now={now} /></div>
        </Zone>
      </div>
      {now.playerProblem === 'autoplay' && (
        <button className="pill banner" onClick={now.controls.unlock}>Trykk for å starte lyden</button>
      )}
    </>,
    track.coverUrl,
  )
}

// Material «fullscreen» / «fullscreen_exit» icons (Apache-2.0).
const ENTER_FULL = 'M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z'
const EXIT_FULL = 'M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z'
// Party icon: a speaker with sound waves.
const PARTY_ICON = 'M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z'
const GEAR = 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z' // Material «settings» icon (Apache-2.0)

/**
 * The background, as in the app: the blurred, dimmed album cover drifting slowly (Ken Burns,
 * 32 s round), three soft lights in the cover's colours drifting on their own paths, and a
 * vignette. All CSS animation, so it costs next to nothing to draw.
 */
function Backdrop({ url, colors, covered, party }: { url: string | null; colors: Rgb[]; covered: boolean; party: boolean }) {
  // Under a playing video the background can't be seen: stop its animations (saves the GPU).
  return (
    <div className={`backdrop${url ? ' with-cover' : ''}${covered ? ' covered' : ''}${party ? ' party' : ''}`} data-shake="overscan" aria-hidden>
      {url && <img src={url} alt="" />}
      <div className="lights">
        {colors.slice(0, 3).map((c, i) => (
          // Same phase offset per light as the app (a = t + i·2.1 over a 32 s round).
          <div key={i} className="light-x" style={{ animationDelay: `${-(i * 2.1) / (2 * Math.PI) * 32}s` }}>
            <div className="light-y" style={{ animationDelay: `${-(i * 2.1 * 1.3) / (2 * Math.PI) * 32}s` }}>
              <div className="light" style={{ background: `radial-gradient(closest-side, ${css(c, 0.45)}, transparent)` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Cover({ url, party, fx }: { url: string | null; party?: Party; fx?: ReactNode }) {
  // 5 quick taps on the cover switch Party on/off, as in the app.
  const taps = useRef({ count: 0, first: 0 })
  const tap = () => {
    if (!party) return
    const t = performance.now(), s = taps.current
    if (t - s.first > 1_500) { s.first = t; s.count = 0 }
    if (++s.count >= 5) { s.count = 0; party.toggle() }
  }
  return (
    <div className="cover-wrap" data-party-cover data-shake={party?.on ? '' : undefined} onClick={tap}>
      {fx}
      <div className="cover">
        {url ? <img src={url} alt="" /> : <div className="cover-empty">♪</div>}
      </div>
    </div>
  )
}

/**
 * Portrait: keeps the height of the button area (--zone-h, <main>'s last child) and of the title
 * (--info-h) on <main>, so the cover can shrink when they need the room instead of the lyrics
 * or the buttons ending up underneath it.
 */
function useZoneHeight() {
  const stop = useRef<(() => void) | null>(null)
  return useCallback((main: HTMLElement | null) => {
    stop.current?.()
    stop.current = null
    const zone = main?.lastElementChild as HTMLElement | null
    const hero = main?.firstElementChild as HTMLElement | null
    if (!main || !zone || !hero) return
    // The title is a new element for every song (key = track id): follow the current one.
    let info: HTMLElement | null = null
    const measure = () => {
      main.style.setProperty('--zone-h', `${zone.offsetHeight}px`)
      const now = hero.querySelector<HTMLElement>('.info')
      if (now !== info) {
        if (info) sizes.unobserve(info)
        if (now) sizes.observe(now)
        info = now
      }
      if (info) main.style.setProperty('--info-h', `${info.offsetHeight}px`)
    }
    const sizes = new ResizeObserver(measure)
    const swaps = new MutationObserver(measure)
    sizes.observe(zone)
    swaps.observe(hero, { childList: true, subtree: true })
    measure()
    stop.current = () => { sizes.disconnect(); swaps.disconnect() }
  }, [])
}

/** The bottom bar's height as --dock-h on .screen (its parent), so every layout keeps that room free. */
function useDockHeight() {
  const observer = useRef<ResizeObserver | null>(null)
  return useCallback((dock: HTMLElement | null) => {
    observer.current?.disconnect()
    observer.current = null
    const screen = dock?.parentElement
    if (!dock || !screen) return
    observer.current = new ResizeObserver(() => screen.style.setProperty('--dock-h', `${dock.offsetHeight}px`))
    observer.current.observe(dock)
  }, [])
}

/** An area whose buttons only show while the mouse is over it (see useZone). */
function Zone({ className, children }: { className: string; children: ReactNode }) {
  const [awake, zone] = useZone()
  return <section className={`${className} zone${awake ? ' awake' : ''}`} {...zone}>{children}</section>
}

/**
 * Landscape cover column. When the buttons hide (mouse still), cover and title glide down by half
 * the buttons' height, so they sit centred next to the lyrics; they glide back when the mouse moves.
 * (Espen asked for this, 2026-11-18.)
 */
function HeroColumn({ autoHide, clean, top, rest }: { autoHide: boolean; clean: boolean; top: ReactNode; rest: ReactNode }) {
  const [awake, zone] = useZone()
  const restRef = useRef<HTMLDivElement>(null)
  const [restHeight, setRestHeight] = useState(0)
  useEffect(() => {
    const el = restRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setRestHeight(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  // The gap between the two parts counts too (it disappears with the buttons).
  const gap = restRef.current ? parseFloat(getComputedStyle(restRef.current.parentElement!).rowGap) || 0 : 0
  // Nothing under the cover (Party off, no notice): nothing to make room for, so no glide either.
  const normal = autoHide && !awake && restHeight > 0 ? (restHeight + gap) / 2 : 0
  // «Ren visning» keeps the cover exactly where it was when it was switched on: it doesn't glide
  // when H is pressed, nor when the mouse passes.
  const frozen = useRef<number | null>(null)
  if (!clean) frozen.current = null
  else if (frozen.current === null) frozen.current = normal
  const shift = clean ? frozen.current ?? normal : normal
  return (
    <section className={awake ? 'hero zone awake' : 'hero zone'} {...zone}
      style={{ '--rest-h': `${restHeight}px` } as CSSProperties}>
      <div className="hero-top" style={{ transform: shift ? `translateY(${shift}px)` : undefined }}>{top}</div>
      <div className="hero-rest" ref={restRef}>{rest}</div>
    </section>
  )
}

/** The first song since the page opened gets no intro; a song gets it once (as in the app). */
let firstTrackId: string | null = null
let introPlayedFor: string | null = null

function Info({ track, compact }: { track: Track; compact: boolean }) {
  firstTrackId ??= track.id
  // New song: title fades in and glides up, artist follows a moment later. Re-showing the same
  // song (turning the screen, switching layout) does not play it again.
  const [intro] = useState(() => track.id !== firstTrackId && track.id !== introPlayedFor)
  useEffect(() => { introPlayedFor = track.id }, [track.id])
  return (
    <div className={compact ? 'info compact' : 'info'} key={track.id}>
      <h1 className={intro ? 'song intro' : 'song'}>{track.title}</h1>
      {track.artist && <p className={intro ? 'artist intro late' : 'artist'}>{track.artist}</p>}
    </div>
  )
}

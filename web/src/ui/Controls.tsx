import { useRef } from 'react'
import type { NowPlaying } from '../spotify/nowPlaying'

// Previous / play-pause / next, volume, where it plays, and «Spill her».
// Only buttons react to a press (scale .97); nothing else moves.

const Icon = {
  prev: <path d="M6 5h2v14H6zM20 5v14L9 12z" />,
  next: <path d="M16 5h2v14h-2zM4 5v14l11-7z" />,
  play: <path d="M7 4.5v15L20 12z" />,
  pause: <path d="M6 5h4v14H6zM14 5h4v14h-4z" />,
}

function IconButton({ label, icon, onClick, big = false }: { label: string; icon: JSX.Element; onClick: () => void; big?: boolean }) {
  return (
    <button className={big ? 'icon-pill big' : 'icon-pill'} aria-label={label} title={label} onClick={onClick}>
      <svg viewBox="0 0 24 24" aria-hidden>{icon}</svg>
    </button>
  )
}

export function Controls({ now }: { now: NowPlaying }) {
  const { controls, status, device, source } = now
  const playing = status === 'playing'
  const canPlayHere = source === 'remote' && now.playerReady
  // Dragging the slider fires many changes: send only the last one (Spotify rate-limits).
  const volumeTimer = useRef(0)
  const onVolume = (p: number) => {
    clearTimeout(volumeTimer.current)
    volumeTimer.current = window.setTimeout(() => controls.setVolume(p), source === 'local' ? 0 : 200)
  }

  return (
    <div className="controls">
      <div className="transport">
        <IconButton label="Forrige" icon={Icon.prev} onClick={controls.previous} />
        <IconButton label={playing ? 'Pause' : 'Spill'} icon={playing ? Icon.pause : Icon.play} onClick={controls.toggle} big />
        <IconButton label="Neste" icon={Icon.next} onClick={controls.next} />
      </div>
      {device?.supportsVolume && device.volume !== null && (
        <input
          className="volume"
          type="range" min={0} max={100} step={1}
          aria-label="Volum"
          defaultValue={device.volume}
          key={`${device.id}-${source}`}
          onChange={e => onVolume(Number(e.currentTarget.value))}
        />
      )}
      <div className="where">
        {device && <span>Spiller på {device.name}</span>}
        {canPlayHere && <button className="pill small" onClick={controls.playHere}>Spill her</button>}
      </div>
    </div>
  )
}

/** A short explanation when «Rave PC» can't play here; null when all is well. */
export function playerProblemText(now: NowPlaying): string | null {
  if (now.otherTab) return 'Rave spiller i en annen fane.'
  switch (now.playerProblem) {
    case 'premium': return 'Å spille her krever Spotify Premium.'
    case 'drm': return 'Nettleseren blokkerer avspilling. Slå på «Beskyttet innhold» i innstillingene.'
    case 'auth': return 'Innloggingen gikk ut. Logg inn igjen.'
    case 'timeout': return 'Rave PC fikk ikke kontakt med Spotify. Rave viser fortsatt det som spilles.'
    case 'offline': return 'Fikk ikke lastet Spotify-spilleren. Sjekk nettet.'
    default: return null
  }
}

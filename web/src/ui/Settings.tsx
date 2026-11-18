import { useEffect, useState } from 'react'
import { getDevices, getMe, transfer, type DeviceInfo, type Me } from '../spotify/api'
import { logout } from '../spotify/auth'
import type { NowPlaying } from '../spotify/nowPlaying'
import type { Settings as SettingsData } from '../settings'

// Settings sheet: «Konto og enhet» and «Skjerm». Opens over a dark scrim (fade only),
// closes with Esc or a click outside.

interface Props {
  now: NowPlaying
  settings: SettingsData
  update: (change: Partial<SettingsData>) => void
  fullscreen: boolean
  toggleFullscreen: () => void
  onClose: () => void
}

export function SettingsSheet({ now, settings, update, fullscreen, toggleFullscreen, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label="Innstillinger" onClick={e => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>Innstillinger</h2>
          <button className="text-button" onClick={onClose}>Ferdig</button>
        </div>
        <Account now={now} settings={settings} update={update} />
        <Screen settings={settings} update={update} fullscreen={fullscreen} toggleFullscreen={toggleFullscreen} />
      </div>
    </div>
  )
}

function Account({ now, settings, update }: Pick<Props, 'now' | 'settings' | 'update'>) {
  const [me, setMe] = useState<Me | null | undefined>(undefined)
  const [devices, setDevices] = useState<DeviceInfo[] | null>(null)

  useEffect(() => {
    let stopped = false
    getMe().then(m => { if (!stopped) setMe(m) }).catch(() => { if (!stopped) setMe(null) })
    const load = () => getDevices().then(d => { if (!stopped) setDevices(d) }).catch(() => {})
    load()
    // The list changes when devices wake up or go to sleep: refresh while the sheet is open.
    const timer = window.setInterval(load, 5_000)
    return () => { stopped = true; clearInterval(timer) }
  }, [])

  const choose = (d: DeviceInfo) => {
    if (d.active) return
    if (d.id === now.raveDeviceId) now.controls.playHere()
    else transfer(d.id, true).catch(() => {})
    setDevices(list => list?.map(x => ({ ...x, active: x.id === d.id })) ?? null)
  }

  return (
    <section className="group">
      <h3>Konto og enhet</h3>
      <div className="card">
        <div className="row">
          {me?.imageUrl ? <img className="avatar" src={me.imageUrl} alt="" /> : <div className="avatar" />}
          <span className="grow">{me === undefined ? 'Henter …' : me?.name || 'Spotify-konto'}</span>
          <button className="text-button" onClick={() => { logout(); location.reload() }}>Logg ut</button>
        </div>
        <div className="divider" />
        {devices === null && <div className="row muted-row">Henter enheter …</div>}
        {devices?.length === 0 && <div className="row muted-row">Ingen enheter. Åpne Spotify på telefonen eller PC-en.</div>}
        {devices?.map(d => (
          <button key={d.id} className={d.active ? 'row choice selected' : 'row choice'} onClick={() => choose(d)} disabled={d.restricted}>
            <span className="grow">{d.id === now.raveDeviceId ? `${d.name} (denne siden)` : d.name}</span>
            <span className="kind">{deviceKind(d.type)}</span>
            <span className="check" aria-hidden>{d.active ? '✓' : ''}</span>
          </button>
        ))}
        <div className="divider" />
        <Toggle label="La denne siden spille musikk (Rave PC)" on={settings.player} onChange={player => update({ player })} />
      </div>
    </section>
  )
}

function Screen({ settings, update, fullscreen, toggleFullscreen }: Pick<Props, 'settings' | 'update' | 'fullscreen' | 'toggleFullscreen'>) {
  const options: { value: SettingsData['orientation']; label: string }[] = [
    { value: 'auto', label: 'Automatisk' },
    { value: 'landscape', label: 'Liggende' },
    { value: 'portrait', label: 'Stående' },
  ]
  return (
    <section className="group">
      <h3>Skjerm</h3>
      <div className="card">
        <div className="row">
          <span className="grow">Retning</span>
          <div className="segmented" role="radiogroup" aria-label="Retning">
            {options.map(o => (
              <button key={o.value} role="radio" aria-checked={settings.orientation === o.value}
                className={settings.orientation === o.value ? 'seg selected' : 'seg'}
                onClick={() => update({ orientation: o.value })}>{o.label}</button>
            ))}
          </div>
        </div>
        <div className="divider" />
        <div className="row">
          <span className="grow">Fullskjerm <span className="hint">(tast F)</span></span>
          <button className="pill small" data-fullscreen onClick={toggleFullscreen}>{fullscreen ? 'Avslutt' : 'Slå på'}</button>
        </div>
        <div className="divider" />
        <Toggle label="Fullskjerm automatisk (ved første klikk eller tast)" on={settings.autoFullscreen} onChange={autoFullscreen => update({ autoFullscreen })} />
        <div className="divider" />
        <Toggle label="Hold skjermen våken" on={settings.keepAwake} onChange={keepAwake => update({ keepAwake })} />
        <div className="divider" />
        <Toggle label="Vis knappene bare når musa er over dem" on={settings.autoHide} onChange={autoHide => update({ autoHide })} />
      </div>
    </section>
  )
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (on: boolean) => void }) {
  return (
    <button className="row choice" role="switch" aria-checked={on} onClick={() => onChange(!on)}>
      <span className="grow">{label}</span>
      <span className={on ? 'switch on' : 'switch'} aria-hidden><span /></span>
    </button>
  )
}

function deviceKind(type: string): string {
  switch (type.toLowerCase()) {
    case 'computer': return 'PC'
    case 'smartphone': return 'Telefon'
    case 'speaker': return 'Høyttaler'
    case 'tv': return 'TV'
    case 'automobile': return 'Bil'
    case 'tablet': return 'Nettbrett'
    default: return type
  }
}

import { useEffect, useRef, useState } from 'react'
import { getDevices, getMe, transfer, type DeviceInfo, type Me } from '../spotify/api'
import { logout } from '../spotify/auth'
import type { NowPlaying } from '../spotify/nowPlaying'
import { ShortcutList } from './Shortcuts'
import { DEFAULTS, LANDSCAPE_LAYOUTS, PORTRAIT_LAYOUTS, type Settings as SettingsData } from '../settings'

// Settings sheet, as in Timetracker: a short overview (icon, title, current value, ›). A row swaps the
// content of the same sheet to that part, with «‹ Innstillinger» back — never a sheet on top of a sheet.
// Opens over a dark scrim (fade only); Esc goes back, and closes from the overview.

interface Props {
  now: NowPlaying
  settings: SettingsData
  update: (change: Partial<SettingsData>) => void
  /** The screen is laid out in landscape now (to name the layout in use). */
  wide: boolean
  onClose: () => void
}

type Section = 'account' | 'screen' | 'look' | 'keys'
const TITLES: Record<Section, string> = { account: 'Konto og enhet', screen: 'Skjerm', look: 'Utseende', keys: 'Hurtigtaster' }
// Material icons (Apache-2.0), 24 × 24: person, desktop, palette, keyboard.
const ICONS: Record<Section, string> = {
  account: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  screen: 'M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z',
  look: 'M12 3a9 9 0 0 0 0 18c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z',
  keys: 'M20 5H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z',
}
const ORIENTATION_LABEL: Record<SettingsData['orientation'], string> = { auto: 'Automatisk', landscape: 'Liggende', portrait: 'Stående' }

export function SettingsSheet({ now, settings, update, wide, onClose }: Props) {
  const [section, setSection] = useState<Section | null>(null)
  const [me, setMe] = useState<Me | null | undefined>(undefined)
  const sheet = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let stopped = false
    getMe().then(m => { if (!stopped) setMe(m) }).catch(() => { if (!stopped) setMe(null) })
    return () => { stopped = true }
  }, [])

  const open = (next: Section | null) => {
    setSection(next)
    sheet.current?.scrollTo({ top: 0 })
    // The row/back button that had focus disappears: keep keyboard focus in the sheet.
    sheet.current?.focus({ preventScroll: true })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      // In an open drop-down Esc only closes the list.
      if (e.target instanceof HTMLElement && e.target.closest('select')) return
      if (section) open(null)
      else onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, section])

  return (
    <div className="scrim" onClick={onClose}>
      <div ref={sheet} tabIndex={-1} className="sheet" role="dialog" aria-label="Innstillinger" onClick={e => e.stopPropagation()}>
        {section && <button className="text-button sheet-back" onClick={() => open(null)}>‹ Innstillinger</button>}
        <div className="sheet-head">
          <h2>{section ? TITLES[section] : 'Innstillinger'}</h2>
          <button className="text-button" onClick={onClose}>Ferdig</button>
        </div>
        {section === null && <>
          <Overview settings={settings} me={me} wide={wide} onOpen={open} />
          <Reset settings={settings} update={update} />
        </>}
        {section === 'account' && <Account now={now} me={me} settings={settings} update={update} />}
        {section === 'screen' && <Screen settings={settings} update={update} />}
        {section === 'look' && <Look settings={settings} update={update} />}
        {section === 'keys' && <section className="group"><ShortcutList /></section>}
      </div>
    </div>
  )
}

function Overview({ settings, me, wide, onOpen }: Pick<Props, 'settings' | 'wide'> & { me: Me | null | undefined; onOpen: (s: Section) => void }) {
  const landscape = settings.orientation === 'landscape' || (settings.orientation === 'auto' && wide)
  const layout = landscape ? LANDSCAPE_LAYOUTS[settings.landscapeLayout] : PORTRAIT_LAYOUTS[settings.portraitLayout]
  return (
    <>
      <section className="group">
        <div className="card">
          <NavRow section="account" value={me === undefined ? '' : me?.name || 'Spotify'} onOpen={onOpen} />
          <div className="divider" />
          <NavRow section="screen" value={`${ORIENTATION_LABEL[settings.orientation]} · ${layout}`} onOpen={onOpen} />
          <div className="divider" />
          <NavRow section="look" value={`Tekst ${settings.lyricsScale} % · Bakgrunn ${settings.dim} %`} onOpen={onOpen} />
        </div>
      </section>
      <section className="group">
        <div className="card">
          <NavRow section="keys" value="" onOpen={onOpen} />
        </div>
      </section>
    </>
  )
}

/** One row of the overview: grey icon box, title, current value, ›. */
function NavRow({ section, value, onOpen }: { section: Section; value: string; onOpen: (s: Section) => void }) {
  return (
    <button className="row choice nav-row" onClick={() => onOpen(section)}>
      <span className="nav-icon" aria-hidden><svg viewBox="0 0 24 24"><path d={ICONS[section]} /></svg></span>
      <span className="grow">{TITLES[section]}</span>
      {value && <span className="nav-value">{value}</span>}
      <span className="nav-chevron" aria-hidden>›</span>
    </button>
  )
}

function Account({ now, me, settings, update }: Pick<Props, 'now' | 'settings' | 'update'> & { me: Me | null | undefined }) {
  const [devices, setDevices] = useState<DeviceInfo[] | null>(null)

  useEffect(() => {
    let stopped = false
    const load = () => getDevices().then(d => { if (!stopped) setDevices(d) }).catch(() => {})
    load()
    // The list changes when devices wake up or go to sleep: refresh while this part is open.
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

function Screen({ settings, update }: Pick<Props, 'settings' | 'update'>) {
  const options: { value: SettingsData['orientation']; label: string }[] = [
    { value: 'auto', label: 'Automatisk' },
    { value: 'landscape', label: 'Liggende' },
    { value: 'portrait', label: 'Stående' },
  ]
  return (
    <section className="group">
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
        <div className="row"><span className="grow">Stående oppsett</span>
          <select aria-label="Stående oppsett" value={settings.portraitLayout} onChange={e => { update({ portraitLayout: e.target.value as SettingsData['portraitLayout'] }); e.currentTarget.blur() }}>
            {Object.entries(PORTRAIT_LAYOUTS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </div>
        <div className="divider" />
        <div className="row"><span className="grow">Liggende oppsett</span>
          <select aria-label="Liggende oppsett" value={settings.landscapeLayout} onChange={e => { update({ landscapeLayout: e.target.value as SettingsData['landscapeLayout'] }); e.currentTarget.blur() }}>
            {Object.entries(LANDSCAPE_LAYOUTS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </div>
        <div className="divider" />
        <Toggle label="Fullskjerm automatisk (ved første klikk eller tast)" on={settings.autoFullscreen} onChange={autoFullscreen => update({ autoFullscreen })} />
        <div className="divider" />
        <Toggle label="Hold skjermen våken" on={settings.keepAwake} onChange={keepAwake => update({ keepAwake })} />
        <div className="divider" />
        <Toggle label="Vis knappene bare når musa er over dem" on={settings.autoHide} onChange={autoHide => update({ autoHide })} />
        <div className="divider" />
        <div className={settings.autoHide ? 'row' : 'row disabled'}><span className="grow">Skjul knapper og musepeker etter</span>
          <select aria-label="Skjul knapper og musepeker etter" value={settings.hideAfter} disabled={!settings.autoHide}
            onChange={e => { update({ hideAfter: Number(e.target.value) }); e.currentTarget.blur() }}>
            {[3, 6, 10].map(s => <option key={s} value={s}>{s} sekunder</option>)}
          </select>
        </div>
      </div>
    </section>
  )
}

function Look({ settings, update }: Pick<Props, 'settings' | 'update'>) {
  return (
    <section className="group">
      <div className="card">
        <Slider label="Tekststørrelse" value={settings.lyricsScale} min={80} max={150} step={5}
          format={v => `${v} %`} onChange={lyricsScale => update({ lyricsScale })} />
        <div className="divider" />
        <Slider label="Mørkere bakgrunn" value={settings.dim} min={0} max={100} step={5}
          format={v => `${v} %`} onChange={dim => update({ dim })} />
        <div className="divider" />
        <Toggle label="Vis klokke øverst til venstre" on={settings.clock} onChange={clock => update({ clock })} />
        <div className="divider" />
        <Toggle label="Ingen blinking i Party (strobe og lysglimt av)" on={settings.noFlash} onChange={noFlash => update({ noFlash })} />
      </div>
    </section>
  )
}

/** Everything back to the defaults, except the lyrics sync per device (measured for each device). */
function Reset({ settings, update }: Pick<Props, 'settings' | 'update'>) {
  const [asking, setAsking] = useState(false)
  return (
    <section className="group">
      <div className="card">
        {asking
          ? <div className="row confirm">
              <span className="grow">Er du sikker? Alle valg settes tilbake.</span>
              <button className="text-button" onClick={() => setAsking(false)}>Avbryt</button>
              <button className="text-button danger" onClick={() => { update({ ...DEFAULTS, lyricsOffsets: settings.lyricsOffsets }); setAsking(false) }}>Ja</button>
            </div>
          : <button className="row choice danger" onClick={() => setAsking(true)}><span className="grow">Tilbakestill innstillinger</span></button>}
      </div>
    </section>
  )
}

function Slider({ label, value, min, max, step, format, onChange }: {
  label: string; value: number; min: number; max: number; step: number
  format: (value: number) => string; onChange: (value: number) => void
}) {
  return (
    <label className="row slider">
      <span className="grow">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} aria-label={label}
        onChange={e => onChange(Number(e.currentTarget.value))} />
      <span className="slider-value">{format(value)}</span>
    </label>
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

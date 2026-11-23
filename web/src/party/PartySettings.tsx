import { useEffect } from 'react'
import type { WebPartyEngine } from '../core/generated/rave-core.mjs'

// «Party-innstillinger»: seks glidebrytere for lysbølger, risting, strobe og hvite blink. Tallene og
// glidebryterens skala (midten = 1× = som før) står i rave-core (PartySettings.kt), som i appen.
// Panelet ligger til høyre uten mørk bakgrunn, så man ser forskjellen på scenen mens man drar.

const GROUPS: { title: string; rows: { key: string; label: string }[] }[] = [
  { title: 'Lysbølger', rows: [
    { key: 'bolger_styrke', label: 'Styrke' },
    { key: 'bolger_bredde', label: 'Bredde' },
    { key: 'bolger_ofte', label: 'Hvor ofte' },
  ] },
  { title: 'Risting og blink', rows: [
    { key: 'risting', label: 'Risting' },
    { key: 'strobe', label: 'Strobe' },
    { key: 'blink', label: 'Hvite blink' },
  ] },
]
/** Glidebryterens steg (0..STEPS); midten er STEPS / 2. */
const STEPS = 1000

/** Gir de lagrede verdiene til motoren (mangler = 1×). Virker fra neste bilde. */
export function usePartyFx(engine: WebPartyEngine, values: Record<string, number>) {
  useEffect(() => {
    for (const key of engine.partyFxKeys) engine.setPartyFx(key, values[key] ?? 1)
  }, [engine, values])
}

export function PartySettingsSheet({ engine, values, onChange, onClose }: {
  engine: WebPartyEngine
  values: Record<string, number>
  onChange: (values: Record<string, number>) => void
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const set = (key: string, value: number) => {
    const next = { ...values }
    if (value === 1) delete next[key]; else next[key] = value
    onChange(next)
  }

  return (
    <div className="scrim see-through" onClick={onClose}>
      <div className="sheet party-sheet" role="dialog" aria-label="Party-innstillinger" onClick={e => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>Party-innstillinger</h2>
          <button className="text-button" onClick={onClose}>Ferdig</button>
        </div>
        {GROUPS.map(group => (
          <section className="group" key={group.title}>
            <h3>{group.title}</h3>
            <div className="card">
              {group.rows.map((row, i) => {
                const value = values[row.key] ?? 1
                return (
                  <div key={row.key}>
                    {i > 0 && <div className="divider" />}
                    <label className="row slider fx-row">
                      <span className="fx-label">{row.label}</span>
                      <input type="range" min={0} max={STEPS} step={1} list="party-fx-middle" aria-label={`${group.title}: ${row.label}`}
                        value={Math.round(engine.partyFxToSlider(row.key, value) * STEPS)}
                        onChange={e => set(row.key, engine.partyFxFromSlider(row.key, Number(e.currentTarget.value) / STEPS))} />
                      <span className="slider-value">{engine.partyFxText(value)}</span>
                    </label>
                  </div>
                )
              })}
            </div>
          </section>
        ))}
        {/* Strek på midten: 1× = slik Party er uten innstillinger. */}
        <datalist id="party-fx-middle"><option value={STEPS / 2} /></datalist>
        <section className="group">
          <div className="card">
            <button className="row choice danger" disabled={Object.keys(values).length === 0} onClick={() => onChange({})}>
              <span className="grow">Tilbakestill</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

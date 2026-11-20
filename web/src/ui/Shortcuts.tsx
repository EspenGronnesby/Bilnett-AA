import { Fragment, useEffect } from 'react'

const KEYS: [string[], string][] = [
  [['F'], 'Fullskjerm av/på'],
  [['H'], 'Ren visning av/på'],
  [['Esc'], 'Avslutt ren visning eller lukk vindu'],
  [['←', '→'], 'Bytt tekststil'],
  [['?'], 'Vis hurtigtastene'],
  [['1', '2', '3', '4', '5'], 'AI-trener: Intro, Build-up, Drop, Breakdown, Outro'],
  [['Z', 'B'], 'AI-trener: angre, «bra»'],
]

/** The keyboard shortcuts as rows in a card (used in the «?» window and in the settings). */
export function ShortcutList() {
  return (
    <div className="card">
      {KEYS.map(([keys, what], i) => (
        <Fragment key={what}>
          {i > 0 && <div className="divider" />}
          <div className="row"><span className="grow">{what}</span><span className="keys">{keys.map(k => <kbd key={k}>{k}</kbd>)}</span></div>
        </Fragment>
      ))}
    </div>
  )
}

/** Small window opened with «?»; closes with Esc or a click outside (same look as the settings). */
export function ShortcutsSheet({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' || e.key === '?') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet shortcuts-sheet" role="dialog" aria-label="Hurtigtaster" onClick={e => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>Hurtigtaster</h2>
          <button className="text-button" onClick={onClose}>Lukk</button>
        </div>
        <ShortcutList />
      </div>
    </div>
  )
}

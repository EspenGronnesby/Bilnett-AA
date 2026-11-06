# CLAUDE.md — Bilnett

> Prosjektregler for Bilnett. Felles regler (kommunikasjon, severity, precedence,
> agenter og skills) arves fra `~/Vibe-kode/System/claude-felles` — ikke dupliser dem her.
> **Bruker > denne fila > skills > rules > security.md > lessons.md.**

## Hva Bilnett er

- Android Auto-app for Espens bil: nettleser + **Rave** (fullskjerm «nå spilles» med
  musikkvisualisering). **Party-modus** i Rave = Trap Nation-/Bass Boosted-stil
  lydspekter-ring rundt coveret, partikler, ripples, strobe og risting.
- **Fork av [AABrowser](https://github.com/kododake/AABrowser) av kododake, GPL-3.0.**
  Alt vi publiserer må forbli GPL-3.0, beholde LICENSE og kreditere originalen.
- Pakkenavn er fortsatt `com.kododake.aabrowser` (ikke endre — da må appen installeres på nytt).

## Status (2026-11-03)

Ferdig og på `main`:
- Fartssperren («Parker bilen …») er fjernet — Rave virker under kjøring.
- Party-modus: heavy/grit-deteksjon, overdrevne spikes på zaag-drops, lys på toppene,
  volum-samspill, strobe, ripples kun på sterk + distortert bass.
- Eget Rave-ikon (`mipmap-anydpi/ic_rave.xml`).
- Analytics til kododakes server er slått av.

Ikke testet i bil ennå: om bilens volumknapp påvirker telefonens medievolum.

**2026-11-06: Party-analyse og trening.** Espen merker sangdelene i Party → Analyse, og appen
logger fasit mot sin egen gjetning. Les `.claude/docs/party-analyse.md` før du rører
sangstruktur, drop-deteksjon eller sjangerregler. Planen for sjangre: `~/.claude/plans/jeg-har-lagt-mere-happy-sunset.md`.

## Tech stack

Kotlin · Jetpack Compose · Android View/WebView · Android Auto (`CAR_LAUNCHER`,
`distractionOptimized`) · `minSdk 35` · Gradle Kotlin DSL · OkHttp · Android `Visualizer` (FFT).

## Kommandoer (fra prosjektroten)

```bash
# Java finnes ikke globalt — bruk Homebrew JDK 21
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home

./gradlew assembleDebug                 # bygg (dette er «verify» for Bilnett)
adb devices                             # sjekk at Pixel 9 er koblet til
adb install -r app/build/renamedApks/debug/AABrowser-3.3_debug.apk
scrcpy --no-audio --stay-awake          # speil telefonskjermen til Mac-en
```

- Sjekk exit code fra Gradle (i zsh: `${pipestatus[1]}`, ikke `PIPESTATUS`).
- Lyd beholdes på telefonen ved speiling, ellers kan `Visualizer` miste signalet.

## Struktur — det vi har laget

```
app/src/main/java/com/kododake/aabrowser/rave/
├── RaveActivity.kt        # Skjermen: metadata, tekst, video, bakgrunnslys, shake, strobe, volum
├── HardstyleAudio.kt      # FFT → HardstyleFrame (bass, kick, energy, heavy, grit …)
├── HardstyleSpectrum.kt   # 48 logaritmiske bånd + historikk for ekko-lagene
├── HardstyleVisuals.kt    # HardstyleOrb (ringen), HardstyleBackdrop (partikler, ripples), volumkurver
├── SilentClipView.kt      # Musikkvideo
├── SpotifyVideoLookup.kt  # Finner video via iTunes-søk
├── NowPlayingListener.kt  # Varseltilgang for å lese hva som spilles
└── party/                 # Analyselogg, FFT-opptak, rettelser per sang (se .claude/docs/party-analyse.md)
tools/party-analyse/       # Mac: henter loggene fra telefonen + HTML-rapport (data i Bilnett-AA-assets, aldri i git)
```

### Party-modus — signaler og hvor tallene står

| Signal / effekt | Fil | Hva den betyr |
|---|---|---|
| `heavy` | `HardstyleAudio.kt` | Tung + distortert bass, eller drop etter breakdown (0..1) |
| `grit` | `HardstyleAudio.kt` | Kun distortion på sterk bass (mid 250–2500 Hz / bass) |
| `volumeGain`, `loudness`, `loudRamp`, `maxVolumeBoost` | `HardstyleVisuals.kt` | Telefonvolum → styrke (rolig lavt, ekstra fra 70 %, «tar av» 90–100 %) |
| Spikes, ekstra strek, lys på topper | `HardstyleOrb` | Utslag, tak (`displacementCap`) og glød |
| Partikler, ripples | `HardstyleBackdrop`, `RippleBank` | Ripples kun når `bass > .72 && grit > .35` |
| Shake, strobe, blink | `RaveActivity.kt` (`graphicsLayer`, bakgrunns-Canvas) | Strobe fra 85 % volum + heavy kick |

Terskler er kvalifiserte gjetninger, ikke målt — juster etter Espens tilbakemelding.

## Beslutninger Espen har tatt (ikke reverser uten å spørre)

- **Ingen fartssperre.** Rave, musikkvideo, strobe og shake skal virke under kjøring.
- **Analytics av** (`UmamiTracker.ENABLED = false`). Ikke slå på igjen.
- Rave har eget ikon; nettleseren beholder originalikonet.

## Git

- Branch før endringer (`fix/…`, `feat/…`, `docs/…`), merge `--ff-only` til `main`.
- **Remotes:** `espen` = github.com/EspenGronnesby/Bilnett-AA (push hit).
  `origin` = kododake/AABrowser — **kun fetch, aldri push.**
- Repoet er **offentlig** — aldri commit `local.properties`, keystore eller nøkler.

## Kjente fallgruver

- **Debug-signering:** appen er signert med `~/.android/debug.keystore` på denne Mac-en.
  Mistes den, kan ikke telefonen oppdatere appen uten avinstallering. Skal ha backup, aldri i git.
- **Android Auto:** sideloadede apper krever «Ukjente kilder» i Android Auto-utviklerinnstillinger.
  Kan slå seg av etter AA-oppdatering.
- **Volum:** appen leser telefonens `STREAM_MUSIC`, ikke bilens forsterker.
- **Ytelse:** Party-modus tegner mye (opptil 224 partikler, 8 ripples, gradienter) — følg med på varme.
- **Upstream-merge** fra `origin` kan gjeninnføre analytics-kallet og README-innhold — sjekk diffen.

## Arbeidsflyt for Claude

1. Les `.claude/docs/lessons.md` før vanskelige problemer.
2. Endre kode → bygg med kommandoen over (verify) → `adb install -r` når telefonen er koblet til.
3. `kritiker` før større endringer meldes ferdig.
4. Commit/merge/push kun når Espen ber om det.

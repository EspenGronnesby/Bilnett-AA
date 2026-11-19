# Lessons Learned — Bilnett

> Problemer vi har løst og hvordan unngå dem. Sjekk her før du løser noe vanskelig.
> Etter et løst problem: spør Espen om det skal inn her (bruk `lesson-skriver`).

---

### Rave web: knapper lå oppå hverandre, finn dem med elementFromPoint
**Dato:** 2026-11-19
**Kategori:** Web / UI
**Berørte filer:** `web/src/App.tsx` (`useZoneHeight`, `HeroColumn`), `web/src/styles.css` (stående oppsett, `.corner-zone`, `.stage.wide`, `.lyrics-foot`, `.party-controls`), `web/src/party/PartyLayers.tsx` (`PartyControls`)

**Problem:** Tekststil-knapper (Myk rulling, Ord for ord) og valget for stående oppsett i hjørnet kunne ikke trykkes i enkelte oppsett. Bygget og typesjekken var grønne, og skjermen så riktig ut.

**Årsak:** (1) Knappeområdet i stående oppsett var `position: absolute` med z-index 4 oppå tekstpanelet, så tekstpanelets egne knapper fikk aldri klikk. (2) `.cover-wrap .cover` har z-index 1, og `.corner-zone` hadde ingen z-index, så coveret lå over hjørneknappene. (3) I liggende med Party ble venstre kolonne høyere enn skjermen, og `overflow-x: auto` på `.lyrics-foot` gjemte knappene sidelengs.

**Løsning:**
- Knappeområdet får egen grid-rad (`grid-row: -2 / -1`) i stedet for absolute.
- Coveret krymper etter målt plass: ResizeObserver setter `--zone-h` og `--info-h`, og CSS bruker dem i `calc()`. Målingen følger gjeldende tittel via MutationObserver, fordi tittelen har `key={track.id}` og byttes ut for hver sang.
- `.corner-zone { z-index: 6 }`.
- I liggende brukes padding/negativ margin rundt kolonnen, så Party-ringen ikke klippes.
- `.lyrics-foot` får `flex-wrap: wrap`, og Party-kontrollene blir mindre.

**Forebygging:**
- Grønt bygg betyr ikke klikkbart. Når noe ikke lar seg trykke: kjør `document.elementFromPoint` på midten og hjørnene av hver knapp, i alle oppsett og skjermstørrelser (Playwright). Gjett ikke ut fra skjermbilder.
- Sett `autoHide: false` i innstillingene før testen, og vent til sangteksten er lastet, ellers blir målingene feil.
- Unngå `position: absolute` for knapperader som deler plass med annet innhold. Bruk grid-rader.
- Når et element har z-index, må overlegg som skal ligge over det også ha z-index.
- `overflow` på én akse klipper begge. Gi plass med padding eller negativ margin hvis noe skal stikke ut.
- Ved CSS-rydding: mål nøkkelelementer før og etter med samme skript og diff resultatet.

**🟢 Enkelt forklart:** Knappene lå under andre elementer på siden, så fingeren (musen) traff noe annet. Vi fant det ved å la et program sjekke hva som ligger øverst på hver knapp, i stedet for å se på bildet. Etter fiksen er alle 1273 knappene tilgjengelige i alle testede oppsett.

---

### Ikke legg inn bevegelse/effekter eieren ikke har bedt om
**Dato:** 2026-11-18
**Kategori:** Party / UI
**Berørte filer:** `rave/party/GenreRules.kt` (`look`, `swayX`/`swayRot`), `rave/RaveActivity.kt` (`sceneShake`), `rave/FestivalShow.kt` (`GENRE_SWAY_DP`/`GENRE_SWAY_DEG`)

**Problem:** I Party-modus vugget hele scenen med albumcoveret fra side til side og vippet litt ved reggae. Eieren hadde ikke bedt om det. Han sa: «en ting jeg ikke liker er at coveret går side til side, ta dette vekk» og «jeg spurte aldri om dette».

**Årsak:** En tidligere økt la inn bevegelsen som en del av «sjangerfølelse» (reggae svaier, reggaeton hopper). Den ble ikke foreslått først, bare implementert. Bevegelsen gikk via `swayX`/`swayRot` i `sceneShake`.

**Løsning:** Fjernet `swayX`/`swayRot` fra `sceneShake` i `RaveActivity` (commit `7ac7831`). Reggaeton-hoppet (`bounceY`) og drop-rist ble beholdt. `GenreRules` beregner fortsatt `swayX` (tester avhenger av det), men det brukes ikke.

**Forebygging:**
- Bevegelse av cover, tekst, knapper eller hele scenen merkes straks. Eieren har tidligere sagt nei til spinning/spiral. Slike effekter legges bare inn når han har bedt om dem, eller etter at du har spurt konkret («skal coveret vugge til reggae?»).
- Ved kreative tolkninger («sjangerfølelse» og lignende): foreslå, ikke implementer stille. Skriv i oppsummeringen hva som beveger seg.
- Sjekk «Beslutninger» i `.claude/CLAUDE.md` og memory før du legger til visuelle effekter.
- Hvis noe uønsket dukker opp: grep etter `translationX`/`rotationZ` i `sceneShake`, fjern bruken, og behold resten.

**🟢 Enkelt forklart:** Appen fikk en egen bevegelse som eieren ikke ville ha. Den ble fjernet, og resten av effektene er like. Lærdommen er å spørre før man legger til noe som beveger seg på skjermen.

---

### Rave krasjet ved ny sjanger: `getValue` på map nøklet på enum
**Dato:** 2026-11-06
**Kategori:** Android / Kotlin
**Berørte filer:** `rave/SpotifyVideoLookup.kt` (`genreVideos`, `VIBE_TERMS`), `rave/GenreDetector.kt` (`enum Genre`)

**Problem:** Rave krasjet og kastet Espen ut om og om igjen rett etter at en sang startet. Logcat: `java.util.NoSuchElementException: Key REGGAE is missing in the map`, i `SpotifyVideoLookup.genreVideos`, på bakgrunnstråd fra `fetchSpotifyVideo`.

**Årsak:** Nye verdier `REGGAE` og `REGGAETON` ble lagt til i `enum Genre`. Kompilatoren tvang fram nye grener i `when`, men `VIBE_TERMS = mapOf(Genre.RAP to …)` ble slått opp med `.getValue(wanted)`, som kaster når nøkkelen mangler. Kompilatoren sjekker ikke map-oppslag. En reggae-sang (gjenkjent via Apple-sjanger) traff den manglende nøkkelen.

**Løsning:** La til `REGGAE` og `REGGAETON` i `VIBE_TERMS`, og byttet `getValue(x)` med `VIBE_TERMS[x]?.let { … }.orEmpty()`. En ukjent sjanger gir da bare ingen videoer, og appen krasjer ikke. Feilen ble funnet med `adb logcat -d -b crash`.

**Forebygging:**
- Når en enum får nye verdier: søk etter alle steder som slår opp enumen i map eller lister (`grep -rn "getValue(\|mapOf(Genre" app/src`), ikke bare der kompilatoren klager.
- Bruk aldri `getValue` på et map nøklet på en enum som kan vokse. Bruk `map[x] ?: reserve`.
- Ved «appen kaster meg ut»: sjekk `adb logcat -d -b crash` først.

---

### Sjanger fra lyd alene er upålitelig: metadata først
**Dato:** 2026-11-06
**Kategori:** Android / Kotlin
**Berørte filer:** `rave/GenreDetector.kt`, `rave/RaveActivity.kt` (updateMeta), `rave/DeezerLookup.kt`, `rave/SpotifyVideoLookup.kt` (appleGenre), `rave/GenreBook.kt`

**Problem:** Rap ble vist som «UPTEMPO», og pop («Hey, Soul Sister», Train) ble klassifisert som HARDSTYLE.

**Årsak:** (a) Regelen «rått drop» (tung og forvrengt bass i 0,8 s) låste hele sangen som hardstyle før Apple-svaret kom 1–3 s senere. Låsen ble aldri nullstilt. (b) Takt måles ofte dobbelt (rap 95 → 190 BPM, pop 97 → 180). (c) Strummet gitar og ukulele leses som «grit». (d) Pop fantes ikke som sjanger, så lyden bestemte.

**Løsning:** Apple (eksakt sangtreff, ikke artist-fallback) og Deezer albumsjanger (`/album/{id}`, `genres`) avgjør. Sikker rap-, pop- eller rolig-sjanger låses for hele sangen. Rått drop venter på metadata i maks 4 s. Lås ikke hvis en kilde sier Dance (Apple merker rå hardstyle som Hip-Hop/Rap).

**Forebygging:** Lyd er et hjelpesignal, ikke fasit. Metadata først. Deezer-sjanger er ikke alltid riktig («Rock, Hard Rock» på en hardstyle-anthem), så Apple vektes høyest.

---

### Sjanger og lås arvet mellom sanger
**Dato:** 2026-11-06
**Kategori:** Android / Kotlin
**Berørte filer:** `rave/GenreDetector.kt`, `rave/RaveActivity.kt` (newTrack)

**Problem:** Ny sang startet som hardstyle fordi forrige sang var i hardstyle.

**Årsak:** `GenreDetector.genre` ble ikke nullstilt i `newTrack`. Hysteresen «bli i hardstyle» og låsen (`target == HARDSTYLE && genre == HARDSTYLE`) gjaldt uansett når sangen startet.

**Løsning:** Hver sang starter som STANDARD. Lås og hysterese krever `changedAt >= trackStart`.

**Forebygging:** Tilstand som styrer klassifisering må nullstilles i samme funksjon som bytter sang. Gå gjennom alle felt som lever på objektet mellom sanger.

---

### Refreng-deteksjon: snittet må ikke starte på 0
**Dato:** 2026-11-06
**Kategori:** Android / Lyd
**Berørte filer:** `rave/GenreDetector.kt` (refreng-deteksjon)

**Problem:** De første ~20 s av en popsang ble klassifisert som «refreng».

**Årsak:** Energi-snittet startet på 0, så alt over snittet ble refreng. Pop er jevnt mikset, og terskel .04/.12 slo nesten aldri ut.

**Løsning:** Snittet følger med de første ~10 s med musikk. Terskler .015/.07 med 40 s snitt.

**Forebygging:** Glidende snitt trenger oppvarming, ellers avgjør startverdien resultatet. Juster terskler med faktisk musikk, ikke gjetning.

---

### Fake drop-løkke: nytt «drop» hvert sekund etter fake drop
**Dato:** 2026-11-06
**Kategori:** Android / Lyd
**Berørte filer:** `rave/GenreDetector.kt` (eller tilsvarende drop-logikk i `RaveActivity.kt`)

**Problem:** Etter FAKE DROP kom nytt drop med en gang, og fake kom igjen hvert sekund under build-up.

**Årsak:** `primed = true` ble satt, og `backFromDip` (subFast − subMin ≥ 6 dB) var fortsatt sann. Neste frame trigget drop.

**Løsning:** 2 takters pause etter fake. `subMin = sub1` ved fake. Banneret vises maks én gang per 8 s.

**Forebygging:** Når en hendelse utløser en tilstand, nullstill grunnlaget den ble målt mot. Ellers trigges den på nytt umiddelbart.

---

### Feilsøk sangklassifisering: logg én linje per sang
**Dato:** 2026-11-06
**Kategori:** Android / Logging
**Berørte filer:** `rave/GenreDetector.kt`, `rave/RaveActivity.kt` (updateMeta)

**Problem:** Det var vanskelig å se hvorfor en sang fikk feil sjanger ut fra støyende logg.

**Årsak:** Ingen samlet logglinje per beslutning.

**Løsning:** Logg én linje per sang med tittel, Apple- og Deezer-sjanger, eksakt/artist-treff og lås (tag `RaveGenre`). Kjør `adb logcat` i en løkke med `adb wait-for-device`, fordi USB-forbindelsen faller ut. Pakkenavnet på telefonen er `no.espen.bilnett.aa`. `pidof com.kododake.aabrowser` finner ingenting.

**Forebygging:** Ett loggformat per beslutning gjør feilsøking i bil mulig. Sjekk pakkenavnet på enheten før du leter etter prosessen.

---

### Krasj på hver build-up: `%` i format-streng («BUILD-UP 66%»)
**Dato:** 2026-11-04
**Kategori:** Android / Kotlin
**Berørte filer:** `app/src/main/java/com/kododake/aabrowser/rave/GenreDetector.kt` (takt-loggen)

**Problem:** Appen startet på nytt hver gang en build-up startet, og sangteksten sto på «Henter tekst …». Det så ut som en tekstfeil.

**Årsak:** Logglinjen bygde en streng med Kotlin-template (`"... | $partName | ...".format(...)`). Når `partName` var «BUILD-UP 66%», tolket `String.format` `%` som formatkode → `UnknownFormatConversionException` → krasj.

**Løsning:** Aldri sett variabel tekst inn i selve format-strengen. Send den som argument: `"... | %s | ...".format(partName, ...)`.

**Lærdom:** Når tekst «ikke laster» og det ligner nettverk/parsing, sjekk først `adb logcat | grep AndroidRuntime`. Krasj vises der, ikke i UI.

---

### WebView-video svart: iframe hadde høyde 0 px
**Dato:** 2026-11-04
**Kategori:** Android / WebView
**Berørte filer:** `app/src/main/java/com/kododake/aabrowser/rave/YouTubeClipView.kt`

**Problem:** YouTube-spilleren rapporterte PLAYING og tiden gikk, men skjermen var svart. Iframen var 923×0.

**Årsak:** WebView lages i Compose/`AndroidView` før den får endelig størrelse. CSS `height:100%` og `100vh` ble derfor 0 px (body clientHeight 0, innerHeight 411).

**Løsning:** Sett størrelsen i piksler fra JS (`innerWidth`/`innerHeight`) ved `onReady`, ved `resize`, og med jevne mellomrom.

**Lærdom:** Mål før du gjetter. Logg hvert 3. s (`getCurrentTime`, `getBoundingClientRect` på iframe, body/html `clientHeight`) og fang det via `WebChromeClient.onConsoleMessage` til logcat. Ikke endre bakgrunnsfarge eller z-order før størrelsen er målt.

---

### YouTube-embed droppet i Rave
**Dato:** 2026-11-04
**Kategori:** Android / Video
**Berørte filer:** `app/src/main/java/com/kododake/aabrowser/rave/SpotifyVideoLookup.kt` (`YOUTUBE_ON = false`)

**Problem:** YouTube-grensesnittet (spinner, tittel, «Flere videoer», topic-kanaler med bare albumbilde) dukket opp i Rave, selv med `controls=0`, zoom/beskjæring og «vis først etter 2,5 s ren avspilling».

**Årsak:** YouTube-iframen kan ikke skjules pålitelig. Overlegg og beskjæring hjelper, men ikke nok.

**Løsning:** Espen valgte å droppe YouTube. Koden er beholdt bak bryteren `YOUTUBE_ON = false`. API-nøkkel ligger kun i `local.properties`, aldri i git.

**Lærdom:** Stol ikke på at en tredjeparts-embed kan skjules i sin helhet. Bruk en kilde du kontrollerer. Se lesson om Apple-kilder under.

---

### Musikkvideo og animert cover fra Apple i stedet for YouTube
**Dato:** 2026-11-04
**Kategori:** Android / Video
**Berørte filer:** `app/src/main/java/com/kododake/aabrowser/rave/SpotifyVideoLookup.kt`, `rave/SilentClipView.kt`

**Problem:** Rave trengte videokilder uten YouTube-grensesnitt. Vanlig iTunes-søk bommer ofte, f.eks. «Dark Knight Dummo».

**Årsak:** Funnet ved å lese iBailas URL-cache read-only (`~/Library/Caches/com.posegraphic.halo/Cache.db`, kopiert til tmp og spurt med `sqlite3`). iBaila bruker Apple-kilder som gir treff.

**Løsning:**
- Sangens egen musikkvideo: `itunes.apple.com/lookup?id=<artistId>&entity=musicVideo&limit=100&country=us`, deretter tittel-match. artistId/collectionId fra `search?entity=song`.
- Animert albumcover: HTML fra `music.apple.com/us/album/<collectionId>`, nøkkel `"motionDetailSquare"`/`"motionDetailTall"`, HLS-URL (`mvod.itunes.apple.com/...m3u8`) ca. 400 tegn etter nøkkelen.
- Animert artistbilde: `music.apple.com/us/artist/<artistId>`, nøkler `"motionArtistWide16x9"` / `"motionArtistFullscreen16x9"` / `"motionArtistSquare1x1"`.
- Rekkefølge: Sang → Cover → Artistbilde → Album → Artist → Vibe.
- `MediaPlayer` spiller HLS uten ekstra bibliotek. `TextureView` strekker video, så bruk center-crop via `setTransform(Matrix)` i `onSurfaceTextureSizeChanged`.
- Søk med hovedartist + tittel uten «(feat. …)», f.eks. «BlocBoy JB, Drake» + «Look Alive», ikke «Look Alive (feat. Drake)».

**Lærdom:** Les hva en fungerende app faktisk kaller (URL-cache) før du bygger søk fra bunnen. Apple-kilder er bedre enn generelt søk for musikkvideo.

---

### Android Auto sa «du kjører» selv når bilen sto parkert (Kenwood DMX)
**Dato:** 2026-11-03
**Kategori:** Android Auto / Bil-installasjon
**Berørte filer:** — (maskinvare)

**Problem:** Kenwood DMX-radio (Android Auto: make=DMX, model=After Market, 2020) i Citroën Berlingo 2018. Android Auto låste tastatur, apper og video («kan ikke brukes mens du kjører») selv når bilen sto parkert.
Diagnose: koble telefonen til radioen med USB, og til Mac via trådløs ADB (`adb tcpip 5555` over USB, deretter `adb connect <ip>:5555`). Kjør `adb shell dumpsys activity service com.google.android.projection.gearhead` og se på `CarSensorService`. Sensor type 6 = parkeringsbrems (0 = ikke på). Type 11 = kjørestatus (11 = NO_VIDEO|NO_KEYBOARD|NO_CONFIG = «kjører»). Verdiene endret seg ikke da håndbrekket ble trukket, så radioen fikk aldri bremsesignalet.

**Årsak:** Den lysegrønne «PRK SW»/«Parking sensor»-ledningen på Kenwood var ikke koblet til noe. Kenwood leser «ledning jordet = parkert». Ingen meny-innstilling i Kenwood slår dette av, og telefonen kan ikke overstyre det uten root.

**Løsning:** Isolasjonen ble fjernet fra den lysegrønne parkeringsledningen, og ledningen ble jordet til en av skruene på radioens metallkasse. Da sluttet Android Auto å blokkere, og appene virket.

**Lærdom:** Permanent jording betyr at radioen aldri blokkerer, også ikke under kjøring. Ikke se video eller betjen apper mens du kjører (trolig ulovlig). Alternativer: av/på-bryter mellom ledning og jord, eller CAN-boks (f.eks. InCarTec 29-UC-050-PGA for Berlingo II B9). Slå av trådløs ADB etterpå (`adb usb` eller omstart).

---

### Party-modus hørte ikke musikken over Android Auto USB
**Dato:** 2026-11-03
**Kategori:** Android / lyd
**Berørte filer:** `app/src/main/java/com/kododake/aabrowser/rave/MicFftSource.kt` (ny), `rave/RaveActivity.kt` (handleFft, startMic/stopMic, stille-vakt i frame-løkka)

**Problem:** Party-modus reagerte ikke på musikken når telefonen var koblet til bilradioen med USB (Android Auto). Telefonen alene, med headset og Bluetooth, fungerte.

**Årsak:** Ikke offisielt dokumentert, men beste forklaring: Android `Visualizer(0)` lytter på telefonens vanlige utgangsmiks. Med Android Auto over USB sendes musikken som data gjennom Android Autos egen lydkanal til radioen, forbi den miksen. Visualizer hører da bare stillhet.

**Løsning:** Reserve-lydkilden `MicFftSource` tar opp mikrofonen (`AudioSource.UNPROCESSED`, fallback `MIC`), bruker Hann-vindu og egen radix-2 FFT, og gir samme byteformat som `Visualizer.getFft()`. Langsom auto-gain (~30 s) bevarer drop vs. build-up. `RaveActivity` bytter til mikrofon når Visualizer har vært stille i 2,5 s mens musikk spiller, og tilbake når Visualizer hører lyd igjen. Foretrekker ekstern mikrofon (bilens, via USB/BT) med `setPreferredDevice`, ellers telefonens. Analysepanelet viser «Lyd: …».

**Lærdom:** `Visualizer` kan ikke lese lyd som rutes via Android Auto. Bruk mikrofon som reserve og vis lydkilden i UI. Bekreftet i bil av Espen.

---

### «Parker bilen for å bruke Rave» var vår egen kode, ikke Android Auto
**Dato:** 2026-11-02
**Kategori:** Android Auto
**Berørte filer:** `app/src/main/java/com/kododake/aabrowser/rave/RaveActivity.kt`

**Problem:** Rave viste en parkeringsmelding under kjøring. Det så ut som en Android Auto-sperre.

**Årsak:** `RaveActivity` leste GPS-hastighet (`LocationManager`) og satte `driving = true` over ~9 km/t,
som skjulte visualizer, pauset video og viste meldingen.

**Løsning:** Fjernet hastighetsmålingen og alle `driving`-sjekker. Android Auto selv sperrer ikke,
fordi aktivitetene har `distractionOptimized=true` i manifestet.

**Lærdom:** Grep etter tekststrengen og `speed`/`LocationListener` i egen kode før du antar at
plattformen sperrer. Android Autos egne meldinger ser annerledes ut (AA-design, ikke appens).

---

### Gradle: «Unable to locate a Java Runtime»
**Dato:** 2026-11-02
**Kategori:** Bygg
**Berørte filer:** —

**Problem:** `./gradlew assembleDebug` feilet med «Unable to locate a Java Runtime».

**Årsak:** Ingen JDK globalt og ingen Android Studio installert. Homebrew har JDK-er under `/opt/homebrew/opt/`.

**Løsning:**
```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
./gradlew assembleDebug
```

**Lærdom:** I zsh er exit code i en pipe `${pipestatus[1]}` (små bokstaver), ikke `${PIPESTATUS[0]}`.

---

### Push til nytt GitHub-repo feilet: «remote unpack failed: index-pack failed»
**Dato:** 2026-11-02
**Kategori:** Git
**Berørte filer:** —

**Problem:** `gh repo create … --push` laget repoet, men pushen ble avvist.

**Årsak:** Prosjektet var en *shallow clone* (bare del av historikken). GitHub godtar ikke push
av et nytt repo med manglende forelder-commits.

**Løsning:**
```bash
git rev-parse --is-shallow-repository   # true = problemet
git fetch --unshallow origin
git push -u espen main
```

**Lærdom:** Sjekk `--is-shallow-repository` før første push av en fork til et nytt repo.

---

### Stil-læreren låste feil sjanger: euphoric hardstyle ble «house»
**Dato:** 2026-11-12
**Kategori:** Party / sjanger
**Berørte filer:** `rave/FestivalShow.kt` (`TEACHER_LOCK_MIN`), `rave/party/StyleBook.kt`, `rave/GenreDetector.kt` (`setTeacher`)

**Problem:** DEEZL – «Rebirth» (euphoric hardstyle) fikk EDM-effekter. Læreren på Mac-en hadde hørt
30 s-smakebiten som house, og appen låste sjangeren på det.

**Årsak:** Smakebiten fra iTunes/Deezer er ofte et rolig, melodisk utdrag (intro/breakdown), ikke dropet.
Essentia gir da lave, spredte score. `StyleBook.styleToGenre` godtar en familie fra sum ≥ 0,25, og
`setTeacher` låste sjangeren på alt som passerte. En usikker gjetning slo dermed ut både Apple-sjangeren
og lyd-detektoren.

**Løsning:** To terskler. ≥ 0,25 = læreren får *uttale seg* (logges, hint). Først ≥ 0,4
(`TEACHER_LOCK_MIN`) får den *låse* sjangeren. Under det bestemmer Apple/lyd som før.
Espens eget valg (handLock) slår alltid læreren.

**Lærdom:** En modell som bare har hørt 30 s av sangen skal ikke ha siste ord når den er usikker.
Skill mellom «hint» og «lås», og krev høyere sikkerhet for å låse. Sjekk familie-summen i
`rapport.html` (lærer-tabellen) før du stoler på en lærer-sjanger.


---

### Animert figur fra en gammel tegnefilm: klipp ut den ekte bevegelsen i stedet for å la AI lage den
**Dato:** 2026-11-18
**Kategori:** Assets / AI-verktøy
**Berørte filer:** `rave/RaveDancer.kt`, `app/src/main/assets/koko/` (rammer), `Bilnett-AA-assets/koko/make_frames.py` (utenfor repoet)

**Problem:** Koko-spøkelset fra Betty Boop-tegnefilmen (1933) skulle danse i Party. AI-genererte bilder
(8 poser) så barnslige og goofy ut. Higgsfield Genjutsu (motion control) ville koste 4–15 credits, og
kontoen hadde 3,2 credits uten daglig påfyll.

**Årsak:** Å la AI tegne bevegelsen fra scratch gir en generisk, «kopiert» stil. Motion control trenger en
referansevideo, og dyre verktøy betales per sekund. Små klipp blir dyrere per sekund (minstepris).

**Løsning:**
1. Finn et klipp der figuren står alene. Lag kontaktark: `ffmpeg -i klipp.mp4 -vf "fps=0.5,scale=240:-1,tile=5x4" -frames:v 1 ark.png`.
2. Klipp ut biten: `ffmpeg -ss 21.5 -i ref.mp4 -an -c:v libx264 -crf 16 ut.mp4` (15 s).
3. Sjekk pris først: `higgsfield generate cost video_background_remover --video ut.mp4` (1 credit for 15 s).
   Kjør deretter `higgsfield generate create video_background_remover --video ut.mp4 --wait --json` og last ned `result_url`.
   Resultatet er en mp4 med **svart** bakgrunn, ikke alfakanal.
4. Gjør svart gjennomsiktig uten å spise de svarte omrissene: lysstyrke > 45 = kropp → `binary_fill_holes` →
   behold biter ≥ 25 % av største (fjerner rester) → `binary_dilation` 3 px (tar med det mørke omrisset) →
   gaussian 0.8 på kanten. Vanlig «chroma key på svart» spiser omrisset.
5. Felles høyde, fast bredde sentrert på føttene (median x av nederste 18 % av figuren), 256 px høyde, webp q82.
   Annenhver ramme (12,5 fps) holder fordi tegnefilmen er tegnet «på toere». Resultat: 194 rammer, 1,5 MB.
6. I appen: rammene ligger i `assets/` (ikke `res/drawable`, da får man 194 R-id-er). Dekodet blir det ~60 MB,
   så `RaveDancer.kt` dekoder bare ~16 rammer fremover i en bakgrunns-coroutine og viser forrige ramme hvis neste
   ikke er klar. Av/på-knapp «Koko» i Party (standard av).

**Resultat:** Figuren danser flytende, og den er laget for 1 credit.

**Prevention:**
- Sjekk alltid saldo (`higgsfield account status`) og pris (`generate cost`) før en kjøring.
- Vurder først et billigere verktøy som bare trenger én mp4 (background remover) før et dyrt motion control-verktøy.
- Ny git worktree mangler `local.properties` → «SDK location not found». Kopier den fra hovedmappa (gitignored).
- Higgsfield `sam_3_video` ga HTTP 500 på cost-sjekk. Ikke testet.
- Rettigheter: rammer fra en film fra 1933 i et offentlig repo er en gråsone. Vurder dette før publisering.

**🟢 Enkelt forklart:** I stedet for å be en AI tegne dansen på nytt, klipte vi ut den ekte dansen fra
filmen og fjernet bakgrunnen. Det ble billigere, og det ser mer ekte ut. Figuren er lagt inn som en
rekke bilder som spilles av etter hverandre, og bare en liten del lastes om gangen så appen ikke blir for stor i minnet.

### Rave web: ti nye innstillinger — fallgruver ved testing og CSS-variabler
**Dato:** 2026-11-19
**Kategori:** React / CSS / Testing
**Berørte filer:** `web/src/settings.ts`, `web/src/App.tsx` (HeroColumn, layoutKey, useShortcut), `web/src/party/visuals.ts`, `web/src/party/PartyLayers.tsx`, `web/src/styles.css`, `web/src/ui/useZone.ts`

**Problem:** Ti nye innstillinger i Rave-nettsiden (commits 03ed4f9..349d8b8) ga flere stille feil: blink-test viste ingen forskjell, tekststørrelse ble NaN, øktvalg ble lagret, og coveret bevegde seg selv om det bare skulle skjules.

**Årsak:**
1. Demoen (`/?demo&party`) spiller på 70 % volum, men strobe/flash starter først fra ~85 %. Testen målte derfor null forskjell.
2. `LyricsView` leser `--u` med `parseFloat`. `calc(...)` gir teksten «calc(…)» → NaN → stille fallback.
3. `process.env` finnes ikke i nettleseren. Init-scriptet i Playwright døde stille, og testen kjørte med standardinnstillinger.
4. «Ren visning» gikk via samme `update()` som andre innstillinger og ble lagret i localStorage.
5. `HeroColumn` forskyver coveret når knapper skjules, også i ren visning.
6. Stående stablet struktur passer ikke liggende Party-scene (knappesonen ~500 px ved u=2.2).
7. `.danger` ble overstyrt av `.text-button` (samme spesifisitet, senere regel vinner).

**Løsning:**
1. Tving motorverdier i testen: `Object.defineProperty(engine, 'strobe', { get, set() {}, configurable: true })` på `window.__raveParty`. Settet må være med, fordi motoren skriver til feltene i `tick`. En ren getter stopper tegnesløyfen.
2. Regn ut px i JS (`--u-lyrics: ${u*scale}px` på `.screen`) og bruk `.lyrics-body { --u: var(--u-lyrics) }`.
3. Send verdier inn som `arg` til `page.addInitScript(fn, arg)`. Les `process.env` i Node-delen.
4. Fjern `clean` før `setItem` (`const { clean: _c, ...saved } = next`), sett `clean = false` i `read()`, og behold egen verdi ved `storage`-event.
5. Frys forskyvningen med `useRef` så lenge ren visning er på.
6. Liggende Party-scene: tre kolonner (tittel | cover + tekstbånd | knapper). Chips får `white-space: nowrap`.
7. Bruk `.text-button.danger`.

**Forebygging:**
- Test visuelle effekter med tvungne motorverdier, ikke demo-lyd.
- CSS-variabler som JS leser skal være ferdige px-verdier, ikke `calc()`.
- Init-script-argumenter sendes fra Node, ikke leses i nettleseren.
- Øktvalg (som ren visning) lagres aldri.
- For alt som «bare skjuler»: mål posisjon før/etter. Coveret skal ikke bevege seg.
- Kjør overlapp-testen (`elementFromPoint`) for alle nye oppsett.

**🟢 Enkelt forklart:** Flere innstillinger så ut til å fungere, men testene var feil oppsatt, og noen effekter kom ikke fram før lyden var høy nok. Det viktigste er å tvinge verdiene i testen, lagre bare det brukeren må ha, og måle at ting faktisk står stille.

### Rave web: innstillingsarket ble for fullt — kort oversikt med undersider, som Timetracker
**Dato:** 2026-11-19
**Kategori:** React / UI
**Berørte filer:** `web/src/ui/Settings.tsx`, `web/src/styles.css`, `web/src/ui/useShortcut.ts`

**Problem:** Etter ti nye innstillinger ble innstillingsarket på Rave-nettsiden én lang side: Konto og enhet, Skjerm (10 rader), Tekst og bakgrunn, Party, Hurtigtaster og Tilbakestill. Det føltes for mye.

**Årsak:** Hver ny innstilling fikk en ny rad eller seksjon i samme ark. Det fantes ingen gruppering og ingen nivåer.

**Løsning:** Mønster hentet fra Timetracker (`EstimationSettingsDialog.tsx`, «Rolig oversikt» i `design.md`):
- Toppnivå er en kort, gruppert liste: grå ikonboks, tittel, nåverdi til høyre og ›. Rave: Konto og enhet, Skjerm, Utseende, Hurtigtaster, og Tilbakestill (rød, uten ›).
- Trykk bytter innholdet i samme ark (`section`-state), med «‹ Innstillinger» og ny tittel. Ark legges aldri oppå ark. Ingen «Lagre», fordi Rave lagrer med en gang.
- Fjernet overflødige valg: bryter for ren visning og «Fullskjerm – Slå på» (finnes allerede som knapp og tast). Små seksjoner er slått sammen (Party med én bryter ble «Utseende»).
- Ingen ikonbibliotek: inline Material-ikoner (Apache-2.0) som SVG-paths.

Fallgruver som måtte fikses:
1. Data oversikten viser (kontonavn fra `getMe()`) ble hentet inne i undersiden og fantes ikke på oversikten. Hentingen ble løftet til arket og sendt ned som prop.
2. Esc-lytteren på `window` må ha `section` i avhengighetene. Den skal ignorere Esc når fokus er i en `<select>`, ellers lukkes arket ved et uhell.
3. Når raden med fokus fjernes ved bytte av del, havner fokus på `body`. Arket fikk `tabIndex={-1}` og `focus({ preventScroll: true })` etter bytte, og `.sheet:focus { outline: none }`.
4. Globale `select`-stiler må bruke `--u`, ellers blir nedtrekkslistene bittesmå på store skjermer.

Verifisert med Playwright: alle 12 innstillinger endret fra sine undersider og lagret, navigering og Esc fungerer, og 87 knapper i arket ble sjekket i tre skjermstørrelser (ingen dekket, ingen sideveis rulling).

**Forebygging:**
- Når en innstillingsside passerer 6–8 rader eller får mer enn 3 seksjoner: bytt til oversikt med undersider.
- Spør «finnes valget allerede som knapp eller tast der det brukes?» før en ny innstilling legges til.

**🟢 Enkelt forklart:** Innstillingene var blitt som en lang kassalapp. Nå er det en kort meny. Trykker du på en linje, åpnes bare den delen du trenger, og du kommer tilbake med «‹ Innstillinger». Det er færre valg på første side, og ingenting blir borte.

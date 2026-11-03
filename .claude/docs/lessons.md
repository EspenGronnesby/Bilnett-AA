# Lessons Learned — Bilnett

> Problemer vi har løst og hvordan unngå dem. Sjekk her før du løser noe vanskelig.
> Etter et løst problem: spør Espen om det skal inn her (bruk `lesson-skriver`).

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

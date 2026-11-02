# Lessons Learned — Bilnett

> Problemer vi har løst og hvordan unngå dem. Sjekk her før du løser noe vanskelig.
> Etter et løst problem: spør Espen om det skal inn her (bruk `lesson-skriver`).

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

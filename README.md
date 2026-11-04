# Bilnett

Android Auto-nettleser med Rave: musikkvisualisering i bilen.

> **Dette er en modifisert versjon av [AABrowser](https://github.com/kododake/AABrowser) av kododake, lisensiert under GPL-3.0. Endret av Espen Grønnesby fra november 2026.**

[![Android](https://img.shields.io/badge/Android-15%2B-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://www.android.com/)
[![Lisens](https://img.shields.io/badge/Lisens-GPLv3-blue.svg?style=for-the-badge)](https://www.gnu.org/licenses/gpl-3.0)

Bilnett krever Android 15 eller nyere.

---

## Rave og Party-modus

Rave er hovedfunksjonen i Bilnett. Det er en fullskjerm «nå spilles»-visning som følger musikken på telefonen.

Rave viser:

- cover og tittel på sangen som spilles
- sangtekst
- musikkvideo

**Party-modus** gjør Rave om til en lydvisualisering i Trap Nation- og Bass Boosted-stil:

- En lydspekter-ring rundt coveret som beveger seg med musikken.
- Overdrevne spikes og lys på tunge zaag- og rawstyle-drops.
- Den følger telefonens volum. Fra 70 % kommer det ekstra streker, flere partikler og risting. Ved 90-100 % tar ringen helt av.
- Strobe ved maks volum og tunge kick.
- Ripple-bølger kun på sterk og forvrengt bass.

Rave har eget ikon, slik at du finner den raskt.

Rave trenger to tilganger:

- **Mikrofon:** brukes til lydanalysen (Android Visualizer).
- **Varsler:** gir tilgang til å lese hva som spilles. Slå på «Bilnett Rave».

---

## Nettleseren

Nettleseren kommer fra AABrowser og er laget for bilskjermer.

<div align="center">
  <img width="80%" src="docs/img/aabrowser3.gif" alt="Nettleseren i Bilnett" />
</div>

- **Material 3-utseende:** tilpasset bilskjermer, med myke animasjoner og ekte svart AMOLED-tema.
- **Video i fullskjerm:** støtter DRM-beskyttet video (Widevine L3). Ett trykk for fullskjerm.
- **Startside:** opptil 6 snarveier du kan sortere ved å dra, med lagrede ikoner og eget bakgrunnsbilde.
- **Faner:** åpne, bytt, lukk og gjenopprett flere faner.
- **Bilvennlig:** bytt mellom mobil- og skrivebordsvisning, skaler hele grensesnittet og administrer bokmerker.

<div align="center">
  <img width="44%" src="docs/screenshots/litemode-v3_0.png" alt="Nettleseren i lyst tema" />
  <img width="44%" src="docs/screenshots/darkmode-v3_0.png" alt="Nettleseren i mørkt tema" />
</div>

---

## Endringer fra AABrowser

Endringer i Bilnett:

- Fartssperren i Rave er fjernet.
- Analytics til opprinnelig forfatters server er slått av. Bilnett sporer ingenting.
- Party-modus er ny.
- Rave har eget ikon.

Alt annet, som nettleseren, startsiden, fanene og Material 3-designet, kommer fra AABrowser og dets bidragsytere. Se [Takk til](#takk-til).

---

## Installer

Det finnes ingen ferdige utgivelser (releases) ennå. Du må bygge appen selv.

Kort versjon, hvis du har gjort dette før (krever JDK 21, Android SDK og `adb`):

```bash
./gradlew assembleDebug
adb install -r app/build/renamedApks/debug/AABrowser-3.3_debug.apk
```

### Steg for steg: sett opp Bilnett i din egen bil

Følg stegene i rekkefølge. Det tar ca. 30–60 minutter første gang, mest fordi verktøyene må lastes ned.

#### Vil du heller la en AI gjøre jobben?

Har du en AI-agent som kan kjøre kommandoer på datamaskinen din (for eksempel Claude Code, Codex eller Cursor), kan du kopiere teksten under og lime den inn. Agenten laster ned det som trengs, bygger og installerer appen. Den sier fra når du må gjøre noe selv på telefonen eller i bilen.

<details>
<summary><b>📋 Klikk for å vise prompten (kopier alt i boksen)</b></summary>

```text
Hjelp meg å installere Bilnett (https://github.com/EspenGronnesby/Bilnett-AA) på Android-telefonen min,
slik at den kan brukes i bilen via Android Auto. Følg README-en i repoet, seksjonen
"Steg for steg: sett opp Bilnett i din egen bil", ett steg om gangen.

Slik vil jeg at du jobber:
- Forklar kort og enkelt hva du gjør og hvorfor, på norsk. Jeg er ikke utvikler.
- Finn ut selv hvilket operativsystem jeg har (Mac, Windows eller Linux), og bruk riktige kommandoer.
- Sjekk hva jeg allerede har installert før du installerer noe: git, JDK 21, Android SDK og adb.
- Spør meg FØR du installerer programmer eller endrer noe utenfor prosjektmappen.
  Foretrekk vanlige pakkebehandlere (Homebrew på Mac, winget på Windows, apt på Linux)
  eller Android Studio / Android command-line tools fra developer.android.com.
- Klon repoet til en mappe jeg godkjenner, og bygg med Gradle-wrapperen (assembleDebug).
  Hvis bygget klager på SDK-plassering, finn Android SDK og lag local.properties med sdk.dir.
  local.properties skal aldri sendes til GitHub.
- Når noe må gjøres på telefonen eller i bilen, stopp og gi meg en kort oppskrift.
  Vent til jeg sier at jeg er ferdig. Dette gjelder:
  slå på USB-feilsøking, godta "Tillat USB-feilsøking?", gi mikrofon- og varseltilgang til Bilnett Rave,
  og slå på "Ukjente kilder" i Android Auto sine utviklerinnstillinger.
- Sjekk at telefonen er koblet til med "adb devices", og installer APK-en med "adb install -r".
  Bekreft at svaret er "Success".
- Hvis noe feiler: vis feilmeldingen, forklar hva den betyr, og foreslå neste steg.
  Ikke prøv det samme om igjen og om igjen.
- Til slutt: gi meg en kort sjekkliste for å teste i bilen.
  Minn meg på at Rave og nettleseren bare virker under kjøring når posisjon (GPS) er av på telefonen,
  og at Google Maps da ikke virker.
- Ikke endre appens kode, og ikke installer noe fra ukjente kilder.
```

</details>

**Du trenger**

- En Android-telefon med **Android 15 eller nyere**.
- En bil (eller bilradio) med **Android Auto**, med kabel eller trådløst.
- En datamaskin (Mac, Windows eller Linux) og en USB-kabel som kan overføre data.

**1. Slå på USB-feilsøking på telefonen**

1. Gå til **Innstillinger → Om telefonen** og trykk **7 ganger på «Build-nummer»**. Da får du «Utvikleralternativer».
2. Gå til **Innstillinger → System → Utvikleralternativer** og slå på **USB-feilsøking**.

**2. Installer verktøyene på datamaskinen**

Det enkleste er å installere **[Android Studio](https://developer.android.com/studio)**. Da får du JDK, Android SDK og `adb` på én gang.

- Har du Mac og Homebrew, holder det med: `brew install openjdk@21 android-platform-tools`. Du trenger også Android SDK, og den følger med Android Studio.

**3. Last ned koden**

```bash
git clone https://github.com/EspenGronnesby/Bilnett-AA.git
cd Bilnett-AA
```

Uten `git` kan du trykke **Code → Download ZIP** på GitHub og pakke ut mappen.

**4. Bygg appen**

- **Enklest:** Åpne mappen i Android Studio, vent til den er ferdig med å laste («Gradle sync»), og velg **Build → Build APK(s)**.
- **Fra terminalen:** Kjør `./gradlew assembleDebug` på Mac/Linux eller `gradlew.bat assembleDebug` på Windows.

Den ferdige appen havner her: `app/build/renamedApks/debug/AABrowser-3.3_debug.apk`

> Får du feilen «SDK location not found»? Åpne prosjektet én gang i Android Studio, så ordner den det automatisk.

**5. Installer på telefonen**

1. Koble telefonen til datamaskinen med USB-kabelen.
2. Kjør `adb devices`. Godta spørsmålet «Tillat USB-feilsøking?» på telefonen. Telefonen skal stå oppført som `device`.
3. Kjør:

   ```bash
   adb install -r app/build/renamedApks/debug/AABrowser-3.3_debug.apk
   ```

   Svaret skal være `Success`.

**6. Gi Rave tilgangene den trenger**

1. Åpne **Rave** på telefonen én gang.
2. Gi **mikrofon**-tilgang når den spør. Den brukes til å analysere lyden.
3. Gå til **Innstillinger → Varsler → Enhetstilgang til varsler** og slå på **Bilnett Rave**. Da kan Rave se hvilken sang som spilles.

**7. Slå på Ukjente kilder i Android Auto**

Android Auto viser bare apper fra Play Store, med mindre du slår på dette. Se [Slik slår du på Ukjente kilder i Android Auto](#slik-slår-du-på-ukjente-kilder-i-android-auto) under.

**8. Koble til bilen**

1. Koble telefonen til bilen og start Android Auto.
2. Åpne app-listen på bilskjermen. **Bilnett** (nettleseren) og **Rave** skal ligge der.
3. Start musikk (for eksempel i Spotify), åpne Rave og trykk på skjermen for å få frem knappene.

**9. Vil du bruke det mens du kjører?**

Slå av posisjon på telefonen. Les [Viktig: posisjon (GPS) og kjøring](#viktig-posisjon-gps-og-kjøring) først. Google Maps virker ikke da.

**Oppdatere senere**

```bash
git pull
./gradlew assembleDebug
adb install -r app/build/renamedApks/debug/AABrowser-3.3_debug.apk
```

> Oppdateringen må bygges på **samme datamaskin** som første gang. Appen signeres med en nøkkel som ligger på den maskinen. Bytter du datamaskin, må du avinstallere Bilnett fra telefonen før du installerer på nytt.

### Slik slår du på Ukjente kilder i Android Auto

Appen er ikke installert fra Play Store, så du må låse opp utviklerinnstillingene i Android Auto.

1. **Åpne Android Auto-innstillinger:** Søk etter «Android Auto» i telefonens innstillinger.
2. **Lås opp utviklermodus:** Bla til bunnen og **trykk 10 ganger på «Versjon»**. Trykk **OK** i dialogen.
3. **Åpne utviklerinnstillinger:** Trykk på **trepunktsmenyen (⋮)** øverst til høyre, og velg **Utviklerinnstillinger**.
4. **Slå på Ukjente kilder:** Finn **Ukjente kilder** og slå den på.

---

## Viktig: posisjon (GPS) og kjøring

Bilnett har ingen egen fartssperre. Android Auto har likevel sin egen sperre. Den bruker posisjonen på telefonen til å se at bilen kjører.

- **Posisjon på:** Android Auto merker at du kjører og stopper Rave og nettleseren. Du får ikke spilt mens bilen er i bevegelse.
- **Posisjon av:** Rave og nettleseren virker som vanlig, også mens du kjører.

> ⚠️ **Google Maps trenger posisjon.** Når posisjon er av, virker ikke Google Maps. Du kan derfor ikke bruke Google Maps og Bilnett samtidig mens du kjører. Velg det ene eller det andre.

Slik slår du av posisjon: Dra ned hurtiginnstillingene på telefonen og trykk på **Posisjon**. Slå den på igjen når du trenger kart.

---

## Sikkerhet i bilen

Føreren har ansvaret. Video, strobe og risting kan ta blikket fra veien. Bruk Bilnett med vett.

Bilnett leveres uten garanti, slik GPL-3.0 sier.

---

## Personvern

Bilnett sender ingen analytics.

Internett brukes bare til:

- nettsidene du selv åpner
- søk etter musikkvideo (iTunes Search)
- sangtekster

---

## Feilsøking

**Appen starter ikke?**
Prøv å åpne en annen navigasjonsapp enn Google Maps først, for eksempel **Waze**. Åpne deretter Bilnett.

**Rave eller nettleseren stopper når bilen kjører?**
Slå av posisjon på telefonen. Se [Viktig: posisjon (GPS) og kjøring](#viktig-posisjon-gps-og-kjøring). Google Maps virker ikke så lenge posisjon er av.

**Bilnett vises ikke i bilen?**
Sjekk at **Ukjente kilder** fortsatt er slått på. Den kan bli slått av etter en oppdatering av Android Auto.

---

## Takk til

Bilnett bygger på [AABrowser](https://github.com/kododake/AABrowser) av [kododake](https://github.com/kododake). Uten det arbeidet fantes ikke Bilnett.

Takk også til bidragsytere i AABrowser:

- [Colin Crowther](https://github.com/cmacrowther): opprinnelig design
- [jigneshbhavani](https://github.com/jigneshbhavani): mikrofonstøtte
- [SaveEditors](https://github.com/SaveEditors): flere faner og opprinnelig startskjerm
- [gregorixG](https://github.com/gregorixG): håndtering av skrivebordsvisning (UA)
- [breakzplatform](https://github.com/breakzplatform): egendefinert UA

**Støtt originalutvikleren:**

- [Buy Me a Coffee](https://buymeacoffee.com/kododake)
- [GitHub Sponsors](https://github.com/sponsors/kododake)

---

## Lisens

GPL-3.0. Se [LICENSE](LICENSE).

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

Du trenger JDK 21 og en telefon koblet til med `adb`.

```bash
./gradlew assembleDebug
adb install -r app/build/renamedApks/debug/AABrowser-3.3_debug.apk
```

### Slik slår du på Ukjente kilder i Android Auto

Appen er ikke installert fra Play Store, så du må låse opp utviklerinnstillingene i Android Auto.

1. **Åpne Android Auto-innstillinger:** Søk etter «Android Auto» i telefonens innstillinger.
2. **Lås opp utviklermodus:** Bla til bunnen og **trykk 10 ganger på «Versjon»**. Trykk **OK** i dialogen.
3. **Åpne utviklerinnstillinger:** Trykk på **trepunktsmenyen (⋮)** øverst til høyre, og velg **Utviklerinnstillinger**.
4. **Slå på Ukjente kilder:** Finn **Ukjente kilder** og slå den på.

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

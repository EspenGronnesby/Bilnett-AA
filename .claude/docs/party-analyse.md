# Party-analyse: slik fungerer den og slik tester vi

> Mål: Party-modus skal kjenne igjen sangdelene (intro, build-up, drop, breakdown, outro) og
> vise riktig følelse per sjanger. Espen er «læreren». Han merker delene mens han kjører, og
> Claude trener de automatiske reglene mot svarene hans.

## 1. Slik fungerer det

### På telefonen
| Del | Hva den gjør | Fil |
|---|---|---|
| **Analyseloggen** | Én linje per takt: hva lyden målte (bass, grit, kick …) og hva effektene gjorde (risting, strobe, partikler). Én fil per sang, pluss sammendrag. | `rave/party/AnalysisLog.kt` → `files/rave-analyse/*.csv`, `sammendrag.txt` |
| **Lydopptak** | Rå FFT per sang (gzip, under 1 MB). Kan spilles av på Mac-en for å teste nye regler. | `rave/party/FftRecorder.kt` → `files/rave-analyse/fft/` |
| **Knappene** | Party → **Analyse**: «Nå er det …» INTRO/OUTRO, BUILD-UP, DROP, BREAKDOWN og «Følelse» FOR MYE / FOR LITE / BRA / FEIL SJANGER. Hvert trykk lagres med tidspunkt i sangen og hva appen trodde. | `RaveActivity.kt` (`FeedbackPanel`) → `files/rave-analyse/feedback.csv` |
| **Manuell styring** | Med **Analyse på** bestemmer Espen delen. Appen bytter aldri selv. Den automatiske gjetningen kjører i en skygge-instans (`autoPhase`) og logges i kolonnen `auto_part`. | `HardstyleStructure.manual`, `force()` |
| **Husker per sang** | Rettelsene lagres per sang og slår inn neste gang sangen spilles (også med Analyse av). | `rave/party/SongMarks.kt` → `files/song-marks.json` |
| **Fake drop** | DROP og så BUILD-UP innen 10 s = fake drop. Teller ikke som drop, og neste ekte drop slår hardere. | `force()`, `FAKE_DROP_WINDOW_MS` |
| **FOR MYE / FOR LITE** | −15 % / +15 % med en gang for *sjanger + del* (f.eks. hardstyle intro). Lagres og gjelder alle sanger i sjangeren. Grense 50–200 %. | `adjustTune()`, prefs `tune_*` |
| **Outro** | De siste 20 s av hver sang roer seg ned til 30 %. Etter 60 % av sangen heter INTRO-knappen OUTRO. | `OUTRO_FADE_MS`, `OUTRO_FROM_SHARE` |

Styrke per del (hardstyle): intro .40 · breakdown .50 · build-up .55–.80 · drop .90–1.20.

### På Mac-en
| Skript | Hva det gjør |
|---|---|
| `tools/party-analyse/sync.py` | Henter nye/endrede filer fra telefonen (adb `run-as`) og lager rapporten. Gjør ingenting uten telefon. |
| `tools/party-analyse/report.py` | Lager `rapport.html`: hvor ofte appen er enig med Espen, hvilke deler den blander, drop funnet ±3 s, fake drops, følelse per del og effekter per del. |
| `tools/party-analyse/install.sh` | (Valgfritt) macOS kjører `sync.py` hvert minutt. Må kjøres av Espen selv. `--remove` fjerner den. |

| `tools/party-analyse/style_teacher.py` | **Stil-lærer**: Essentia Discogs-EffNet (400 stiler) + BPM på 30 s smakebit (iTunes/Deezer, samme versjon ±15 % lengde) → `style-book.json`. Kjører med venv (Python 3.12). Modellen er CC BY-NC-SA og kjøres bare på Mac-en. |

Data og rapport: `~/Vibe-kode/Projects/Bilnett-AA-assets/party-analyse/` (**aldri i git**, repoet er offentlig).

**Stil-læreren, første test (2026-11-06):** 14/16 hardstyle-låter fikk Hardstyle som toppstil; resten ble
hardstyle-familien (Hands Up/Hard Trance, Hardcore/Speedcore). BPM 150–162 (appens live-takt hoppet 117–235).
Steg 1 = bare logging i appen; steg 2 (læreren bestemmer sjanger/BPM) etter sjekk med Espen.

## 2. Slik tester vi (Espen i bilen)

1. Åpne Rave → slå på **Party** (5 trykk på coveret) → trykk **Analyse**.
2. Spill hele sanger. Trykk delen **i det du hører at den bytter**:
   - **INTRO**: starten før noe skjer (rolig, svevende).
   - **BREAKDOWN**: kicken er borte; sang eller melodi alene. Også mellompartiet etter et drop.
   - **BUILD-UP**: spenningen stiger (trommeruller, sus, bassen forsvinner).
   - **DROP**: kick og tung bass slår jevnt på hvert slag. Raw anti-climax regnes også som drop.
   - **OUTRO**: slutten (samme knapp som INTRO etter 60 % av sangen).
   - Fake drop: DROP når det starter, BUILD-UP når det stopper.
   - Kort pause på 1 takt midt i dropet: ikke trykk. Usikker: ikke trykk.
3. Trykk **FOR MYE / FOR LITE / BRA** når følelsen ikke stemmer (eller stemmer).
4. Spill gjerne flere sjangre: rap, pop, EDM, reggae, reggaeton.
5. Vil du bare nyte musikken: slå **Analyse av**. Da styrer appen selv.

## 3. Slik henter og leser vi resultatet (Mac)

```bash
# Koble til telefonen, deretter:
python3 tools/party-analyse/sync.py --open     # henter alt og åpner rapporten
# eller automatisk hvert minutt (én gang):
tools/party-analyse/install.sh
```

Hva vi ser etter i rapporten:
- **«Hva appen trodde, når du sa …»**: diagonalen skal bli høy. Første måling (2026-11-06, 22 sanger):
  drop 89 %, intro 73 %, build-up 11 %, breakdown 4 %. Appen henger igjen i drop.
- **Drop funnet**: dine drop som appen fant selv innen 3 s (første måling 15/25).
- **Effekter per del**: skal stige intro → breakdown → build-up → drop.

## 4. Hvordan Claude trener

Kommandoene står i CLAUDE.md under «Når Espen sier analyser». Kort:
`report.py` (rapport) → `PartyReplayTest.replayAgainstEspensAnswers` (avspilling mot fasit, `replay.txt`)
→ `PartyReplayTest.sweepTuning` med `SWEEP`-fil (søk etter terskler i `PartyTuning`, `sweep.txt`).
  `PartyTuning` og resten av analysen ligger i `rave-core/src/commonMain/…` (delt med nettsiden): etter endring, kjør `./gradlew :rave-core:syncWebCore` og commit `web/src/core/generated/`.

Funn 2026-11-06: Espens breakdowns har ofte kick (2,4 kick/s, som drop). Det som skiller er «fylde»:
diskant + presence ca. 1,5–2 dB under sangens topp i breakdown, mens build-up har lite sub (−6 dB) og full diskant.

**Egen del-modell (fase C, 2026-11-10):** `train_parts.py` trener logistisk regresjon på ett sekund per rad
(målinger nå + endring over 2/4/8 s) og tester med én sang utenfor om gangen. På 9 sanger slår den ikke reglene
totalt (59 % mot 69 %), men er mye bedre på build-up (47 % mot 13 %). Ikke i appen ennå – flere merkede sanger trengs.

**Drop-fingeravtrykk (fase D, 2026-11-10):** smakebiten gjøres om til Visualizer-lignende FFT (`preview_fft.py`) og kjøres
gjennom den ekte analysen; den fulleste 8 s-biten blir sangens «drop-profil» (48 bånd). Live-lyden ligner mest på profilen
i Espens drop (AUC 78–90 % i 4 av 4 sanger), men som ekstra bevis ga den ingen bedring over fylde-reglene. Ligger klar, av.

**Ny «lytt først»-analyse, steg 0 (2026-11-19):** én samlet evaluator i `PartyReplayTest` (`evaluate(songs, clean)`),
renset fasit (trykk flyttet 600 ms bakover; manuell modus startet midt i sang teller fra første trykk) og nye mål:
drop innen én takt, falske drop per minutt, build-up fanget. `replayAgainstEspensAnswers` gir både gamle tall (rå fasit)
og nye (renset, drop-musikk og andre sjangre); første kjøring skrev `baseline.txt` i assets.
Baseline (9 drop-sanger): enig 69 %, drop innen én takt 10/16, falske drop 1,52/min, build-up fanget 2/16.
`REACTION_MS` = 600 ms er en antakelse, ikke målt ennå.
Rettelser per sang (`SongMarks`) bruker nå `GenreBook.key` + lengde i sekunder (versjoner holdes adskilt); gamle merker
flyttes og slås sammen ved neste avspilling.
Plan: `~/.claude/plans/lag-en-plan-for-fizzy-parasol.md` (steg 0–6).

**Steg 3 lettvekt (2026-11-20, 9 sanger):** `SongListener` eksporterer 16 selvrelative målinger per slag
(`exportListenerFeatures` → `listener-features.csv`), og `tools/party-analyse/train_listener.py` trener logistisk regresjon for
build-up med én sang utenfor om gangen (AUC 0,75; gradient boosting ga 0,77 – forskjellen er støy på 9 sanger). Hybrid = gammel
hjerne bestemmer alt, men der den ikke sier DROP og modellen er ≥ 0,8 sikker → BUILDUP: enig 69 % (som gammel), drop 87 %
(uendret), build-up fanget 7/15 (gammel 2/15), falsk build-up 43 s (gammel 27 s). Terskel 0,5 gir 13/15 men enig 64 %.
I skyggen i appen fra 2026-11-20: `BuildUpModel.kt` (generert av `train_listener.py --save`, vekter uten lyd) kjøres av `SongListener`
(`pBuildModel`, glattet over 4 slag) og logges som `p_model` sist i analyse-CSV. Styrer ingenting. Hybrid-regelen (gammel ≠ DROP og
`p_model` ≥ 0,8 → BUILDUP) regnes ut på Mac-en fra loggen. Python og Kotlin gir samme p (snittavvik 0,0002).
Tren på nytt etter mer fasit: `exportListenerFeatures` → `train_listener.py --save` → bygg. `hybrid.txt` i assets har tallene.
Lytteren: samme lydbilde telles bare én gang (live mater det flere ganger), og pause/spoling starter vinduene på nytt.

**Steg 5 (2026-11-19): opptak og merking på nettsiden.** Party-panelet har **Analyse av/på**; på: Intro / Build-up / Drop /
Breakdown / Outro, og lyden tas opp (`web/src/party/analysis.ts`, samme BNFFT1-format som appen). Lagres i nettleseren
(IndexedDB, maks 40 sanger, ikke i git) til **Eksporter (N)** laster ned `<stamp>-<navn>.fft.gz` + `.csv` (en rad per sekund,
`part_by=espen` fra første trykk). Legg filene i `…/party-analyse/raw/` (csv) og `raw/fft/` (fft.gz) så leser `PartyReplayTest`
dem som appens. Testet i Chrome med demo-lyden (format og rader stemmer); ikke testet med ekte PC-lyd ennå, og `sync.py` henter
ikke fra Nedlastinger ennå. Nettsiden har ikke `feedback.csv`, så «midt i sang»-rensen (første trykk) bruker bare første merke.

**Hands-free opptak (2026-11-20):** i Party → Analyse på → **Velg mappe** (Chrome; anbefalt `Nedlastinger/rave-analyse`) skrives hver
sang dit av seg selv, uten å trykke noe, så en spilleliste kan gå alene. `sync.py` henter fra `~/Downloads/rave-analyse` og `~/Downloads`
(også uten telefon: `python3 tools/party-analyse/sync.py --web`), hopper over sanger vi allerede har (samme tittel og lengde).
Mappevalget er ikke testet i en ekte nettleser (kan ikke automatiseres); hentingen i `sync.py` er testet med falske filer.

**Læreren, rettings-verktøyet og modellsammenligning (2026-11-20).** `teacher.py` ser hele sangen offline (selvrelativ: Foote-novelty + fylde =
svakeste av sub og lys klang + frasenett). Måling (`teacher.txt`, drop-musikk = **6 unike sanger** i 8 opptak, ikke 9): færre falske drops (0,6 mot 1,6/min) og
4/14 build-ups (gammel 2/14, støy), men klart dårligere drop-tidspunkt (±3 s: 4/12 mot 10/12). **Læreren er ikke bedre enn gammel hjerne** → bare forslag til
rettings-verktøyet, ikke treningsmerker. Påstanden «Espen trykker ca. 1,6 s sent» er IKKE etablert (regnet av de få treffene, samme data): `LAG` i `teacher.py`
er en følsomhetsprøve; og «innen én takt» kan uansett ikke måles skarpere enn menneskets timing.
`review.py` lager `review.html` (kurver + gammel/lærer/Live/Din, sortert etter uenighet; opptak under 60 s hoppes over; dra for å velge tidsrom, 1–5 setter del; **A/G «godta»
regnes ikke som fasit**; tomme slag forblir tomme; angre per sang; Lagre → `corrections.json`). `review_apply.py` skriver bare sanger du faktisk har rettet (`edited`)
som `part_by=review` + `# kilde: review`, originalen kopieres til `raw/pre-review/` (aldri overskrevet). `PartyReplayTest.truth()` leser `review` uten reaksjonstid-forskyvning.
Løype: `sync.py --web` → `exportAllSlots` → `teacher.py --write` → `review.py --open` → rett → `review_apply.py`. `sync.py` kaster aldri et opptak med Espens merker som duplikat.
`train_models.py` (én sang utenfor, gruppert på tittel, test bare på menneskemerkede, tomme slag holdt utenfor): logistisk er minst like god som boosting og nevralt nett på
6–11 sanger (AUC 0,7; boosting/MLP 0,45–0,7); spektrum-målinger hjalp på drop-musikk (0,82) men skadet på alle sanger; lærerens svake merker ga ingen sikker gevinst.
**Ingen modell velges av dette: for lite data (6 unike drop-sanger, ~15 build-ups).** Neste reelle steg er flere menneskemerkede sanger (ca. 25–30), ikke flere modeller.

**AI-trener (2026-11-20).** Når Analyse slås på åpnes en egen visning («Trener AI-en») på nettsiden (`web/src/party/Trainer.tsx`, motor-getters i
`WebPartyEngine`, historikk i `timeline.ts`): kort for gammel hjerne, ny lytter og build-up-modell (med «Riktig/Feil»), live tidslinje (siste 2 min; dra for å velge
tidsrom, klikk for «fra her»), forklaring («slik tenker den nå», modellens tre viktigste grunner) og mange valg (deler 1–5, «startet for 2/4/8 s / 1–4 takter siden»,
flytt siste merke, stemmer ikke, fake drop, ingen drop, ikke drop-musikk, bra/for mye/for lite/feil sjanger, angre, spol tilbake 10 s). `analysis.ts` bygger CSV
først ved lagring: merker kan settes bakover i tid, filen får `# kilde: review`, kolonnene `new_part,p_model`, og `<navn>.events.csv`. «Min lærling»
(`trainerModel.ts`) er en liten kopi av build-up-modellen som justerer seg av rettelsene dine i nettleseren (viser AT den lærer, ikke at den er bedre; nullstill-knapp).
Appen (Analyse-modus): AI-blokk i `AnalysisHud` (hjerner + live tidslinje, `TrainerTimeline.kt`), «Startet for …»-knapper, «Stemmer ikke», «Fake drop», «Ingen drop»;
bakover-merker skrives som `# RELABEL <fra_s> <til_s> <DEL>` i sang-CSV (`AnalysisLog.relabel`) og leses av `PartyReplayTest.truth()` (uten reaksjonstid).

**AI-trener gjort enklere (2026-11-20, etter kritiker).** Standard er «Enkel modus»: når den nye lytteren bytter del, kommer et stort «Stemmer det? ✔ Ja (mellomrom) / ✖ Nei (N) / ▶ Hør igjen»;
«Stopp sangen og spør» (standard på) setter sangen på pause ved bytte (maks hvert 20. s), du kan spole 6 s tilbake og høre igjen, og sangen fortsetter der den stoppet når du har svart (eller etter 45 s).
«Finn starten automatisk» legger starten der fylden (sub/lys klang) faktisk hopper (`snapOnset`), ellers reaksjonstiden. «Flere valg» viser resten. Rettelser etter kritiker: sjekkpunkter hvert 20. s og ved skjuling
(IndexedDB `drafts`/`parts`, `recover()` berger utkast ved neste åpning), tomt slutt-merke (`part=''`, `part_by=review`) når et tidsrom dras først (testen leser tom del som «her slutter det du merket»),
`sync.py` kaster aldri opptak med `espen`/`review`, `.events.csv` kopieres til `raw/events/` og forveksles ikke med sang-CSV, ærlige «Lagret»/«Angret»-meldinger, «flytt siste merke» flytter riktig merke, lærlingen
trener først på slag eldre enn 6 s og lagrer en modell-signatur. Ikke testet: ekte Spotify (pause/spol/fortsett), ekte PC-lyd, hvordan det oppleves å bruke mens du hører på, appen på telefon.

**AI-trener, renere (2026-11-20).** Standardvisningen er bare: tittel, «AI-en tror: <del>», live tidslinje (bass og lys klang + felt for AI og Din), fem store knapper (Intro, Build-up, Drop, Breakdown, Outro),
og tre små brytere (Angre, Finn start selv, Pause og spør). «Hjernen» åpner hjernekort og forklaring, «Flere valg» åpner resten (tidspunkt, stemmer ikke, fake drop, følelse, sjanger, spol, reaksjonstid, data).
Mappe-valg og eksport ligger kun under «Flere valg → data» og vises ikke lenger i Party-panelet: sangene lagres i nettleseren av seg selv, og eksport/mappe er noe Espen gjør senere.

**AI-trener, musikk-uttrykk, senere dempet etter designprofilen (2026-11-20: ingen emoji/konfetti, nøytrale knapper, valgt = kremhvit, delene som lysstyrke-skala på tidslinjen, rolig prikk).** Første versjon: Coveret blurret som bakgrunn, farger som følger delen AI-en tror på (`--tr-accent`), lite cover som pulserer på kicken, equalizer (48 bånd) som danser,
fylt «bølge» under bassen på tidslinjen, emoji på delknappene (🌅 🚀 💥 🌊 🌙), glass-kort og konfetti ved svar. Av ved «Ingen blinking» og reduser-bevegelse. Ren utseende-endring (ingen endring i data).

**AI-trener, designprofil-gjennomgang (2026-11-20, mål: maksimalt clean).** Sentrert spalte med luft; ett kort per del med tynne skillelinjer (ikke kort i kort); tonale kontroller uten kant;
valgt = fylt aksent (kremhvit) med hake, ellers grå flate; reserveveier («Hjernen ›», «Flere valg ›», Angre, Lukk) som dempede tekstlenker; bryterne «Finn start selv» og «Pause og spør» som `.switch`-lignende;
delene som lysstyrke-skala via CSS-tokens (`--p-intro … --p-drop`), ingen hex i komponenten; forklaringene i vanlige ord uten tall; ingen fast forklaringstekst om lagring; coveret pulserer ikke (regel: ingen uønsket
bevegelse); ingen `will-change`/blur på kort; bevegelse via tokens (120/180/250 ms), hover bare med `@media (hover: hover)`, reduser bevegelse gir kortere overganger.

Profil-revisjon (automatisk, i nettleseren, 67 stilregler for AI-treneren): 0× `transition: all`, 0× `will-change`, 0× `scale(0)`, 0× `backdrop-filter`, alle `:hover` i `@media (hover: hover)`,
0 bokstavelige farger i regler (alt via tokens), 0 transisjoner på width/height/margin/top/left, 0 bokstavelig easing, 0 emoji, ingen animasjon på coveret, redusert bevegelse = bare opacity-fade, knapper ≥ 28 px.

**Party-skjermen ryddet (2026-11-20, siden AI-treneren viser det).** Ingen tekst midt på skjermen om sangdel eller sjanger (bare «PARTY ON / OFF»), i appen og på nettsiden. Nettsiden: dock har bare lydkilde,
styrke, tilkoblingsstatus (kun når noe er galt) og «Analyse på/av» + «AI-trener»; delknappene, sjanger-prikken og Koko-knappen er borte (Koko ligger i Innstillinger → Utseende). Appen: Analyse-panelet viser bare AI-blokken
(hjerner + live tidslinje), uten Sub-bass/Diskant/Zaag-målere, sang-info (`SongInfoBlock` slettet) og «Nå er det …»-overskriften.

Gammel plan for trening:

1. Hent loggene og lydopptakene (sync).
2. Spill av lydopptakene gjennom `HardstyleAudio` + `HardstyleStructure` på Mac-en (JUnit) med
   Espens merker som fasit.
3. Juster reglene (først: gå ut av drop ved breakdown/build-up) til enigheten i rapporten stiger,
   uten at drop-treffet faller.
4. Installer, Espen tester i bil, ny rapport. Gjenta i små steg ([[party-intensitet-hardstyle]]: heller for lite enn for mye).

Plan: `~/.claude/plans/jeg-har-lagt-mere-happy-sunset.md` (steg 0–6).

## Merk: loggtall etter aura-ombyggingen (2026-11-20)

Fra `feat/party-ring-frekvenslag` er `shakePx` i loggene bare over 0 i drop (og ca. halvert), og
partikkelantallet er maks 120 (før 224). Snitt av risting/partikler fra eldre logger er derfor ikke
sammenlignbare med nye. Analysen selv (sjanger, sangdeler, `PartyReplayTest`) er uendret.

## Grit for effektene (2026-11-23)

- `grit` / `heavy` var stilt inn etter mikrofonen 6.11 (kuttet bass, mid/bass .4–.8). Visualizer og dagens
  UNPROCESSED-mikrofon beholder bassen (mid/bass .05–.32), så grit var nesten alltid 0 → få lysbølger og lite risting.
- Nå: `gritFx` / `heavyFx` (`GRIT_FX_FROM` .14 / `GRIT_FX_RANGE` .16) brukes av effektene via `HardstyleFrame.forEffects()`
  rett før `vibeShape`. **Sjangerreglene, delanalysen og fasit-kolonnene i loggen bruker fortsatt `grit` / `heavy`.**
- Bilens mikrofon og MIC-reserven regnes som «kutter bass» (`MicFftSource.bassCut`) og bruker de gamle tallene også
  for effektene. Det er et anslag: se etter «kutter bass» i loggen (`Party lytter via: …`) første tur i bilen.
- Loggkolonnene `out_grit` / `out_heavy` (det effektene fikk) bruker de nye tallene fra 23.11 og kan ikke sammenlignes direkte med eldre logger.
- Mål effekt-grit på opptakene: `--tests '*PartyReplayTest.gritForEffects'` → `grit-effekter.txt`.

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

Funn 2026-11-06: Espens breakdowns har ofte kick (2,4 kick/s, som drop). Det som skiller er «fylde»:
diskant + presence ca. 1,5–2 dB under sangens topp i breakdown, mens build-up har lite sub (−6 dB) og full diskant.

**Egen del-modell (fase C, 2026-11-10):** `train_parts.py` trener logistisk regresjon på ett sekund per rad
(målinger nå + endring over 2/4/8 s) og tester med én sang utenfor om gangen. På 9 sanger slår den ikke reglene
totalt (59 % mot 69 %), men er mye bedre på build-up (47 % mot 13 %). Ikke i appen ennå – flere merkede sanger trengs.

Gammel plan for trening:

1. Hent loggene og lydopptakene (sync).
2. Spill av lydopptakene gjennom `HardstyleAudio` + `HardstyleStructure` på Mac-en (JUnit) med
   Espens merker som fasit.
3. Juster reglene (først: gå ut av drop ved breakdown/build-up) til enigheten i rapporten stiger,
   uten at drop-treffet faller.
4. Installer, Espen tester i bil, ny rapport. Gjenta i små steg ([[party-intensitet-hardstyle]]: heller for lite enn for mye).

Plan: `~/.claude/plans/jeg-har-lagt-mere-happy-sunset.md` (steg 0–6).

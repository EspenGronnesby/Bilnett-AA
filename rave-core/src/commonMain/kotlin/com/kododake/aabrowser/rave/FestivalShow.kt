package com.kododake.aabrowser.rave

import kotlin.math.exp

// Festival-style show rules (research 2026-11-04: festival LDs, SoundSwitch/MaestroDMX/BeatNet,
// WCAG 2.3.1). All tunables in one place so they are easy to adjust after testing in the car.

/** Visuals fire this much BEFORE the predicted beat. People accept the picture up to ~150 ms early
 *  but notice it ~50 ms late; our FFT pipeline lags ~60–120 ms, so firing early lands on the beat. */
const val BEAT_LEAD_MS = 70f
/** The beat clock takes over the pump once the beat tracker has this many beats in a row on its grid. */
const val BEAT_CLOCK_MIN_CONFIDENCE = 3
/** Same decay as the detected kick (HardstyleAudio), so the pump looks the same, just on time. */
const val BEAT_PULSE_DECAY_MS = 85f

/** How dark the "breath in" before the drop gets: 0.85 → the scene drops to ~15 % brightness. */
const val PRE_DROP_DIP_DEPTH = .85f
/** Build-up progress (0..1) from where the dip starts even without a known phrase end. */
const val PRE_DROP_BUILD_START = .75f
/** Heaviness a confirmed drop never falls under (log 2026-11-06: it fell to 0 and the drop «stopped»). */
const val DROP_HEAVY_FLOOR = .35f
/** How much a build-up adds to particles / density at full build (was .8 / .5 — more than the drop). */
const val BUILD_PARTICLE_RISE = .25f
const val BUILD_DENSITY_RISE = .2f
/** Remembered part corrections switch this early (Espen taps after he hears the change). */
const val MARK_LEAD_MS = 400L
/** Rap's 808 pulse fades this slowly (heavy, «head-nod» feel). */
const val PULSE_808_DECAY_MS = 350f
/** The last part of every song fades down like an outro, to this share of the normal level. */
const val OUTRO_FADE_MS = 20_000L
const val OUTRO_FLOOR = .3f
/** From this share of the song, the INTRO correction button becomes OUTRO. */
const val OUTRO_FROM_SHARE = .6f
/** The single big hit on the first beat of the drop (time constant; visible for ~0.6–0.8 s). */
const val DROP_HIT_DECAY_S = .2f
/** The dip never lasts longer than this per build-up, so a build-up without a drop can't stay dark. */
const val PRE_DROP_DIP_MAX_MS = 2_500L
/** Drop hit strength when the drop isn't backed by a breath-in (could still turn out to be a fake drop). */
const val DROP_HIT_UNSURE = .5f
/** The beat clock and unsmoothed hits only from about here on the vibe slider (calm modes stay soft). */
const val BEAT_CLOCK_FROM_VIBE = .4f

// ---- Roligere Party (2026-11-20): «heller for lite enn for mye». Risting og ripples bare i dropet. ----
/** Dropet «er på» (risting, ripples, full partikkelfart) når sangnivået er minst dette. Samme grense som strobe. */
const val SHOW_DROP_FROM = .9f
/** Risting: dyttet per tungt kick i dp ved lavt volum (var 10) … */
const val SHAKE_PUNCH_DP = 5f
/** … og hvor mye mer ved fullt volum (var 4). */
const val SHAKE_PUNCH_LOUD_DP = 2f
/** Risting: største vridning i grader (var .8). */
const val SHAKE_ROTATION_DEG = .4f
/** Risting: ekstra dytt på kick når det skriker (screech), i dp (var 7). */
const val SHAKE_SCREECH_DP = 3.5f
/** Partikler: antall ved vanlig volum (var 112) og største antall ved fullt volum (var 224). */
const val PARTICLES_BASE = 60
const val PARTICLES_MAX = 120
/** Partikler: farten utenfor dropet, som andel av farten i dropet (1 = som før). */
const val PARTICLE_CALM_SPEED = .7f
/** Ripples: minst så lenge mellom hver (var 160 ms). */
const val RIPPLE_MIN_GAP_MS = 400L

// ---- Samme lys som auraen (2026-11-20): lysstøv, lysbølger, nordlysskjær og snare-glød. ----
// Alt tegnes som lys som legges oppå hverandre (additivt), i coverfargene, uten harde streker.

// Bakgrunnslyset (partyHit, subGlow): svulmer mykt med bassen i stedet for å slå.
/** Så fort følger bakgrunnslyset musikken opp (s) … */
const val BACKLIGHT_ATTACK_S = .07f
/** … og så sakte faller det igjen (s). */
const val BACKLIGHT_RELEASE_S = .3f
/** Så langt flytter bakgrunnslysene seg på et slag, som andel av skjermens korteste side (var .12). */
const val BACKLIGHT_HIT_TRAVEL = .03f
/** Én runde for bakgrunnslysene i Party (s; var 8). */
const val BACKLIGHT_CYCLE_S = 32f

// Nordlysskjæret: to store, myke lysflekker i coverfargene bak coveret, som driver sakte rundt det.
/** Bredde og høyde som andel av coverets side. */
const val HALO_WIDTH = 3.4f
const val HALO_HEIGHT = 2.5f
/** Styrke i ro, og hvor mye bassen legger til (0..1). */
const val HALO_REST = .12f
const val HALO_GAIN = .3f
/** Hvor mye skjæret vokser med bassen (andel). */
const val HALO_SWELL = .1f
/** Hvor langt fra coverets midte de to flekkene ligger (andel av coverets side), og én runde rundt (s). */
const val HALO_OFFSET = .3f
const val HALO_ROUND_S = 40f
/** Banen er flatklemt: så mye av avstanden brukes i høyden. */
const val HALO_SQUASH = .6f
/** Andel av bassens tillegg som vises også i rolige sangdeler (resten følger sangdelens styrke). */
const val HALO_GAIN_CALM = .5f
/** Skjæret er dempet så mye når musikkvideoen spilles (gjelder også lysstøv og lysbølger). */
const val VIDEO_LIGHT_DIM = .72f

// Lysstøv (partiklene): små, myke lyspunkter som svever sakte ut fra auraen.
/** Så lenge bruker et støvkorn fra auraen til det er helt borte, i dropet (s). */
const val DUST_DRIFT_S = 24f
/** Hvor langt støvet rekker, som andel av skjermens lengste side. */
const val DUST_REACH = .42f
/** Størrelse (dp) på de små kornene og på de få store, svake. */
const val DUST_SMALL_DP = 4f
const val DUST_BIG_DP = 16f
/** Hvert n-te korn er stort og svakt (dybde); hvert n-te er nesten hvitt. */
const val DUST_BIG_EVERY = 7
const val DUST_WHITE_EVERY = 3
/** Hvor svake de store kornene er (andel av de små). */
const val DUST_BIG_ALPHA = .3f
/** Lysstyrke i ro (0..1); resten kommer med musikken. */
const val DUST_REST = .35f
/** Andel av kornene som synes utenfor dropet (resten tones inn i dropet). */
const val DUST_CALM_SHARE = .6f
/** Hvert korn lyser opp så fort (s) og dør ut så sakte (s). */
const val DUST_ATTACK_S = .09f
const val DUST_RELEASE_S = .45f
/** Hvor mye kornene svaier sidelengs (radianer rundt coveret). */
const val DUST_SWAY = .3f
/** Farten glir mot ny verdi så sakte (s): tempoet hopper aldri. */
const val DUST_PACE_EASE_S = 1.2f
/** Kornene fødes her (andel av halve coveret, målt langs coverets firkantede kant). */
const val DUST_START = .96f
/** Veien utover: over 1 = sakte først, fortere lenger ute. */
const val DUST_PATH_CURVE = 1.25f
/** Toner inn over 1/n av veien, og ut med denne kurven (over 1 = borte lenge før kanten). */
const val DUST_FADE_IN = 12f
const val DUST_FADE_OUT_CURVE = 1.2f
/** Hvor mye hvert korn glitrer (0 = jevnt lys). */
const val DUST_SHIMMER = .22f
/** De nesten hvite kornene blandes så mye mot [CORE_COLOR], de andre så mye. */
const val DUST_WHITE_MIX = .85f
const val DUST_TINT_MIX = .3f
/** Snare/crash: så stor andel av kornene blinker opp, minst så sterkt, og blinket dør ut så sakte (s). */
const val DUST_TWINKLE_SHARE = .17f
const val DUST_TWINKLE_MIN = .7f
const val DUST_TWINKLE_DECAY_S = .35f
/** Hvor mye kornets eget diskantbånd og blinket løfter lyset (0..1). */
const val DUST_BAND_GAIN = .3f
const val DUST_TWINKLE_GAIN = .45f

// Lysbølger (ripples): en bred, myk lysring i coverets form som brer seg rolig ut og toner bort.
/** Levetid (ms; var ~1000). */
const val WAVE_LIFE_MS = 1900
/** Hvor langt bølgen går ut fra coveret, som andel av coverets side (var: hele skjermen). */
const val WAVE_REACH = .75f
/** Bølgens bredde ved start og slutt, som andel av coverets side (Espen 2026-11-20: «veldig bred»; var .10 → .42). */
const val WAVE_WIDTH_FROM = .04f
const val WAVE_WIDTH_TO = .15f
/** Sterkeste lys midt i bølgen (0..1; opp fra .34 så den smalere bølgen ikke blir blekere). */
const val WAVE_ALPHA = .50f
/** Høyst så mange bølger samtidig. */
const val WAVE_COUNT = 8
/** Ny bølge bare i dropet når bassen er over BASS og forvrengningen (grit) over GRIT; bassen må under REARM imellom. */
const val WAVE_BASS_FROM = .72f
const val WAVE_GRIT_FROM = .35f
const val WAVE_REARM_BASS = .5f
/** Bølgen starter så langt utenfor coveret (andel av coverets side) … */
const val WAVE_START = .04f
/** … og bremser utover (over 1 = fort først, rolig til slutt). */
const val WAVE_SLOWDOWN = 2.2f
/** Toner inn over 1/n av levetiden, og ut med denne kurven. */
const val WAVE_FADE_IN = 7f
const val WAVE_FADE_OUT_CURVE = 3f
/** En bølge tegnes som så mange streker oppå hverandre, smal til bred: myk klokkeform, ingen linje. */
const val WAVE_STROKES = 9
/** Bølgens farge blandes så mye mot [CORE_COLOR]. */
const val WAVE_WHITE_MIX = .25f

// Snare-gløden rett utenfor coverkanten (var en hvit strek på opptil .55): en myk skygge i [CORE_COLOR].
const val EDGE_GLOW_MAX = .3f
const val EDGE_GLOW_ATTACK_S = .04f
const val EDGE_GLOW_RELEASE_S = .25f
/** Skyggens uskarphet og utbredelse (dp), og fargens styrke (0..1) før gløden ganges inn. */
const val EDGE_GLOW_BLUR_DP = 9f
const val EDGE_GLOW_SPREAD_DP = 1f
const val EDGE_GLOW_ALPHA = .9f

/** Sync for the car: the user can shift the visuals this far earlier (+) or later (−). */
const val SYNC_LIMIT_MS = 150
const val SYNC_STEP_MS = 10
/** Tap test: taps needed, and the assumed screen delay added on top of what the taps measure. */
const val SYNC_TAPS = 8
const val SCREEN_DELAY_MS = 40f

/**
 * Tap-in-time calibration (like rhythm games): the user taps on the beat they HEAR; the median
 * distance to our beat grid tells how much earlier/later the visuals must fire.
 * Returns the new sync value (ms, + = earlier), or null while still collecting.
 */
class SyncTapper {
    private val errors = ArrayList<Float>()
    val taps: Int get() = errors.size
    fun reset() = errors.clear()

    /** False when the beat grid isn't known yet (the tap is ignored). */
    fun tap(now: Long, f: HardstyleFrame): Int? {
        val p = f.beatPeriod
        if (f.beatConfidence < BEAT_CLOCK_MIN_CONFIDENCE || p <= 0f || f.beatAt <= 0L) return null
        val raw = (now - f.beatAt).mod(p.toLong()).toFloat()
        errors += if (raw > p / 2f) raw - p else raw     // −p/2..p/2: heard beat vs our grid
        if (errors.size < SYNC_TAPS) return null
        val median = errors.sorted()[errors.size / 2]
        errors.clear()
        // Heard beat = grid + median; visuals should land there after the screen delay.
        val lead = -median + SCREEN_DELAY_MS
        return (lead - BEAT_LEAD_MS).toInt().coerceIn(-SYNC_LIMIT_MS, SYNC_LIMIT_MS)
    }
}

/** WCAG 2.3.1 / Epilepsy Society: at most 3 full-screen flashes in any 1 s, shared by ALL flash
 *  types (strobe, white heavy flash, drop hit). */
const val MAX_FLASHES_PER_SECOND = 3
const val MIN_FLASH_GAP_MS = 250L
/** Strobe colours are mixed this much with white: no saturated red/colour flashes. */
const val STROBE_WHITE_MIX = .45f

/**
 * Beat clock: instead of reacting after a kick is heard, pulse on the beat the tracker PREDICTS
 * (last beat + period), [BEAT_LEAD_MS] early. Like Synesthesia/BeatNet: a tempo+phase clock that
 * the detector only corrects. Returns null when the tracker isn't confident (then the detected
 * kick is used as before).
 */
class BeatClock {
    private var prevSince = -1f
    private var lastPeakAt = 0L
    var active = false
        private set

    fun reset() { prevSince = -1f; lastPeakAt = 0L; active = false }

    /**
     * @param halfTime pulse every second beat (felt tempo: trap/drill/dubstep at 140 feel like 70),
     *  anchored on even beats, with a longer, heavier decay ([decayMs]).
     */
    fun pulse(f: HardstyleFrame, now: Long, leadMs: Float = BEAT_LEAD_MS, halfTime: Boolean = false,
              decayMs: Float = BEAT_PULSE_DECAY_MS): Float? {
        val beatP = f.beatPeriod
        // Kicks must still be coming (the tracker stops filling in after 2 missing kicks).
        active = f.beatConfidence >= BEAT_CLOCK_MIN_CONFIDENCE && beatP > 0f && f.beatAt > 0L && now - f.beatAt < beatP * 1.6f
        if (!active) { prevSince = -1f; return null }
        val p = if (halfTime) beatP * 2f else beatP
        val anchor = if (halfTime) f.beatAt - (f.beat % 2) * beatP.toLong() else f.beatAt
        val since = (((now + leadMs - anchor) % p) + p) % p
        // A new beat starts when the phase wraps around. The re-sync to a real kick can nudge the
        // phase, so ignore a second wrap within 60 % of a beat (no double pulses).
        if (prevSince >= 0f && since < prevSince && now - lastPeakAt > p * .6f) lastPeakAt = now
        prevSince = since
        return exp(-(now - lastPeakAt) / decayMs)
    }
}

/** One shared flash budget for every full-screen flash: max [MAX_FLASHES_PER_SECOND] per second. */
class FlashBudget {
    private val times = LongArray(MAX_FLASHES_PER_SECOND)

    /** True (and counted) when a new flash may start now. */
    fun tryFlash(now: Long): Boolean {
        if (times.any { now - it < MIN_FLASH_GAP_MS }) return false
        val oldest = times.indices.minBy { times[it] }
        if (now - times[oldest] < 1_000L) return false
        times[oldest] = now
        return true
    }

    fun perSecond(now: Long): Int = times.count { it > 0L && now - it < 1_000L }
}

/** Lyrics: the next line appears this much before its first word, so it can be read in time. */
const val LINE_LEAD_MS = 150L
const val LYRICS_OFFSET_STEP_MS = 50
const val LYRICS_OFFSET_LIMIT_MS = 1_500
/** Music-note pause: shown this long after a line's last word ends (exact / guessed word timing)… */
const val PAUSE_AFTER_MS = 700L
const val PAUSE_AFTER_GUESSED_MS = 2_000L
/** …and hidden again this long before the next line, so it can be read in time. */
const val PAUSE_BEFORE_NEXT_MS = 1_500L
/** «For mye» / «for lite»: one tap = −15 % / +15 % for that genre + song part, kept within 50–200 %. */
const val TUNE_STEP_UP = 1.15f
const val TUNE_STEP_DOWN = .85f
const val TUNE_MIN = .5f
const val TUNE_MAX = 2f
/** Genre motion of the whole scene at full bar strength: reggae sway (dp, degrees) and reggaeton bounce (dp). */
const val GENRE_SWAY_DP = 14f
const val GENRE_SWAY_DEG = .8f
const val GENRE_BOUNCE_DP = 10f
/** How far reggae/reggaeton pull the palette's hues toward warm red/gold/green (0..1). */
const val WARMTH_PULL = .45f
/** The Mac teacher's genre family must sum to at least this (top-5 Discogs scores) to lock the genre. */
const val TEACHER_LOCK_MIN = .4f

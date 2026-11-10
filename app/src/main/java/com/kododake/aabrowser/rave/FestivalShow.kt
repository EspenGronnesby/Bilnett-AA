package com.kododake.aabrowser.rave

import kotlin.math.exp

// Festival-style show rules (research 2026-11-04: festival LDs, SoundSwitch/MaestroDMX/BeatNet,
// WCAG 2.3.1). All tunables in one place so they are easy to adjust after testing in the car.

/** Visuals fire this much BEFORE the predicted beat. People accept the picture up to ~150 ms early
 *  but notice it ~50 ms late; our FFT pipeline lags ~60–120 ms, so firing early lands on the beat. */
internal const val BEAT_LEAD_MS = 70f
/** The beat clock takes over the pump once the beat tracker has this many beats in a row on its grid. */
internal const val BEAT_CLOCK_MIN_CONFIDENCE = 3
/** Same decay as the detected kick (HardstyleAudio), so the pump looks the same, just on time. */
internal const val BEAT_PULSE_DECAY_MS = 85f

/** How dark the "breath in" before the drop gets: 0.85 → the scene drops to ~15 % brightness. */
internal const val PRE_DROP_DIP_DEPTH = .85f
/** Build-up progress (0..1) from where the dip starts even without a known phrase end. */
internal const val PRE_DROP_BUILD_START = .75f
/** Heaviness a confirmed drop never falls under (log 2026-11-06: it fell to 0 and the drop «stopped»). */
internal const val DROP_HEAVY_FLOOR = .35f
/** How much a build-up adds to particles / density at full build (was .8 / .5 — more than the drop). */
internal const val BUILD_PARTICLE_RISE = .25f
internal const val BUILD_DENSITY_RISE = .2f
/** Remembered part corrections switch this early (Espen taps after he hears the change). */
internal const val MARK_LEAD_MS = 400L
/** Rap's 808 pulse fades this slowly (heavy, «head-nod» feel). */
internal const val PULSE_808_DECAY_MS = 350f
/** The last part of every song fades down like an outro, to this share of the normal level. */
internal const val OUTRO_FADE_MS = 20_000L
internal const val OUTRO_FLOOR = .3f
/** From this share of the song, the INTRO correction button becomes OUTRO. */
internal const val OUTRO_FROM_SHARE = .6f
/** The single big hit on the first beat of the drop (time constant; visible for ~0.6–0.8 s). */
internal const val DROP_HIT_DECAY_S = .2f
/** The dip never lasts longer than this per build-up, so a build-up without a drop can't stay dark. */
internal const val PRE_DROP_DIP_MAX_MS = 2_500L
/** Drop hit strength when the drop isn't backed by a breath-in (could still turn out to be a fake drop). */
internal const val DROP_HIT_UNSURE = .5f
/** The beat clock and unsmoothed hits only from about here on the vibe slider (calm modes stay soft). */
internal const val BEAT_CLOCK_FROM_VIBE = .4f

/** Sync for the car: the user can shift the visuals this far earlier (+) or later (−). */
internal const val SYNC_LIMIT_MS = 150
internal const val SYNC_STEP_MS = 10
/** Tap test: taps needed, and the assumed screen delay added on top of what the taps measure. */
internal const val SYNC_TAPS = 8
internal const val SCREEN_DELAY_MS = 40f

/**
 * Tap-in-time calibration (like rhythm games): the user taps on the beat they HEAR; the median
 * distance to our beat grid tells how much earlier/later the visuals must fire.
 * Returns the new sync value (ms, + = earlier), or null while still collecting.
 */
internal class SyncTapper {
    private val errors = ArrayList<Float>()
    val taps: Int get() = errors.size
    fun reset() = errors.clear()

    /** False when the beat grid isn't known yet (the tap is ignored). */
    fun tap(now: Long, f: HardstyleFrame): Int? {
        val p = f.beatPeriod
        if (f.beatConfidence < BEAT_CLOCK_MIN_CONFIDENCE || p <= 0f || f.beatAt <= 0L) return null
        val raw = Math.floorMod(now - f.beatAt, p.toLong()).toFloat()
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
internal const val MAX_FLASHES_PER_SECOND = 3
internal const val MIN_FLASH_GAP_MS = 250L
/** Strobe colours are mixed this much with white: no saturated red/colour flashes. */
internal const val STROBE_WHITE_MIX = .45f

/**
 * Beat clock: instead of reacting after a kick is heard, pulse on the beat the tracker PREDICTS
 * (last beat + period), [BEAT_LEAD_MS] early. Like Synesthesia/BeatNet: a tempo+phase clock that
 * the detector only corrects. Returns null when the tracker isn't confident (then the detected
 * kick is used as before).
 */
internal class BeatClock {
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
internal class FlashBudget {
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
internal const val LINE_LEAD_MS = 150L
internal const val LYRICS_OFFSET_STEP_MS = 50
internal const val LYRICS_OFFSET_LIMIT_MS = 1_500
/** Music-note pause: shown this long after a line's last word ends (exact / guessed word timing)… */
internal const val PAUSE_AFTER_MS = 700L
internal const val PAUSE_AFTER_GUESSED_MS = 2_000L
/** …and hidden again this long before the next line, so it can be read in time. */
internal const val PAUSE_BEFORE_NEXT_MS = 1_500L
/** «For mye» / «for lite»: one tap = −15 % / +15 % for that genre + song part, kept within 50–200 %. */
internal const val TUNE_STEP_UP = 1.15f
internal const val TUNE_STEP_DOWN = .85f
internal const val TUNE_MIN = .5f
internal const val TUNE_MAX = 2f
/** Genre motion of the whole scene at full bar strength: reggae sway (dp, degrees) and reggaeton bounce (dp). */
internal const val GENRE_SWAY_DP = 14f
internal const val GENRE_SWAY_DEG = .8f
internal const val GENRE_BOUNCE_DP = 10f
/** How far reggae/reggaeton pull the palette's hues toward warm red/gold/green (0..1). */
internal const val WARMTH_PULL = .45f
/** The Mac teacher's genre family must sum to at least this (top-5 Discogs scores) to lock the genre. */
internal const val TEACHER_LOCK_MIN = .4f

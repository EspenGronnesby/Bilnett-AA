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
/** The single big hit on the first beat of the drop (time constant; visible for ~0.6–0.8 s). */
internal const val DROP_HIT_DECAY_S = .2f
/** The dip never lasts longer than this per build-up, so a build-up without a drop can't stay dark. */
internal const val PRE_DROP_DIP_MAX_MS = 2_500L
/** Drop hit strength when the drop isn't backed by a breath-in (could still turn out to be a fake drop). */
internal const val DROP_HIT_UNSURE = .5f
/** The beat clock and unsmoothed hits only from about here on the vibe slider (calm modes stay soft). */
internal const val BEAT_CLOCK_FROM_VIBE = .4f

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

    fun pulse(f: HardstyleFrame, now: Long, leadMs: Float = BEAT_LEAD_MS): Float? {
        val p = f.beatPeriod
        // Kicks must still be coming (the tracker stops filling in after 2 missing kicks).
        active = f.beatConfidence >= BEAT_CLOCK_MIN_CONFIDENCE && p > 0f && f.beatAt > 0L && now - f.beatAt < p * 1.6f
        if (!active) { prevSince = -1f; return null }
        val since = (((now + leadMs - f.beatAt) % p) + p) % p
        // A new beat starts when the phase wraps around. The re-sync to a real kick can nudge the
        // phase, so ignore a second wrap within 60 % of a beat (no double pulses).
        if (prevSince >= 0f && since < prevSince && now - lastPeakAt > p * .6f) lastPeakAt = now
        prevSince = since
        return exp(-(now - lastPeakAt) / BEAT_PULSE_DECAY_MS)
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

package com.kododake.aabrowser.rave.party

/**
 * The song's mood as the Mac's style teacher heard it (Essentia mood heads on the 30 s preview),
 * turned into a few 0..1 knobs for the visuals.
 *
 * Calibrated on Espen's hardstyle (2026-11-10): raw tracks (Machinery, Eternal Pulse, Make You Mine)
 * scored «aggressive» .54–.60, euphoric/melodic ones (Cry for You, Daylight, Ocean) .12–.21.
 */
internal data class SongMood(
    val aggressive: Float = 0f, val happy: Float = 0f, val party: Float = 0f, val relaxed: Float = 0f,
    val sad: Float = 0f, val dance: Float = 0f, val voice: Float = 0f, val bright: Float = 0f,
    val themes: List<Pair<String, Float>> = emptyList()
) {
    private fun theme(vararg names: String) = themes.any { it.first in names }

    /** 0..1: hard, dark, distorted (raw/rawstyle, aggressive rap, metal). */
    val raw: Float get() =
        (((aggressive - RAW_FROM) / RAW_RANGE).coerceIn(0f, 1f) + if (theme("dark", "heavy", "powerful")) .15f else 0f).coerceIn(0f, 1f)

    /** 0..1: uplifting, melodic, «floating» (euphoric hardstyle, happy pop). */
    val euphoric: Float get() =
        ((1f - raw) * (if (theme("melodic", "uplifting", "epic", "dream", "happy", "hopeful", "inspiring", "emotional")) 1f else .75f) +
            .3f * happy).coerceIn(0f, 1f)

    /** 0..1: calm / sad / relaxed. */
    val calm: Float get() = (relaxed + .5f * sad).coerceIn(0f, 1f)

    /** 0..1: party / danceable. */
    val partyLevel: Float get() = maxOf(party, dance * .8f).coerceIn(0f, 1f)

    /**
     * Multipliers for the effects (soft caps ~±25 %), on top of the genre profile and Espen's
     * «for mye / for lite». Euphoric floats: softer lights, less shake, slower motion; raw hits harder.
     */
    data class Motion(val shake: Float, val spike: Float, val particles: Float, val softness: Float, val speed: Float)

    val motion: Motion get() {
        val calmDown = 1f - .2f * calm
        return Motion(
            shake = (.75f + .5f * raw) * (1f - .2f * euphoric) * calmDown,
            spike = (.85f + .3f * raw) * calmDown,
            particles = (.9f + .25f * partyLevel) * calmDown,
            softness = 1f + .6f * euphoric * (1f - raw),
            speed = (1f - .3f * euphoric * (1f - raw)) * (1f - .15f * calm)
        )
    }

    /** Only calm/party (genres where «euphoric» vs «raw» isn't the point, e.g. rap and pop). */
    val calmPartyMotion: Motion get() {
        val calmDown = 1f - .2f * calm
        return Motion(shake = calmDown, spike = calmDown, particles = (.9f + .25f * partyLevel) * calmDown,
            softness = 1f, speed = 1f - .15f * calm)
    }

    /** The same motion at [w] strength (1 = full, .5 = half): used where the sub-genre already does some of it. */
    fun Motion.scaled(w: Float) = Motion(1f + (shake - 1f) * w, 1f + (spike - 1f) * w, 1f + (particles - 1f) * w,
        1f + (softness - 1f) * w, 1f + (speed - 1f) * w)

    companion object {
        const val RAW_FROM = .25f
        const val RAW_RANGE = .3f
        /** Hardstyle sub-genre from the mood: raw ≥ this → RAW, else EUPHORIC. */
        const val RAW_SUB_FROM = .5f
    }
}

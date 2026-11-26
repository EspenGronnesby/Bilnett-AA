package com.kododake.aabrowser.rave

import kotlin.math.abs
import kotlin.math.ln
import kotlin.math.pow
import kotlin.math.round
import kotlin.math.roundToLong

// Party-innstillinger (Espen 2026-11-20, auraen 2026-11-26): åtte gangetall som appen og nettsiden bruker likt.
// 1 = slik Party er uten innstillinger (samme tall som før), 0 = av, 2 = mer.
// Analysen (sjanger, sangdeler, drop) bruker dem aldri: de endrer bare hvor sterkt effektene vises.

/**
 * Én innstilling: [key] lagres (appen: SharedPreferences «rave» som «party_<key>», nettsiden: localStorage),
 * [min]..[max] er lovlig område. [log]: glidebryteren er logaritmisk (0,5–2 med 1 på midten).
 */
enum class PartyFx(val key: String, val min: Float, val max: Float, val log: Boolean) {
    /** Lysbølgenes styrke: ganger [WAVE_ALPHA]. 0 = ingen bølger. */
    WAVE_STRENGTH("bolger_styrke", 0f, 2f, false),
    /** Lysbølgenes bredde: ganger [WAVE_WIDTH_FROM] og [WAVE_WIDTH_TO]. */
    WAVE_WIDTH("bolger_bredde", .5f, 2f, true),
    /** Hvor ofte det kan komme en ny bølge: minste avstand er [RIPPLE_MIN_GAP_MS] delt på dette (0,5 = dobbelt så lenge). */
    WAVE_OFTEN("bolger_ofte", .5f, 2f, true),
    /** Risting: ganger dyttet og vridningen. 0 = ingen risting. */
    SHAKE("risting", 0f, 2f, false),
    /** Strobe: ganger styrken. 0 = av (og bruker da ikke av blinkbudsjettet). */
    STROBE("strobe", 0f, 2f, false),
    /** Hvite blink (heavy-blink og drop-treffet): ganger styrken. 0 = av (bruker da ikke av blinkbudsjettet). */
    FLASHES("blink", 0f, 2f, false),
    /** Auraens utslag (2026-11-26): ganges med bulenes størrelse, også bunnen ([OrbGeometry.auraSize]). */
    AURA_SIZE("aura_utslag", .5f, AURA_SIZE_REACH_MAX, false),
    /** Auraens skarphet: 0 = myk og tåkete med mye glød, 2 = klar og spiss med lite tåke ([auraSharp]). */
    AURA_SHARP("aura_skarphet", 0f, 2f, false);

    /** Klemt til lovlig område; ugyldig tall blir 1. */
    fun clamp(value: Float): Float = if (value.isNaN()) 1f else value.coerceIn(min, max)

    /** Glidebryterens plass 0..1 → verdi. Midten (± [PARTY_FX_SNAP]) er nøyaktig 1. */
    fun fromSlider(position: Float): Float {
        val p = if (position.isNaN()) .5f else position.coerceIn(0f, 1f)
        if (abs(p - .5f) < PARTY_FX_SNAP) return 1f
        return clamp(if (log) min * (max / min).pow(p) else min + (max - min) * p)
    }

    /** Verdi → glidebryterens plass 0..1 (motsatt av [fromSlider]). */
    fun toSlider(value: Float): Float {
        val v = clamp(value)
        return (if (log) ln(v / min) / ln(max / min) else (v - min) / (max - min)).coerceIn(0f, 1f)
    }

    companion object {
        fun of(key: String): PartyFx? = entries.firstOrNull { it.key == key }
    }
}

/** Så nær midten av glidebryteren (andel) regnes som nøyaktig 1×, så «som før» er lett å treffe med fingeren. */
const val PARTY_FX_SNAP = .03f

/** Verdien som tekst: «Av», «0,5×», «1×», «1,3×». */
fun partyFxText(value: Float, fx: PartyFx? = null): String {
    // Skarphet 0 is not «off»: the aura is there, just soft (as it was before 24 Nov).
    if (value <= 0f) return if (fx == PartyFx.AURA_SHARP) "Myk" else "Av"
    val tenths = round(value * 10f).toInt()
    return if (tenths % 10 == 0) "${tenths / 10}×" else "${tenths / 10},${tenths % 10}×"
}

/** De åtte gangetallene, standard 1. Les tallene effektene trenger herfra. */
class PartySettings {
    private val values = FloatArray(PartyFx.entries.size) { 1f }

    operator fun get(fx: PartyFx): Float = values[fx.ordinal]
    operator fun set(fx: PartyFx, value: Float) { values[fx.ordinal] = fx.clamp(value) }
    fun reset() = values.fill(1f)
    /** Alt står på 1×. */
    val isDefault: Boolean get() = values.all { it == 1f }

    /** Lysbølgenes sterkeste lys (før: [WAVE_ALPHA]). */
    val waveAlpha: Float get() = WAVE_ALPHA * this[PartyFx.WAVE_STRENGTH]
    /** Lysbølgenes bredde ved start og slutt (før: [WAVE_WIDTH_FROM] / [WAVE_WIDTH_TO]). */
    val waveWidthFrom: Float get() = WAVE_WIDTH_FROM * this[PartyFx.WAVE_WIDTH]
    val waveWidthTo: Float get() = WAVE_WIDTH_TO * this[PartyFx.WAVE_WIDTH]
    /** Minste tid mellom bølgene i ms (før: [RIPPLE_MIN_GAP_MS]). */
    val rippleGapMs: Long get() = (RIPPLE_MIN_GAP_MS / this[PartyFx.WAVE_OFTEN]).roundToLong()
    /** Ganges med ristingens dytt og vridning. */
    val shake: Float get() = this[PartyFx.SHAKE]
    /** Ganges med strobens styrke; 0 = ingen strobe. */
    val strobe: Float get() = this[PartyFx.STROBE]
    /** Ganges med heavy-blink og drop-treffet; 0 = ingen hvite blink. */
    val flashes: Float get() = this[PartyFx.FLASHES]
    /** Auraens utslag og skarphet ([OrbGeometry.auraSize] / [OrbGeometry.auraSharpness]). */
    val auraSize: Float get() = this[PartyFx.AURA_SIZE]
    val auraSharp: Float get() = this[PartyFx.AURA_SHARP]
}

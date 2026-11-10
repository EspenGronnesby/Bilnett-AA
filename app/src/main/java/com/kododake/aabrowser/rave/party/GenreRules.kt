package com.kododake.aabrowser.rave.party

import com.kododake.aabrowser.rave.Genre
import com.kododake.aabrowser.rave.HardstyleFrame
import kotlin.math.PI
import kotlin.math.sin

/**
 * EDM sub-styles (from the Mac style teacher's top Discogs style), like [com.kododake.aabrowser.rave.HardSub]
 * for hardstyle: how the drop feels. Research 2026-11-06: house pumps on every beat, dubstep/future bass/
 * EDM-trap are felt at half tempo, DnB is fast small sparks over a slow sub glow.
 */
internal enum class EdmSub(val label: String, val halfTime: Boolean, val particles: Float, val shake: Float,
                           val spike: Float, val strobe: Float) {
    HOUSE("HOUSE", false, 1f, .8f, 1f, 1f),
    BIG_ROOM("BIG ROOM", false, 1.1f, 1f, 1.15f, 1f),
    DUBSTEP("DUBSTEP", true, 1f, 1.2f, 1.2f, .9f),
    FUTURE_BASS("FUTURE BASS", true, 1.1f, .6f, .9f, .6f),
    DNB("DNB", false, 1.4f, .7f, .9f, .8f),
    TRAP("TRAP", true, .9f, 1f, 1f, .8f);

    companion object {
        /** The first EDM style among the teacher's top styles, or null. */
        fun from(styles: List<Pair<String, Float>>): EdmSub? = styles.firstNotNullOfOrNull { (name, _) ->
            if (!name.startsWith("Electronic---")) null else when (name.substringAfter("---")) {
                "House", "Tech House", "Deep House", "Electro House", "Progressive House", "Garage House" -> HOUSE
                "Big Room" -> BIG_ROOM
                "Dubstep", "Drumstep", "Bass Music", "Breakbeat" -> DUBSTEP
                "Future Bass" -> FUTURE_BASS
                "Drum n Bass", "Jungle" -> DNB
                "Trap" -> TRAP
                else -> null
            }
        }
    }
}

/**
 * What a genre adds on top of the shared Party visuals this frame. Multipliers are 1 = unchanged;
 * sway/bounce are -1..1 / 0..1 and turned into pixels by RaveActivity.
 */
internal data class GenreLook(
    /** Replaces the pump (kick) when set: e.g. rap's slow 808 pulse at felt tempo. */
    val kick: Float? = null,
    val spike: Float = 1f, val particles: Float = 1f, val shake: Float = 1f, val strobe: Float = 1f,
    /** Side-to-side sway (-1..1) and a little rotation (-1..1) of the whole scene. */
    val swayX: Float = 0f, val swayRot: Float = 0f,
    /** Upward bounce (0..1) of the whole scene. */
    val bounceY: Float = 0f,
    /** 0..1: shift the colours toward warm (reggae/reggaeton). */
    val warmth: Float = 0f
)

internal object GenreRules {
    /** Position in the current beat (0..1), or null without a steady beat grid. */
    fun beatPhase(f: HardstyleFrame, now: Long): Float? {
        val p = f.beatPeriod
        if (p <= 0f || f.beatAt <= 0L || now - f.beatAt > p * 2f) return null
        return ((((now - f.beatAt) / p) % 1f) + 1f) % 1f
    }

    /** Position over two beats (0..1): one slow sway per two beats, even beats first. */
    fun twoBeatPhase(f: HardstyleFrame, now: Long): Float? = beatPhase(f, now)?.let { ((f.beat % 2) + it) / 2f }

    /**
     * @param halfPulse the beat clock at half tempo (felt tempo for trap/dubstep), null when no grid
     * @param fullPulse the beat clock at the tracked tempo, null when no grid
     */
    fun look(genre: Genre, edm: EdmSub?, f: HardstyleFrame, halfPulse: Float?, fullPulse: Float?, now: Long): GenreLook =
        when (genre) {
            Genre.RAP -> {
                // Only strong 808s count (same gate as Genre.RAP.shape): a slow, heavy pulse at felt tempo,
                // shake only on those hits, small sparks from hi-hat rolls. Never strobe.
                val strong = ((f.bass - .55f) / .3f).coerceIn(0f, 1f) * (.5f + f.sub).coerceAtMost(1f)
                // (Shake already rides the gated kick, so it isn't gated a second time.)
                GenreLook(kick = (halfPulse ?: f.kick) * strong, particles = 1f + .6f * f.highMotion, strobe = 0f)
            }
            Genre.REGGAE -> {
                // Laid back: one sway per two beats, stronger with the offbeat skank; warm colours, calm.
                val ph = twoBeatPhase(f, now)
                val s = if (ph == null) 0f else sin(2f * PI.toFloat() * ph) * (.6f + .4f * f.offbeat.coerceIn(0f, 1f))
                GenreLook(swayX = s, swayRot = .5f * s, shake = 0f, strobe = 0f, warmth = 1f)
            }
            Genre.REGGAETON -> {
                // Dembow: a bounce on every kick (four per bar) and a side step over two beats; warm and bright.
                val ph = twoBeatPhase(f, now)
                GenreLook(bounceY = fullPulse ?: f.kick, swayX = if (ph == null) 0f else .6f * sin(2f * PI.toFloat() * ph),
                    shake = 0f, strobe = 0f, warmth = .7f)
            }
            Genre.POP -> GenreLook(shake = 0f, strobe = 0f)
            Genre.EDM -> if (edm == null) GenreLook() else GenreLook(
                kick = if (edm.halfTime) halfPulse else null,
                spike = edm.spike, particles = edm.particles, shake = edm.shake, strobe = edm.strobe)
            else -> GenreLook()
        }

    /** The bar: 0 → 40 %, 0.5 → as today, 1 → 160 % of the genre's own effects. */
    fun strengthMul(strength: Float) = .4f + 1.2f * strength.coerceIn(0f, 1f)

    /** Below this bar position nothing flashes. */
    const val STROBE_FROM_STRENGTH = .25f
}

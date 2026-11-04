package com.kododake.aabrowser.rave

import android.util.Log
import kotlin.math.exp
import kotlin.math.log10
import kotlin.math.max

/** Party profiles. Hardstyle is the original tuning; the others reshape what the visuals react to. */
internal enum class Genre(val label: String) {
    HARDSTYLE("HARDSTYLE"), RAP("RAP"), ROCK("ROCK"), EDM("EDM"), STANDARD("ROLIG")
}

/** How strong each effect is per genre (1 = original hardstyle strength). */
internal data class PartyProfile(
    val spike: Float, val particles: Float, val shake: Float, val strobe: Float,
    /** Particle count multiplier. */ val density: Float = 1f,
    /** 1 = sharp sparks (hardstyle); higher = bigger, softer, calmer bokeh. */ val softness: Float = 1f
)

internal fun Genre.profile(): PartyProfile = when (this) {
    // Hardstyle: maximum chaos on the raw drop (shake and spikes above the original strength).
    Genre.HARDSTYLE -> PartyProfile(spike = 1.15f, particles = 1.15f, shake = 1.35f, strobe = 1f)
    // Rap: no hardstyle sparks — a few big, slow, soft lights drifting out like smoke.
    Genre.RAP -> PartyProfile(spike = .75f, particles = .35f, shake = .35f, strobe = 0f, density = .35f, softness = 2.4f)
    Genre.ROCK -> PartyProfile(spike = 1f, particles = 1f, shake = 1f, strobe = .8f)
    Genre.EDM -> PartyProfile(spike = 1f, particles = 1f, shake = .8f, strobe = .9f)
    Genre.STANDARD -> PartyProfile(spike = .6f, particles = .7f, shake = 0f, strobe = 0f)
}

/**
 * Reshapes the audio frame so the existing hardstyle-tuned visuals react to what matters in
 * each genre: `kick` drives pump, `heavy` drives big spikes/drop effects, and ripples fire on
 * `bass > .72 && grit > .35`. Hardstyle passes through untouched.
 */
internal fun Genre.shape(f: HardstyleFrame): HardstyleFrame = when (this) {
    Genre.HARDSTYLE -> f
    // Rap: big, heavy pumping on 808 sub bass; ripples on 808 hits.
    // Rap: it should only hit now and then — on the strongest 808 hits, not every beat.
    Genre.RAP -> {
        val strong = ((f.bass - .6f) / .3f).coerceIn(0f, 1f) * (.5f + f.sub).coerceAtMost(1f)
        f.copy(
            kick = f.kick * strong,
            heavy = strong * strong * .6f,
            bass = f.bass * .9f,
            grit = if (f.sub > .55f && strong > .6f) 1f else 0f
        )
    }
    // Rock: drums and guitars in the mids — pump, shake and ripples on the snare.
    Genre.ROCK -> f.copy(
        kick = max(f.snare, f.kick * .6f),
        heavy = (f.snare * .6f + f.grit * .4f).coerceAtMost(1f),
        bass = max(f.bass * .7f, f.snare),
        grit = if (f.snare > .7f) 1f else 0f
    )
    // EDM: steady kicks; the big effects (ripples, strobe) only once the drop hits.
    Genre.EDM -> f.copy(
        heavy = max(f.heavy, f.energy * .6f * f.kick),
        grit = if (f.heavy > .3f) 1f else 0f
    )
    // Everything else: calm, no drop effects.
    Genre.STANDARD -> f.copy(heavy = 0f, grit = 0f, kick = f.kick * .5f)
}

/** Mixes two shaped frames for a soft (~1 s) change between profiles. */
internal fun blendFrames(a: HardstyleFrame, b: HardstyleFrame, t: Float): HardstyleFrame {
    fun l(x: Float, y: Float) = x + (y - x) * t
    return b.copy(bass = l(a.bass, b.bass), kick = l(a.kick, b.kick), heavy = l(a.heavy, b.heavy), grit = l(a.grit, b.grit))
}

// ---- Vibe meter: one vertical slider (0 = calm … 1 = full hardstyle/rock) replaces the genre buttons.
// 0 → ROLIG, .25 → RAP, .5 → EDM, 1 → HARD (hardstyle and rock fused, mixed by `rockness`).

/** Where the auto mode puts the slider for a detected genre. */
internal fun Genre.vibeTarget(): Float = when (this) {
    Genre.STANDARD -> 0f
    Genre.RAP -> .25f
    Genre.EDM -> .5f
    Genre.HARDSTYLE, Genre.ROCK -> 1f
}

/** 0..1: how far into the HARD part of the slider we are (0 at EDM, 1 at the top). */
internal fun hardWeight(v: Float) = ((v - .5f) / .5f).coerceIn(0f, 1f)
/** 0..1: how much song structure (calm intro, max on the drop) applies — off below RAP, full from EDM. */
internal fun structureWeight(v: Float) = ((v - .25f) / .25f).coerceIn(0f, 1f)

private fun lerpF(a: Float, b: Float, t: Float) = a + (b - a) * t
private fun lerpProfile(a: PartyProfile, b: PartyProfile, t: Float) = PartyProfile(
    lerpF(a.spike, b.spike, t), lerpF(a.particles, b.particles, t), lerpF(a.shake, b.shake, t),
    lerpF(a.strobe, b.strobe, t), lerpF(a.density, b.density, t), lerpF(a.softness, b.softness, t))

/**
 * HARD = hardstyle and rock merged into one: both reactions run all the time and the strongest
 * wins, every frame. Hardstyle hits on distorted bass kicks, rock on snares/guitar hits — so a
 * song gets whichever is harder (Espen found rock mode often harder than hardstyle mode, even
 * on hardstyle songs).
 */
@Suppress("UNUSED_PARAMETER")
internal fun hardFusion(f: HardstyleFrame, rockness: Float): HardstyleFrame {
    val rock = Genre.ROCK.shape(f)
    val edm = Genre.EDM.shape(f)
    return f.copy(
        kick = max(f.kick, rock.kick),
        heavy = maxOf(f.heavy, rock.heavy, edm.heavy),
        bass = max(f.bass, rock.bass),
        grit = maxOf(f.grit, rock.grit, edm.grit)
    )
}

/** The audio frame reshaped for slider value [v]. */
internal fun vibeShape(f: HardstyleFrame, v: Float, rockness: Float): HardstyleFrame = when {
    v <= .25f -> blendFrames(Genre.STANDARD.shape(f), Genre.RAP.shape(f), v / .25f)
    v <= .5f -> blendFrames(Genre.RAP.shape(f), Genre.EDM.shape(f), (v - .25f) / .25f)
    else -> {
        // Upper half: the merged hardstyle + rock reaction is fully in from ~65 % (so drum hits
        // in hardstyle songs keep landing); below the top it is just a bit weaker, not different.
        val h = hardWeight(v)
        val fused = hardFusion(f, rockness)
        val scaled = fused.copy(
            kick = fused.kick * (.7f + .3f * h),      // pump
            heavy = fused.heavy * (.6f + .4f * h),    // heaviness: spikes, shake, flash
            grit = fused.grit * (.8f + .2f * h)       // ripples around the cover
        )
        blendFrames(Genre.EDM.shape(f), scaled, ((v - .5f) / .15f).coerceIn(0f, 1f))
    }
}

/** Effect strengths for slider value [v]. */
internal fun vibeProfile(v: Float, rockness: Float): PartyProfile {
    // Strongest of both profiles per effect (in practice the hardstyle one, which is the bigger).
    val hs = Genre.HARDSTYLE.profile(); val rk = Genre.ROCK.profile()
    val hard = PartyProfile(max(hs.spike, rk.spike), max(hs.particles, rk.particles),
        max(hs.shake, rk.shake), max(hs.strobe, rk.strobe))
    return when {
        v <= .25f -> lerpProfile(Genre.STANDARD.profile(), Genre.RAP.profile(), v / .25f)
        v <= .5f -> lerpProfile(Genre.RAP.profile(), Genre.EDM.profile(), (v - .25f) / .25f)
        else -> lerpProfile(Genre.EDM.profile(), hard, hardWeight(v))
    }
}

/** Apple Music's genre name → profile, or null when it does not say enough. */
internal fun genreFromApple(name: String?): Genre? {
    val g = name?.lowercase() ?: return null
    return when {
        "hardstyle" in g || "hardcore" in g || "hard dance" in g -> Genre.HARDSTYLE
        "hip-hop" in g || "hip hop" in g || "rap" in g || "trap" in g || "drill" in g -> Genre.RAP
        "metal" in g || "rock" in g || "punk" in g || "alternative" in g || "grunge" in g -> Genre.ROCK
        "dance" in g || "electronic" in g || "house" in g || "techno" in g || "trance" in g ||
            "edm" in g || "dubstep" in g || "drum" in g -> Genre.EDM
        else -> null
    }
}

/**
 * Picks the Party profile automatically. Apple Music's genre answers immediately when it is
 * clear; otherwise the sound decides after ~8 s (tempo, distortion, sub bass, snare and kick
 * rates). A new profile is only adopted after the evidence holds for ~6 s.
 */
internal class GenreDetector {
    var genre = Genre.HARDSTYLE
        private set
    var previous = Genre.HARDSTYLE
        private set
    var changedAt = 0L
        private set
    /** Time the profile was last shown/confirmed — once per song, and on every change. */
    var announcedAt = 0L
        private set
    private var announcedThisTrack = false

    private var apple: Genre? = null
    /** Chosen by hand with the genre buttons; null = automatic. */
    var manual: Genre? = null
        private set

    fun setManual(g: Genre?, now: Long) {
        manual = g
        if (g != null) commit(g, now, "valgt")
        announcedAt = now
    }
    private var appleName: String? = null
    private var trackStart = 0L
    private var lastUpdate = 0L
    private var candidate = Genre.HARDSTYLE
    private var candidateSince = 0L

    // Rolling (~8 s) statistics of the sound.
    private var grit = 0f
    private var sub = 0f
    private var kickRate = 0f
    private var snareRate = 0f
    private var lastKick = 0f
    private var lastSnare = 0f
    private var lastLog = 0L
    private var dropSince = 0L
    /** Once a song has proven to be hardstyle, it stays hardstyle (calm parts are handled by SongPhase). */
    private var hardstyleThisTrack = false
    val provenHardstyle: Boolean get() = hardstyleThisTrack

    /**
     * 0 = the HARD reaction is pure hardstyle, 1 = pure rock. Rises with live drums (snare hits
     * without a dense four-on-the-floor kick, little sub bass); held at 0 once a song has shown
     * real zaag distortion. Only learned in loud parts: build-ups/breakdowns lose the kick and
     * have snare rolls, which would otherwise look like rock.
     */
    var rockness = .1f
        private set

    fun newTrack(now: Long) {
        apple = null; appleName = null; trackStart = now; announcedThisTrack = false; hardstyleThisTrack = false
        rockness = .1f
        candidate = genre; candidateSince = now
    }

    fun setAppleGenre(name: String?, now: Long) {
        appleName = name
        apple = genreFromApple(name)
        val a = apple ?: return
        // Apple's "Dance" may still be hardstyle; let the sound decide that part.
        if (manual == null && a != Genre.EDM) { commit(a, now, "apple"); announce(now) }
    }

    private fun announce(now: Long) { announcedAt = now; announcedThisTrack = true }

    fun update(f: HardstyleFrame, now: Long): Genre {
        val dt = if (lastUpdate == 0L) 0f else ((now - lastUpdate) / 1000f).coerceIn(0f, .2f)
        lastUpdate = now
        val decay = exp(-dt / 8f)
        fun avg(old: Float, v: Float) = old * decay + v * (1f - decay)
        grit = avg(grit, f.grit)
        sub = avg(sub, f.sub)
        // Event rates (per second), counted on rising edges of the pulses.
        val kickHit = if (f.kick > .95f && lastKick <= .95f) 1f else 0f
        val snareHit = if (f.snare > .95f && lastSnare <= .95f) 1f else 0f
        lastKick = f.kick; lastSnare = f.snare
        kickRate = kickRate * decay + kickHit / 8f
        snareRate = snareRate * decay + snareHit / 8f

        updateRockness(f, dt)

        if (now - lastLog >= 5_000L) {
            lastLog = now
            Log.d("RaveGenre", "nå=${genre.label} apple=$appleName bpm=%.0f grit=%.2f sub=%.2f kick/s=%.2f snare/s=%.2f rock=%.2f → lyd sier ${audioGuess(f.bpm).label}"
                .format(f.bpm, grit, sub, kickRate, snareRate, rockness))
        }
        manual?.let { if (it != genre) commit(it, now, "valgt"); return genre }
        // Raw drop: heavy, distorted bass right now → hardstyle chaos within ~1 s, in any song,
        // without waiting for the slow averages.
        // Not for songs Apple calls rock/metal: metalcore breakdowns are heavy and distorted too.
        if (apple != Genre.ROCK && f.heavy > .45f && f.grit > .3f) { if (dropSince == 0L) dropSince = now } else if (f.heavy < .2f) dropSince = 0L
        if (dropSince > 0L && now - dropSince >= 800L && genre != Genre.HARDSTYLE) commit(Genre.HARDSTYLE, now, "rått drop")
        if ((apple == null || apple == Genre.EDM) && now - trackStart < 8_000L) return genre
        // Show what we think once per song, even when the profile stays the same.
        if (!announcedThisTrack) announce(now)
        // Follow the song section by section, so the visuals always fit what is playing now:
        //  - calm parts (intro, breakdown, quiet verse) → calm PARTY profile
        //  - heavy, distorted parts (zaag drop, heavy section) → HARDSTYLE, in any song
        //  - otherwise the song's own genre (Apple), or the sound's guess if Apple doesn't know.
        val audio = audioGuess(f.bpm)
        val calm = f.energy < .2f
        // Apple's "Dance" at hardstyle tempo is hardstyle (euphoric hardstyle has little distortion).
        // 138–210 BPM covers hardstyle, rawstyle, hardcore and uptempo.
        val hardstyleTempo = f.bpm in 138f..250f
        // Obvious hardstyle (fast four-on-the-floor) beats Apple's label — rap never has a steady
        // 150+ BPM kick (log 2026-11-03: a raw track was tagged "Hip-Hop/Rap").
        val obviousHardstyle = hardstyleTempo && kickRate > 2.2f
        val target = when {
            hardstyleThisTrack -> Genre.HARDSTYLE
            obviousHardstyle && apple != Genre.ROCK -> Genre.HARDSTYLE
            apple == Genre.EDM && hardstyleTempo -> Genre.HARDSTYLE
            // Apple's "Dance" with strong distortion is raw hardstyle, even when kicks dip.
            apple == Genre.EDM && grit > .25f -> Genre.HARDSTYLE
            dropSince > 0L -> Genre.HARDSTYLE
            calm -> Genre.STANDARD
            audio == Genre.HARDSTYLE -> Genre.HARDSTYLE
            apple != null -> apple!!
            else -> audio
        }
        if (target == Genre.HARDSTYLE && genre == Genre.HARDSTYLE) hardstyleThisTrack = true
        if (target != candidate) { candidate = target; candidateSince = now }
        val needed = when {
            genre == Genre.STANDARD && !calm -> 1_500L          // the drop after a breakdown hits fast
            candidate == Genre.HARDSTYLE && grit > .3f -> 2_000L // clear zaag
            candidate == Genre.STANDARD -> 5_000L                // only calm down after a real calm part
            else -> 6_000L
        }
        if (candidate != genre && now - candidateSince >= needed) commit(candidate, now, if (calm) "rolig del" else "lyd")
        return genre
    }

    private fun updateRockness(f: HardstyleFrame, dt: Float) {
        val target = when {
            hardstyleThisTrack || apple == Genre.HARDSTYLE -> 0f
            // Steady fast four-on-the-floor kick = hardstyle/EDM, not live drums.
            f.bpm in 138f..250f && kickRate > 2.2f -> 0f
            else -> {
                val fewKicks = ((2.5f - kickRate) / .8f).coerceIn(0f, 1f)
                val snares = ((snareRate - .6f) / 1f).coerceIn(0f, 1f)
                val lowSub = 1f - .5f * ((sub - .5f) / .15f).coerceIn(0f, 1f)
                val sound = fewKicks * (.4f + .6f * snares) * lowSub
                if (apple == Genre.ROCK) max(sound, .7f) else sound
            }
        }
        // Proven hardstyle drops straight away; otherwise learn slowly and only while it is loud.
        if (hardstyleThisTrack || apple == Genre.HARDSTYLE) rockness = 0f
        else if (f.energy > .4f) rockness += (target - rockness) * (1f - exp(-dt / 4f))
    }

    // Tuned on real songs (log 2026-11-03, hardstyle + rap): hardstyle shows strong distortion
    // (grit .3–.57) and dense kicks (2.3–3.4/s) whether the sub bass is high or low. Rock gets
    // distortion from guitars but has fewer kicks (< 2.2/s). Tempo jumps a lot → only support.
    // Rock is mainly recognised via Apple's genre; the sound rule is deliberately strict.
    private fun audioGuess(bpm: Float): Genre = when {
        // Metal double-kick also gives many kicks: hardstyle needs its tempo window too.
        grit > .25f && kickRate >= 2.3f && bpm in 138f..250f -> Genre.HARDSTYLE
        grit > .2f && sub > .53f && kickRate > 2.3f && bpm in 138f..250f -> Genre.HARDSTYLE
        // Hysteresis: stay in hardstyle until the distortion has really gone.
        genre == Genre.HARDSTYLE && grit > .12f && kickRate >= 2f -> Genre.HARDSTYLE
        grit > .2f && kickRate < 2.2f && sub < .5f && snareRate > 1.2f -> Genre.ROCK
        sub > .6f && grit < .15f && (bpm < 110f || kickRate < 2f) -> Genre.RAP
        bpm in 118f..136f && kickRate >= 1.8f && grit < .2f -> Genre.EDM
        else -> Genre.STANDARD
    }

    private fun commit(g: Genre, now: Long, why: String) {
        if (g == genre) return
        previous = genre; genre = g; changedAt = now; candidate = g; candidateSince = now
        announcedAt = now
        if (g == Genre.HARDSTYLE && why != "valgt") hardstyleThisTrack = true
        Log.d("RaveGenre", "→ ${g.label} ($why) apple=$appleName grit=%.2f sub=%.2f kick/s=%.2f snare/s=%.2f"
            .format(grit, sub, kickRate, snareRate))
    }

    /** 0..1 progress of the soft change from [previous] to [genre]. */
    fun transition(now: Long): Float = ((now - changedAt) / 1000f).coerceIn(0f, 1f)
}

/**
 * Where we are in a hardstyle/EDM song, and how wild the visuals should be there.
 *
 * Typical raw/zaag hardstyle (150–160 BPM): intro (often just kicks for DJs to mix — still the
 * start, so calm) → breakdown (no kick, melody/vocals) → build-up (snare rolls getting denser,
 * risers) → DROP (distorted raw/zaag kick returns, screeches) → mid-intro → breakdown →
 * build-up → final drop → outro. Calm at the start, rising in the build-up, maximum chaos on
 * the drop — strongest right as it hits.
 */
internal enum class SongPart(val label: String) {
    INTRO("intro"), VOCAL("synging"), BREAKDOWN("breakdown"), BUILDUP("build-up"),
    DROP("drop"), GROOVE("mellom drops"), OUTRO("avslutning"),
    /** Raw hardstyle: where a melodic climax would be, a dark, sparse part with screeches and kick rolls. */
    ANTI_CLIMAX("anti-climax")
}

/** Which drop this is: the first is strong, middle drops full, the last one (in the final part
 * of the song) the hardest. PENDING = the first 2 s, before we know it is not a fake drop. */
internal enum class DropKind(val label: String) { NONE(""), PENDING("DROP"), FIRST("FØRSTE DROP"), MIDDLE("DROP"), LAST("SISTE DROP") }

/** What the analysis sees right now — shown live on screen (HUD) and logged once per bar. */
internal data class StructureHud(
    val part: String = "INTRO", val barInPhrase: Int = 0, val phrase: Int = 0, val ready: Boolean = false,
    val subRelDb: Float = 0f, val airTrendDb: Float = 0f, val build: Float = 0f, val grit: Float = 0f,
    val screech: Float = 0f, val vocalHint: Boolean = false, val bpm: Float = 0f
)

/**
 * Hardstyle song structure, counted in bars and phrases the way the music is built
 * (research 2026-11-03): sections come in blocks of 8/16/32 bars. Everything is measured in dB
 * RELATIVE to the last ~8 s, not against fixed levels.
 *  - BUILD-UP: over several seconds the sub-bass falls (filtered away) while treble/onsets rise.
 *  - DROP: the sub-bass slams back ≥ +6 dB over its recent average → hit at once, then confirmed
 *    after 1 bar (still ≥ +3 dB) — otherwise it was a FAKE DROP.
 *  - Leaving a drop and other section changes need a whole bar of evidence, so a zaag kick
 *    (energy jumping between sub and mids every beat) can't flip the section by itself.
 */
/** No new drop within this time of a confirmed one. */
internal const val DROP_LOCKOUT_MS = 16_000L

internal class HardstyleStructure {
    var part = SongPart.INTRO
        private set
    var dropKind = DropKind.NONE
        private set
    val effectsAllowed: Boolean get() = part == SongPart.DROP && dropKind != DropKind.PENDING
    var label = ""
        private set
    var labelAt = 0L
        private set
    var hud = StructureHud()
        private set
    /** Confirmed (real) drops so far in this song. */
    val drops: Int get() = realDrops

    private var lastUpdate = 0L
    private var trackStart = 0L
    private var partSince = 0L
    // dB trends (fast ~0.25 s, short ~1 s, long ~8 s)
    private var subFast = 0f; private var sub1 = 0f; private var sub8 = 0f
    private var air1 = 0f; private var air8 = 0f
    private var grit1 = 0f
    // Noise risers (flatness) and filter sweeps (centroid), fast vs slow (FastLED-style trend).
    private var noise1 = 0f; private var noise8 = 0f
    private var lastRealDropAt = 0L
    private var subRef = 0f        // sub peak-hold (falls slowly, ~25 s)
    private var subMin = 0f        // recent sub minimum (rises 1.5 dB/s)
    private var snareRate = 0f; private var lastSnare = 0f
    private var lastKick = 0f; private var lastKickAt = 0L
    private var started = false
    // section state
    private var primed = false
    private var introOver = false
    private var buildSince = 0L
    private var notBuildSince = 0L
    private var dropHitAt = 0L
    private var dropBaseline = 0f
    private var dropSubAtHit = 0f
    private var dropLowSince = 0L
    private var realDrops = 0
    private var boostNext = false
    private var dropBoost = 0f
    private var intensity = .4f
    private var lastBannerAt = 0L
    // phrase grid
    private val phaseVotes = IntArray(32)
    private var lastBarLogged = -1

    fun newTrack(now: Long) {
        part = SongPart.INTRO; dropKind = DropKind.NONE; label = ""; labelAt = 0L; hud = StructureHud()
        trackStart = now; partSince = now; started = false
        primed = false; introOver = false; buildSince = 0L; notBuildSince = 0L; dropHitAt = 0L; dropLowSince = 0L
        realDrops = 0; boostNext = false; dropBoost = 0f; intensity = .4f; lastBannerAt = 0L
        phaseVotes.fill(0); lastBarLogged = -1; lastKickAt = 0L; snareRate = 0f; grit1 = 0f
        noise1 = 0f; noise8 = 0f; lastRealDropAt = 0L
    }

    // Floor 2.5: 8-bit FFT values of 0/1 would otherwise flicker ±6 dB in quiet parts.
    private fun db(x: Float) = 20f * log10(max(x, 2.5f))

    private fun show(text: String, now: Long, always: Boolean = false) {
        if (!always && (text == label || now - lastBannerAt < 6_000L)) return
        label = text; labelAt = now; lastBannerAt = now
    }

    private fun enter(next: SongPart, now: Long, why: String) {
        if (next == part) return
        Log.d("RaveGenre", "del: ${part.label} → ${next.label} ($why)")
        part = next; partSince = now
        when (next) {
            SongPart.BUILDUP -> { primed = true; introOver = true; show("BUILD-UP", now) }
            SongPart.BREAKDOWN -> { primed = true; introOver = true; show("BREAKDOWN", now) }
            SongPart.VOCAL -> { primed = true; introOver = true; show("BREAKDOWN (SYNG?)", now) }
            SongPart.ANTI_CLIMAX -> { primed = true; introOver = true; show("ANTI-CLIMAX", now) }
            else -> {}
        }
    }

    fun update(f: HardstyleFrame, now: Long, positionMs: Long = -1L, durationMs: Long = -1L): Float {
        val dt = if (lastUpdate == 0L) 0f else ((now - lastUpdate) / 1000f).coerceIn(0f, .2f)
        lastUpdate = now
        if (trackStart == 0L) { trackStart = now; partSince = now }
        fun ema(old: Float, v: Float, s: Float) = old + (v - old) * (1f - exp(-dt / s))
        val subDb = db(f.subLevel); val airDb = db(f.air)
        if (!started) {
            subFast = subDb; sub1 = subDb; sub8 = subDb; air1 = airDb; air8 = airDb; subRef = subDb; subMin = subDb
            noise1 = f.noise; noise8 = f.noise; started = true
        }
        subFast = ema(subFast, subDb, .25f); sub1 = ema(sub1, subDb, 1f); sub8 = ema(sub8, subDb, 8f)
        subRef = max(sub1, subRef - dt * (6f / 25f))      // peak-hold, falls ~6 dB over 25 s
        subMin = minOf(sub1, subMin + dt * 1.5f)          // recent low point
        air1 = ema(air1, airDb, 1f); air8 = ema(air8, airDb, 8f)
        grit1 = ema(grit1, f.grit, 1f)
        noise1 = ema(noise1, f.noise, 1f); noise8 = ema(noise8, f.noise, 8f)
        val kickHit = f.kick > .95f && lastKick <= .95f
        val snareHit = f.snare > .95f && lastSnare <= .95f
        lastKick = f.kick; lastSnare = f.snare
        if (kickHit) lastKickAt = now
        snareRate = snareRate * exp(-dt / 2f) + (if (snareHit) 1f else 0f) / 2f

        val barMs = if (f.bpm in 100f..260f) 240_000f / f.bpm else 1600f
        val subRel = sub1 - sub8          // dB vs the last ~8 s
        val subHitRel = subFast - sub8
        val airTrend = air1 - air8
        val songFraction = if (durationMs > 0L && positionMs >= 0L) positionMs.toFloat() / durationMs else -1f
        val remainingMs = if (durationMs > 0L && positionMs >= 0L) durationMs - positionMs else -1L
        val kickGone = lastKickAt == 0L || now - lastKickAt > barMs     // no kick for a whole bar
        // Hardstyle intros are 16–32 bars; after 32 bars without anything else it is over.
        if (!introOver && now - trackStart > 32 * barMs) introOver = true

        // Build-up intensity (after FastLED's buildup detector): sub falling + treble rising +
        // denser snare rolls. Needs the treble/rolls part, so a sub dip alone (zaag) isn't one.
        // Risers: white noise gets flatter, filter sweeps push the centroid up (research 2026-11-04).
        // Only flatness (the centroid also climbs when the kick simply leaves), and only while the
        // treble is actually rising — a breakdown that just loses its drums is not a riser.
        val riser = if (airTrend > 0f) ((noise1 - noise8) / .12f).coerceIn(0f, 1f) else 0f
        val build = (.4f * (-subRel / 6f).coerceIn(0f, 1f) + .25f * (airTrend / 4f).coerceIn(0f, 1f) +
            .15f * ((snareRate - 1f) / 3f).coerceIn(0f, 1f) + .2f * riser)
        val buildEvidence = build >= .55f && subRel < -3f && (airTrend > 1.5f || snareRate > 2f || riser > .5f)
        if (buildEvidence) { if (buildSince == 0L) buildSince = now; notBuildSince = 0L }
        else { if (notBuildSince == 0L) notBuildSince = now; if (now - notBuildSince > 1_000L) buildSince = 0L }

        // ---- section state machine ----
        when (part) {
            SongPart.DROP -> {
                // Confirm after one bar: the sub must still be well above where it was before.
                if (dropKind == DropKind.PENDING && now - dropHitAt >= barMs) {
                    if (sub1 - dropBaseline >= 3f) {
                        realDrops++
                        lastRealDropAt = dropHitAt
                        primed = false
                        dropBoost = if (boostNext) .1f else 0f; boostNext = false
                        dropKind = when {
                            songFraction >= .6f -> DropKind.LAST
                            realDrops == 1 -> DropKind.FIRST
                            else -> DropKind.MIDDLE
                        }
                        show(dropKind.label, now, always = true)
                        Log.d("RaveGenre", "ekte drop #$realDrops → ${dropKind.label} (%.0f%% ut, sub +%.1f dB)".format(songFraction * 100f, sub1 - dropBaseline))
                    } else {
                        boostNext = true
                        dropKind = DropKind.NONE
                        // Raw: screeches over a held-back low end is the anti-climax, not a failed drop.
                        if (f.screech > .35f && grit1 > .25f) {
                            Log.d("RaveGenre", "ANTI-CLIMAX (sub bare +%.1f dB, screech %.2f)".format(sub1 - dropBaseline, f.screech))
                            enter(SongPart.ANTI_CLIMAX, now, "anti-climax")
                        } else {
                            show("FAKE DROP", now, always = true)
                            Log.d("RaveGenre", "FAKE DROP (sub bare +%.1f dB etter 1 takt)".format(sub1 - dropBaseline))
                            enter(if (kickGone) SongPart.BREAKDOWN else SongPart.BUILDUP, now, "fake drop")
                        }
                        primed = true
                    }
                }
                // Leave the drop when the sub stays ≥ 6 dB under its drop level for a whole bar.
                if (part == SongPart.DROP && dropKind != DropKind.PENDING) {
                    if (sub1 < dropSubAtHit - 6f || kickGone) { if (dropLowSince == 0L) dropLowSince = now } else dropLowSince = 0L
                    if (dropLowSince > 0L && now - dropLowSince >= barMs) {
                        dropKind = DropKind.NONE; dropBoost = 0f; dropLowSince = 0L
                        enter(when {
                            kickGone -> SongPart.BREAKDOWN
                            buildSince > 0L -> SongPart.BUILDUP
                            else -> SongPart.GROOVE
                        }, now, "bassen borte i 1 takt")
                    }
                }
            }
            else -> {
                // DROP HIT: after a build-up/breakdown (or still in the intro), the sub slams back
                // ≥ +6 dB over its recent average with a kick → at once, no delay.
                // No new drop within 16 s of a confirmed one (a drop lasts ≥ 8 bars; kick rolls and
                // re-entries inside it are not new drops — FastLED/Yadati use a similar lockout).
                // 8 bars at most, so fast uptempo/frenchcore drops close together are still caught.
                val lockedOut = lastRealDropAt > 0L && now - lastRealDropAt < minOf(DROP_LOCKOUT_MS, (8 * barMs).toLong())
                val mayDrop = !lockedOut && (primed || part == SongPart.BUILDUP || part == SongPart.BREAKDOWN ||
                    part == SongPart.VOCAL || part == SongPart.ANTI_CLIMAX)
                // Also after a short build-up (where the 8 s average hasn't sunk much): the sub is back
                // near its peak level after a clear dip of ≥ 6 dB.
                val backFromDip = subFast - subMin >= 6f && subFast >= subRef - 3f
                if (mayDrop && (subHitRel >= 6f || backFromDip) && f.subLevel > 8f && now - lastKickAt < 300L) {
                    dropHitAt = now; dropBaseline = minOf(sub8, subMin + 3f); dropSubAtHit = subFast
                    dropKind = DropKind.PENDING; introOver = true
                    voteBoundary(f.beat)
                    enter(SongPart.DROP, now, "sub +%.1f dB".format(subHitRel))
                } else {
                    val next = when {
                        remainingMs in 0L..(16 * barMs).toLong() && now - trackStart > 30_000L -> SongPart.OUTRO
                        buildSince > 0L && now - buildSince >= 2_000L -> SongPart.BUILDUP
                        part == SongPart.BUILDUP && buildSince > 0L -> SongPart.BUILDUP
                        // Raw anti-climax: after a build-up/breakdown, screeches while the low end stays held back.
                        primed && (part == SongPart.BUILDUP || part == SongPart.BREAKDOWN || part == SongPart.ANTI_CLIMAX) &&
                            f.screech > .35f && subRel < -2f && !kickGone && grit1 > .25f -> SongPart.ANTI_CLIMAX
                        kickGone && part != SongPart.INTRO -> if (f.presence > 3f && f.highs > .08f) SongPart.VOCAL else SongPart.BREAKDOWN
                        kickGone && part == SongPart.INTRO && now - trackStart > 8_000L -> SongPart.BREAKDOWN
                        !introOver -> SongPart.INTRO
                        else -> SongPart.GROOVE
                    }
                    // Other changes need a bar of evidence (not one beat).
                    if (next != part && now - partSince >= barMs.toLong()) {
                        enter(next, now, "takt-bevis")
                    }
                }
            }
        }

        // Phrase grid: 32 beats = 8 bars; phase locked by votes from section changes.
        val phase = phaseVotes.indices.maxByOrNull { phaseVotes[it] } ?: 0
        val pos = ((f.beat - phase) % 32 + 32) % 32
        val barInPhrase = pos / 4 + 1
        val phrase = Math.floorDiv(f.beat - phase, 32) + 1
        val partName = when (part) {
            SongPart.DROP -> if (dropKind == DropKind.PENDING) "DROP?" else dropKind.label.ifBlank { "DROP" }
            SongPart.BUILDUP -> "BUILD-UP %.0f%%".format(build * 100f)
            SongPart.VOCAL -> "BREAKDOWN (SYNG?)"
            else -> part.label.uppercase()
        }
        hud = StructureHud(partName, barInPhrase, phrase, primed, subRel, airTrend, build, grit1, f.screech,
            part == SongPart.VOCAL, f.bpm)
        // One log line per bar (same picture as the HUD).
        val bar = f.beat / 4
        if (bar != lastBarLogged) {
            lastBarLogged = bar
            // Names go in as %s arguments: a name containing "%" must never be read as a format code.
            Log.d("RaveGenre", "takt %d/8 frase %d | %s | sub %+.1f dB (treff %+.1f) diskant %+.1f dB build %.0f%% grit %.2f snare/s %.1f klar=%b"
                .format(barInPhrase, phrase, partName, subRel, subHitRel, airTrend, build * 100f, grit1, snareRate, primed))
        }

        val boost = dropBoost
        val target = when (part) {
            SongPart.INTRO -> .4f
            SongPart.BREAKDOWN, SongPart.VOCAL -> .2f
            SongPart.BUILDUP -> (.4f + build * .35f).coerceIn(.4f, .75f)
            SongPart.DROP -> when (dropKind) {
                DropKind.PENDING -> .9f
                DropKind.FIRST -> .9f + boost
                DropKind.MIDDLE -> 1f + boost
                DropKind.LAST -> 1.2f + boost
                DropKind.NONE -> 1f
            }
            SongPart.GROOVE -> .55f
            SongPart.ANTI_CLIMAX -> .6f
            SongPart.OUTRO -> .35f
        }
        val rate = if (target > intensity && part == SongPart.DROP) .05f else .6f
        intensity += (target - intensity) * (1f - exp(-dt / rate))
        return intensity
    }

    private fun voteBoundary(beat: Int) { phaseVotes[((beat % 32) + 32) % 32]++ }
}

/** Hardstyle sub-genres — each gets its own feel inside the hardstyle profile. */
internal enum class HardSub(val label: String, val shake: Float, val strobe: Float, val spike: Float,
                            val particles: Float, val screech: Float) {
    // Big melodies and vocals, clean kicks: bright and soaring, less shaking.
    EUPHORIC("EUFORISK", shake = .6f, strobe = .6f, spike = .9f, particles = 1f, screech = 0f),
    // Distorted raw/zaag kicks and screeches: dark and aggressive.
    RAW("RAW", shake = 1f, strobe = 1f, spike = 1f, particles = 1f, screech = 1.3f),
    // Very distorted, heavy kicks at 160–190 BPM: heavy and hard.
    HARDCORE("HARDCORE", shake = 1.1f, strobe = .9f, spike = 1f, particles = 1.1f, screech = 1f),
    // 190–220+ BPM: fast and dense — many particles, slightly less shake per kick.
    UPTEMPO("UPTEMPO", shake = .9f, strobe = .8f, spike = 1f, particles = 1.2f, screech = .8f),
    // 220–250 BPM, distorted kicks with offbeat bass: very fast — lots of particles, lighter shake.
    FRENCHCORE("FRENCHCORE", shake = .8f, strobe = .7f, spike = 1f, particles = 1.3f, screech = .7f)
}

/** Picks the hardstyle sub-genre from tempo, distortion and screeches (stable per song). */
internal class HardSubDetector {
    var sub = HardSub.RAW
        private set
    var changedAt = 0L
        private set
    private val bpms = FloatArray(12)
    private var n = 0
    private var idx = 0
    private var lastSample = 0L
    private var grit = 0f
    private var screech = 0f
    private var offbeat = 0f
    private var lastUpdate = 0L
    private var candidate = HardSub.RAW
    private var candidateSince = 0L

    private var decidedThisTrack = false
    fun newTrack() { n = 0; idx = 0; grit = 0f; screech = 0f; decidedThisTrack = false }

    fun update(f: HardstyleFrame, now: Long): HardSub {
        val dt = if (lastUpdate == 0L) 0f else ((now - lastUpdate) / 1000f).coerceIn(0f, .2f)
        lastUpdate = now
        val d = exp(-dt / 8f)
        grit = grit * d + f.grit * (1f - d)
        screech = screech * d + f.screech * (1f - d)
        offbeat = offbeat * d + f.offbeat * (1f - d)
        if (f.bpm > 0f && now - lastSample >= 1_000L) {
            lastSample = now; bpms[idx] = f.bpm; idx = (idx + 1) % bpms.size; n = minOf(n + 1, bpms.size)
        }
        if (n < 5) return sub
        val bpm = bpms.copyOf(n).sorted()[n / 2]
        val guess = when {
            // Tempo ranges from research 2026-11-04: hardcore 160–180, uptempo 190–220+, frenchcore up to 250.
            bpm >= 222f -> HardSub.FRENCHCORE
            bpm >= 188f -> HardSub.UPTEMPO
            bpm >= 162f -> HardSub.HARDCORE
            // Reverse bass between the kicks + only moderate distortion = euphoric, even with bright leads.
            offbeat > .5f && grit < .35f -> HardSub.EUPHORIC
            grit > .22f || screech > .08f -> HardSub.RAW
            else -> HardSub.EUPHORIC
        }
        if (guess != candidate) { candidate = guess; candidateSince = now }
        // First decision per song after 12 s; after that it is locked unless the sound is clearly
        // different for 40 s (a drop briefly sounding "euphoric" must not flip it).
        val needed = if (decidedThisTrack) 40_000L else 12_000L
        if (candidate != sub && now - candidateSince >= needed || (!decidedThisTrack && candidate == sub && now - candidateSince >= 12_000L)) {
            decidedThisTrack = true
            if (candidate == sub) return sub
            sub = candidate; changedAt = now
            Log.d("RaveGenre", "undersjanger → ${sub.label} (bpm=%.0f grit=%.2f screech=%.2f)".format(bpm, grit, screech))
        }
        return sub
    }
}

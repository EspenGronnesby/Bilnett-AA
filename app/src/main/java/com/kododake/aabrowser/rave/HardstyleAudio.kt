package com.kododake.aabrowser.rave

import kotlin.math.*

// ---- Detection tunables (research 2026-11-04, see FestivalShow.kt for the show side) ----
/** Song reference: the loudest bass of the last ~25 s (decays slowly), so a breakdown after a drop is
 *  NOT auto-gained back up to "loud" within 3 s (WLED/FastLED: slow AGC + noise gate). */
internal const val SONG_REF_DECAY_S = 25f
/** Auto-gain never normalises against less than this share of the song reference. */
internal const val SONG_REF_SHARE = .55f
/** Bass below this share of the song reference (≈ −20 dB) counts as silence (noise gate). */
internal const val QUIET_GATE = .1f
/** Zaag/distortion is measured in the kick's TAIL (research: tail = 50–250 ms after the hit), so pads,
 *  leads and vocals between kicks don't count as distortion. */
internal const val GRIT_TAIL_FROM_MS = 50L
/** Grit only counts when the bass is at least this share of the song's loud level (full from +range). */
internal const val GRIT_BASS_FROM = .45f
internal const val GRIT_BASS_RANGE = .3f
/** Bass this strong (norm) keeps the beat going through missed kicks (dense zaag drops). */
internal const val FLYWHEEL_NORM = .55f
/** The teacher's tempo wins when its spacing has at least this share of the strongest spacing's votes. */
internal const val HINT_MIN_SHARE = .3f
/** At most this many filled-in kicks in a row while the bass stays strong. */
internal const val FLYWHEEL_BEATS = 8
/** Kick value of a flywheel beat (under the .95 the song structure counts as a heard kick). */
internal const val FLYWHEEL_KICK = .85f
internal const val GRIT_TAIL_TO_MS = 250L

internal data class HardstyleFrame(val bass: Float = 0f, val kick: Float = 0f, val highs: Float = 0f,
    val energy: Float = 0f, val burst: Float = 0f, val build: Float = 0f,
    val spectrum: List<Float> = SILENT_SPECTRUM, val highMotion: Float = 0f,
    /** 0..1: heavy, distorted bass (zaag kicks, big drops). 0 for ordinary music. */
    val heavy: Float = 0f,
    /** 0..1: distortion on strong bass only (no drop/loudness lift mixed in). */
    val grit: Float = 0f,
    /** Tempo estimated from kick spacing (0 = unknown yet). */
    val bpm: Float = 0f,
    /** Pulse 0..1 on drum/guitar attacks in 1–4 kHz (snare). */
    val snare: Float = 0f,
    /** Pulse 0..1 on cymbal/crash bursts in 6–12 kHz. */
    val crash: Float = 0f,
    /** 0..1: how much of the bass is deep sub (30–90 Hz) — high for 808s. */
    val sub: Float = 0f,
    /** Raw (not auto-gained) bass level, so a song can be compared against its own loudest part. */
    val level: Float = 0f,
    /** 0..1 while a raw-hardstyle screech (sustained, distorted lead ~1.2–5 kHz) is sounding. */
    val screech: Float = 0f,
    /** Raw deep-bass level only (30–250 Hz) — drops when the bass is filtered away in a build-up. */
    val bassLevel: Float = 0f,
    /** Raw high-treble level (6–12 kHz) — rises with risers in a build-up. */
    val air: Float = 0f,
    /** Raw sub-bass level (30–90 Hz) — leaves in a build-up, slams back on the drop. */
    val subLevel: Float = 0f,
    /** Raw presence level (1.2–5 kHz) — zaag/screech/vocals live here. */
    val presence: Float = 0f,
    /** Beats counted by the beat tracker (heard + filled in) since the song started. */
    val beat: Int = 0,
    /** Beat clock: time (uptime ms) of the last grid beat, its period (ms) and how sure the tracker is. */
    val beatAt: Long = 0L,
    val beatPeriod: Float = 0f,
    val beatConfidence: Int = 0,
    /** 0..1 spectral flatness 2–12 kHz: high for noise (white-noise risers in a build-up), low for tones. */
    val noise: Float = 0f,
    /** Spectral centroid 250 Hz–12 kHz in Hz: climbs during filter sweeps / pitch risers. */
    val centroid: Float = 0f,
    /** 0..1: share of bass hits landing between the kicks (reverse bass = euphoric/classic hardstyle). */
    val offbeat: Float = 0f)

/** Independent from the original visualizer. Input sample rate is Hz, not Android's milliHz. */
internal class HardstyleAudio {
    private val spectrumAnalyzer = HardstyleSpectrum()
    private var peak = 8f
    private var average = 0f
    private var lastBass = 0f
    private var lastAt = 0L
    private var lastKick = -1000L
    private var lastBurst = -5000L
    private var shortAverage = 0f
    private var longAverage = 0f
    private var beatPeriod = 0f
    private var snareAvg = 0f; private var lastSnareValue = 0f; private var lastSnare = -1000L
    private var crashAvg = 0f; private var lastCrashValue = 0f; private var lastCrash = -1000L
    private var screechAvg = 0f
    private var songRef = 0f
    private var lastHeldGrit = 0f
    private var offbeatScore = 0f
    private val beats = BeatTracker()
    private var fluxAvg = 0f
    private var lastCandidate = -1000L
    private var frame = HardstyleFrame()
    /**
     * Tempo from the Mac's style teacher (TempoCNN on the preview), or 0 = unknown. Kept across
     * [reset] (mic ↔ visualizer switches); set again at every new song.
     */
    @Synchronized fun setTempoHint(bpm: Float) { beats.setHint(bpm) }

    @Synchronized fun reset() {
        spectrumAnalyzer.reset()
        peak = 8f; average = 0f; lastBass = 0f; lastAt = 0; lastKick = -1000; lastBurst = -5000
        shortAverage = 0f; longAverage = 0f; beatPeriod = 0f
        snareAvg = 0f; lastSnareValue = 0f; lastSnare = -1000; crashAvg = 0f; lastCrashValue = 0f; lastCrash = -1000; screechAvg = 0f
        songRef = 0f; lastHeldGrit = 0f; offbeatScore = 0f
        beats.reset(); fluxAvg = 0f; lastCandidate = -1000
        frame = HardstyleFrame()
    }
    @Synchronized fun accept(fft: ByteArray, sampleRate: Int, now: Long): HardstyleFrame {
        if (sampleRate <= 0 || fft.size < 4) return HardstyleFrame()
        var low = 0f; var bass = 0f; var high = 0f; var mid = 0f; var snareBand = 0f; var air = 0f; var scr = 0f
        var nl = 0; var nb = 0; var nh = 0; var nm = 0; var ns = 0; var na = 0; var nsc = 0
        // Spectral flatness (2–12 kHz) and centroid (250 Hz–12 kHz) for build-up detection.
        var flatLog = 0f; var flatSum = 0f; var nf = 0
        var centNum = 0f; var centDen = 0f
        for (k in 1 until fft.size / 2) {
            val hz = k.toFloat() * sampleRate / fft.size
            val magnitude = hypot(fft[2*k].toFloat(), fft[2*k+1].toFloat())
            if (hz in 2000f..12000f) { flatLog += ln(magnitude + 1f); flatSum += magnitude + 1f; nf++ }
            if (hz in 250f..12000f) { centNum += hz * magnitude; centDen += magnitude }
            when {
                hz in 30f..<90f -> { low += magnitude; nl++ }
                hz in 90f..<250f -> { bass += magnitude; nb++ }
                hz in 250f..8000f -> { high += magnitude; nh++ }
            }
            // Distortion harmonics of a zaag kick live here.
            if (hz in 250f..2500f) { mid += magnitude; nm++ }
            if (hz in 1000f..4000f) { snareBand += magnitude; ns++ }
            if (hz in 6000f..12000f) { air += magnitude; na++ }
            if (hz in 1200f..5000f) { scr += magnitude; nsc++ }
        }
        low /= max(1, nl); bass /= max(1, nb); high /= max(1, nh); mid /= max(1, nm)
        snareBand /= max(1, ns); air /= max(1, na); scr /= max(1, nsc)
        val value = max(low, bass)
        val dt = if (lastAt == 0L) 0.016f else ((now-lastAt)/1000f).coerceIn(.001f, .2f)
        lastAt = now
        peak = max(8f, max(value, peak * exp(-dt / 3f)))
        // Rises over ~2 s (one loud click/door slam can't set it), falls over ~25 s.
        songRef = if (value > songRef) songRef + (value - songRef) * (1f - exp(-dt / 2f)) else songRef * exp(-dt / SONG_REF_DECAY_S)
        val reference = max(peak, songRef * SONG_REF_SHARE)
        val norm = if (value < 2f || value < songRef * QUIET_GATE) 0f else (value / (reference * 1.3f)).coerceIn(0f, 1f)
        val flatWeight = if (nf > 0) ((flatSum / nf - 2f) / 3f).coerceIn(0f, 1f) else 0f
        val noise = if (flatWeight > 0f) (exp(flatLog / nf) / (flatSum / nf)).coerceIn(0f, 1f) * flatWeight else 0f
        val centroid = if (centDen > 1f) centNum / centDen else 0f
        val onset = value > 3f && value > lastBass * 1.12f && value > average * 1.15f && now-lastKick >= 120
        if (onset) {
            // Tempo from kick spacing (40–240 BPM), smoothed so single misses don't matter.
            val gap = (now - lastKick).toFloat()
            if (gap in 250f..1500f) beatPeriod = if (beatPeriod == 0f) gap else beatPeriod * .85f + gap * .15f
            lastKick = now
        }
        // Snare / guitar attacks and cymbal crashes: sudden jumps above their own average.
        val snareOnset = snareBand > 3f && snareBand > snareAvg * 1.45f && snareBand > lastSnareValue * 1.15f && now - lastSnare >= 90
        if (snareOnset) lastSnare = now
        val crashOnset = air > 2f && air > crashAvg * 1.8f && air > lastCrashValue * 1.3f && now - lastCrash >= 400
        if (crashOnset) lastCrash = now
        // Beat tracking: looser onset candidates (rise in bass, even on top of a long kick tail),
        // then a tempo grid that locks onto them and fills in kicks the onset detector misses.
        val flux = max(0f, value - lastBass)
        val candidate = value > 3f && flux > max(1.5f, fluxAvg * 1.6f) && now - lastCandidate >= 100
        if (candidate) lastCandidate = now
        fluxAvg = fluxAvg * .9f + flux * .1f
        // Reverse bass: bass hits halfway between the kicks (phase read before the tracker re-syncs).
        if (onset && beats.period > 0f && beats.lastBeat > 0L && beats.confidence >= 3) {
            val phase = (((now - beats.lastBeat) % beats.period.toLong()).toFloat() / beats.period)
            val off = if (phase in .4f..(.6f)) 1f else 0f
            offbeatScore = offbeatScore * .92f + off * .08f
        }
        val beat = beats.update(now, candidate || onset, norm > .3f, norm > FLYWHEEL_NORM)
        val burst = onset && norm > .55f && frame.energy < .35f && now-lastBurst >= 1800
        if (burst) lastBurst = now
        fun smooth(old: Float, target: Float, seconds: Float) = old + (target-old)*(1-exp(-dt/seconds))
        // Heavy = distorted bass (level independent, so it does not adapt away during a
        // long drop) + lift above the last ~12 s (a drop after a breakdown).
        shortAverage = smooth(shortAverage, value, .3f)
        longAverage = if (longAverage == 0f) value else smooth(longAverage, value, 12f)
        // Require real bass in absolute terms, so mid-heavy passages with little bass
        // (vocals, lead synths after autogain) do not count as distortion.
        // …and the bass must be near this song's own loud level: in a build-up the bass is filtered
        // away while risers/screeches fill the mids, which made mid/bass (= grit) highest right
        // BEFORE the drop and low in it (log 2026-11-06). That screech is tension, not heaviness.
        val bassPresent = if (songRef > 0f) ((value / songRef - GRIT_BASS_FROM) / GRIT_BASS_RANGE).coerceIn(0f, 1f) else 0f
        val gritNow = ((mid / max(value, 12f) - .35f) / .5f).coerceIn(0f, 1f) * (value / 20f).coerceIn(0f, 1f) * bassPresent
        // Measure distortion only in the kick tail; between kicks just hold it (pads/leads don't count).
        // No kick heard for a while (long zaag tails can hide the attack) → measure as before.
        val anchor = max(lastKick, beats.lastBeat)
        val sinceKick = now - anchor
        val grit = when {
            // No kick for a while: nothing to measure the distortion of (fades out instead of
            // reading pads, risers and screeches as zaag).
            sinceKick > 600L -> lastHeldGrit * exp(-dt / .3f)
            sinceKick in GRIT_TAIL_FROM_MS..GRIT_TAIL_TO_MS -> gritNow
            else -> lastHeldGrit * exp(-dt / .6f)
        }
        lastHeldGrit = grit
        val lift = ((shortAverage / max(4f, longAverage) - 1f) / .8f).coerceIn(0f, 1f)
        // How loud the bass is against this song's own loud parts (songRef falls over ~25 s), so a
        // long drop stays heavy instead of adapting away like `lift` (log 2026-11-06: heavy .13 at
        // the drop, .00 fifteen seconds later — the shake died in the middle of the drop).
        val loudRel = if (songRef > 0f) ((shortAverage / songRef - .45f) / .45f).coerceIn(0f, 1f) else 0f
        val heavyRaw = norm * norm * (.4f * grit + .15f * lift + .25f * loudRel + .2f * norm)
        val heavyTarget = ((heavyRaw - .12f) / .4f).coerceIn(0f, 1f)
        frame = HardstyleFrame(
            smooth(frame.bass, norm, if (norm > frame.bass) .025f else .18f),
            // Grid beats hit fully; off-grid onsets (syncopated rap/rock kicks) still pulse a bit.
            // Flywheel beats (kicks only predicted, see BeatTracker) pulse a little softer and stay
            // under .95, so the song-structure analysis does not count them as heard kicks.
            if (beat) (if (beats.flywheeling) FLYWHEEL_KICK else 1f) else if (onset) max(.7f, frame.kick * exp(-dt/.085f)) else frame.kick * exp(-dt/.085f),
            smooth(frame.highs, (high / max(8f, peak)).coerceIn(0f,1f), .08f),
            smooth(frame.energy, norm, .8f),
            if (burst) 1f else frame.burst * exp(-dt/.35f),
            smooth(frame.build, if (burst || frame.burst > .1f) 0f else
                ((norm-frame.energy)/.35f).coerceIn(0f,1f), .3f),
            spectrumAnalyzer.accept(fft, sampleRate, dt),
            spectrumAnalyzer.highMotion,
            smooth(frame.heavy, heavyTarget, if (heavyTarget > frame.heavy) .02f else .5f),
            smooth(frame.grit, grit, if (grit > frame.grit) .02f else .25f),
            if (beats.period > 0f) 60_000f / beats.period else 0f,
            if (snareOnset) 1f else frame.snare * exp(-dt/.09f),
            if (crashOnset) 1f else frame.crash * exp(-dt/.18f),
            smooth(frame.sub, if (value > 3f) (low / max(1f, low + bass)).coerceIn(0f, 1f) else frame.sub, .4f),
            // Loudness 30–2500 Hz: deep bass PLUS the mid-range distortion, so a zaag kick (much of
            // its power is in the distortion) measures as strong as it sounds (log 2026-11-03).
            value + mid,
            // Screech: the 1.2–5 kHz band jumps well above its usual level for this song and
            // stays there. Slow attack (0.12 s) so short snare hits don't count.
            run {
                val target = if (scr > 3f && screechAvg > 0f) ((scr / screechAvg - 1.5f) / 1.2f).coerceIn(0f, 1f) else 0f
                smooth(frame.screech, target, if (target > frame.screech) .12f else .3f)
            },
            value,
            air,
            low,
            scr,
            beats.count,
            beats.lastBeat,
            beats.period,
            beats.confidence,
            smooth(frame.noise, noise, .3f),
            smooth(frame.centroid, centroid, .3f),
            offbeatScore)
        average = smooth(average, value, .5f); lastBass = value
        screechAvg = if (screechAvg == 0f) scr else smooth(screechAvg, scr, 6f)
        snareAvg = smooth(snareAvg, snareBand, .6f); lastSnareValue = snareBand
        crashAvg = smooth(crashAvg, air, .8f); lastCrashValue = air
        return frame
    }
}

/**
 * Keeps time like a drummer: learns the tempo from the kicks it does hear, locks its grid onto
 * them, and fills in kicks the onset detector misses (long distorted hardstyle kick tails often
 * hide the next kick's attack; Android only delivers ~20 FFT frames per second). Stops filling
 * in after a couple of missing kicks, so breakdowns stay kick-less.
 */
internal class BeatTracker {
    // Onset times of the last ~6 s. Tempo = the most common spacing between ALL pairs of
    // onsets (not just neighbours), so extra hits from kick tails / reverse bass between the
    // kicks don't push the tempo up (log 2026-11-03: raw at ~155 BPM read as 170–195).
    private val onsets = LongArray(48)
    private var onsetCount = 0
    private var onsetNext = 0
    private val bins = FloatArray(29)          // 240..530 ms in 10 ms steps (113–250 BPM)
    var period = 0f
        private set
    var lastBeat = 0L
        private set
    private var lastOnset = 0L
    var confidence = 0
        private set
    private var predictedInRow = 0
    /** The teacher's beat length in ms, folded into the tracker's 240–530 ms range (0 = none). */
    private var hintPeriod = 0f

    fun setHint(bpm: Float) {
        var p = if (bpm in 40f..300f) 60_000f / bpm else 0f
        if (p > 0f) { while (p < 240f) p *= 2f; while (p >= 530f) p /= 2f }
        hintPeriod = p
    }
    /** The last beat was predicted beyond the normal 2 (bass strong, kicks not heard). */
    val flywheeling: Boolean get() = predictedInRow > 2
    /** Number of beats so far (heard or filled in). */
    var count = 0
        private set

    fun reset() {
        onsetCount = 0; onsetNext = 0; period = 0f; lastBeat = 0L; lastOnset = 0L; confidence = 0; predictedInRow = 0; count = 0
    }

    private fun addOnset(now: Long) {
        onsets[onsetNext] = now; onsetNext = (onsetNext + 1) % onsets.size; onsetCount = minOf(onsetCount + 1, onsets.size)
        bins.fill(0f)
        for (i in 0 until onsetCount) {
            val a = onsets[i]
            if (now - a > 6_000L) continue
            for (j in 0 until onsetCount) {
                val d = (onsets[j] - a).toFloat()
                if (d <= 0f || d > 1_600f) continue
                // A spacing of 1, 2 or 3 beats all vote for the same beat length.
                for (k in 1..3) {
                    val p = d / k
                    if (p < 240f || p >= 530f) continue
                    bins[((p - 240f) / 10f).toInt()] += 1f / k
                }
            }
        }
        // Smooth over neighbouring bins (timing jitter of ±1 FFT frame).
        fun score(b: Int) = bins[b] + .5f * (bins.getOrElse(b - 1) { 0f } + bins.getOrElse(b + 1) { 0f })
        var best = -1; var bestScore = 0f
        for (b in bins.indices) {
            val score = score(b)
            if (score > bestScore) { bestScore = score; best = b }
        }
        // The teacher's tempo: take the best spacing near it when the onsets support it at all
        // (fixes double/half and 3:4 readings – live 117–235 BPM for a 155 BPM song, log 2026-11-06).
        var hinted = false
        if (hintPeriod > 0f && best >= 0) {
            val hb = ((hintPeriod - 245f) / 10f).roundToInt().coerceIn(0, bins.size - 1)
            var hBest = -1; var hScore = 0f
            for (b in (hb - 2)..(hb + 2)) if (b in bins.indices && score(b) > hScore) { hScore = score(b); hBest = b }
            // Needs real support: enough onsets and votes, so a few stray hits can't set the tempo.
            if (hBest >= 0 && onsetCount >= 6 && hScore >= 2.5f && hScore >= bestScore * HINT_MIN_SHARE) {
                best = hBest; bestScore = maxOf(bestScore, 3f); hinted = true
            }
        }
        if (best >= 0 && bestScore >= 3f) {
            // Very fast estimates (< 280 ms ≈ > 214 BPM) are often 8th notes of a ~120 BPM song:
            // prefer the double period when it has at least half the votes.
            if (best < 4 && !hinted) {
                val double = best * 2 + 24
                if (double < bins.size && bins[double] >= bins[best] * .5f) best = double
            }
            val estimate = 245f + best * 10f
            period = if (period == 0f) estimate else period * .8f + estimate * .2f
        }
    }

    /**
     * True when a beat (heard or predicted) lands in this frame. [strongBass]: the low end is as
     * loud as in a drop — then keep the beat going longer (flywheel). In a dense zaag drop the bass
     * barely dips between kicks, so the onset test misses them; stopping after 2 filled-in kicks
     * made the effects (and the drop itself) stop in the middle of the drop.
     */
    fun update(now: Long, onset: Boolean, bassPresent: Boolean, strongBass: Boolean = false): Boolean {
        var beat = false
        if (onset) {
            addOnset(now)
            lastOnset = now
            if (period > 0f && lastBeat > 0L) {
                val since = (now - lastBeat).toFloat()
                // Distance to the nearest grid beat.
                val err = ((since + period / 2f) % period) - period / 2f
                if (kotlin.math.abs(err) < period * .22f) {
                    if (since > period * .5f) { beat = true; confidence = minOf(confidence + 1, 8); predictedInRow = 0 }
                    lastBeat = now                // re-sync to the real kick
                } else if (confidence < 2) {
                    beat = true; lastBeat = now   // no steady grid yet: trust the onset
                }
            } else {
                beat = true; lastBeat = now
            }
        }
        // Predicted kick: the grid is steady and bass is sounding, but no kick was heard.
        // At most 2 filled-in kicks in a row: when the kick really stops (breakdown), stop too,
        // even if a bassline or melody keeps going.
        if (!beat && period > 0f && lastBeat > 0L && confidence >= 3 && bassPresent &&
            predictedInRow < (if (strongBass) FLYWHEEL_BEATS else 2) &&
            now - lastBeat >= period - 25f) {
            beat = true
            lastBeat += period.toLong()
            // While the bass stays strong, lose confidence only every 4th beat (drift guard).
            if (!strongBass || predictedInRow % 4 == 0) confidence -= 1
            predictedInRow++
        }
        if (period > 0f && lastBeat > 0L && now - lastBeat > period * 2.5f) confidence = 0
        if (beat) count++
        return beat
    }
}

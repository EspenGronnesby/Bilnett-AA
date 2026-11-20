@file:OptIn(ExperimentalJsExport::class)

package com.kododake.aabrowser.rave

import com.kododake.aabrowser.rave.party.EdmSub
import com.kododake.aabrowser.rave.party.GenreRules
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.exp
import kotlin.math.max
import kotlin.math.pow
import kotlin.math.round
import kotlin.math.sin
import kotlin.random.Random

/**
 * Party for the Rave website: the shared analysis (HardstyleAudio, GenreDetector, HardstyleStructure,
 * HardSubDetector, PartyTuning …) plus the effect layer, ported from the app's frame loop
 * (RaveActivity.kt, LaunchedEffect(hardstyleOn, foreground, playing) and the strobe/heavy-flash
 * decisions in the background Canvas). Keep it in step with the app; the plan is to move this into
 * commonMain later so the app uses it too.
 *
 * The page feeds raw sound with [pushPcm] (shared screen sound or microphone), calls [tick] once per
 * animation frame, and reads the outputs (plain numbers) to draw. Lengths are in dp (the page turns
 * them into pixels). Times are performance.now() milliseconds for both sound and picture.
 *
 * Not on the website yet (later step): Espen's song-part corrections and «for mye/for lite»,
 * the Mac's style teacher (song mood), analysis log.
 */
@JsExport
class WebPartyEngine(fftSize: Int = 2048) {
    private val pcm = PcmFft(fftSize)
    /** New samples per FFT frame: feed [pushPcm] chunks of exactly this many samples. */
    val hop: Int get() = pcm.hop

    private val audio = HardstyleAudio()
    private val genreDetector = GenreDetector()
    private val songPhase = HardstyleStructure()
    /** «Lytt først»-lytteren (kjører ved siden av den gamle hjernen; styrer ingenting). Vises i AI-treneren. */
    private val listener = SongListener()
    private val hardSubDetector = HardSubDetector()
    private val beatClock = BeatClock()
    private val halfClock = BeatClock()
    private val flashBudget = FlashBudget()
    private val random = Random(7)

    private var frame = HardstyleFrame()
    private var frameAt = 0L
    private var shown = HardstyleFrame()
    private val smoothSpectrum = FloatArray(SPECTRUM_BANDS)
    private var shakeAngle = 0f
    private var shakeArmed = 1f

    // ---- Settings from the page ----
    /** Vibe slider: Auto (null) or a fixed strength 0..1, per genre like the app's «styrke_<GENRE>». */
    private var manualStrength: Float? = null
    private var edmSub: EdmSub? = null
    private var hardSub = HardSub.RAW
    private var loudNoDropS = 0f
    private var lastPart = SongPart.INTRO
    private var dipStartedAt = 0L
    private var dipSpent = false
    private var lastStrobeAt = -10_000L
    private var lastHeavyFlashAt = -10_000L
    private var strobeColorIndex = 0

    // ---- Outputs (read every frame) ----
    var genre: String = Genre.HARDSTYLE.name; private set
    var genreLabel: String = Genre.HARDSTYLE.label; private set
    var genreAnnouncedAt: Double = 0.0; private set
    var partName: String = SongPart.INTRO.name; private set
    var partLabel: String = ""; private set
    var partLabelAt: Double = 0.0; private set
    var vibe: Float = 1f; private set
    var vibeLive: Float = 0f; private set
    var vibeAuto: Boolean = true; private set
    var rockness: Float = .1f; private set
    var phaseLevel: Float = 1f; private set
    var visualTime: Float = 0f; private set
    var audioIntensity: Float = 0f; private set
    var dropLook: Int = 0; private set
    var warmth: Float = 0f; private set
    var dip: Float = 0f; private set
    var dropHit: Float = 0f; private set
    var breath: Float = 0f; private set
    var grade: Float = 0f; private set
    /** Scene shake in dp and degrees; bounce (reggaeton) in dp. */
    var shakeX: Float = 0f; private set
    var shakeY: Float = 0f; private set
    var shakeRotation: Float = 0f; private set
    var bounceY: Float = 0f; private set
    /** Chromatic split on the ring in dp. */
    var aberration: Float = 0f; private set
    var strobe: Float = 0f; private set
    var strobeColor: Int = 0; private set
    var heavyFlash: Float = 0f; private set
    var partyHit: Float = 0f; private set
    var subGlow: Float = 0f; private set
    var screechTint: Float = 0f; private set
    var flashesPerSecond: Int = 0; private set
    // Profile (how much each visual reacts).
    var spike: Float = 1f; private set
    var particles: Float = 1f; private set
    var shakeAmount: Float = 1f; private set
    var strobeAmount: Float = 0f; private set
    var density: Float = 1f; private set
    var softness: Float = 1f; private set
    /** The heard sound is fresh (< 300 ms old). */
    var hearing: Boolean = false; private set

    // ---- «AI-treneren»: hva lytteren og modellen tenker (alt kun lesing) ----
    val listenerPart: String get() = listener.part.name
    val listenerLevel: Float get() = listener.level
    val pBuild: Float get() = listener.pBuild
    val pDrop: Float get() = listener.pDrop
    /** Build-up-modellens sannsynlighet, glattet over fire slag. */
    val pBuildModel: Float get() = listener.pBuildModel
    val pBuildModelRaw: Float get() = listener.pBuildModelRaw
    val listenerDrops: Int get() = listener.drops
    /** Antall slag lukket så langt: når tallet endres er [listenerFeatures] og [listenerLevels] ferske. */
    val listenerSlots: Int get() = listener.slots
    val slotLengthMs: Float get() = listener.slotLengthMs
    /** Kravet til fylde-hopp for å melde drop akkurat nå. */
    val jumpNeeded: Float get() = listener.jumpNeeded
    /** 16 selvrelative målinger for siste slag, i rekkefølgen [featureNames]. */
    val listenerFeatures: FloatArray get() = listener.features
    /** Sub-, høyde- og nærværsnivå (dB), kick og snare siste slag. */
    val listenerLevels: FloatArray get() = listener.levels
    val featureNames: Array<String> get() = LISTENER_FEATURES.toTypedArray()
    /** Input til build-up-modellen (48), hvert tall sin bidrag og modellens grunnverdi. */
    val modelInput: FloatArray get() = listener.modelInput
    val modelContrib: FloatArray get() = FloatArray(BuildUpModel.size) { BuildUpModel.contribution(listener.modelInput, it) }
    val modelBias: Float get() = BuildUpModel.bias
    val modelFeatureNames: Array<String> get() = BuildUpModel.FEATURES.toTypedArray()
    /** Den gamle hjernens eget «bygger opp»-mål, takt i frasen og om den er klar for drop. */
    val hudBuild: Float get() = songPhase.hud.build
    val hudBar: Int get() = songPhase.hud.barInPhrase
    val hudReady: Boolean get() = songPhase.hud.ready

    // ---- The smoothed frame the visuals use ----
    val bass: Float get() = shown.bass
    val kick: Float get() = shown.kick
    val highs: Float get() = shown.highs
    val energy: Float get() = shown.energy
    val burst: Float get() = shown.burst
    val build: Float get() = shown.build
    val highMotion: Float get() = shown.highMotion
    val heavy: Float get() = shown.heavy
    val grit: Float get() = shown.grit
    val snare: Float get() = shown.snare
    val crash: Float get() = shown.crash
    val sub: Float get() = shown.sub
    val screech: Float get() = shown.screech
    val vocal: Float get() = shown.vocal
    val vocalHit: Float get() = shown.vocalHit
    val bpm: Float get() = shown.bpm
    /** 48 bands, eased every frame (quick rise, slower fall). */
    val spectrum: FloatArray get() = smoothSpectrum

    /** [samples]: [hop] new mono samples (−1..1) at [rateHz]. */
    /** Returns the FFT frame (Visualizer bytes) the analysis just used, so the page can record it. */
    fun pushPcm(samples: FloatArray, rateHz: Int, nowMs: Double): ByteArray {
        val now = nowMs.toLong()
        val fft = pcm.push(samples, rateHz)
        frame = audio.accept(fft, rateHz, now)
        frameAt = now
        return fft
    }

    /** A new song (as in the app's updateMeta). */
    fun newTrack(nowMs: Double) {
        val now = nowMs.toLong()
        audio.reset()
        frame = HardstyleFrame()
        genreDetector.newTrack(now)
        songPhase.newTrack(now)
        listener.newTrack(now)
        hardSubDetector.newTrack()
        loudNoDropS = 0f
        beatClock.reset(); halfClock.reset()
        dip = 0f; dropHit = 0f; lastPart = SongPart.INTRO; dropLook = 0
        dipStartedAt = 0L; dipSpent = false
    }

    /** What Apple (and Deezer) say about the song, as in the app's background lookup. */
    fun setMetadata(appleGenre: String?, appleExact: Boolean, deezerGenres: Array<String>, nowMs: Double) {
        genreDetector.setMetadata(appleGenre, appleExact, deezerGenres.toList(), null, nowMs.toLong())
        genre = genreDetector.genre.name
    }

    /** Vibe slider: null = Auto, else 0..1. */
    fun setStrength(value: Float?) { manualStrength = value?.coerceIn(0f, 1f) }

    private val strength: Float get() = manualStrength ?: .5f

    /**
     * One animation frame. [volume] 0..1 (Rave PC's volume, or the playing device's).
     * [positionMs]/[durationMs]: the song (−1 when unknown).
     */
    fun tick(nowMs: Double, dtS: Double, playing: Boolean, positionMs: Double, durationMs: Double, volume: Float) {
        val now = nowMs.toLong()
        val dt = dtS.toFloat().coerceIn(0f, .05f)
        val fresh = now - frameAt < 300L
        hearing = fresh
        val rawTarget = if (playing && fresh) frame else HardstyleFrame()
        val pos = positionMs.toLong()
        val dur = if (durationMs > 0) durationMs.toLong() else -1L

        // Advance the scene only while the live signal has energy.
        val activity = maxOf(rawTarget.bass, rawTarget.kick, rawTarget.highs, rawTarget.highMotion, rawTarget.spectrum.maxOrNull() ?: 0f)
        if (playing && activity > .025f) visualTime += dt * (.35f + activity)
        audioIntensity = if (playing && activity > .025f) activity.coerceIn(0f, 1f) else 0f
        val mix = 1f - exp(-dt / (if (playing) .025f else .12f))
        fun blend(a: Float, b: Float) = a + (b - a) * mix

        val g = if (playing && fresh) genreDetector.update(rawTarget, now) else genreDetector.genre
        genre = g.name
        genreAnnouncedAt = genreDetector.announcedAt.toDouble()
        rockness = round(genreDetector.rockness * 100f) / 100f
        vibeAuto = manualStrength == null
        val vibeGoal = if (genreDetector.provenHardstyle) 1f else g.vibeTarget()
        val glided = vibe + (vibeGoal - vibe) * (1f - exp(-dt / .6f))
        vibe = if (abs(vibeGoal - glided) < .002f) vibeGoal else glided
        val v = vibe
        val r = rockness
        val hardW = hardWeight(v)

        if (!playing || !fresh) { beatClock.reset(); halfClock.reset() }
        val clockOn = v >= BEAT_CLOCK_FROM_VIBE
        val clockPulse = if (playing && fresh) beatClock.pulse(rawTarget, now, BEAT_LEAD_MS) else null
        val clockKick = if (clockOn) clockPulse else null
        val halfPulse = if (playing && fresh) halfClock.pulse(rawTarget, now, BEAT_LEAD_MS, halfTime = true, decayMs = PULSE_808_DECAY_MS) else null
        val look = GenreRules.look(g, edmSub, rawTarget, halfPulse, clockPulse, now)
        val strengthMul = GenreRules.strengthMul(strength)
        val clocked = if (clockKick != null) rawTarget.copy(kick = clockKick) else rawTarget
        val visualInput = if (songPhase.part == SongPart.BUILDUP) clocked.copy(snare = clocked.snare * .3f) else clocked
        val shapedFull = vibeShape(visualInput, v, r)
        val phaseIntensity = if (playing && fresh) songPhase.update(rawTarget, now, pos, dur) else 1f
        if (playing && fresh) listener.update(rawTarget, now, pos, dur)
        partName = songPhase.part.name
        partLabel = songPhase.label
        partLabelAt = songPhase.labelAt.toDouble()
        if (playing && fresh && hardW > 0f) hardSub = hardSubDetector.update(rawTarget, now)
        genreLabel = when (g) {
            Genre.HARDSTYLE -> if (rockness >= .5f) "ROCK" else "HARDSTYLE · ${hardSub.label}"
            Genre.EDM -> edmSub?.let { "EDM · ${it.label}" } ?: "EDM"
            else -> g.label
        }

        val sw = structureWeight(v) * (1f - hardW * r)
        val heldOnPurpose = songPhase.part == SongPart.DROP || songPhase.part == SongPart.BUILDUP ||
            songPhase.part == SongPart.BREAKDOWN || songPhase.part == SongPart.ANTI_CLIMAX
        if (!playing || heldOnPurpose || rawTarget.energy < .3f) loudNoDropS = 0f
        else if (rawTarget.energy > .55f) loudNoDropS += dt
        val missedDrop = ((loudNoDropS - 20f) / 10f).coerceIn(0f, 1f)
        val remainingMs = if (dur > 0L) dur - pos else -1L
        val outroFade = if (remainingMs in 0L until OUTRO_FADE_MS) OUTRO_FLOOR + (1f - OUTRO_FLOOR) * (remainingMs.toFloat() / OUTRO_FADE_MS) else 1f
        val pi = max(1f + (phaseIntensity - 1f) * sw, .9f * missedDrop) * outroFade
        val inDrop = sw > 0f && songPhase.part == SongPart.DROP
        val effectsOn = sw <= .5f || songPhase.effectsAllowed || missedDrop >= 1f
        val hsW = hardW * (1f - r)
        val sub = hardSub
        fun subMul(x: Float) = 1f + (x - 1f) * hsW
        phaseLevel = pi.coerceAtMost(1f)
        val live = if (!playing) 0f else (sw * pi.coerceAtMost(1f) + (1f - sw) * rawTarget.energy.coerceIn(0f, 1f)).coerceIn(0f, 1f)
        val liveGoal = (strength * (.35f + .65f * live)).coerceIn(0f, 1f)
        vibeLive = round((vibeLive + (liveGoal - vibeLive) * (1f - exp(-dt / .35f))) * 200f) / 200f
        val screechShake = hsW * when {
            songPhase.part == SongPart.DROP && effectsOn -> sub.screech * (if (songPhase.dropKind == DropKind.LAST) 1.3f else 1f)
            songPhase.part == SongPart.DROP -> .5f * sub.screech
            else -> 0f
        }
        val shaped = when {
            sw <= 0f -> shapedFull
            inDrop -> shapedFull.copy(heavy = max(shapedFull.heavy * pi,
                    if (effectsOn) DROP_HEAVY_FLOOR * sw * pi.coerceAtMost(1f) else 0f).coerceAtMost(1f),
                grit = if (effectsOn) shapedFull.grit else 0f)
            else -> shapedFull.copy(
                heavy = (shapedFull.heavy * pi).coerceAtMost(1f),
                kick = shapedFull.kick * (.6f + .4f * pi.coerceAtMost(1f)),
                grit = if (missedDrop >= 1f) shapedFull.grit else shapedFull.grit * (1f - sw))
        }

        // ---- Festival show rules ----
        val showW = structureWeight(v) * (1f - .7f * r * hardW)
        val hud = songPhase.hud
        val part = songPhase.part
        val buildRise = if (part == SongPart.BUILDUP) hud.build.coerceIn(0f, 1f) * showW else 0f
        val hadDip = dip > .3f || dipStartedAt > 0L || dipSpent
        if (part != SongPart.BUILDUP) { dipStartedAt = 0L; dipSpent = false }
        val dipWanted = if (part == SongPart.BUILDUP && hud.ready && !dipSpent) showW * maxOf(
            if (songPhase.drops >= 1 && hud.barInPhrase == 8) 1f else 0f,
            ((hud.build - PRE_DROP_BUILD_START) / (1f - PRE_DROP_BUILD_START)).coerceIn(0f, 1f)) else 0f
        if (dipWanted > .3f && dipStartedAt == 0L) dipStartedAt = now
        if (dipStartedAt > 0L && now - dipStartedAt > PRE_DROP_DIP_MAX_MS) dipSpent = true
        val dipGoal = if (dipSpent) 0f else dipWanted
        val dipNext = if (part == SongPart.DROP) 0f else dip + (dipGoal - dip) * (1f - exp(-dt / if (dipGoal > dip) .3f else .5f))
        dip = round(dipNext * 100f) / 100f
        if (part == SongPart.DROP && lastPart != SongPart.DROP && showW > .3f && flashBudget.tryFlash(now))
            dropHit = if (hadDip) 1f else DROP_HIT_UNSURE
        else if (dropHit > 0f) dropHit = (dropHit * exp(-dt / DROP_HIT_DECAY_S)).let { if (it < .01f) 0f else it }
        lastPart = part
        val inShowDrop = part == SongPart.DROP && showW > 0f
        dropLook = if (inShowDrop) (hud.phrase + songPhase.drops) % 3 else 0
        val lookSpike = if (!inShowDrop) 1f else when (dropLook) { 1 -> 1.2f; else -> .95f }
        val lookShake = if (!inShowDrop) 1f else when (dropLook) { 0 -> 1.15f; 1 -> .75f; else -> .9f }
        val lookParticles = if (inShowDrop && dropLook == 1) 1.1f else 1f
        flashesPerSecond = flashBudget.perSecond(now)
        val tune = 1f // «for mye / for lite» comes with the analysis step on the website

        val p = vibeProfile(v, r)
        spike = p.spike * (.75f + .25f * pi) * subMul(sub.spike) * lookSpike * tune * look.spike * strengthMul
        particles = p.particles * (.6f + .4f * pi) * subMul(sub.particles) * (1f + BUILD_PARTICLE_RISE * buildRise) * lookParticles * tune * look.particles * strengthMul
        shakeAmount = p.shake * pi * subMul(sub.shake) * lookShake * tune * look.shake * strengthMul
        strobeAmount = p.strobe * (if (effectsOn && pi >= .9f) 1f else 0f) * subMul(sub.strobe) * look.strobe *
            (if (strength < GenreRules.STROBE_FROM_STRENGTH) 0f else 1f)
        density = p.density * (1f + BUILD_DENSITY_RISE * buildRise)
        softness = p.softness.let { if (it <= 1.2f) it.coerceAtMost(1.15f) else it }
        val popLift = if (g == Genre.POP || g == Genre.REGGAE || g == Genre.REGGAETON) genreDetector.chorus else 0f
        if (popLift > 0f) { spike *= 1f + .35f * popLift; particles *= 1f + .4f * popLift }
        val shapedPop = if (popLift > 0f) shaped.copy(kick = (shaped.kick * (1f + .6f * popLift)).coerceAtMost(1f),
            bass = (shaped.bass * (1f + .15f * popLift)).coerceAtMost(1f)) else shaped
        val untuned = if (buildRise > 0f) shapedPop.copy(kick = max(shapedPop.kick, rawTarget.snare * .45f * buildRise)) else shapedPop
        val target = look.kick?.let { untuned.copy(kick = it.coerceIn(0f, 1f)) } ?: untuned

        val liveSpectrum = playing && fresh
        for (i in 0 until SPECTRUM_BANDS) {
            val goal = if (liveSpectrum) target.spectrum[i] else 0f
            val current = smoothSpectrum[i]
            val tau = if (goal > current) .022f else .13f
            var value = current + (goal - current) * (1f - exp(-dt / tau))
            if (value < .0001f) value = 0f
            smoothSpectrum[i] = value
        }
        shown = HardstyleFrame(blend(shown.bass, target.bass),
            if (clockOn) target.kick else blend(shown.kick, target.kick), blend(shown.highs, target.highs),
            blend(shown.energy, target.energy), if (clockOn) target.burst else blend(shown.burst, target.burst), blend(shown.build, target.build),
            spectrum = smoothSpectrum.toList(),
            highMotion = blend(shown.highMotion, if (playing && fresh) target.highMotion else 0f),
            heavy = blend(shown.heavy, target.heavy),
            grit = blend(shown.grit, target.grit),
            bpm = target.bpm, snare = target.snare, crash = target.crash, sub = target.sub, level = target.level, screech = blend(shown.screech, target.screech),
            bassLevel = target.bassLevel, air = target.air, subLevel = target.subLevel,
            presence = target.presence, beat = target.beat,
            vocal = blend(shown.vocal, target.vocal), vocalHit = target.vocalHit)

        // Camera shake (in dp; the app multiplies the same numbers by the screen density).
        val f = shown
        val ramp = loudRamp(volume)
        val punch = shakeAmount * f.kick * volumeGain(volume) *
            (f.heavy * (10f + loudness(volume) * 4f) * (1f + ramp * .8f) + ramp * 5f)
        val tremble = screechShake * f.screech * 7f * volumeGain(volume)
        if (f.kick < .3f) shakeArmed = 1f
        if (f.kick > .55f && shakeArmed == 1f) { shakeArmed = 0f; shakeAngle = (random.nextDouble() * 2 * PI).toFloat() }
        val s = (now % 1_000_000L) / 1000f
        val wobble = punch * .35f + tremble
        val x = cos(shakeAngle) * punch + sin(s * 61f) * wobble
        val y = sin(shakeAngle) * punch + cos(s * 47f) * wobble
        // The app compares with 0.5 px; ~0.2 dp is the same on a typical screen.
        val big = punch + tremble > .2f
        shakeX = if (big) x else 0f
        shakeY = if (big) y else 0f
        shakeRotation = if (big) (f.heavy * f.kick * .8f * if (shakeAngle > PI) -1f else 1f) else 0f
        val split = f.heavy * f.kick * shakeAmount
        aberration = if (effectsOn && split > .25f) ((split - .25f) / .75f).coerceAtMost(1f) * 5f else 0f
        bounceY = -look.bounceY * GENRE_BOUNCE_DP * strengthMul
        warmth = look.warmth

        var lowBands = 0f
        for (i in 0 until SPECTRUM_BANDS / 2) lowBands += smoothSpectrum[i]
        lowBands /= (SPECTRUM_BANDS / 2).toFloat()
        val knee = (5f * (1.2f * lowBands - lowBands.pow(1.2f))).coerceIn(0f, 1f).pow(.8f)
        breath += (knee - breath) * (1f - exp(-dt / if (knee > breath) .08f else .35f))
        val gradeTarget = if (sw > .5f) when (songPhase.part) {
            SongPart.INTRO, SongPart.BREAKDOWN, SongPart.OUTRO, SongPart.ANTI_CLIMAX -> -.6f
            SongPart.VOCAL, SongPart.GROOVE -> 0f
            SongPart.BUILDUP -> .35f
            SongPart.DROP -> 1f
        } else (-.4f + shown.energy * 1.2f).coerceIn(-.6f, .8f)
        grade += ((if (playing) gradeTarget else 0f) - grade) * (1f - exp(-dt / 1.5f))

        // ---- Background hits and flashes (decided here, once per frame; drawn by the page) ----
        partyHit = ((.3f + .7f * phaseLevel) *
            (maxOf(f.kick, f.bass * .55f, f.highMotion * .2f) + f.heavy * f.kick * .4f +
                (smoothSpectrum.maxOrNull() ?: 0f) * .25f * volumeGain(volume))).coerceAtMost(1.6f)
        val heavyRaw = f.heavy * f.kick * (.6f + .4f * loudness(volume))
        val showOn = structureWeight(v)
        subGlow = .12f * f.sub * f.bass * showOn
        screechTint = (f.screech * .7f * showOn).coerceAtMost(.7f)
        // Strobe: heavy distorted kicks (or crashes for rock) at high volume; never more than
        // 2.5 per second, and every flash type shares one budget of 3 per second.
        val strobeSource = max(f.kick * f.heavy, f.crash * hardWeight(v))
        val strobeFrom = .85f - .15f * hardWeight(v)
        val strobeRaw = strobeAmount * strobeSource * ((volume - strobeFrom) / .15f).coerceIn(0f, 1f)
        if (strobeRaw > .3f && now - lastStrobeAt >= 400L && flashBudget.tryFlash(now)) { lastStrobeAt = now; strobeColorIndex++ }
        strobe = if (now - lastStrobeAt < 120L) strobeRaw else 0f
        strobeColor = strobeColorIndex
        if (heavyRaw > .3f && now - lastHeavyFlashAt >= 400L && now - lastStrobeAt >= 120L && flashBudget.tryFlash(now)) lastHeavyFlashAt = now
        heavyFlash = if (heavyRaw > .02f && now - lastHeavyFlashAt < 120L) heavyRaw else 0f
    }
}

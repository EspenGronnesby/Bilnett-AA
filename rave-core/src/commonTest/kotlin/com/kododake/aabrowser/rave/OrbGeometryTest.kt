package com.kododake.aabrowser.rave

import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.exp
import kotlin.math.hypot
import kotlin.math.ln
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sin
import kotlin.random.Random
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue
import kotlin.test.fail

private const val RATE = 44_100
private const val SIDE = 400f
private const val RADIUS = 40f

/** A Visualizer-format FFT frame (1024 bytes = 512 bins, like the phone) with a chosen level per frequency. */
private fun bandFft(level: (hz: Float) -> Float): ByteArray {
    val fft = ByteArray(1024)
    for (k in 1 until fft.size / 2) fft[k * 2] = level(k.toFloat() * RATE / fft.size).toInt().coerceIn(0, 127).toByte()
    return fft
}

/** Loud and weak stripes two thirds of an octave wide: every range has a shape of its own to show. */
private fun striped(hz: Float): Float = if ((ln(hz / 40f) / ln(2f) * 1.5f).toInt() % 2 == 0) 90f else 30f
private val FLAT = bandFft { 90f }
private val LOUD = bandFft { striped(it) }
private val BASSY = bandFft { if (it < 500f) striped(it) else 20f }
private val BRIGHT = bandFft { if (it < 500f) 20f else striped(it) }
private val SILENT = ByteArray(1024)

/**
 * A real sine through PcmFft, so leakage between bins is realistic. 2048 bytes at 44.1 kHz is the website
 * (and the phone's microphone); the phone's Visualizer hands out [PHONE_FFT] bytes at [PHONE_RATE].
 */
private class Tone(private val hz: Double, size: Int = 2048, private val rate: Int = RATE) {
    private val pcm = PcmFft(size)
    private var n = 0
    /** FFT frames per second. */
    val perSecond: Int = rate / pcm.hop
    fun next(): ByteArray = pcm.push(FloatArray(pcm.hop) { (.8 * sin(2 * PI * hz * n++ / rate)).toFloat() }, rate)
}

/** What Party gets from the Pixel 9's Visualizer (the recordings in party-analyse/raw/fft): 46.9 Hz per bin, ~20 frames a second. */
private const val PHONE_FFT = 1024
private const val PHONE_RATE = 48_000

/** Draws at [fps] while new FFT frames only arrive [fftHz] times per second. */
private class Rig(val fps: Int, val fftHz: Int = 20, val side: Float = SIDE, val radius: Float = RADIUS, val rate: Int = RATE) {
    val spectrum = DisplaySpectrum()
    val geo = OrbGeometry()
    var frame = 0
    var fftCount = 0
    var playing = true
    var feeding = true
    var phase = 1f; var volume = .8f; var heavy = .5f; var kick = 0f; var spike = 1f; var coverScale = 1f
    var pulse: Float? = null
    val time: Float get() = frame.toFloat() / fps

    fun run(seconds: Float, source: () -> ByteArray, before: (() -> Unit)? = null, each: (() -> Unit)? = null) {
        repeat((seconds * fps + .5f).toInt()) {
            frame++
            val due = frame * fftHz / fps
            while (fftCount < due) { fftCount++; if (feeding) spectrum.accept(source(), rate) }
            before?.invoke()
            geo.update(1f / fps, playing, spectrum.bands, spectrum.version, side, radius, coverScale, phase, spike, volume, heavy, kick, pulse)
            each?.invoke()
        }
    }
}

/** Distance from (x, y) to the edge of a rounded square (half side [h], corner radius [r]); positive outside. */
private fun outsideRoundedSquare(x: Float, y: Float, h: Float, r: Float): Float {
    val qx = abs(x) - (h - r); val qy = abs(y) - (h - r)
    return hypot(max(qx, 0f), max(qy, 0f)) + min(max(qx, qy), 0f) - r
}

/** assertTrue whose message is only built when it fails (the checks below run a million times; Node allows a test 2 s). */
private inline fun sure(condition: Boolean, message: () -> String) { if (!condition) fail(message()) }

class OrbGeometryTest {
    @Test fun displaySpectrumPutsATonesInTheRightBand() {
        val spectrum = DisplaySpectrum()
        spectrum.accept(bandFft { if (it in 950f..1050f) 100f else 0f }, RATE)
        val at = displayBandAt(1000f).toInt()
        assertTrue(spectrum.bands[at] > 50f || spectrum.bands[at + 1] > 50f, "1 kHz lands in band $at")
        assertEquals(0f, spectrum.bands[0]); assertEquals(0f, spectrum.bands[DISPLAY_BANDS - 1])
        assertEquals(1, spectrum.version)
    }

    @Test fun audioHandsOutTheDisplaySpectrum() {
        val audio = HardstyleAudio()
        val mine = FloatArray(DISPLAY_BANDS)
        val before = audio.readDisplay(mine)
        val frame = audio.accept(FLAT, RATE, 1000L)
        assertEquals(SPECTRUM_BANDS, frame.spectrum.size)
        assertEquals(before + 1, audio.readDisplay(mine))
        assertTrue(mine.all { it > 80f })
        audio.reset()
        audio.readDisplay(mine)
        assertTrue(mine.all { it == 0f })
    }

    /** At rest the aura is the cover's own outline: same corner radius, an even gap all the way round. */
    @Test fun restingOutlineIsTheCoversRoundedRectangle() {
        // A small cover with (relatively) very round corners, a normal one and a big one with tight corners.
        for ((side, radius) in listOf(160f to 36f, 400f to 40f, 535f to 44f, 300f to 0f, 200f to 100f)) {
            for (scale in listOf(1f, 1.06f)) {
                val rig = Rig(60, side = side, radius = radius)
                rig.coverScale = scale
                rig.run(.5f, { SILENT })
                val gap = side * ORB_GAP
                val foot = rig.geo.foot()
                var step = 0f; var shortest = Float.MAX_VALUE; var longest = 0f
                for (l in 0 until rig.geo.layerCount) {
                    val p = rig.geo.points(l)
                    for (i in 0 until ORB_SEGMENTS) {
                        val out = outsideRoundedSquare(p[i * 2], p[i * 2 + 1], side / 2 * scale, radius * scale)
                        assertTrue(abs(out - gap) < .02f, "side $side radius $radius: layer $l point $i is $out px outside the cover (gap $gap)")
                    }
                }
                for (i in 0 until ORB_SEGMENTS) {
                    // The foot lies exactly on the cover's edge, and the points are evenly spaced along it.
                    assertTrue(abs(outsideRoundedSquare(foot[i * 2], foot[i * 2 + 1], side / 2 * scale, radius * scale)) < .02f, "foot $i on the edge")
                    val n = (i + 1) % ORB_SEGMENTS
                    step = hypot(foot[n * 2] - foot[i * 2], foot[n * 2 + 1] - foot[i * 2 + 1])
                    shortest = min(shortest, step); longest = max(longest, step)
                }
                // (Chords across a corner are a little shorter than the arc they span.)
                assertTrue(shortest > longest * .9f, "side $side radius $radius: even spacing ($shortest..$longest px)")
            }
        }
    }

    /** New sound only 20 times a second, drawn at 60 fps: the aura glides, it never jumps. */
    @Test fun steppedInputMovesSmoothly() {
        val rig = Rig(60)
        rig.run(8f, { LOUD })
        rig.run(3f, { BASSY })     // the bright half of the ring sinks
        assertTrue(rig.geo.open > .9f)
        val layers = rig.geo.layerCount
        val half = ORB_SEGMENTS / 2
        fun offsets() = Array(layers) { l -> FloatArray(half + 1) { rig.geo.offsetAt(l, it) } }
        // The frame-by-frame level after the sound changes, of the point in [range] that moves the most.
        fun record(layer: Int, range: IntRange, source: () -> ByteArray): Pair<Float, FloatArray> {
            val start = offsets()
            val all = Array(60) { start }
            var i = 0
            rig.run(1f, source, each = { all[i++] = offsets() })
            var point = range.first
            for (p in range) if (abs(all[59][layer][p] - start[layer][p]) > abs(all[59][layer][point] - start[layer][point])) point = p
            return start[layer][point] to FloatArray(60) { all[it][layer][point] }
        }
        fun check(run: Pair<Float, FloatArray>, name: String, maxShare: Float) {
            val (start, track) = run
            val total = abs(track.last() - start)
            assertTrue(total > 4f, "$name should move (moved $total px)")
            var largest = 0f; var previous = start; var moving = 0
            for (i in track.indices) {
                val d = abs(track[i] - previous); previous = track[i]
                largest = max(largest, d)
                if (i < 6 && d > 0f) moving++
            }
            // A raw step would do the whole movement (share 1.0) in a single picture.
            assertTrue(largest < total * maxShare, "$name: biggest step ${largest / total} of the movement (limit $maxShare)")
            assertTrue(largest < SIDE * .02f, "$name: biggest step $largest px")
            // It keeps moving in the pictures between FFT frames (no stair steps)…
            assertEquals(6, moving, "$name moves in every picture")
            // …and starts gently (second order: no kink when the new FFT frame lands).
            assertTrue(abs(track[0] - start) < largest * .75f, "$name starts softly")
        }
        check(record(0, half / 2..half, { LOUD }), "the bright side", .6f)
        rig.run(2f, { BRIGHT })
        check(record(0, 0..half / 4, { BASSY }), "the bass", .45f)
        rig.run(2f, { BRIGHT })
        // The layers behind are slower: smaller steps for the same change.
        check(record(layers - 1, 0..half / 4, { BASSY }), "the bass in the back layer", .3f)
    }

    private fun assertClosed(geo: OrbGeometry, why: String) {
        assertTrue(geo.open < .001f, "$why: open = ${geo.open}")
        for (l in 0 until geo.layerCount) for (p in 0 until ORB_SEGMENTS) {
            val off = geo.offsetAt(l, p)
            assertTrue(off >= SIDE * ORB_GAP - .001f && off <= SIDE * ORB_GAP + .5f, "$why: layer $l is $off px out at $p")
        }
    }

    @Test fun silenceAndPauseCloseTheAura() {
        // Paused while the sound keeps coming (e.g. the microphone still hears something).
        val paused = Rig(60)
        paused.run(8f, { LOUD })
        assertTrue(paused.geo.open > .9f)
        paused.playing = false
        paused.run(30f, { LOUD })
        assertClosed(paused.geo, "paused")
        // Playing, but silence.
        val silent = Rig(60)
        silent.run(8f, { LOUD })
        silent.run(30f, { SILENT })
        assertClosed(silent.geo, "silence")
        // Playing, but no FFT frames arrive any more: held for a second, then to rest.
        val stale = Rig(60)
        stale.run(8f, { LOUD })
        stale.feeding = false
        val held = stale.geo.offsetAt(0, 8)
        stale.run(.5f, { LOUD })
        assertTrue(abs(stale.geo.offsetAt(0, 8) - held) < 1f, "the last shape is held for a moment")
        stale.run(30f, { LOUD })
        assertClosed(stale.geo, "no sound frames")
        // A new song starts closed.
        val fresh = Rig(60)
        fresh.run(8f, { LOUD })
        fresh.geo.reset()
        assertEquals(0f, fresh.geo.open)
    }

    @Test fun loudMusicOpensTheAuraOverSeconds() {
        val rig = Rig(60)
        rig.run(.3f, { LOUD })
        assertTrue(rig.geo.open in .02f..(.3f), "not at once: ${rig.geo.open}")
        var last = rig.geo.open
        rig.run(6f, { LOUD }, each = { assertTrue(rig.geo.open >= last); last = rig.geo.open })
        assertTrue(rig.geo.open > .9f, "open after 6 s: ${rig.geo.open}")
        // A quiet song part (intro) only opens it part of the way.
        val intro = Rig(60); intro.phase = .4f
        intro.run(10f, { LOUD })
        assertTrue(intro.geo.open in .2f..(.5f), "intro: ${intro.geo.open}")
    }

    /** One spectrum round the ring: bass bulges at the top, bright sounds near the bottom, clearly visible. */
    @Test fun eachToneBulgesInItsOwnPlace() {
        val half = ORB_SEGMENTS / 2
        fun peakOf(geo: OrbGeometry): Pair<Int, Float> {
            var at = 0
            for (p in 0..half) if (geo.offsetAt(0, p) > geo.offsetAt(0, at)) at = p
            return at to geo.offsetAt(0, at) - SIDE * ORB_GAP
        }
        val low = Rig(60, fftHz = 43); val lowTone = Tone(70.0)
        low.run(4f, { lowTone.next() })
        val (lowAt, lowSize) = peakOf(low.geo)
        assertTrue(lowAt < half / 4, "70 Hz bulges at the top (point $lowAt)")
        assertTrue(lowAt > 0, "…beside 12 o'clock, not one peak in the middle (point $lowAt)")
        assertTrue(lowSize > SIDE * .06f, "…clearly: $lowSize px")
        // Since 2026-11-23 the bottom also bulges on the bass (mirrored), but smaller than the top.
        val lowBottom = low.geo.offsetAt(0, half) - SIDE * ORB_GAP
        // (A single pure tone is narrow, more so with ORB_CONTRAST 2.0; real bass is broader.)
        assertTrue(lowBottom > SIDE * .012f, "70 Hz also moves the bottom: $lowBottom px")
        assertTrue(lowBottom <= lowSize * ORB_BOTTOM_BASS + 1f, "…but less than the top ($lowBottom against $lowSize px)")
        val high = Rig(60, fftHz = 43); val highTone = Tone(5000.0)
        high.run(4f, { highTone.next() })
        val (highAt, highSize) = peakOf(high.geo)
        assertTrue(highAt > half * 3 / 4, "5 kHz bulges near the bottom (point $highAt)")
        assertTrue(highSize > SIDE * .02f && highSize < lowSize, "…smaller than the bass: $highSize px against $lowSize")
        assertTrue(high.geo.offsetAt(0, 4) - SIDE * ORB_GAP < 1f, "5 kHz leaves the top alone")
        // The layers behind show the same bulge, bigger.
        assertTrue(low.geo.offsetAt(low.geo.layerCount - 1, lowAt) > low.geo.offsetAt(0, lowAt), "the back layer reaches further")
    }

    /** Random sound and settings for many pictures: ceiling, mirror, closed curve, cover fit. */
    @Test fun alwaysMirroredClosedAndUnderTheCeiling() {
        val rnd = Random(3)
        val rig = Rig(60, fftHz = 43)
        val geo = rig.geo
        val fft = ByteArray(1024)
        var envelope = 1f
        var checked = 0
        rig.run(50f, source = {
            if (rnd.nextInt(40) == 0) envelope = rnd.nextFloat()
            for (i in 2 until fft.size) fft[i] = ((rnd.nextInt(255) - 127) * envelope * (if (i < 60) 1f else rnd.nextFloat())).toInt().toByte()
            fft
        }, before = {
            if (rnd.nextInt(30) == 0) {
                rig.volume = rnd.nextFloat(); rig.heavy = rnd.nextFloat(); rig.spike = rnd.nextFloat() * 2.5f
                rig.phase = rnd.nextFloat() * 1.3f; rig.playing = rnd.nextInt(6) != 0
            }
            rig.kick = rnd.nextFloat(); rig.pulse = if (rnd.nextBoolean()) rnd.nextFloat() else null
            rig.coverScale = 1f + rnd.nextFloat() * .15f
        }, each = {
            val h = SIDE / 2f * rig.coverScale
            assertTrue(geo.reachPx <= SIDE * ORB_REACH_MAX + .01f)
            for (l in 0 until geo.layerCount) {
                val p = geo.points(l); val c = geo.curves(l)
                for (i in 0 until ORB_SEGMENTS) {
                    val off = geo.offsetAt(l, i)
                    sure(off >= SIDE * ORB_GAP - .001f && off <= geo.reachPx + .001f) { "layer $l point $i: $off px (ceiling ${geo.reachPx})" }
                    // The cover never shows through: every point is at least the gap outside its edge.
                    sure(outsideRoundedSquare(p[i * 2], p[i * 2 + 1], h, RADIUS * rig.coverScale) >= SIDE * ORB_GAP - .02f) { "layer $l point $i inside the cover" }
                    // Mirrored left/right.
                    val m = (ORB_SEGMENTS - i) % ORB_SEGMENTS
                    sure(abs(p[i * 2] + p[m * 2]) < .001f && abs(p[i * 2 + 1] - p[m * 2 + 1]) < .001f) { "mirror at $i" }
                    // Closed curve through the points; its control points mirror too.
                    val n = (i + 1) % ORB_SEGMENTS
                    sure(p[n * 2] == c[i * 6 + 4] && p[n * 2 + 1] == c[i * 6 + 5]) { "the curve passes point $n" }
                    val ms = ORB_SEGMENTS - 1 - i
                    sure(abs(c[i * 6] + c[ms * 6 + 2]) < .001f && abs(c[i * 6 + 1] - c[ms * 6 + 3]) < .001f) { "curve mirror at $i" }
                    // Control points stay near their segment (no loops).
                    val prev = (i + ORB_SEGMENTS - 1) % ORB_SEGMENTS
                    val span = abs(p[n * 2] - p[prev * 2]) + abs(p[n * 2 + 1] - p[prev * 2 + 1])
                    sure(abs(c[i * 6] - p[i * 2]) + abs(c[i * 6 + 1] - p[i * 2 + 1]) <= span * ORB_CURVE_TENSION + .001f) { "control point near its segment at $i" }
                }
                // `side` is the cover's side: the outline passes the middle of the (pulsing) cover's sides.
                assertTrue(abs(p[0]) < .001f && abs(p[1] + h + geo.offsetAt(l, 0)) < .01f, "12 o'clock")
                assertTrue(abs(p[32 * 2] - h - geo.offsetAt(l, 32)) < .01f && abs(p[32 * 2 + 1]) < .01f, "3 o'clock")
                assertTrue(abs(p[64 * 2]) < .001f && abs(p[64 * 2 + 1] - h - geo.offsetAt(l, 64)) < .01f, "6 o'clock")
                assertTrue(geo.alpha(l) in 0f..1f && geo.level(l) in 0f..1f)
            }
            assertTrue(geo.open in 0f..1f && geo.glow in 0f..1f && geo.drift in 0f..1f)
            checked++
        })
        assertEquals(3000, checked)
    }

    @Test fun displacementNeverPassesTheCeiling() {
        val rig = Rig(60, fftHz = 43)
        rig.volume = 1f; rig.heavy = 1f; rig.spike = 5f; rig.phase = 1.5f; rig.kick = 1f; rig.pulse = 1f
        var far = 0f
        rig.run(12f, { LOUD }, each = { for (l in 0 until rig.geo.layerCount) for (p in 0 until ORB_SEGMENTS) far = max(far, rig.geo.offsetAt(l, p)) })
        // Everything at max: the aura is big, but never beyond the overall limit.
        assertTrue(far > SIDE * ORB_REACH_MAX * .8f && far <= SIDE * ORB_REACH_MAX + .01f, "the aura reached $far px")
        // Normal settings in a loud part: the bass bulges are clearly visible in the main shape.
        val normal = Rig(60, fftHz = 43); normal.volume = .7f
        var bass = 0f
        normal.run(8f, { LOUD }, each = { for (p in 0..16) bass = max(bass, normal.geo.offsetAt(0, p)) })
        assertTrue(bass - SIDE * ORB_GAP > SIDE * .08f, "bass bulge only ${bass - SIDE * ORB_GAP} px")
    }

    /** The same music drawn at 30, 60 and 120 pictures per second looks the same. */
    @Test fun sameAtEveryFrameRate() {
        fun play(fps: Int): List<Float> {
            val rig = Rig(fps)
            val out = ArrayList<Float>()
            fun sample() { for (l in 0 until rig.geo.layerCount) for (p in intArrayOf(6, 20, 40, 58)) out += rig.geo.offsetAt(l, p); out += rig.geo.open * SIDE }
            val beat = { val since = rig.time % .4f; rig.kick = exp(-since / .085f); rig.pulse = if (rig.time > 4f) rig.kick else null }
            rig.run(2.9f, { LOUD }, beat); sample()
            rig.run(2f, { BASSY }, beat); sample()
            rig.run(.2f, { BRIGHT }, beat); sample()      // in the middle of a change
            rig.run(1.8f, { BRIGHT }, beat); sample()
            rig.playing = false
            rig.run(1f, { BRIGHT }, beat); sample()
            return out
        }
        val a = play(30); val b = play(60); val c = play(120)
        var worst = 0f
        for (i in a.indices) worst = max(worst, max(abs(a[i] - b[i]), abs(c[i] - b[i])))
        println("ORB frame-rate spread: $worst px of side $SIDE")
        assertTrue(worst < SIDE * .015f, "30/60/120 fps differ by $worst px")
    }

    private fun assertFinite(geo: OrbGeometry, why: String) {
        for (l in 0 until geo.layerCount) {
            assertTrue(geo.points(l).all { it.isFinite() } && geo.curves(l).all { it.isFinite() }, "$why: layer $l has a point that is not a number")
            assertTrue(geo.alpha(l).isFinite() && geo.level(l).isFinite(), "$why: alpha / level")
            for (p in 0 until ORB_SEGMENTS) assertTrue(geo.offsetAt(l, p).isFinite(), "$why: offset")
        }
        assertTrue(geo.foot().all { it.isFinite() }, "$why: foot")
        assertTrue(geo.open.isFinite() && geo.glow.isFinite() && geo.reachPx.isFinite() && geo.drift.isFinite(), "$why: open / glow / reach / drift")
    }

    /** A cover that isn't measured yet, nonsense sizes and NaN: never an exception, never NaN points. */
    @Test fun badSizesNeverThrowOrGiveNaN() {
        val nan = Float.NaN; val inf = Float.POSITIVE_INFINITY
        // side to cornerRadius
        val sizes = listOf(0f to 0f, 0f to 40f, -400f to 40f, -400f to -40f, nan to 40f, 400f to nan, nan to nan, inf to 40f,
            400f to inf, 400f to -40f, 400f to 300f, 400f to 200f, 1f to 5f, 1e-6f to 1e-6f)
        for ((side, radius) in sizes) {
            val rig = Rig(60, side = side, radius = radius)
            rig.run(1.5f, { LOUD }, each = { assertFinite(rig.geo, "side $side radius $radius") })
            val shown = if (side > 0f && side.isFinite()) side else 0f
            // Nothing is ever further out than the (pulsing) cover's corner plus the reach.
            val limit = shown * (.5f * rig.coverScale * 1.4143f + ORB_REACH_MAX) + .01f
            for (l in 0 until rig.geo.layerCount) assertTrue(rig.geo.points(l).all { abs(it) <= limit }, "side $side radius $radius: inside $limit px")
            assertTrue(rig.geo.reachPx >= 0f && rig.geo.reachPx <= shown * ORB_REACH_MAX + .01f)
        }
        // A radius bigger than half the side is the same as a full circle (radius = half the side).
        val round = Rig(60, radius = SIDE / 2); val tooRound = Rig(60, radius = SIDE * 3)
        round.run(1f, { LOUD }); tooRound.run(1f, { LOUD })
        for (l in 0 until round.geo.layerCount) for (i in 0 until ORB_SEGMENTS * 2) assertEquals(round.geo.points(l)[i], tooRound.geo.points(l)[i])
        // The cover gets its size after a while (first measured as 0): the aura is simply there, right away.
        val late = OrbGeometry(); val spectrum = DisplaySpectrum()
        spectrum.accept(LOUD, RATE)
        late.update(1f / 60, true, spectrum.bands, spectrum.version, 0f, 0f, 1f, 1f, 1f, .8f, .5f, 0f, null)
        assertTrue(late.points(0).all { it == 0f })
        late.update(1f / 60, true, spectrum.bands, spectrum.version, SIDE, RADIUS, 1f, 1f, 1f, .8f, .5f, 0f, null)
        assertTrue(abs(late.points(0)[1] + SIDE / 2 + late.offsetAt(0, 0)) < .01f && late.offsetAt(0, 0) >= SIDE * ORB_GAP - .001f)
        // NaN in every other number, an empty spectrum and odd time steps.
        val odd = Rig(60)
        odd.run(2f, { LOUD })
        for (bad in listOf(nan, inf, -inf, -1f, 1e9f)) {
            odd.geo.update(bad, true, odd.spectrum.bands, odd.spectrum.version + 1, SIDE, RADIUS, bad, bad, bad, bad, bad, bad, bad)
            assertFinite(odd.geo, "everything $bad")
            odd.geo.update(1f / 60, true, FloatArray(DISPLAY_BANDS) { bad }, odd.spectrum.version + 2, SIDE, RADIUS, 1f, 1f, 1f, .8f, .5f, 0f, null)
            assertFinite(odd.geo, "bands $bad")
        }
        odd.geo.update(1f / 60, true, FloatArray(0), 12345, SIDE, RADIUS, 1f, 1f, 1f, .8f, .5f, 0f, null)
        assertFinite(odd.geo, "no bands")
        odd.run(1f, { LOUD }, each = { assertFinite(odd.geo, "afterwards") })
        for (l in 0 until odd.geo.layerCount) for (p in 0 until ORB_SEGMENTS)
            assertTrue(odd.geo.offsetAt(l, p) in SIDE * ORB_GAP - .001f..SIDE * ORB_REACH_MAX + .01f, "back under the ceiling")
    }

    /** The shape of the main layer after [seconds] of one steady tone. */
    private fun toneShape(hz: Double, size: Int, rate: Int, seconds: Float = 4f): OrbGeometry {
        val tone = Tone(hz, size, rate)
        val rig = Rig(60, fftHz = tone.perSecond, rate = rate)
        rig.run(seconds, { tone.next() }, each = { assertFinite(rig.geo, "$hz Hz, $size bytes at $rate Hz") })
        return rig.geo
    }

    /**
     * Real tones at every FFT size Party can get: the phone's Visualizer ([PHONE_FFT] bytes at 48 kHz =
     * 46.9 Hz per bin, so the whole deep-bass range is two bins), and 512 / 1024 / 2048 bytes at 44.1 kHz.
     * Bass bulges at the top and leaves the bottom alone; treble the other way round.
     */
    @Test fun realTonesLandInTheRightPlaceAtEveryFftSize() {
        val half = ORB_SEGMENTS / 2
        val rest = SIDE * ORB_GAP
        fun peakAt(geo: OrbGeometry): Int { var at = 0; for (p in 0..half) if (geo.offsetAt(0, p) > geo.offsetAt(0, at)) at = p; return at }
        for ((size, rate) in listOf(PHONE_FFT to PHONE_RATE, 512 to RATE, 1024 to RATE, 2048 to RATE)) {
            val name = "$size bytes at $rate Hz (${rate.toFloat() / size} Hz per bin)"
            for (hz in listOf(60.0, 150.0)) {
                val geo = toneShape(hz, size, rate)
                val at = peakAt(geo)
                assertTrue(at < half / 2, "$name: $hz Hz bulges in the top half (point $at)")
                assertTrue(geo.offsetAt(0, at) - rest > SIDE * .06f, "$name: $hz Hz is clearly visible (${geo.offsetAt(0, at) - rest} px)")
                val topSize = geo.offsetAt(0, at) - rest
                for (p in half * 3 / 4..half) assertTrue(geo.offsetAt(0, p) - rest <= topSize * ORB_BOTTOM_BASS + 1f,
                    "$name: $hz Hz bulges less at the bottom than at the top (point $p)")
            }
            val low = peakAt(toneShape(60.0, size, rate)); val higher = peakAt(toneShape(150.0, size, rate))
            assertTrue(low < higher, "$name: 60 Hz (point $low) sits above 150 Hz (point $higher)")
            val treble = toneShape(5000.0, size, rate)
            val at = peakAt(treble)
            assertTrue(at > half * 3 / 4, "$name: 5 kHz bulges near the bottom (point $at)")
            assertTrue(treble.offsetAt(0, at) - rest > SIDE * .02f, "$name: 5 kHz is visible")
            for (p in 0..half / 2) assertTrue(treble.offsetAt(0, p) - rest < 1f, "$name: 5 kHz leaves the top alone (point $p)")
        }
    }

    /**
     * At the phone's resolution the deep bass is only two FFT bins wide. It must still be a round bulge
     * (the display spectrum interpolates between the bins, the ring smooths), not stair steps or a block.
     */
    @Test fun phoneResolutionBassIsARoundBulgeNotBlocks() {
        val half = ORB_SEGMENTS / 2
        fun profile(size: Int, rate: Int, hz: Double) = toneShape(hz, size, rate).let { geo -> FloatArray(half + 1) { geo.offsetAt(0, it) - SIDE * ORB_GAP } }
        for (hz in listOf(50.0, 60.0, 85.0, 110.0, 150.0)) {
            val phone = profile(PHONE_FFT, PHONE_RATE, hz); val web = profile(2048, RATE, hz)
            val top = phone.max()
            var biggestStep = 0f; var flatRun = 0; var longestFlat = 0; var turns = 0; var direction = 0
            // The top and sides (the bottom holds the mirrored copy of the same bulge, ORB_BOTTOM_BASS).
            for (p in 1..(half * (1f - ORB_BOTTOM_SPAN)).toInt()) {
                val d = phone[p] - phone[p - 1]
                biggestStep = max(biggestStep, abs(d))
                // A «block»: several neighbouring points at exactly the same height, high up on the bulge.
                if (abs(d) < .02f && phone[p] > top * .3f) { flatRun++; longestFlat = max(longestFlat, flatRun) } else flatRun = 0
                val now = if (d > .5f) 1 else if (d < -.5f) -1 else 0
                if (now != 0) { if (direction != 0 && now != direction) turns++; direction = now }
            }
            println("ORB phone bass $hz Hz: top ${top.toInt()} px (website ${web.max().toInt()}), biggest step ${biggestStep.toInt()} px, flat run $longestFlat, turns $turns")
            assertTrue(biggestStep < SIDE * .045f, "$hz Hz: a step of $biggestStep px between two neighbouring points")
            assertTrue(longestFlat <= 2, "$hz Hz: $longestFlat points in a row at the same height (a block)")
            // One bulge (or one with a shoulder where two ranges meet), not a comb of teeth.
            assertTrue(turns <= 3, "$hz Hz: the outline turns $turns times")
            assertTrue(top > web.max() * .7f, "$hz Hz: about as big as on the website ($top px against ${web.max()})")
        }
    }

    /** A low sample rate: the bands above half the rate do not exist. They are silent, nothing breaks. */
    @Test fun bandsAboveNyquistAreSilentAndHarmless() {
        val half = ORB_SEGMENTS / 2
        for (rate in listOf(16_000, 8_000, 11_025)) for (size in listOf(512, PHONE_FFT, 2048)) {
            val spectrum = DisplaySpectrum()
            val tone = Tone(60.0, size, rate)
            repeat(8) { spectrum.accept(tone.next(), rate) }
            for (b in 0 until DISPLAY_BANDS) {
                assertTrue(spectrum.bands[b].isFinite() && spectrum.bands[b] >= 0f, "band $b at $rate Hz")
                if (displayBandHz(b.toFloat()) >= rate / 2f) assertEquals(0f, spectrum.bands[b], "band $b lies above half of $rate Hz")
            }
            val geo = toneShape(60.0, size, rate, seconds = 3f)
            var at = 0
            for (p in 0..half) if (geo.offsetAt(0, p) > geo.offsetAt(0, at)) at = p
            assertTrue(at < half / 4, "$size bytes at $rate Hz: 60 Hz still bulges at the top (point $at)")
            assertTrue(geo.offsetAt(0, half) - SIDE * ORB_GAP <= (geo.offsetAt(0, at) - SIDE * ORB_GAP) * ORB_BOTTOM_BASS + 1f,
                "…and the bottom (mirrored bass) stays smaller than the top")
        }
        // Tiny and odd frames, and a silly rate.
        val spectrum = DisplaySpectrum()
        for (bytes in listOf(0, 2, 4, 6, 16, 130)) { spectrum.accept(ByteArray(bytes) { 90 }, RATE); assertTrue(spectrum.bands.all { it.isFinite() }) }
        spectrum.accept(LOUD, 0); spectrum.accept(LOUD, -1); spectrum.accept(LOUD, 100)
        assertTrue(spectrum.bands.all { it.isFinite() })
    }

    /**
     * The absolute floors follow the source. Visualizer numbers are 2–4 times PCM's and carry 8-bit
     * noise: with the Visualizer's floors that noise keeps the aura shut, and music opens it as usual.
     */
    @Test fun visualizerFloorsKeepNoiseShutAndMusicOpen() {
        val rnd = Random(5)
        val noise = { ByteArray(PHONE_FFT) { (rnd.nextInt(5) - 2).toByte() } }     // real and imaginary parts within ±2
        val quiet = Rig(60, rate = PHONE_RATE); quiet.geo.source = OrbSource.VISUALIZER
        quiet.run(20f, noise)
        assertEquals(0f, quiet.geo.open, "8-bit noise does not open the aura")
        for (l in 0 until quiet.geo.layerCount) for (p in 0 until ORB_SEGMENTS)
            assertTrue(quiet.geo.offsetAt(l, p) < SIDE * ORB_GAP + 1f, "8-bit noise does not move the aura")
        // The same noise read with PCM's floors would open it: that is why the floors are per source.
        val wrong = Rig(60, rate = PHONE_RATE)
        wrong.run(20f, noise)
        assertTrue(wrong.geo.open > .3f, "PCM floors on Visualizer noise: open ${wrong.geo.open}")
        // Music at Visualizer level (loud, sometimes clipping at the byte limit) opens it just as on the website.
        val music = Rig(60, rate = PHONE_RATE); music.geo.source = OrbSource.VISUALIZER
        val loud = ByteArray(PHONE_FFT).also { for (k in 1 until it.size / 2) it[k * 2] = (striped(k.toFloat() * PHONE_RATE / it.size) * 1.4f).toInt().coerceAtMost(127).toByte() }
        music.run(8f, { loud })
        val web = Rig(60); web.run(8f, { LOUD })
        assertTrue(music.geo.open > .9f, "music opens it: ${music.geo.open}")
        var most = 0f; var mostWeb = 0f
        for (p in 0..16) { most = max(most, music.geo.offsetAt(0, p)); mostWeb = max(mostWeb, web.geo.offsetAt(0, p)) }
        assertTrue(abs(most - mostWeb) < SIDE * .03f, "the bass bulge is as big as with PCM ($most px against $mostWeb)")
        // Silence closes it again, and a source switch in the middle is harmless.
        music.geo.source = OrbSource.PCM
        music.run(1f, { loud }, each = { assertFinite(music.geo, "source switched") })
        music.geo.source = OrbSource.VISUALIZER
        music.run(30f, { SILENT })
        assertClosed(music.geo, "silence from the Visualizer")
    }

    /** A new song in the middle of a big movement: closed and calm at once, the shape glides in, nothing jumps. */
    @Test fun resetInTheMiddleOfMovementIsCalmAndClosed() {
        for (soundAfter in listOf(false, true)) {
            val rig = Rig(60, fftHz = 43)
            rig.volume = 1f; rig.heavy = 1f; rig.kick = 1f; rig.pulse = 1f
            rig.run(8f, { LOUD })
            rig.run(.05f, { BASSY })                     // in the middle of a change
            val geo = rig.geo
            val layers = geo.layerCount
            fun offsets() = Array(layers) { l -> FloatArray(ORB_SEGMENTS) { geo.offsetAt(l, it) } }
            val before = offsets()
            assertTrue(before[0].max() > SIDE * .1f, "the aura was far out (${before[0].max()} px)")
            val drift = geo.drift
            geo.reset()
            assertEquals(0f, geo.open); assertTrue(abs(ORB_GLOW_REST - geo.glow) < 1e-6f); assertEquals(drift, geo.drift, "the colours do not jump")
            for (l in 0 until layers) { assertEquals(0f, geo.level(l)); assertTrue(abs(ORB_LAYERS[l].restAlpha - geo.alpha(l)) < 1e-6f) }
            // No sound yet (as when the engine clears the spectrum at a new song), or the old sound still coming.
            rig.feeding = soundAfter
            rig.kick = 0f; rig.pulse = null; rig.heavy = 0f
            if (!soundAfter) rig.spectrum.reset()
            var previous = before
            val gap = SIDE * ORB_GAP
            var restedAt = -1f
            val start = rig.time
            rig.run(.6f, { SILENT }, each = {
                val now = offsets()
                for (l in 0 until layers) for (p in 0 until ORB_SEGMENTS) {
                    val d = now[l][p] - previous[l][p]
                    assertTrue(d <= .001f, "sound after = $soundAfter: layer $l point $p moved outward by $d px after reset")
                    assertTrue(d >= -SIDE * ORB_MAX_SPEED / 60f - .01f, "layer $l point $p jumped $d px in one picture")
                }
                if (restedAt < 0f && now.all { layer -> layer.all { it < gap + .5f } }) restedAt = rig.time - start
                previous = now
            })
            assertTrue(restedAt in 0f..(.35f), "at rest ${restedAt}s after reset")
            assertTrue(geo.open < .001f)
            assertClosed(geo, "after reset")
            // And it opens again as for any new song.
            rig.feeding = true
            rig.run(6f, { LOUD })
            assertTrue(geo.open > .9f, "the next song opens it: ${geo.open}")
        }
    }

    /** The numbers the drawing reads: the canvas always has room for the aura, and the tables are sane. */
    @Test fun sharedLookNumbersFitTogether() {
        assertEquals(COVER_PULSE_MAX, coverPulseScale(1f, 1f, 1f, 1f, 1f))
        assertEquals(COVER_PULSE_MAX, coverPulseScale(5f, 5f, 5f, 5f, 5f), "never above the biggest pulse")
        assertEquals(1f, coverPulseScale(0f, 0f, 0f, 0f, 0f))
        // Everything at max, a very round cover and the biggest pulse: every point is inside the drawing margin.
        val rig = Rig(60, fftHz = 43)
        rig.volume = 1f; rig.heavy = 1f; rig.spike = 5f; rig.phase = 1f; rig.kick = 1f; rig.pulse = 1f; rig.coverScale = COVER_PULSE_MAX
        var far = 0f
        rig.run(10f, { LOUD }, each = {
            for (l in 0 until rig.geo.layerCount) for (v in rig.geo.points(l)) far = max(far, abs(v))
        })
        assertTrue(far <= SIDE * ORB_EXTENT + .01f, "the aura reached $far px from the centre, the margin is ${SIDE * ORB_EXTENT}")
        assertTrue(far > SIDE * ORB_EXTENT * .9f, "…and the margin is not much bigger than needed ($far px of ${SIDE * ORB_EXTENT})")
        for (l in 0 until ORB_LAYERS.size) {
            assertTrue(auraLayerAlpha(l) in 0f..1f && (l == 0 || auraLayerAlpha(l) < auraLayerAlpha(l - 1)), "layer $l is weaker than the one in front")
            assertTrue(abs(auraLayerDrift(l)) == 1f && auraLayerColorShift(l) >= 0)
        }
        assertEquals(AURA_MAIN_ALPHA, auraLayerAlpha(0))
    }
}

package com.kododake.aabrowser.rave

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

/**
 * Grit for the effects (2026-11-23): [HardstyleFrame.gritFx] / [HardstyleFrame.heavyFx] are new, while the
 * genre rules keep reading [HardstyleFrame.grit] / [HardstyleFrame.heavy] exactly as before. No recordings
 * needed: synthetic Visualizer-like kicks (strong bass, mid distortion in the tail, mid/bass .17–.31).
 */
class GritEffectsTest {
    private val rate = 48_000
    private val size = 1024

    /** One Visualizer-format frame: [bass] in 30–250 Hz, [mid] in 250–2500 Hz, a little treble. */
    private fun frame(bass: Float, mid: Float): ByteArray {
        val fft = ByteArray(size)
        for (k in 1 until size / 2) {
            val hz = k.toFloat() * rate / size
            val v = when { hz < 250f -> bass; hz <= 2500f -> mid; else -> 4f }
            fft[k * 2] = v.toInt().coerceIn(0, 127).toByte()
        }
        return fft
    }

    /** 8 s of hardstyle-like kicks at 150 BPM: the bass jumps on the kick and decays, the distortion stays. */
    private fun run(audio: HardstyleAudio): List<HardstyleFrame> {
        val out = ArrayList<HardstyleFrame>()
        var t = 1_000L
        while (t < 9_000L) {
            val sinceKick = (t - 1_000L) % 400L
            // A long zaag tail: the bass never falls far, so mid/bass stays .17–.31 (under the old .35).
            val bass = 70f + 60f * kotlin.math.exp(-sinceKick / 180f)
            out.add(audio.accept(frame(bass, 22f), rate, t))
            t += 20L
        }
        return out
    }

    @Test fun genreNumbersAreUnchangedAndEffectsGetGrit() {
        val normal = run(HardstyleAudio())
        val bassCut = run(HardstyleAudio().apply { setBassCutInput(true) })
        // The genre rules see the same numbers whichever microphone the effects think is in use.
        for (i in normal.indices) {
            assertEquals(normal[i].grit, bassCut[i].grit, "grit at frame $i")
            assertEquals(normal[i].heavy, bassCut[i].heavy, "heavy at frame $i")
        }
        val late = normal.drop(normal.size / 2)
        // With today's sources mid/bass stays under the old .35: the old grit is (still) 0 here…
        assertTrue(late.maxOf { it.grit } < .05f, "old grit stays as before: ${late.maxOf { it.grit }}")
        // …while the effects' grit and heavy react to the distortion.
        assertTrue(late.maxOf { it.gritFx } > .3f, "effects' grit reacts: ${late.maxOf { it.gritFx }}")
        assertTrue(late.maxOf { it.heavyFx } > late.maxOf { it.heavy }, "effects' heavy is above the old heavy")
        // A bass-cutting microphone keeps the old numbers for the effects too.
        for (f in bassCut) assertEquals(f.grit, f.gritFx, "bass-cut microphone: effects use the old grit")
        // forEffects() hands the effects exactly these numbers.
        val fx = late.last().forEffects()
        assertEquals(late.last().gritFx, fx.grit); assertEquals(late.last().heavyFx, fx.heavy)
    }
}

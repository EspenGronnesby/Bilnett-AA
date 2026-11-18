package com.kododake.aabrowser.rave

import kotlin.math.PI
import kotlin.math.exp
import kotlin.math.round
import kotlin.math.sin
import kotlin.random.Random
import kotlin.test.Test
import kotlin.test.assertTrue

/**
 * The same synthetic music through PcmFft + HardstyleAudio on the JVM (the app) and JS (the website).
 * Prints a fingerprint per platform (compare the two lines in the test output) and checks the
 * analysis reacts at all. Float math is Double on JS, so tiny differences are expected.
 */
class PlatformParityTest {
    @Test fun analysisFingerprint() {
        val rate = 44_100
        val fft = PcmFft(2048)
        val audio = HardstyleAudio()
        val rnd = Random(1)
        var t = 0
        var kicks = 0; var sumBass = 0.0; var sumHeavy = 0.0; var sumEnergy = 0.0; var maxBpm = 0f
        var lastKick = 0f
        repeat(43 * 20) { frame ->   // ~20 s at ~43 frames/s
            val samples = FloatArray(fft.hop) {
                val s = t++ / rate.toDouble()
                val beat = s % (60.0 / 150.0)            // 150 BPM kick
                val kick = sin(2 * PI * (50 + 80 * exp(-beat * 30)) * beat) * exp(-beat * 9)
                val drop = if (s > 8) 1.0 else 0.3          // build-up, then the drop from 8 s
                (drop * (0.7 * kick + 0.15 * sin(2 * PI * 440 * s) * (0.5 + 0.5 * sin(2 * PI * 0.5 * s))) +
                    0.03 * (rnd.nextDouble() - 0.5)).toFloat()
            }
            val f = audio.accept(fft.push(samples, rate), rate, frame * 23L)
            if (f.kick > .7f && lastKick <= .7f) kicks++
            lastKick = f.kick
            sumBass += f.bass; sumHeavy += f.heavy; sumEnergy += f.energy
            if (f.bpm > maxBpm) maxBpm = f.bpm
        }
        fun r3(x: Double) = round(x * 1000) / 1000
        println("FINGERPRINT kicks=$kicks bass=${r3(sumBass)} heavy=${r3(sumHeavy)} energy=${r3(sumEnergy)} bpm=$maxBpm")
        assertTrue(kicks > 20, "the analysis should hear the kicks (got $kicks)")
    }
}

package com.kododake.aabrowser.rave

import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.exp
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.roundToInt
import kotlin.math.sin
import kotlin.random.Random
import kotlin.test.Test
import kotlin.test.assertContentEquals

/** PcmFft must give exactly the frames the app's old MicFftSource loop gave (copied below). */
class PcmFftParityTest {
    private class OldLoop(val size: Int, val rate: Int) {
        val hop = size / 2
        val window = FloatArray(size) { (0.5f - 0.5f * cos(2.0 * PI * it / (size - 1))).toFloat() }
        val ring = FloatArray(size); val re = FloatArray(size); val im = FloatArray(size); val out = ByteArray(size)
        var peak = 1f
        fun frame(chunk: ShortArray): ByteArray {
            System.arraycopy(ring, hop, ring, 0, size - hop)
            for (i in 0 until hop) ring[size - hop + i] = chunk[i] / 32768f
            for (i in 0 until size) { re[i] = ring[i] * window[i]; im[i] = 0f }
            fft(re, im)
            var frameMax = 0f
            for (k in 1 until size / 2) frameMax = max(frameMax, hypot(re[k], im[k]))
            peak = max(frameMax, max(1e-3f, peak * exp(-(hop.toFloat() / rate) / 30f)))
            val scale = 100f / peak
            fun b(v: Float): Byte = (v * scale).roundToInt().coerceIn(-128, 127).toByte()
            out[0] = b(re[0]); out[1] = b(re[size / 2])
            for (k in 1 until size / 2) { out[2 * k] = b(re[k]); out[2 * k + 1] = b(im[k]) }
            return out.copyOf()
        }
        /** In-place iterative radix-2 FFT (size must be a power of two). */
        fun fft(re: FloatArray, im: FloatArray) {
            val n = re.size
            var j = 0
            for (i in 1 until n) {
                var bit = n shr 1
                while (j and bit != 0) { j = j xor bit; bit = bit shr 1 }
                j = j xor bit
                if (i < j) { var t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t }
            }
            var len = 2
            while (len <= n) {
                val ang = -2.0 * PI / len
                val wr = cos(ang).toFloat(); val wi = sin(ang).toFloat()
                var i = 0
                while (i < n) {
                    var cr = 1f; var ci = 0f
                    for (k in 0 until len / 2) {
                        val ar = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci
                        val ai = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr
                        re[i + k + len / 2] = re[i + k] - ar; im[i + k + len / 2] = im[i + k] - ai
                        re[i + k] += ar; im[i + k] += ai
                        val ncr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = ncr
                    }
                    i += len
                }
                len = len shl 1
            }
        }

    }

    @Test fun identicalToTheOldMicLoop() {
        for (size in intArrayOf(512, 2048)) {
            val rate = 44_100
            val old = OldLoop(size, rate)
            val new = PcmFft(size)
            val rnd = Random(42)
            var t = 0
            repeat(300) { frame ->
                // Kick-like bass, a tone and noise, getting louder and softer (exercises the auto-gain).
                val chunk = ShortArray(size / 2) {
                    val s = t++ / rate.toDouble()
                    val loud = 0.2 + 0.8 * ((frame / 60) % 2)
                    val v = loud * (0.6 * sin(2 * PI * 55 * s) * exp(-(s % 0.5) * 8) + 0.2 * sin(2 * PI * 880 * s) + 0.1 * (rnd.nextDouble() - 0.5))
                    (v * 32767).toInt().coerceIn(-32768, 32767).toShort()
                }
                val expected = old.frame(chunk)
                val actual = new.push(FloatArray(chunk.size) { chunk[it] / 32768f }, rate)
                assertContentEquals(expected, actual, "size $size frame $frame")
            }
        }
    }
}

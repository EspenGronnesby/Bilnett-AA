package com.kododake.aabrowser.rave

import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.exp
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.roundToInt
import kotlin.math.sin

/**
 * Raw sound → FFT in the exact byte format of Android's Visualizer.getFft(), so the analysis
 * doesn't need to know where the sound came from. Moved unchanged out of MicFftSource (the app's
 * microphone backup) so the Rave website can feed the same analysis from shared screen sound or
 * a microphone. Hann window, 50 % overlap (call [push] with [hop] new samples at a time), slow
 * auto-gain over ~30 s that keeps drops louder than build-ups.
 */
class PcmFft(val size: Int) {
    /** New samples per frame (50 % overlap → ~43 frames per second at 2048 and 44.1 kHz). */
    val hop = size / 2
    private val window = FloatArray(size) { (0.5f - 0.5f * cos(2.0 * PI * it / (size - 1))).toFloat() }
    private val ring = FloatArray(size)
    private val re = FloatArray(size)
    private val im = FloatArray(size)
    private val out = ByteArray(size)
    private var peak = 1f

    /** [samples]: [hop] new mono samples in −1..1. Returns a fresh FFT frame (Visualizer bytes). */
    fun push(samples: FloatArray, rateHz: Int): ByteArray {
        ring.copyInto(ring, 0, hop, size)
        for (i in 0 until hop) ring[size - hop + i] = samples[i]
        for (i in 0 until size) { re[i] = ring[i] * window[i]; im[i] = 0f }
        fft(re, im)
        // Slow auto-gain (peak falls over ~30 s) keeps values in Visualizer's byte range
        // without flattening the difference between a build-up and a drop.
        var frameMax = 0f
        for (k in 1 until size / 2) frameMax = max(frameMax, hypot(re[k], im[k]))
        peak = max(frameMax, max(1e-3f, peak * exp(-(hop.toFloat() / rateHz) / 30f)))
        val scale = 100f / peak
        fun b(v: Float): Byte = (v * scale).roundToInt().coerceIn(-128, 127).toByte()
        out[0] = b(re[0]); out[1] = b(re[size / 2])
        for (k in 1 until size / 2) { out[2 * k] = b(re[k]); out[2 * k + 1] = b(im[k]) }
        return out.copyOf()
    }

    /** In-place iterative radix-2 FFT (size must be a power of two). */
    private fun fft(re: FloatArray, im: FloatArray) {
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

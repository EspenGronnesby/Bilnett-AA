package com.kododake.aabrowser.rave

import kotlin.math.*

internal const val SPECTRUM_BANDS = 48
internal val SILENT_SPECTRUM: List<Float> = List(SPECTRUM_BANDS) { 0f }

/** Logarithmic display bands, not 48 independent low-frequency FFT measurements. */
internal class HardstyleSpectrum {
    private val levels = FloatArray(SPECTRUM_BANDS)
    private val raw = FloatArray(SPECTRUM_BANDS)
    private val previousRaw = FloatArray(SPECTRUM_BANDS)
    private var reference = 8f
    var highMotion: Float = 0f
        private set

    fun reset() {
        levels.fill(0f)
        raw.fill(0f)
        previousRaw.fill(0f)
        reference = 8f
        highMotion = 0f
    }

    fun accept(fft: ByteArray, sampleRate: Int, dt: Float): List<Float> {
        val binHz = sampleRate.toFloat() / fft.size
        val lastBin = fft.size / 2 - 1
        fun magnitude(bin: Int): Float = if (bin in 1..lastBin)
            hypot(fft[bin * 2].toFloat(), fft[bin * 2 + 1].toFloat()) else 0f
        for (i in raw.indices) {
            val hz = 40f * 100f.pow(i.toFloat() / (SPECTRUM_BANDS - 1))
            val position = hz / binHz
            // Interpolate narrow display bands; retain peaks inside wider high-frequency bands.
            val lower = floor(position).toInt()
            val fraction = position - lower
            var value = magnitude(lower) * (1f - fraction) + magnitude(lower + 1) * fraction
            val halfWidth = 100f.pow(.5f / (SPECTRUM_BANDS - 1))
            val start = max(1, ceil(hz / halfWidth / binHz).toInt())
            val end = min(lastBin, floor(hz * halfWidth / binHz).toInt())
            for (bin in start..end) value = max(value, magnitude(bin))
            raw[i] = if (hz >= sampleRate / 2f) 0f else max(0f, value - 2f)
        }
        var positiveFlux = 0f
        for (i in 32 until SPECTRUM_BANDS) positiveFlux += max(0f, raw[i] - previousRaw[i])
        highMotion = (positiveFlux / 16f / max(8f, reference) * 3f).coerceIn(0f, 1f)
        raw.copyInto(previousRaw)
        reference = max(8f, max(raw.maxOrNull() ?: 0f, reference * exp(-dt / 3f)))
        for (i in levels.indices) {
            val neighbor = raw[max(0, i - 1)] * .15f + raw[i] * .7f + raw[min(raw.lastIndex, i + 1)] * .15f
            val ratio = neighbor / reference
            val target = (ln(1f + 3f * ratio) / ln(5f)).coerceIn(0f, 1f)
            val seconds = if (target > levels[i]) .01f else .07f
            levels[i] += (target - levels[i]) * (1f - exp(-dt / seconds))
            if (levels[i] < .0001f) levels[i] = 0f
        }
        return levels.toList() // Never publish the mutable working buffer.
    }
}

/** Bounded timestamped history. All buffers are reused by the drawing layer. */
internal class SpectrumHistory {
    private val times = LongArray(64)
    private val values = Array(64) { FloatArray(SPECTRUM_BANDS) }
    private var count = 0
    private var head = -1

    fun push(now: Long, spectrum: List<Float>) {
        if (head >= 0 && now < times[head]) { count = 0; head = -1 }
        if (head < 0 || times[head] != now) {
            head = (head + 1) % times.size
            count = min(count + 1, times.size)
        }
        times[head] = now
        for (i in 0 until SPECTRUM_BANDS) values[head][i] = spectrum[i]
    }

    fun sampleInto(now: Long, delayMs: Long, output: FloatArray) {
        if (count == 0) { output.fill(0f); return }
        val target = now - delayMs
        var newer = head
        for (age in 1 until count) {
            val older = (head - age + times.size) % times.size
            if (times[older] <= target) {
                val fraction = ((target - times[older]).toFloat() / max(1L, times[newer] - times[older])).coerceIn(0f, 1f)
                for (i in output.indices) output[i] = values[older][i] + (values[newer][i] - values[older][i]) * fraction
                return
            }
            newer = older
        }
        values[newer].copyInto(output)
    }
}

/** Top -> right -> bottom -> left -> top, with a mirrored frequency arrangement. */
internal fun mirroredSpectrumValue(spectrum: FloatArray, point: Int, segments: Int = 128): Float {
    val phase = (point % segments).toFloat() / segments
    val position = (if (phase <= .5f) phase * 2f else (1f - phase) * 2f) * (spectrum.size - 1)
    val index = floor(position).toInt()
    val next = min(index + 1, spectrum.lastIndex)
    return spectrum[index] + (spectrum[next] - spectrum[index]) * (position - index)
}

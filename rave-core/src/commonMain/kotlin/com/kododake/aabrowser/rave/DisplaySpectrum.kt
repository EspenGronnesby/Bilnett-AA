package com.kododake.aabrowser.rave

import kotlin.math.ceil
import kotlin.math.floor
import kotlin.math.hypot
import kotlin.math.ln
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow

/** Antall bånd i visnings-spekteret (logaritmisk fordelt). Flere = finere tagger i diskanten. */
const val DISPLAY_BANDS = 96
/** Visnings-spekteret dekker dette området. */
const val DISPLAY_FROM_HZ = 40f
const val DISPLAY_TO_HZ = 10_000f

/** Centre frequency of display band [band] (may be fractional). */
fun displayBandHz(band: Float): Float =
    DISPLAY_FROM_HZ * (DISPLAY_TO_HZ / DISPLAY_FROM_HZ).pow(band / (DISPLAY_BANDS - 1))

/** The (fractional) display band where [hz] lives, clamped to the covered range. */
fun displayBandAt(hz: Float): Float =
    ((DISPLAY_BANDS - 1) * ln(hz / DISPLAY_FROM_HZ) / ln(DISPLAY_TO_HZ / DISPLAY_FROM_HZ)).coerceIn(0f, (DISPLAY_BANDS - 1).toFloat())

/**
 * The ring's own spectrum: RAW magnitudes (Visualizer byte units, 0..~181) in [DISPLAY_BANDS]
 * logarithmic bands, taken from the same FFT bytes as [HardstyleSpectrum] with the same
 * interpolation / peak pick-up. No normalising and no smoothing here ([OrbGeometry] does that per
 * layer), and nothing the song analysis reads.
 *
 * Not thread safe on its own: [HardstyleAudio] owns it and guards it (see [HardstyleAudio.readDisplay]).
 * No allocation per call.
 */
class DisplaySpectrum {
    /** The latest raw bands. Owner's buffer: copy it out, never keep a reference across threads. */
    val bands = FloatArray(DISPLAY_BANDS)
    /** Goes up by one for every FFT frame (and every reset), so a reader can tell «new frame». */
    var version = 0
        private set

    // Where each band sits in the FFT; only worked out again when the FFT size or sample rate changes.
    private val position = FloatArray(DISPLAY_BANDS)
    private val start = IntArray(DISPLAY_BANDS)
    private val end = IntArray(DISPLAY_BANDS)
    private val audible = BooleanArray(DISPLAY_BANDS)
    private var layoutRate = 0
    private var layoutSize = 0

    fun reset() { bands.fill(0f); version++ }

    /** [fft]: Visualizer.getFft() bytes; [sampleRate] in Hz. */
    fun accept(fft: ByteArray, sampleRate: Int) {
        if (sampleRate <= 0 || fft.size < 4) return
        if (sampleRate != layoutRate || fft.size != layoutSize) layout(sampleRate, fft.size)
        val lastBin = fft.size / 2 - 1
        for (i in 0 until DISPLAY_BANDS) {
            if (!audible[i]) { bands[i] = 0f; continue }
            // Interpolate narrow bands; keep the peak inside the wider high-frequency bands.
            val lower = position[i].toInt()
            val fraction = position[i] - lower
            var value = magnitude(fft, lower, lastBin) * (1f - fraction) + magnitude(fft, lower + 1, lastBin) * fraction
            for (bin in start[i]..end[i]) value = max(value, magnitude(fft, bin, lastBin))
            bands[i] = value
        }
        version++
    }

    private fun magnitude(fft: ByteArray, bin: Int, lastBin: Int): Float =
        if (bin in 1..lastBin) hypot(fft[bin * 2].toFloat(), fft[bin * 2 + 1].toFloat()) else 0f

    private fun layout(sampleRate: Int, size: Int) {
        layoutRate = sampleRate; layoutSize = size
        val binHz = sampleRate.toFloat() / size
        val lastBin = size / 2 - 1
        val halfWidth = (DISPLAY_TO_HZ / DISPLAY_FROM_HZ).pow(.5f / (DISPLAY_BANDS - 1))
        for (i in 0 until DISPLAY_BANDS) {
            val hz = displayBandHz(i.toFloat())
            position[i] = hz / binHz
            start[i] = max(1, ceil(hz / halfWidth / binHz).toInt())
            end[i] = min(lastBin, floor(hz * halfWidth / binHz).toInt())
            audible[i] = hz < sampleRate / 2f
        }
    }
}

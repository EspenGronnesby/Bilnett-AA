package com.kododake.aabrowser.rave

import kotlin.math.*

internal data class HardstyleFrame(val bass: Float = 0f, val kick: Float = 0f, val highs: Float = 0f,
    val energy: Float = 0f, val burst: Float = 0f, val build: Float = 0f,
    val spectrum: List<Float> = SILENT_SPECTRUM, val highMotion: Float = 0f)

/** Independent from the original visualizer. Input sample rate is Hz, not Android's milliHz. */
internal class HardstyleAudio {
    private val spectrumAnalyzer = HardstyleSpectrum()
    private var peak = 8f
    private var average = 0f
    private var lastBass = 0f
    private var lastAt = 0L
    private var lastKick = -1000L
    private var lastBurst = -5000L
    private var frame = HardstyleFrame()
    @Synchronized fun reset() {
        spectrumAnalyzer.reset()
        peak = 8f; average = 0f; lastBass = 0f; lastAt = 0; lastKick = -1000; lastBurst = -5000
        frame = HardstyleFrame()
    }
    @Synchronized fun accept(fft: ByteArray, sampleRate: Int, now: Long): HardstyleFrame {
        if (sampleRate <= 0 || fft.size < 4) return HardstyleFrame()
        var low = 0f; var bass = 0f; var high = 0f
        var nl = 0; var nb = 0; var nh = 0
        for (k in 1 until fft.size / 2) {
            val hz = k.toFloat() * sampleRate / fft.size
            val magnitude = hypot(fft[2*k].toFloat(), fft[2*k+1].toFloat())
            when {
                hz in 30f..<90f -> { low += magnitude; nl++ }
                hz in 90f..<250f -> { bass += magnitude; nb++ }
                hz in 250f..8000f -> { high += magnitude; nh++ }
            }
        }
        low /= max(1, nl); bass /= max(1, nb); high /= max(1, nh)
        val value = max(low, bass)
        val dt = if (lastAt == 0L) 0.016f else ((now-lastAt)/1000f).coerceIn(.001f, .2f)
        lastAt = now
        peak = max(8f, max(value, peak * exp(-dt / 3f)))
        val norm = if (value < 2f) 0f else (value / (peak * 1.3f)).coerceIn(0f, 1f)
        val onset = value > 3f && value > lastBass * 1.12f && value > average * 1.15f && now-lastKick >= 120
        if (onset) lastKick = now
        val burst = onset && norm > .55f && frame.energy < .35f && now-lastBurst >= 1800
        if (burst) lastBurst = now
        fun smooth(old: Float, target: Float, seconds: Float) = old + (target-old)*(1-exp(-dt/seconds))
        frame = HardstyleFrame(
            smooth(frame.bass, norm, if (norm > frame.bass) .025f else .18f),
            if (onset) 1f else frame.kick * exp(-dt/.085f),
            smooth(frame.highs, (high / max(8f, peak)).coerceIn(0f,1f), .08f),
            smooth(frame.energy, norm, .8f),
            if (burst) 1f else frame.burst * exp(-dt/.35f),
            smooth(frame.build, if (burst || frame.burst > .1f) 0f else
                ((norm-frame.energy)/.35f).coerceIn(0f,1f), .3f),
            spectrumAnalyzer.accept(fft, sampleRate, dt),
            spectrumAnalyzer.highMotion)
        average = smooth(average, value, .5f); lastBass = value
        return frame
    }
}

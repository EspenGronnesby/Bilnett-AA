package com.kododake.aabrowser.rave

import org.junit.Assert.*
import org.junit.Test

class HardstyleSpectrumTest {
    private fun fft(vararg bins: Pair<Int, Int>, size: Int = 2048) = ByteArray(size).also { data ->
        bins.forEach { (bin, amplitude) -> data[bin*2] = amplitude.toByte() }
    }
    private fun settled(data: ByteArray, sampleRate: Int = 44100): List<Float> {
        val analyzer = HardstyleSpectrum()
        var result = SILENT_SPECTRUM
        repeat(60) { result = analyzer.accept(data, sampleRate, .016f) }
        return result
    }
    @Test fun differentFrequenciesMoveThePeak() {
        val low = settled(fft(3 to 90))
        val high = settled(fft(46 to 90))
        assertTrue(low.indices.maxBy { low[it] } < high.indices.maxBy { high[it] })
        assertTrue(low.max() > .5f)
        assertTrue(high.max() > .5f)
    }
    @Test fun harmonicsAddDetailAtComparableTotalPower() {
        val pure = settled(fft(4 to 100))
        val rich = settled(fft(4 to 60, 12 to 60, 20 to 50))
        assertTrue(rich.count { it > .25f } > pure.count { it > .25f })
    }
    @Test fun weakFrequenciesAreNotIndividuallyNormalized() {
        val result = settled(fft(4 to 100, 46 to 8))
        assertTrue(result.take(15).max() > result.drop(25).max() * 3)
    }
    @Test fun snapshotsAreStableAndSilenceSettles() {
        val analyzer = HardstyleSpectrum()
        val snapshot = analyzer.accept(fft(3 to 100), 44100, .016f)
        val original = snapshot.toList()
        var quiet = snapshot
        repeat(100) { quiet = analyzer.accept(fft(),44100,.016f) }
        assertEquals(original, snapshot)
        assertEquals(SILENT_SPECTRUM, quiet)
        analyzer.reset()
        assertEquals(SILENT_SPECTRUM, analyzer.accept(fft(),44100,.016f))
    }
    @Test fun sampleRateAndCaptureSizeDetermineFrequencyMapping() {
        val a = settled(fft(32 to 90), 48000)
        val b = settled(fft(16 to 90, size=1024), 48000)
        assertEquals(a.indices.maxBy { a[it] }, b.indices.maxBy { b[it] })
        assertTrue(b.all { it.isFinite() && it in 0f..1f })
    }
    @Test fun historyHasTimeBasedDelaysAtThirtyAndSixtyFps() {
        for (fps in listOf(30, 60)) {
            val history = SpectrumHistory()
            for (i in 0..fps) {
                val time = 1000L * i / fps
                history.push(time, List(SPECTRUM_BANDS) { time/1000f })
            }
            val values = FloatArray(SPECTRUM_BANDS)
            history.sampleInto(1000,35,values)
            assertEquals(.965f, values[0], .001f)
            history.sampleInto(1000,70,values)
            assertEquals(.930f, values[0], .001f)
        }
    }
    @Test fun frequencyContourIsMirroredAndClosed() {
        val spectrum = FloatArray(SPECTRUM_BANDS) { it.toFloat() / (SPECTRUM_BANDS-1) }
        for (point in 0..128) assertEquals(mirroredSpectrumValue(spectrum,point),
            mirroredSpectrumValue(spectrum,128-point),.00001f)
        assertEquals(0f,mirroredSpectrumValue(spectrum,0),0f)
        assertEquals(1f,mirroredSpectrumValue(spectrum,64),0f)
    }
    @Test fun changingSpectralShapeDoesNotChangeLegacyKickOrEnergy() {
        val a = HardstyleAudio()
        val b = HardstyleAudio()
        repeat(80) { index ->
            val amplitude = if (index % 12 < 3) 100 else 10
            val first = a.accept(fft(3 to amplitude, 20 to 60),44100,1000L+index*16)
            val second = b.accept(fft(3 to amplitude, 60 to 60),44100,1000L+index*16)
            assertEquals(first.copy(spectrum=SILENT_SPECTRUM),second.copy(spectrum=SILENT_SPECTRUM))
        }
    }
}

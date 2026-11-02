package com.kododake.aabrowser.rave

import org.junit.Assert.*
import org.junit.Test

class HardstyleAudioTest {
    private fun signal(amplitude: Int) = ByteArray(2048).also {
        // 43, 65, 86 Hz at 44.1 kHz: a sustained low-frequency signal.
        for (bin in 2..4) it[bin*2] = amplitude.toByte()
    }
    @Test fun silenceHasNoKickOrBass() {
        val audio = HardstyleAudio()
        repeat(100) {
            val frame = audio.accept(signal(0), 44100, 1000L+it*16)
            assertEquals(0f, frame.kick, 0f); assertEquals(0f, frame.bass, 0f)
        }
    }
    @Test fun sustainedBassSettlesWithoutRepeatedKicks() {
        val audio = HardstyleAudio()
        var frame = HardstyleFrame()
        repeat(100) { frame = audio.accept(signal(70), 44100, 1000L+it*16) }
        assertTrue(frame.bass > .5f); assertTrue(frame.bass < .9f)
        assertTrue(frame.kick < .01f)
    }
    @Test fun fastKicksRemainDistinctAndResetClearsHistory() {
        val audio = HardstyleAudio()
        repeat(5) { pulse ->
            val time = 1000L+pulse*200
            audio.accept(signal(0), 44100, time)
            assertEquals(1f, audio.accept(signal(100),44100,time+16).kick,0f)
            audio.accept(signal(0),44100,time+100)
        }
        audio.reset()
        assertEquals(HardstyleFrame(),audio.accept(signal(0),44100,3000))
    }
    @Test fun invalidInputIsSafe() {
        assertEquals(HardstyleFrame(),HardstyleAudio().accept(ByteArray(0),0,0))
    }
}

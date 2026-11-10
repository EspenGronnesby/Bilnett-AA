package com.kododake.aabrowser.rave.party

import org.junit.Assert.assertTrue
import org.junit.Test

class SongMoodTest {
    // Real teacher values (2026-11-10).
    private val machinery = SongMood(aggressive = .58f, happy = .07f, themes = listOf("melodic" to .3f, "energetic" to .3f, "dark" to .2f))
    private val cryForYou = SongMood(aggressive = .12f, happy = .16f, themes = listOf("energetic" to .3f, "melodic" to .3f))

    @Test fun rawTrackIsRaw() {
        assertTrue(machinery.raw >= SongMood.RAW_SUB_FROM)
        assertTrue(cryForYou.raw < SongMood.RAW_SUB_FROM)
    }

    @Test fun euphoricFloatsAndRawHitsHarder() {
        val e = cryForYou.motion; val r = machinery.motion
        assertTrue(e.shake < 1f && e.softness > 1.2f && e.speed < 1f)
        assertTrue(r.shake > e.shake && r.spike > e.spike)
    }

    @Test fun motionStaysWithinSoftCaps() {
        for (m in listOf(machinery, cryForYou, SongMood(relaxed = 1f, sad = 1f), SongMood(aggressive = 1f, party = 1f))) {
            val x = m.motion
            listOf(x.shake, x.spike, x.particles, x.speed).forEach { assertTrue("$m → $x", it in .5f..1.3f) }
            assertTrue(x.softness in 1f..1.6f)
        }
    }
}

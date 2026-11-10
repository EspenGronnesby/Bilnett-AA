package com.kododake.aabrowser.rave.party

import com.kododake.aabrowser.rave.Genre
import com.kododake.aabrowser.rave.HardstyleFrame
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class GenreRulesTest {
    private fun frame(bass: Float = .9f, sub: Float = .8f, beat: Int = 4, beatAt: Long = 10_000L, period: Float = 400f) =
        HardstyleFrame(bass = bass, kick = 1f, sub = sub, beat = beat, beatAt = beatAt, beatPeriod = period)

    @Test fun calmGenresNeverStrobeOrShake() {
        for (g in listOf(Genre.POP, Genre.REGGAE, Genre.REGGAETON)) {
            val l = GenreRules.look(g, null, frame(), 1f, 1f, 10_100L)
            assertEquals("$g strobe", 0f, l.strobe, 0f)
            assertEquals("$g shake", 0f, l.shake, 0f)
        }
        assertEquals(0f, GenreRules.look(Genre.RAP, null, frame(), 1f, 1f, 10_100L).strobe, 0f)
    }

    @Test fun rapOnlyPulsesOnStrong808() {
        assertEquals(0f, GenreRules.look(Genre.RAP, null, frame(bass = .4f), 1f, 1f, 10_100L).kick!!, 0f)
        assertTrue(GenreRules.look(Genre.RAP, null, frame(bass = .95f), 1f, 1f, 10_100L).kick!! > .8f)
    }

    @Test fun reggaeSwayFollowsTwoBeats() {
        // Beat 4 (even), quarter into it → a quarter of the first half of the 2-beat cycle.
        assertEquals(.125f, GenreRules.twoBeatPhase(frame(beat = 4), 10_100L)!!, .001f)
        assertEquals(.625f, GenreRules.twoBeatPhase(frame(beat = 5), 10_100L)!!, .001f)
        val a = GenreRules.look(Genre.REGGAE, null, frame(beat = 4), null, null, 10_100L).swayX
        val b = GenreRules.look(Genre.REGGAE, null, frame(beat = 5), null, null, 10_100L).swayX
        assertTrue(a > 0f && b < 0f)
    }

    @Test fun noGridNoSway() {
        assertNull(GenreRules.beatPhase(frame(period = 0f), 10_100L))
        assertEquals(0f, GenreRules.look(Genre.REGGAE, null, frame(period = 0f), null, null, 10_100L).swayX, 0f)
    }

    @Test fun edmSubFromTeacher() {
        assertEquals(EdmSub.DUBSTEP, EdmSub.from(listOf("Electronic---Dubstep" to .5f)))
        assertEquals(EdmSub.HOUSE, EdmSub.from(listOf("Pop---K-pop" to .3f, "Electronic---Tech House" to .2f)))
        assertNull(EdmSub.from(listOf("Hip Hop---Trap" to .5f)))
        assertTrue(EdmSub.DUBSTEP.halfTime && !EdmSub.HOUSE.halfTime)
    }

    @Test fun barIsStrengthNotGenre() {
        assertEquals(.4f, GenreRules.strengthMul(0f), .001f)
        assertEquals(1f, GenreRules.strengthMul(.5f), .001f)
        assertEquals(1.6f, GenreRules.strengthMul(1f), .001f)
    }
}

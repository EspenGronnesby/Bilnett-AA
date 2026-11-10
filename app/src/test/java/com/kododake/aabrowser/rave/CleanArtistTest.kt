package com.kododake.aabrowser.rave

import org.junit.Assert.assertEquals
import org.junit.Test

class CleanArtistTest {
    @Test fun removesPlayerBadges() {
        assertEquals("Pop Smoke", cleanArtist("Pop Smoke • Lossless"))
        assertEquals("A Boogie Wit da Hoodie, 6ix9ine", cleanArtist("A Boogie Wit da Hoodie, 6ix9ine • Lossless"))
        assertEquals("Coone", cleanArtist("Coone • Hi-Res Lossless"))
        assertEquals("Avicii", cleanArtist("Avicii · Dolby Atmos"))
    }

    @Test fun keepsNormalNames() {
        assertEquals("Mark Hennson, Tylight", cleanArtist("Mark Hennson, Tylight"))
        assertEquals("Lekkerfaces", cleanArtist("Lekkerfaces"))
    }
}

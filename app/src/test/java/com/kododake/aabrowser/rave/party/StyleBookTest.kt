package com.kododake.aabrowser.rave.party

import com.kododake.aabrowser.rave.Genre
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class StyleBookTest {
    @Test fun hardFamilyIsSummed() {
        // The slowed hardstyle song: no single style is sure, the hard family together is.
        val g = StyleBook.styleToGenre(listOf("Electronic---Industrial" to .22f, "Electronic---Hardcore" to .2f,
            "Electronic---Speedcore" to .18f, "Electronic---Hardstyle" to .08f))
        assertEquals(Genre.HARDSTYLE, g?.first)
    }

    @Test fun familiesMapByParent() {
        assertEquals(Genre.RAP, StyleBook.family("Hip Hop---Trap"))
        assertEquals(Genre.EDM, StyleBook.family("Electronic---Trap"))
        assertEquals(Genre.REGGAETON, StyleBook.family("Latin---Reggaeton"))
        assertEquals(Genre.REGGAE, StyleBook.family("Reggae---Dancehall"))
        assertEquals(Genre.POP, StyleBook.family("Electronic---Dance-pop"))
        assertEquals(Genre.ROCK, StyleBook.family("Rock---Hardcore"))
        assertEquals(Genre.HARDSTYLE, StyleBook.family("Electronic---Hardcore"))
    }

    @Test fun radioPopIsPop() {
        // «Hey, Soul Sister»: K-pop .16 + Pop Rock .13 → pop (the app had called it HARDSTYLE).
        assertEquals(Genre.POP, StyleBook.styleToGenre(listOf("Pop---K-pop" to .16f, "Rock---Pop Rock" to .13f,
            "Latin---Reggaeton" to .11f))?.first)
        assertEquals(Genre.POP, StyleBook.family("Funk / Soul---RnB/Swing"))
    }

    @Test fun unsureStaysNull() {
        assertNull(StyleBook.styleToGenre(listOf("Hip Hop---Trap" to .1f, "Electronic---House" to .08f)))
    }

    @Test fun parsesBookAndSkipsTriedEntries() {
        val book = StyleBook.parse("""{"a|b":{"styles":[["Electronic---Hardstyle",0.8]],"bpm":150.2,"bpmConf":2.1},
            "c|d":{"styles":null,"tried":1}}""")
        assertEquals(1, book.size)
        assertEquals(150.2f, book["a|b"]!!.trustedBpm!!, .01f)
        assertEquals(Genre.HARDSTYLE, book["a|b"]!!.genre?.first)
    }

    @Test fun lowConfidenceBpmIsNotTrusted() {
        assertNull(StyleBook.Style(emptyList(), 117f, .78f).trustedBpm)
    }
}

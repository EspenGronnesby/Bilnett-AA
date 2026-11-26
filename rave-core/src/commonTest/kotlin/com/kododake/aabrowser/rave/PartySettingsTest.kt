package com.kododake.aabrowser.rave

import kotlin.math.abs
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class PartySettingsTest {
    @Test
    fun defaultsGiveTheSameNumbersAsBefore() {
        val s = PartySettings()
        assertTrue(s.isDefault)
        // Everything at 1× (as before), except the light waves: off by default since 2026-11-26.
        PartyFx.entries.forEach { assertEquals(if (it == PartyFx.WAVE_STRENGTH) 0f else 1f, s[it], it.name) }
        assertEquals(0f, s.waveAlpha)
        s[PartyFx.WAVE_STRENGTH] = 1f
        assertEquals(WAVE_ALPHA, s.waveAlpha)
        assertEquals(WAVE_WIDTH_FROM, s.waveWidthFrom)
        assertEquals(WAVE_WIDTH_TO, s.waveWidthTo)
        assertEquals(RIPPLE_MIN_GAP_MS, s.rippleGapMs)
        assertEquals(1f, s.shake); assertEquals(1f, s.strobe); assertEquals(1f, s.flashes)
        // Ganger med 1 gir nøyaktig samme tall (ingen avrunding).
        listOf(.123f, .5f, 3.7f, 1e-6f).forEach { x -> assertEquals(x, x * s.shake); assertEquals(x, x * s.flashes) }
    }

    @Test
    fun valuesAreClampedToTheirRange() {
        val s = PartySettings()
        s[PartyFx.WAVE_STRENGTH] = -1f; assertEquals(0f, s[PartyFx.WAVE_STRENGTH])
        s[PartyFx.WAVE_STRENGTH] = 5f; assertEquals(2f, s[PartyFx.WAVE_STRENGTH])
        s[PartyFx.WAVE_WIDTH] = 0f; assertEquals(.5f, s[PartyFx.WAVE_WIDTH])
        s[PartyFx.WAVE_WIDTH] = 9f; assertEquals(2f, s[PartyFx.WAVE_WIDTH])
        s[PartyFx.WAVE_OFTEN] = .1f; assertEquals(.5f, s[PartyFx.WAVE_OFTEN])
        s[PartyFx.SHAKE] = Float.NaN; assertEquals(1f, s[PartyFx.SHAKE])
        s[PartyFx.STROBE] = 0f; assertEquals(0f, s.strobe)
        s[PartyFx.FLASHES] = 2.5f; assertEquals(2f, s.flashes)
        assertTrue(!s.isDefault)
        s.reset()
        assertTrue(s.isDefault)
    }

    @Test
    fun effectNumbersFollowTheSettings() {
        val s = PartySettings()
        s[PartyFx.WAVE_STRENGTH] = 0f; assertEquals(0f, s.waveAlpha)
        s[PartyFx.WAVE_STRENGTH] = 2f; assertEquals(WAVE_ALPHA * 2f, s.waveAlpha)
        s[PartyFx.WAVE_WIDTH] = .5f
        assertEquals(WAVE_WIDTH_FROM * .5f, s.waveWidthFrom); assertEquals(WAVE_WIDTH_TO * .5f, s.waveWidthTo)
        // «Sjelden» = dobbelt så lenge mellom, «ofte» = halvparten.
        s[PartyFx.WAVE_OFTEN] = .5f; assertEquals(RIPPLE_MIN_GAP_MS * 2, s.rippleGapMs)
        s[PartyFx.WAVE_OFTEN] = 2f; assertEquals(RIPPLE_MIN_GAP_MS / 2, s.rippleGapMs)
    }

    @Test
    fun sliderMiddleIsExactlyOneAndEndsAreTheLimits() {
        PartyFx.entries.forEach { fx ->
            assertEquals(1f, fx.fromSlider(.5f), fx.name)
            assertEquals(1f, fx.fromSlider(.5f + PARTY_FX_SNAP / 2f), fx.name)
            assertEquals(fx.min, fx.fromSlider(0f), fx.name)
            assertEquals(fx.max, fx.fromSlider(1f), fx.name)
            assertTrue(abs(fx.toSlider(1f) - .5f) < 1e-5f, fx.name)
            // Fram og tilbake gir samme plass.
            listOf(.1f, .3f, .7f, .9f).forEach { p -> assertTrue(abs(fx.toSlider(fx.fromSlider(p)) - p) < 1e-4f, "${fx.name} $p") }
        }
        assertEquals(PartyFx.WAVE_OFTEN, PartyFx.of("bolger_ofte"))
        assertEquals(null, PartyFx.of("ukjent"))
    }

    @Test
    fun textIsShortAndPlain() {
        assertEquals("Av", partyFxText(0f))
        assertEquals("Myk", partyFxText(0f, PartyFx.AURA_SHARP))
        assertEquals("Av", partyFxText(0f, PartyFx.SHAKE))
        assertEquals("1×", partyFxText(1f))
        assertEquals("0,5×", partyFxText(.5f))
        assertEquals("1,3×", partyFxText(1.26f))
        assertEquals("2×", partyFxText(2f))
    }
}

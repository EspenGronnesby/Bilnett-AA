package com.kododake.aabrowser.rave

import org.junit.Assert.*
import org.junit.Test

class RaveControlsTest {
    private fun hidden() = RaveControls().expire(10_000)
    @Test fun progressiveRevealAndReset() {
        var state = hidden().tap(20_000)
        assertTrue(state.transport); assertFalse(state.media); assertFalse(state.hardstyle)
        state = state.tap(20_200).tap(20_400)
        assertTrue(state.media); assertEquals(3, state.count); assertFalse(state.hardstyle)
        state = state.tap(20_600)
        assertFalse(state.hardstyle)
        // The 5th tap no longer switches Party here (ad06a7b): only 5 taps on the cover do. It still resets the count.
        state = state.tap(20_800)
        assertFalse(state.hardstyle); assertEquals(0, state.count)
    }
    @Test fun buttonBreaksSequenceAndRefreshesTimeout() {
        var state = hidden().tap(20_000).tap(20_100).button(20_200)
        state = state.tap(20_300).tap(20_400).tap(20_500)
        assertFalse(state.hardstyle)
        // Buttons hide 3 s after the last touch (ad06a7b; was 10 s).
        assertTrue(state.expire(23_499).media)
        assertFalse(state.expire(23_500).media)
    }
    @Test fun windowMeasuredFromFirstTap() {
        val state = hidden().tap(20_000).tap(20_800).tap(21_501)
        assertEquals(1, state.count); assertFalse(state.media)
    }
    @Test fun fiveTapsNeverSwitchPartyAndExpireHides() {
        var state = hidden()
        repeat(5) { state = state.tap(20_000L+it*200) }
        state = state.button(21_000)
        assertFalse(state.hardstyle); assertTrue(state.transport); assertTrue(state.media)
        state = state.expire(24_000)
        assertFalse(state.transport); assertFalse(state.media)
    }
}

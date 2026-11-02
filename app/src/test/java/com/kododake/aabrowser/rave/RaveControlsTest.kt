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
        state = state.tap(20_800)
        assertTrue(state.hardstyle); assertEquals(0, state.count)
    }
    @Test fun buttonBreaksSequenceAndRefreshesTimeout() {
        var state = hidden().tap(20_000).tap(20_100).button(20_200)
        state = state.tap(20_300).tap(20_400).tap(20_500)
        assertFalse(state.hardstyle)
        assertTrue(state.expire(30_499).media)
        assertFalse(state.expire(30_500).media)
    }
    @Test fun windowMeasuredFromFirstTap() {
        val state = hidden().tap(20_000).tap(20_800).tap(21_501)
        assertEquals(1, state.count); assertFalse(state.media)
    }
    @Test fun hidingRequiresFiveFreshTaps() {
        var state = hidden()
        repeat(5) { state = state.tap(20_000L+it*200) }
        state = state.button(21_000)
        assertTrue(state.hardstyle)
        state = state.expire(31_000)
        assertFalse(state.transport); assertFalse(state.media); assertFalse(state.hardstyle)
        repeat(4) { state = state.tap(32_000L+it*200) }
        assertFalse(state.hardstyle)
        assertTrue(state.tap(32_800).hardstyle)
    }
}

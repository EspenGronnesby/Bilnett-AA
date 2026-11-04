package com.kododake.aabrowser.rave

/** Immutable state shared by every layout; timestamps use elapsed realtime. */
internal data class RaveControls(
    val transport: Boolean = true,
    val media: Boolean = true,
    val hardstyle: Boolean = false,
    val count: Int = 0,
    val firstTap: Long = 0,
    val touchedAt: Long = 0
) {
    fun touch(now: Long) = copy(touchedAt = now)
    fun button(now: Long) = copy(count = 0, firstTap = 0, touchedAt = now)
    /** True when a tap now is the 5th quick tap, the one that toggles Party on/off. */
    fun isFifthTap(now: Long) = count == 4 && now - firstTap <= 1500
    fun tap(now: Long): RaveControls {
        val fresh = count == 0 || now - firstTap > 1500
        val next = if (fresh) 1 else count + 1
        // The 5th tap toggles Party directly (see RaveActivity); it no longer reveals a Party button.
        return copy(transport = true, media = media || next >= 3,
            count = if (next >= 5) 0 else next,
            firstTap = if (next >= 5) 0 else if (fresh) now else firstTap, touchedAt = now)
    }
    fun expire(now: Long) = if (now - touchedAt >= 3_000)
        copy(transport = false, media = false, hardstyle = false, count = 0, firstTap = 0) else this
}

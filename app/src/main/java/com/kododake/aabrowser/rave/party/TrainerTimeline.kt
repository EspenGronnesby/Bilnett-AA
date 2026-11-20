package com.kododake.aabrowser.rave.party

import com.kododake.aabrowser.rave.SongListener
import com.kododake.aabrowser.rave.SongPart

/**
 * Live history for the «AI-trener» panel in Analyse mode: one point per beat the listener closed, with what the old
 * brain, the new listener and the build-up model thought then. Main thread only (filled from the frame loop, read in draw).
 */
internal class TrainerTimeline {
    class Pt(val pos: Long, val old: SongPart, val listener: SongPart, val pModel: Float, val sub: Float, val bright: Float)

    private val pts = ArrayList<Pt>()
    private var lastSlots = -1
    private var lastPos = -1L
    val points: List<Pt> get() = pts

    fun reset() { pts.clear(); lastSlots = -1; lastPos = -1L }

    fun feed(l: SongListener, old: SongPart, pos: Long) {
        val s = l.slots
        if (s == lastSlots) return
        if (s < lastSlots) pts.clear() // new song
        lastSlots = s
        if (pos < 0) return
        if (lastPos >= 0 && (pos < lastPos - 1500 || pos > lastPos + 6000)) pts.clear() // seek: start the picture over
        lastPos = pos
        pts.add(Pt(pos, old, l.part, l.pBuildModel, l.features[0], (l.features[14] + l.features[15]) / 2f))
        if (pts.size > 600) pts.removeAt(0)
    }
}

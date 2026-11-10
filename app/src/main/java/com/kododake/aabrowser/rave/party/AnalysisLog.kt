package com.kododake.aabrowser.rave.party

import android.util.Log
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.Executors

/**
 * Party analysis log (step 0 of the genre plan): what the music measured and what the visuals did,
 * one CSV line per bar, one file per song, plus one summary line per song.
 *
 * Lives only on the phone (`filesDir/rave-analyse/`). Fetch with
 * `adb exec-out run-as no.espen.bilnett.aa cat files/rave-analyse/<file>`.
 * Never copy these files into the repo (it is public and they contain song titles).
 *
 * Called once per display frame from the main thread; only averages are kept in memory and
 * files are written on a background thread.
 */
internal class AnalysisLog(private val dir: File) {

    /** Filled by the caller every frame (reused object, no allocation per frame). */
    class Frame {
        var positionMs = -1L
        var beat = 0
        var part = ""
        /** What the automatic analysis would have said (in manual mode `part` is Espen's answer). */
        var autoPart = ""
        var autoDrop = ""
        /** Who decided the song part: "espen" (manual mode), "espen_hold" (his correction holding in
         *  auto mode) or "auto". Only "espen" is a full answer key for training. */
        var partBy = "auto"
        var dropKind = ""
        var genre = ""
        var sub = ""
        var vibe = 0f
        var sw = 0f
        var effectsOn = false
        var pi = 0f
        var buildRise = 0f
        var volume = 0f
        // What the audio analysis measured (raw, before the genre shaping)
        var bass = 0f; var kick = 0f; var heavy = 0f; var grit = 0f; var screech = 0f
        var subBass = 0f; var energy = 0f; var highMotion = 0f; var snare = 0f; var bpm = 0f
        // After genre shaping + song structure (what the effects get)
        var outHeavy = 0f; var outGrit = 0f; var outKick = 0f
        // Effects
        var shakePx = 0f; var strobe = 0f; var particles = 0f; var spike = 0f; var density = 0f
    }

    private val io = Executors.newSingleThreadExecutor { r -> Thread(r, "rave-analyse").apply { isDaemon = true } }
    private var file: File? = null
    private var songName = ""
    private var startedAt = 0L
    private var lastFrameMs = 0L
    private var openTitle = ""
    // Latest frame, for feedback marks
    private var lastPos = -1L
    private var lastPart = ""; private var lastDrop = ""; private var lastGenre = ""; private var lastSub = ""
    private var lastAutoPart = ""
    private var openArtist = ""

    // ---- current bar ----
    private var barKey = Int.MIN_VALUE
    private var barStartMs = 0L
    private var n = 0
    private var barPart = ""; private var barDrop = ""; private var barGenre = ""; private var barSub = ""
    private var barAutoPart = ""; private var barAutoDrop = ""; private var barPartBy = "auto"
    private var barPos = -1L
    private var effectsFrames = 0
    private val sum = FloatArray(MEAN_FIELDS)
    private val peak = FloatArray(PEAK_FIELDS)

    // ---- per song, per song part ----
    private class PartStats { var bars = 0; var shake = 0f; var particles = 0f; var spike = 0f
        var strobeBars = 0; var heavy = 0f; var grit = 0f; var kickPeak = 0f }
    private val parts = LinkedHashMap<String, PartStats>()
    private var fpsSum = 0f
    private var fpsBars = 0

    private var pendingTitle = ""
    private var pendingArtist = ""

    /** New song. The file is only created once Party actually sends frames for it. */
    fun startSong(title: String, artist: String) {
        endSong()
        pendingTitle = title
        pendingArtist = artist
    }

    private fun openFile(nowMs: Long) {
        val title = pendingTitle; val artist = pendingArtist
        pendingTitle = ""; pendingArtist = ""
        openTitle = title; openArtist = artist
        songName = "$artist – $title"
        startedAt = nowMs
        val stamp = SimpleDateFormat("yyyyMMdd-HHmmss", Locale.US).format(Date())
        val safe = "$artist-$title".lowercase(Locale.ROOT).replace(Regex("[^a-z0-9æøå]+"), "_").trim('_').take(60)
        val f = File(dir, "$stamp-$safe.csv")
        file = f
        io.execute {
            try {
                dir.mkdirs()
                f.writeText("# $songName\n$HEADER\n")
                prune()
            } catch (e: Exception) { Log.w(TAG, "kan ikke lage analysefil", e) }
        }
    }

    fun frame(x: Frame, nowMs: Long) {
        if (file == null) {
            if (pendingTitle.isBlank()) return
            openFile(nowMs)
        }
        lastFrameMs = nowMs
        lastPos = x.positionMs; lastPart = x.part; lastDrop = x.dropKind; lastGenre = x.genre; lastSub = x.sub
        lastAutoPart = x.autoPart
        // A new bar every 4 beats; without a beat grid (calm music) a "bar" is 2 s.
        val key = if (x.beat > 0) x.beat / 4 else -(1 + ((nowMs - startedAt) / 2000L).toInt())
        if (key != barKey || nowMs - barStartMs > 4000L) {
            flushBar(nowMs)
            barKey = key
            barStartMs = nowMs
        }
        if (n == 0) {
            barPart = x.part; barDrop = x.dropKind; barGenre = x.genre; barSub = x.sub; barPos = x.positionMs
            barAutoPart = x.autoPart; barAutoDrop = x.autoDrop; barPartBy = x.partBy
        }
        n++
        if (x.effectsOn) effectsFrames++
        val m = floatArrayOf(x.vibe, x.sw, x.pi, x.buildRise, x.volume, x.bass, x.heavy, x.grit, x.screech,
            x.subBass, x.energy, x.highMotion, x.outHeavy, x.outGrit, x.shakePx, x.particles, x.spike, x.density, x.bpm)
        for (i in m.indices) sum[i] += m[i]
        val p = floatArrayOf(x.kick, x.outKick, x.snare, x.shakePx, x.strobe, x.heavy, x.grit, x.screech)
        for (i in p.indices) if (p[i] > peak[i]) peak[i] = p[i]
    }

    private fun flushBar(nowMs: Long) {
        val f = file ?: return
        if (n == 0) return
        val durS = ((nowMs - barStartMs) / 1000f).coerceAtLeast(.001f)
        // A bar cut short (song ended, app closed) says nothing about the frame rate.
        val fps = if (durS >= .5f) n / durS else 0f
        val a = FloatArray(MEAN_FIELDS) { sum[it] / n }
        val line = buildString {
            append(if (barPos >= 0) "%.1f".format(Locale.US, barPos / 1000f) else "")
            append(',').append(barPart).append(',').append(barDrop).append(',').append(barGenre).append(',').append(barSub)
            append(',').append("%.0f".format(Locale.US, fps))
            append(',').append("%.2f".format(Locale.US, effectsFrames.toFloat() / n))
            append(',').append(barAutoPart).append(',').append(barAutoDrop).append(',').append(barPartBy)
            for (v in a) append(',').append("%.3f".format(Locale.US, v))
            for (v in peak) append(',').append("%.3f".format(Locale.US, v))
            append('\n')
        }
        val stats = parts.getOrPut(barPart) { PartStats() }
        stats.bars++
        stats.shake += a[IDX_SHAKE]; stats.particles += a[IDX_PARTICLES]; stats.spike += a[IDX_SPIKE]
        stats.heavy += a[IDX_HEAVY]; stats.grit += a[IDX_GRIT]
        stats.kickPeak += peak[0]
        if (peak[4] > 0f) stats.strobeBars++
        if (fps > 0f) { fpsSum += fps; fpsBars++ }
        io.execute { try { f.appendText(line) } catch (_: Exception) { } }
        n = 0; effectsFrames = 0
        sum.fill(0f); peak.fill(0f)
    }

    /**
     * Closes the current song: writes the last bar and one summary line per song part.
     * Also called when the app goes to the background; if the same song keeps playing when it
     * comes back, logging continues in a new file.
     */
    fun endSong() {
        val f = file ?: return
        flushBar(lastFrameMs)
        file = null
        pendingTitle = openTitle; pendingArtist = openArtist
        if (parts.isEmpty()) return
        val summary = buildString {
            append(SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.US).format(Date())).append(" | ").append(songName)
            append(" | fps %.0f".format(Locale.US, if (fpsBars > 0) fpsSum / fpsBars else 0f))
            for ((part, s) in parts) {
                val b = s.bars.toFloat()
                append(" | %s: %d takter shake %.1f px partikler %.2f spike %.2f heavy %.2f grit %.2f kick %.2f strobe %d"
                    .format(Locale.US, part, s.bars, s.shake / b, s.particles / b, s.spike / b, s.heavy / b, s.grit / b,
                        s.kickPeak / b, s.strobeBars))
            }
        }
        Log.d(TAG, summary)
        io.execute {
            try { File(dir, "sammendrag.txt").appendText(summary + "\n" + "#   fil: ${f.name}\n") } catch (_: Exception) { }
        }
        parts.clear(); fpsSum = 0f; fpsBars = 0
        barKey = Int.MIN_VALUE
    }

    /**
     * Espen's feedback button ("drop nå", "for mye" …): stored with the song position and what the
     * analysis believed at that moment, in the song's CSV and in `feedback.csv` (all songs).
     * This is the answer key the analysis is trained against.
     */
    fun mark(kind: String) {
        val song = if (file != null) songName else "$pendingArtist – $pendingTitle"
        val pos = if (lastPos >= 0) "%.1f".format(Locale.US, lastPos / 1000f) else ""
        val time = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US).format(Date())
        val clean = song.replace(',', ' ')
        val line = "$time,$clean,$pos,$kind,$lastPart,$lastDrop,$lastGenre,$lastSub,${file?.name.orEmpty()},$lastAutoPart\n"
        val f = file
        Log.d(TAG, "feedback: $kind ved $pos s | $song | analyse: $lastPart $lastDrop $lastGenre $lastSub")
        io.execute {
            try {
                dir.mkdirs()
                val fb = File(dir, "feedback.csv")
                if (!fb.exists()) fb.writeText("tid,sang,pos_s,feedback,part,drop,genre,sub,fil,auto_part\n")
                fb.appendText(line)
                f?.appendText("# MARK $pos $kind\n")
            } catch (_: Exception) { }
        }
    }

    /** Keep only the newest song files. */
    private fun prune() {
        val files = dir.listFiles { f -> f.name.endsWith(".csv") } ?: return
        if (files.size <= MAX_FILES) return
        files.sortedBy { it.name }.take(files.size - MAX_FILES).forEach { it.delete() }
    }

    companion object {
        private const val TAG = "RaveGenre"
        private const val MAX_FILES = 300
        private const val MEAN_FIELDS = 19
        private const val PEAK_FIELDS = 8
        private const val IDX_HEAVY = 6
        private const val IDX_GRIT = 7
        private const val IDX_SHAKE = 14
        private const val IDX_PARTICLES = 15
        private const val IDX_SPIKE = 16
        /** Means over the bar, then peaks ("max_") over the bar. */
        /** part/drop = what the visuals followed (Espen's answer in manual mode); auto_* = the app's own guess. */
        const val HEADER = "pos_s,part,drop,genre,sub,fps,effects_on,auto_part,auto_drop,part_by," +
            "vibe,sw,pi,build_rise,volume,bass,heavy,grit,screech,sub_bass,energy,high_motion," +
            "out_heavy,out_grit,shake_px,particles,spike,density,bpm," +
            "max_kick,max_out_kick,max_snare,max_shake_px,max_strobe,max_heavy,max_grit,max_screech"
    }
}

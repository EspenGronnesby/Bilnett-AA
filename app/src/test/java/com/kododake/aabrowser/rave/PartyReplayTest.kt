package com.kododake.aabrowser.rave

import org.junit.Assume.assumeTrue
import org.junit.Test
import java.io.DataInputStream
import java.io.EOFException
import java.io.File
import java.util.Locale
import java.util.zip.GZIPInputStream

/**
 * Replays Espen's recorded songs (raw FFT from the phone) through the real analysis
 * ([HardstyleAudio] + automatic [HardstyleStructure]) and compares the song part it picks with
 * what Espen said in manual mode (the answer key in the song's analysis CSV, `part_by = espen`).
 *
 * Only runs on the Mac that has the data (never in the public repo):
 *   ~/Vibe-kode/Projects/Bilnett-AA-assets/party-analyse/raw/ (song CSVs) and raw/fft/ (.fft.gz recordings)
 * Result: stdout + `replay.txt` next to the data.
 *
 *   ./gradlew testDebugUnitTest --tests '*PartyReplayTest*'
 */
class PartyReplayTest {
    private val raw = File(System.getProperty("user.home"), "Vibe-kode/Projects/Bilnett-AA-assets/party-analyse/raw")
    private val classes = listOf("INTRO", "BUILDUP", "DROP", "BREAKDOWN", "OUTRO")

    private fun norm(p: String) = when (p.trim().uppercase(Locale.ROOT)) {
        "VOCAL" -> "BREAKDOWN"
        else -> p.trim().uppercase(Locale.ROOT)
    }

    /** Espen's timeline from the song CSV: (song position ms, part) at the start of each bar he steered. */
    private fun truth(csv: File): List<Pair<Long, String>> {
        val lines = csv.readLines().filter { it.isNotBlank() && !it.startsWith("#") }
        if (lines.isEmpty()) return emptyList()
        val head = lines.first().split(",")
        val iPos = head.indexOf("pos_s"); val iPart = head.indexOf("part"); val iBy = head.indexOf("part_by")
        if (iPos < 0 || iPart < 0 || iBy < 0) return emptyList()
        return lines.drop(1).mapNotNull { l ->
            val c = l.split(",")
            if (c.size <= iBy || c[iBy] != "espen") null
            else c[iPos].toFloatOrNull()?.let { (it * 1000).toLong() to norm(c[iPart]) }
        }
    }

    /** Espen's «it is X now» presses per song CSV (song position ms), from feedback.csv. */
    private val presses: Map<String, List<Long>> by lazy {
        val f = File(raw, "feedback.csv")
        if (!f.exists()) return@lazy emptyMap()
        val lines = f.readLines().filter { it.isNotBlank() }
        val head = lines.firstOrNull()?.split(",") ?: return@lazy emptyMap()
        val iPos = head.indexOf("pos_s"); val iFb = head.indexOf("feedback"); val iFile = head.indexOf("fil")
        if (iPos < 0 || iFb < 0 || iFile < 0) return@lazy emptyMap()
        lines.drop(1).mapNotNull { l ->
            val c = l.split(","); if (c.size <= maxOf(iPos, iFb, iFile)) return@mapNotNull null
            if (!c[iFb].startsWith("rett_")) return@mapNotNull null
            c[iPos].toFloatOrNull()?.let { c[iFile] to (it * 1000).toLong() }
        }.groupBy({ it.first }, { it.second }).mapValues { (_, v) -> v.sorted() }
    }

    /**
     * The answer key with two known skews removed (2026-11-19):
     *  - Espen presses a little after the change he hears: every change is moved [REACTION_MS] back.
     *  - Manual mode switched on mid-song starts on the app's own guess: bars before his first press
     *    are dropped (only when the key doesn't start at the beginning of the song).
     */
    private fun cleanKey(key: List<Pair<Long, String>>, csv: File): List<Pair<Long, String>> {
        if (key.isEmpty()) return key
        var k = key
        if (k.first().first > MID_SONG_START_MS) {
            val first = presses[csv.name]?.firstOrNull { it >= k.first().first - REACTION_MS }
            // No press logged for this play (older log): keep the key as it is rather than lose the song.
            if (first != null) k = k.filter { it.first >= first - REACTION_MS }
        }
        val out = ArrayList<Pair<Long, String>>(k.size)
        for ((i, e) in k.withIndex()) {
            val changed = i > 0 && e.second != k[i - 1].second
            val pos = if (changed) maxOf(e.first - REACTION_MS, out.last().first + 1) else e.first
            out.add(pos to e.second)
        }
        return out
    }

    private class Frame(val now: Long, val pos: Long, val rate: Int, val fft: ByteArray)

    private fun frames(fft: File): List<Frame> {
        val out = ArrayList<Frame>()
        DataInputStream(GZIPInputStream(fft.inputStream().buffered())).use { s ->
            if (s.readUTF() != "BNFFT1") return out
            s.readUTF()
            try {
                while (true) {
                    val now = s.readLong(); val pos = s.readLong(); val rate = s.readInt()
                    val size = s.readShort().toInt() and 0xFFFF
                    val b = ByteArray(size); s.readFully(b)
                    out.add(Frame(now, pos, rate, b))
                }
            } catch (_: EOFException) { } catch (_: java.util.zip.ZipException) { } // cut-off recording
        }
        return out
    }

    private fun stamp(name: String) = name.take(15)
    private fun slug(name: String) = name.drop(16).substringBefore(".")

    /** FFT file ↔ CSV of the same song play (same slug, file stamps within 10 s). */
    private fun csvFor(fft: File, csvs: List<File>): File? {
        val fmt = java.text.SimpleDateFormat("yyyyMMdd-HHmmss", Locale.US)
        val t = runCatching { fmt.parse(stamp(fft.name))!!.time }.getOrNull() ?: return null
        return csvs.filter { slug(it.name) == slug(fft.name) }
            .minByOrNull { kotlin.math.abs((runCatching { fmt.parse(stamp(it.name))!!.time }.getOrNull() ?: 0L) - t) }
            ?.takeIf { kotlin.math.abs((runCatching { fmt.parse(stamp(it.name))!!.time }.getOrNull() ?: 0L) - t) <= 10_000L }
    }

    /** What the sound measures in each part Espen named (means over time; dB relative to the song's median). */
    @Test fun featuresPerPart() {
        val fftDir = File(raw, "fft")
        assumeTrue(fftDir.isDirectory)
        val csvs = raw.listFiles { f -> f.name.endsWith(".csv") && f.name != "feedback.csv" }?.toList().orEmpty()
        val names = listOf("bass", "energy", "sub", "subDbRel", "lowDbRel", "airDbRel", "highs", "grit", "screech",
            "kick/s", "onset/s", "beatConf", "noise", "centroid", "heavy", "presDbRel", "midDbRel")
        val sums = HashMap<String, DoubleArray>(); val time = HashMap<String, Double>()
        fun db(x: Float) = 20.0 * kotlin.math.log10(maxOf(x.toDouble(), 2.5))
        for (fft in fftDir.listFiles { f -> f.name.endsWith(".fft.gz") }.orEmpty().sortedBy { it.name }) {
            val csv = csvFor(fft, csvs) ?: continue
            if (!structured(csv, fft.name)) continue
            val key = truth(csv); if (key.size < 8) continue
            val fs = frames(fft); if (fs.size < 200) continue
            val audio = HardstyleAudio()
            val rows = ArrayList<Pair<String, DoubleArray>>()
            var prev = fs.first().now; var lastKick = 0f; var lastBeat = 0
            for (fr in fs) {
                val f = audio.accept(fr.fft, fr.rate, fr.now)
                val dt = (fr.now - prev).coerceIn(0L, 200L) / 1000.0; prev = fr.now
                val t = key.lastOrNull { it.first <= fr.pos }?.second ?: continue
                val kickHit = if (f.kick > .95f && lastKick <= .95f) 1.0 else 0.0
                val beatHit = if (f.beat != lastBeat) 1.0 else 0.0
                lastKick = f.kick; lastBeat = f.beat
                rows.add(t to doubleArrayOf(dt, f.bass.toDouble(), f.energy.toDouble(), f.sub.toDouble(), db(f.subLevel),
                    db(f.bassLevel), db(f.air), f.highs.toDouble(), f.grit.toDouble(), f.screech.toDouble(),
                    kickHit, beatHit, f.beatConfidence.toDouble(), f.noise.toDouble(), f.centroid / 1000.0, f.heavy.toDouble(),
                    db(f.presence), db(f.level - f.bassLevel)))
            }
            // dB values relative to this song's median (songs differ in loudness).
            for (col in listOf(4, 5, 6, 16, 17)) {
                val med = rows.map { it.second[col] }.sorted().let { it[it.size / 2] }
                rows.forEach { it.second[col] -= med }
            }
            for ((t, r) in rows) {
                val acc = sums.getOrPut(t) { DoubleArray(names.size) }
                val dt = r[0]; time.merge(t, dt, Double::plus)
                for (i in names.indices) acc[i] += if (i == 9 || i == 10) r[i + 1] else r[i + 1] * dt
            }
        }
        assumeTrue(sums.isNotEmpty())
        val sb = StringBuilder("\nDel          sek " + names.joinToString("") { "%9s".format(it.take(8)) } + "\n")
        for (t in classes) {
            val a = sums[t] ?: continue; val sec = time[t]!!
            sb.append("%-10s %5.0f ".format(t, sec) + a.indices.joinToString("") { "%9.2f".format(Locale.US, a[it] / sec) } + "\n")
        }
        println(sb)
        File(raw.parentFile, "features.txt").writeText(sb.toString())
    }

    /** Causal «fullness» candidates: 2 s level vs a slowly falling peak of this song (percentiles per part). */
    @Test fun fullnessPerPart() {
        val fftDir = File(raw, "fft")
        assumeTrue(fftDir.isDirectory)
        val csvs = raw.listFiles { f -> f.name.endsWith(".csv") && f.name != "feedback.csv" }?.toList().orEmpty()
        val vals = HashMap<String, HashMap<String, ArrayList<Double>>>()
        fun db(x: Float) = 20.0 * kotlin.math.log10(maxOf(x.toDouble(), 2.5))
        for (fft in fftDir.listFiles { f -> f.name.endsWith(".fft.gz") }.orEmpty().sortedBy { it.name }) {
            val csv = csvFor(fft, csvs) ?: continue
            if (!structured(csv, fft.name)) continue
            val key = truth(csv); if (key.size < 8) continue
            val fs = frames(fft); if (fs.size < 200) continue
            val audio = HardstyleAudio()
            var prev = fs.first().now
            val ema = DoubleArray(3); val ref = DoubleArray(3); var started = false
            for (fr in fs) {
                val f = audio.accept(fr.fft, fr.rate, fr.now)
                val dt = (fr.now - prev).coerceIn(0L, 200L) / 1000.0; prev = fr.now
                val x = doubleArrayOf(db(f.subLevel), db(f.air), db(f.presence))
                if (!started) { x.copyInto(ema); x.copyInto(ref); started = true }
                for (i in 0..2) {
                    ema[i] += (x[i] - ema[i]) * (1 - kotlin.math.exp(-dt / 2.0))
                    ref[i] = maxOf(ema[i], ref[i] - dt * 3.0 / 60.0)
                }
                val t = key.lastOrNull { it.first <= fr.pos }?.second ?: continue
                if (fr.pos - (key.firstOrNull()?.first ?: 0L) < 20_000L) continue  // warm-up
                val m = vals.getOrPut(t) { HashMap() }
                val subR = ema[0] - ref[0]; val airR = ema[1] - ref[1]; val preR = ema[2] - ref[2]
                m.getOrPut("sub") { ArrayList() }.add(subR)
                m.getOrPut("air") { ArrayList() }.add(airR)
                m.getOrPut("pres") { ArrayList() }.add(preR)
                m.getOrPut("full") { ArrayList() }.add(subR + airR + preR)
                m.getOrPut("hiMinusSub") { ArrayList() }.add((airR + preR) / 2 - subR)
            }
        }
        assumeTrue(vals.isNotEmpty())
        val sb = StringBuilder("\nDel        signal      p10    p25    p50    p75    p90\n")
        for (t in classes) for (sig in listOf("sub", "air", "pres", "full", "hiMinusSub")) {
            val v = vals[t]?.get(sig)?.sorted() ?: continue
            fun q(p: Double) = v[((v.size - 1) * p).toInt()]
            sb.append("%-10s %-10s %6.1f %6.1f %6.1f %6.1f %6.1f\n".format(Locale.US, t, sig, q(.1), q(.25), q(.5), q(.75), q(.9)))
        }
        println(sb)
        File(raw.parentFile, "fullness.txt").writeText(sb.toString())
    }

    private class Song(val name: String, val key: List<Pair<Long, String>>, val now: LongArray, val pos: LongArray,
                       val frames: List<HardstyleFrame>, val print: FloatArray? = null,
                       val cleanKey: List<Pair<Long, String>> = key, val structured: Boolean = true) {
        /** One bar at the song's typical tempo (the median of the frames' BPM; 1.6 s when unknown). */
        val barMs: Long = frames.map { it.bpm }.filter { it in 100f..260f }.sorted()
            .let { if (it.isEmpty()) 1600L else (240_000f / it[it.size / 2]).toLong() }
    }

    /** The preview's drop fingerprint for a song: its fullest 8 s, 48-band profile through the real analysis. */
    private fun fingerprint(csv: File): FloatArray? {
        val pdir = File(raw.parentFile, "previews-fft")
        val head = csv.useLines { it.firstOrNull() }.orEmpty().drop(2).split(" – ", limit = 2)
        if (head.size < 2) return null
        val pfile = File(pdir, Regex("[^a-z0-9]+").replace(GenreBook.key(head[1], head[0]), "_").take(80) + ".fft.gz")
        if (!pfile.exists()) return null
        val pf = frames(pfile); if (pf.size < 100) return null
        val a = HardstyleAudio()
        val fr = pf.map { a.accept(it.fft, it.rate, it.now) }
        return printFrom(LongArray(pf.size) { pf[it].now }, fr)
    }

    /** Fingerprint from analysed frames: mean spectrum over the fullest 8 s (skipping the first quarter). */
    private fun printFrom(times: LongArray, fr: List<HardstyleFrame>): FloatArray? {
        if (fr.isEmpty()) return null
        val n = fr[0].spectrum.size
        var bestI = -1; var bestLevel = -1.0; var j = 0; var lvl = 0.0
        for (i in fr.indices) {
            lvl += fr[i].level
            while (times[i] - times[j] > 8_000L) { lvl -= fr[j].level; j++ }
            if (i >= fr.size / 4 && times[i] - times[j] >= 7_000L && lvl / (i - j + 1) > bestLevel) { bestLevel = lvl / (i - j + 1); bestI = i }
        }
        if (bestI < 0) return null
        var start = bestI; while (start > 0 && times[bestI] - times[start - 1] <= 8_000L) start--
        return FloatArray(n) { k -> (start..bestI).map { fr[it].spectrum[k] }.average().toFloat() }
    }

    /** The teacher's answer for a song (style-book.json, looked up like the app does), or null. */
    private fun teacher(csv: File): com.kododake.aabrowser.rave.party.StyleBook.Style? {
        val head = csv.useLines { it.firstOrNull() }.orEmpty()
        if (!head.startsWith("# ") || " – " !in head) return null
        val (artist, title) = head.drop(2).split(" – ", limit = 2)
        val book = File(raw.parentFile, "style-book.json").takeIf { it.exists() } ?: return null
        return com.kododake.aabrowser.rave.party.StyleBook.parse(book.readText())[GenreBook.key(title, artist)]
    }

    /** Song parts (drop/build-up) only steer the visuals for hardstyle/EDM, so only those are scored. */
    private fun structured(csv: File, fftName: String): Boolean {
        val g = teacher(csv)?.genre?.first
        return if (g != null) g == Genre.HARDSTYLE || g == Genre.EDM else "hardstyle" in fftName
    }

    /** Set to true to replay with the teacher's tempo hint (compare both). */
    private var useTeacherTempo = false

    /** Decodes every song with an answer key once (the audio analysis doesn't depend on PartyTuning). */
    private fun songs(all: Boolean = false): List<Song> {
        val fftDir = File(raw, "fft")
        val csvs = raw.listFiles { f -> f.name.endsWith(".csv") && f.name != "feedback.csv" }?.toList().orEmpty()
        return fftDir.listFiles { f -> f.name.endsWith(".fft.gz") }.orEmpty().sortedBy { it.name }.mapNotNull { fft ->
            val csv = csvFor(fft, csvs) ?: return@mapNotNull null
            val key = truth(csv); val dropMusic = structured(csv, fft.name)
            if (key.size < 8 || (!all && !dropMusic)) return@mapNotNull null
            val fs = frames(fft); if (fs.size < 200) return@mapNotNull null
            val audio = HardstyleAudio()
            if (useTeacherTempo) audio.setTempoHint(teacher(csv)?.trustedBpm ?: 0f)
            Song(fft.name.drop(16), key, LongArray(fs.size) { fs[it].now }, LongArray(fs.size) { fs[it].pos },
                fs.map { audio.accept(it.fft, it.rate, it.now) }, fingerprint(csv), cleanKey(key, csv), dropMusic)
        }
    }

    private class Score(val agree: Double, val perClass: Map<String, Double>, val found: Int, val trueDrops: Int, val extra: Int,
                        val matrix: Map<String, Map<String, Double>> = emptyMap(), val seconds: Double = 0.0,
                        /** Drops found within one bar, and automatic drops with no true drop within one bar. */
                        val foundBar: Int = 0, val extraBar: Int = 0,
                        /** Espen's build-ups where the app said BUILDUP for ≥ 2 s inside it. */
                        val buildSections: Int = 0, val buildCaught: Int = 0) {
        val balanced get() = listOf("INTRO", "BUILDUP", "DROP", "BREAKDOWN").map { perClass[it] ?: 0.0 }.average()
        val objective get() = balanced + .15 * found / trueDrops.coerceAtLeast(1) - .004 * extra
        val falseDropsPerMin get() = if (seconds > 0) extraBar / (seconds / 60) else 0.0
    }

    /**
     * The one evaluator (2026-11-19): replays songs through the automatic [HardstyleStructure] and scores
     * it against Espen's key — [clean] picks the cleaned key ([cleanKey]) instead of the raw one.
     */
    private fun evaluate(songs: List<Song>, clean: Boolean = false, listener: Boolean = false): Score {
        val total = HashMap<String, HashMap<String, Double>>()
        var trueDrops = 0; var found = 0; var extra = 0; var foundBar = 0; var extraBar = 0
        var buildSections = 0; var buildCaught = 0
        for (sg in songs) {
            val key = if (clean) sg.cleanKey else sg.key
            if (key.isEmpty()) continue
            val st = HardstyleStructure(); st.newTrack(sg.now[0]); st.dropPrint = sg.print
            val ln = SongListener(); ln.newTrack(sg.now[0])
            var prev = sg.now[0]; var last = ""; val auto = ArrayList<Long>()
            val autoParts = ArrayList<Pair<Long, String>>()
            for (i in sg.frames.indices) {
                if (listener) ln.update(sg.frames[i], sg.now[i], sg.pos[i], -1L) else st.update(sg.frames[i], sg.now[i], sg.pos[i], -1L)
                val dt = (sg.now[i] - prev).coerceIn(0L, 200L) / 1000.0; prev = sg.now[i]
                val a = norm((if (listener) ln.part else st.part).name)
                if (a == "DROP" && last != "DROP") auto.add(sg.pos[i]); last = a
                val t = key.lastOrNull { it.first <= sg.pos[i] }?.second ?: continue
                total.getOrPut(t) { HashMap() }.merge(a, dt, Double::plus)
                autoParts.add(sg.pos[i] to a)
            }
            val td = key.zipWithNext().filter { (x, y) -> x.second != "DROP" && y.second == "DROP" }.map { it.second.first }
            trueDrops += td.size
            // On the cleaned key, automatic drops before the key starts aren't scored (the raw key keeps the old rule).
            val from = if (clean) key.first().first else Long.MIN_VALUE
            found += td.count { d -> auto.any { kotlin.math.abs(it - d) <= 3_000L } }
            extra += auto.count { x -> x >= from && td.none { kotlin.math.abs(it - x) <= 3_000L } }
            val bar = sg.barMs
            foundBar += td.count { d -> auto.any { kotlin.math.abs(it - d) <= bar } }
            extraBar += auto.count { x -> x >= from && td.none { kotlin.math.abs(it - x) <= bar } }
            // Build-up sections: [start, next change) in Espen's key.
            val changes = key.filterIndexed { i, e -> i == 0 || e.second != key[i - 1].second }
            for ((i, c) in changes.withIndex()) {
                if (c.second != "BUILDUP") continue
                val end = changes.getOrNull(i + 1)?.first ?: Long.MAX_VALUE
                buildSections++
                val said = autoParts.zipWithNext().sumOf { (x, y) ->
                    if (x.second == "BUILDUP" && x.first >= c.first && x.first < end) (y.first - x.first).coerceIn(0L, 200L) else 0L }
                if (said >= 2_000L) buildCaught++
            }
        }
        val secs = total.values.sumOf { it.values.sum() }
        val ok = total.entries.sumOf { (t, m) -> m[t] ?: 0.0 }
        val per = total.mapValues { (t, m) -> (m[t] ?: 0.0) / m.values.sum() }
        return Score(if (secs > 0) ok / secs else 0.0, per, found, trueDrops, extra, total, secs,
            foundBar, extraBar, buildSections, buildCaught)
    }

    /** Searches PartyTuning against Espen's answers; prints the best settings (only with -Dparty.sweep=true). */
    @Test fun sweepTuning() {
        assumeTrue(System.getProperty("party.sweep") == "true" || File(raw.parentFile, "SWEEP").exists())
        assumeTrue(File(raw, "fft").isDirectory)
        val sg = songs(); assumeTrue(sg.isNotEmpty())
        val results = ArrayList<Pair<String, Score>>()
        for (dull in listOf(-2f, -2.5f, -3f)) for (bars in listOf(1f, 2f)) for (bsub in listOf(-2f, -2.5f, -3f, -4f))
        for (bbr in listOf(-1.5f, -2f, -3f)) for (conf in listOf(-2.5f, -3f, -4f)) for (re in listOf(0f, 2f))
        for (csub in listOf(-99f, -4f, -3f, -2f)) {
            PartyTuning.dullBrightDb = dull; PartyTuning.dullBars = bars; PartyTuning.buildSubDb = bsub
            PartyTuning.buildBrightDb = bbr; PartyTuning.confirmBrightDb = conf; PartyTuning.reentryBars = re
            PartyTuning.confirmSubDb = csub
            results.add("dull %.1f bars %.0f bsub %.1f bbr %.1f conf %.1f re %.0f csub %.0f".format(Locale.US, dull, bars, bsub, bbr, conf, re, csub) to evaluate(sg))
        }
        val sb = StringBuilder("\n${sg.size} sanger. Beste 15 (balansert treff + drop − ekstra):\n")
        results.sortedByDescending { it.second.objective }.take(15).forEach { (n, sc) ->
            sb.append("%-60s enig %3.0f %%  bal %3.0f %%  I %3.0f B %3.0f D %3.0f Br %3.0f  drop %d/%d  ekstra %d\n".format(Locale.US, n,
                100 * sc.agree, 100 * sc.balanced, 100 * (sc.perClass["INTRO"] ?: 0.0), 100 * (sc.perClass["BUILDUP"] ?: 0.0),
                100 * (sc.perClass["DROP"] ?: 0.0), 100 * (sc.perClass["BREAKDOWN"] ?: 0.0), sc.found, sc.trueDrops, sc.extra))
        }
        println(sb)
        File(raw.parentFile, "sweep.txt").writeText(sb.toString())
    }

    /** Phase D check: does the drop fingerprint help the song parts? On/off plus a small search. */
    @Test fun dropPrintHelps() {
        assumeTrue(File(raw, "fft").isDirectory && File(raw.parentFile, "previews-fft").isDirectory)
        val sg = songs(); assumeTrue(sg.isNotEmpty())
        val sb = StringBuilder("\n${sg.count { it.print != null }} av ${sg.size} sanger har fingeravtrykk\n")
        fun line(name: String, sc: Score) = sb.append("%-28s enig %3.0f %%  I %3.0f B %3.0f D %3.0f Br %3.0f  drop %d/%d  ekstra %d\n".format(Locale.US,
            name, 100 * sc.agree, 100 * (sc.perClass["INTRO"] ?: 0.0), 100 * (sc.perClass["BUILDUP"] ?: 0.0),
            100 * (sc.perClass["DROP"] ?: 0.0), 100 * (sc.perClass["BREAKDOWN"] ?: 0.0), sc.found, sc.trueDrops, sc.extra))
        val (c0, e0) = PartyTuning.printConfirm to PartyTuning.printExit
        PartyTuning.usePrint = false; line("uten avtrykk", evaluate(sg))
        PartyTuning.usePrint = true
        for (c in listOf(.01f, .02f, .04f, 1f)) for (e in listOf(-.02f, -.04f, -.08f, 0f)) {
            PartyTuning.printConfirm = c; PartyTuning.printExit = e
            line("bekreft %.2f / ut %.2f".format(Locale.US, c, e), evaluate(sg))
        }
        PartyTuning.printConfirm = c0; PartyTuning.printExit = e0; PartyTuning.usePrint = false
        println(sb)
        File(raw.parentFile, "drop-print-helps.txt").writeText(sb.toString())
    }

    /** Phase B check: the same replay with and without the teacher's tempo hint. */
    @Test fun teacherTempoDoesNotHurt() {
        assumeTrue(File(raw, "fft").isDirectory)
        useTeacherTempo = false
        val without = evaluate(songs())
        useTeacherTempo = true
        val with = evaluate(songs())
        val sb = "\nUten lærer-takt: enig %.0f %%, drop %d/%d, ekstra %d\nMed lærer-takt:  enig %.0f %%, drop %d/%d, ekstra %d\n".format(
            Locale.US, 100 * without.agree, without.found, without.trueDrops, without.extra,
            100 * with.agree, with.found, with.trueDrops, with.extra)
        println(sb)
        File(raw.parentFile, "teacher-tempo.txt").writeText(sb)
    }

    /**
     * Phase C: training data for our own song-part model. One row per second of each song Espen
     * steered: what the analysis measured (now + change over 2/4/8 s), the rule's own answer and
     * Espen's answer. Written to parts-features.csv next to the data (never in the repo).
     */
    @Test fun exportPartFeatures() {
        assumeTrue(File(raw, "fft").isDirectory)
        val sg = songs(); assumeTrue(sg.isNotEmpty())
        val base = listOf("subRel", "airTrend", "build", "grit1", "screech", "bright", "subFull", "bass", "energy",
            "kick", "snare", "noise", "centroid", "highs", "heavy")
        val head = (listOf("song", "t") + base + base.flatMap { b -> listOf(2, 4, 8).map { "${b}_d$it" } } + listOf("rule", "truth"))
        val out = StringBuilder(head.joinToString(",")).append('\n')
        for ((si, s) in sg.withIndex()) {
            val st = HardstyleStructure(); st.newTrack(s.now[0])
            val hist = ArrayList<DoubleArray>()
            val acc = DoubleArray(base.size); var n = 0; var secStart = s.now[0]
            for (i in s.frames.indices) {
                val f = s.frames[i]
                st.update(f, s.now[i], s.pos[i], -1L)
                val h = st.hud
                val v = doubleArrayOf(h.subRelDb.toDouble(), h.airTrendDb.toDouble(), h.build.toDouble(), h.grit.toDouble(),
                    h.screech.toDouble(), st.brightRel.toDouble(), st.subFullRel.toDouble(), f.bass.toDouble(), f.energy.toDouble(),
                    f.kick.toDouble(), f.snare.toDouble(), f.noise.toDouble(), f.centroid / 1000.0, f.highs.toDouble(), f.heavy.toDouble())
                for (k in v.indices) acc[k] += v[k]; n++
                if (s.now[i] - secStart >= 1000L) {
                    val mean = DoubleArray(acc.size) { acc[it] / n }
                    hist.add(mean)
                    val truth = s.key.lastOrNull { it.first <= s.pos[i] }?.second
                    if (truth != null && hist.size > 8) {
                        val row = ArrayList<String>()
                        row += "$si"; row += "%.1f".format(Locale.US, s.pos[i] / 1000.0)
                        mean.forEach { row += "%.4f".format(Locale.US, it) }
                        for (k in mean.indices) for (d in listOf(2, 4, 8)) row += "%.4f".format(Locale.US, mean[k] - hist[hist.size - 1 - d][k])
                        row += norm(st.part.name); row += truth
                        out.append(row.joinToString(",")).append('\n')
                    }
                    acc.fill(0.0); n = 0; secStart = s.now[i]
                }
            }
        }
        File(raw.parentFile, "parts-features.csv").writeText(out.toString())
        println("eksportert ${out.lines().size - 2} sekunder fra ${sg.size} sanger")
    }

    /**
     * Phase D (experiment): the «drop fingerprint». The preview (converted to Visualizer-like FFT by
     * preview_fft.py) runs through the real analysis; its fullest 8 s gives a 48-band profile. In the
     * recorded song: does the live 4 s profile look most like it during Espen's drops?
     */
    @Test fun dropFingerprint() {
        val pdir = File(raw.parentFile, "previews-fft")
        assumeTrue(pdir.isDirectory && File(raw, "fft").isDirectory)
        val csvs = raw.listFiles { f -> f.name.endsWith(".csv") && f.name != "feedback.csv" }?.toList().orEmpty()
        fun slug(k: String) = Regex("[^a-z0-9]+").replace(k, "_").take(80)
        fun cos(a: DoubleArray, b: DoubleArray): Double {
            var d = 0.0; var na = 0.0; var nb = 0.0
            for (i in a.indices) { d += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i] }
            return if (na > 0 && nb > 0) d / Math.sqrt(na * nb) else 0.0
        }
        /** Mean spectrum over a sliding window of [windowMs], one value per frame. */
        fun windowed(times: LongArray, spec: List<DoubleArray>, windowMs: Long): List<DoubleArray> {
            val out = ArrayList<DoubleArray>(); var j = 0; val acc = DoubleArray(spec[0].size)
            for (i in spec.indices) {
                for (k in acc.indices) acc[k] += spec[i][k]
                while (times[i] - times[j] > windowMs) { for (k in acc.indices) acc[k] -= spec[j][k]; j++ }
                val n = (i - j + 1).toDouble(); out.add(DoubleArray(acc.size) { acc[it] / n })
            }
            return out
        }
        val sb = StringBuilder("\nSang                                         likhet drop  ellers   drop-topp\n")
        var wins = 0; var tested = 0
        for (fft in File(raw, "fft").listFiles { f -> f.name.endsWith(".fft.gz") }.orEmpty().sortedBy { it.name }) {
            val csv = csvFor(fft, csvs) ?: continue
            if (!structured(csv, fft.name)) continue
            val key = truth(csv); if (key.size < 8) continue
            val head = csv.useLines { it.firstOrNull() }.orEmpty().drop(2).split(" – ", limit = 2)
            if (head.size < 2) continue
            val pfile = File(pdir, slug(GenreBook.key(head[1], head[0])) + ".fft.gz").takeIf { it.exists() } ?: continue
            // Fingerprint: the preview's fullest 8 s.
            val pf = frames(pfile); if (pf.size < 100) continue
            val pa = HardstyleAudio()
            val pFrames = pf.map { pa.accept(it.fft, it.rate, it.now) }
            val pSpec = pFrames.map { f -> DoubleArray(f.spectrum.size) { f.spectrum[it].toDouble() } }
            val pTimes = LongArray(pf.size) { pf[it].now }
            val pWin = windowed(pTimes, pSpec, 8_000L)
            val pLevel = windowed(pTimes, pFrames.map { doubleArrayOf(it.level.toDouble()) }, 8_000L).map { it[0] }
            val best = pLevel.indices.drop(pf.size / 4).maxByOrNull { pLevel[it] } ?: continue
            val print = pWin[best]
            // Live: 4 s profile vs fingerprint, compared with Espen's parts.
            val lf = frames(fft); if (lf.size < 200) continue
            val la = HardstyleAudio()
            val lSpec = lf.map { fr -> la.accept(fr.fft, fr.rate, fr.now).spectrum.let { s -> DoubleArray(s.size) { s[it].toDouble() } } }
            val lWin = windowed(LongArray(lf.size) { lf[it].now }, lSpec, 4_000L)
            val inDrop = ArrayList<Double>(); val other = ArrayList<Double>()
            for (i in lf.indices) {
                val t = key.lastOrNull { it.first <= lf[i].pos }?.second ?: continue
                (if (t == "DROP") inDrop else other).add(cos(lWin[i], print))
            }
            if (inDrop.isEmpty() || other.isEmpty()) continue
            // «Peaks at the drop»: how often a drop moment beats a random other moment (AUC).
            val o = other.sorted()
            val auc = inDrop.sumOf { d -> o.count { it < d }.toDouble() } / (inDrop.size.toDouble() * o.size)
            tested++; if (auc >= .65) wins++
            sb.append("%-44s %6.3f  %6.3f   %3.0f %%\n".format(Locale.US, fft.name.drop(16).take(44), inDrop.average(), other.average(), 100 * auc))
        }
        sb.append("\nTopper ved Espens drop (AUC ≥ 65 %%) i %d av %d sanger\n".format(wins, tested))
        println(sb)
        File(raw.parentFile, "drop-fingerprint.txt").writeText(sb.toString())
    }

    /**
     * The main check (also the «analyser» step): the old numbers on the raw key (same as before, so they can
     * be compared with older replay.txt), and the new metrics on the cleaned key for drop music and the rest.
     * Writes replay.txt, and baseline.txt the first time (the system as it was before the new listener).
     */
    @Test fun replayAgainstEspensAnswers() {
        assumeTrue("ingen opptak på denne maskinen", File(raw, "fft").isDirectory)
        val all = songs(all = true)
        assumeTrue("ingen sanger med fasit", all.isNotEmpty())
        val drop = all.filter { it.structured }; val rest = all.filterNot { it.structured }
        val report = StringBuilder()
        fun pct(x: Double) = "%3.0f %%".format(Locale.US, 100 * x)

        report.append("Drop-musikk (hardstyle/EDM), rå fasit — som før:\n")
        for (sg in drop) {
            val sc = evaluate(listOf(sg))
            report.append("%-58s enig %s  drop %d/%d  ekstra %d\n".format(Locale.US, sg.name.take(58), pct(sc.agree), sc.found, sc.trueDrops, sc.extra))
        }
        val old = evaluate(drop)
        report.append("\nTOTALT enig %.0f %% (%.0f s med fasit), drop funnet %d/%d, ekstra drop %d\n"
            .format(Locale.US, 100 * old.agree, old.seconds, old.found, old.trueDrops, old.extra))
        val cols = listOf("INTRO", "BUILDUP", "DROP", "BREAKDOWN", "GROOVE", "OUTRO", "ANTI_CLIMAX")
        report.append("\nDu sa \\ appen    " + cols.joinToString("") { "%11s".format(it.take(10)) } + "     treff\n")
        for (t in classes) {
            val m = old.matrix[t] ?: continue
            val n = m.values.sum()
            report.append("%-16s".format(t) + cols.joinToString("") { "%10.0fs".format(Locale.US, m[it] ?: 0.0) } +
                "  %5.0f %%\n".format(Locale.US, 100 * (m[t] ?: 0.0) / n))
        }

        fun newMetrics(title: String, songs: List<Song>) {
            val sc = evaluate(songs, clean = true)
            report.append("\n$title, renset fasit (${songs.size} sanger, %.0f s):\n".format(Locale.US, sc.seconds))
            if (sc.seconds <= 0) { report.append("  ingen fasit\n"); return }
            report.append("  enig %s · balansert %s\n".format(Locale.US, pct(sc.agree), pct(sc.balanced)))
            report.append("  drop innen én takt %d/%d · falske drop %.2f per min (%d)\n"
                .format(Locale.US, sc.foundBar, sc.trueDrops, sc.falseDropsPerMin, sc.extraBar))
            report.append("  build-up fanget %d/%d · per del: I %s B %s D %s Br %s\n".format(Locale.US,
                sc.buildCaught, sc.buildSections, pct(sc.perClass["INTRO"] ?: 0.0), pct(sc.perClass["BUILDUP"] ?: 0.0),
                pct(sc.perClass["DROP"] ?: 0.0), pct(sc.perClass["BREAKDOWN"] ?: 0.0)))
        }
        newMetrics("Drop-musikk", drop)
        newMetrics("Andre sjangre", rest)
        println(report)
        File(raw.parentFile, "replay.txt").writeText(report.toString())
        val baseline = File(raw.parentFile, "baseline.txt")
        if (!baseline.exists()) baseline.writeText("Dagens system før ny lytter (" +
            java.time.LocalDate.now() + "):\n\n" + report)
    }

    /** Gammel hjerne mot ny lytter (SongListener) på samme sanger og renset fasit → listener.txt. */
    @Test fun listenerAgainstEspensAnswers() {
        assumeTrue("ingen opptak på denne maskinen", File(raw, "fft").isDirectory)
        val all = songs(all = true)
        assumeTrue("ingen sanger med fasit", all.isNotEmpty())
        val drop = all.filter { it.structured }; val rest = all.filterNot { it.structured }
        val sb = StringBuilder()
        fun pct(x: Double) = "%3.0f %%".format(Locale.US, 100 * x)
        fun line(name: String, sc: Score) = sb.append("%-8s enig %s · balansert %s · drop innen takt %d/%d · falske %.2f/min (%d) · build-up %d/%d · I %s B %s D %s Br %s\n"
            .format(Locale.US, name, pct(sc.agree), pct(sc.balanced), sc.foundBar, sc.trueDrops, sc.falseDropsPerMin, sc.extraBar,
                sc.buildCaught, sc.buildSections, pct(sc.perClass["INTRO"] ?: 0.0), pct(sc.perClass["BUILDUP"] ?: 0.0),
                pct(sc.perClass["DROP"] ?: 0.0), pct(sc.perClass["BREAKDOWN"] ?: 0.0)))
        sb.append("Drop-musikk (${drop.size} sanger), renset fasit:\n")
        line("gammel", evaluate(drop, clean = true)); line("ny", evaluate(drop, clean = true, listener = true))
        sb.append("\nPer sang:\n")
        for (sg in drop) {
            line("gammel", evaluate(listOf(sg), clean = true)); line("ny", evaluate(listOf(sg), clean = true, listener = true))
            sb.append("   ↑ ${sg.name.take(70)}\n")
        }
        sb.append("\nAndre sjangre (${rest.size} sanger), renset fasit:\n")
        line("gammel", evaluate(rest, clean = true)); line("ny", evaluate(rest, clean = true, listener = true))
        // Falske drops per minutt i alle opptak (også uten fasit): rap/reggae skal ha nesten ingen.
        var secs = 0.0; var drops = 0
        for (sg in all) {
            val ln = SongListener(); ln.newTrack(sg.now[0]); var last = 0
            for (i in sg.frames.indices) { ln.update(sg.frames[i], sg.now[i], sg.pos[i], -1L); if (ln.drops > last) last = ln.drops }
            secs += (sg.now.last() - sg.now.first()) / 1000.0; drops += last
        }
        sb.append("\nAlle %d sanger med fasit: %d drops på %.0f min (%.2f/min)\n".format(Locale.US, all.size, drops, secs / 60, drops / (secs / 60)))
        // Tid per takt
        val big = all.maxByOrNull { it.frames.size }!!
        val ln = SongListener(); ln.newTrack(big.now[0]); val t0 = System.nanoTime()
        for (i in big.frames.indices) ln.update(big.frames[i], big.now[i], big.pos[i], -1L)
        val ms = (System.nanoTime() - t0) / 1e6
        sb.append("Tid: %.1f ms for %d bilder (%.3f ms per bilde)\n".format(Locale.US, ms, big.frames.size, ms / big.frames.size))
        println(sb)
        File(raw.parentFile, "listener.txt").writeText(sb.toString())
    }

    /** Tidslinje per takt: Espens fasit mot ny lytter (for å se hvor den bommer) → listener-tidslinje.txt. */
    @Test fun listenerTimeline() {
        assumeTrue("ingen opptak på denne maskinen", File(raw, "fft").isDirectory)
        val sb = StringBuilder()
        for (sg in songs().filter { it.cleanKey.isNotEmpty() }) {
            sb.append("\n## ${sg.name}\n  tid   fasit       lytter      nivå  pB   pD\n")
            val ln = SongListener(); ln.newTrack(sg.now[0]); var nextAt = 0L
            val td = sg.cleanKey.zipWithNext().filter { (x, y) -> x.second != "DROP" && y.second == "DROP" }.map { it.second.first / 1000 }
            val lo = ArrayList<Long>(); var lp = ""
            for (i in sg.frames.indices) { ln.update(sg.frames[i], sg.now[i], sg.pos[i], -1L); val a = norm(ln.part.name); if (a == "DROP" && lp != "DROP") lo.add(sg.pos[i] / 1000); lp = a }
            sb.append("  sanne drops: $td\n  lytterens drops: $lo\n"); ln.newTrack(sg.now[0])
            for (i in sg.frames.indices) {
                ln.update(sg.frames[i], sg.now[i], sg.pos[i], -1L)
                if (sg.pos[i] >= nextAt) {
                    nextAt = sg.pos[i] + sg.barMs
                    val t = sg.cleanKey.lastOrNull { it.first <= sg.pos[i] }?.second ?: "-"
                    val l = norm(ln.part.name)
                    sb.append("%5.0fs %-10s %-10s %s %.2f %.2f %.2f\n".format(Locale.US, sg.pos[i] / 1000.0, t, l, if (t == l) " " else "✗", ln.level, ln.pBuild, ln.pDrop))
                }
            }
        }
        File(raw.parentFile, "listener-tidslinje.txt").writeText(sb.toString())
    }

    /** Rå målinger per halv takt rundt Espens drops (for å se hva som faktisk skjer) → listener-signal.txt. */
    @Test fun listenerSignal() {
        assumeTrue("ingen opptak på denne maskinen", File(raw, "fft").isDirectory)
        val sb = StringBuilder()
        fun db(x: Double) = 20 * Math.log10(maxOf(x, 2.5))
        for (sg in songs().filter { it.cleanKey.isNotEmpty() }) {
            sb.append("\n## ${sg.name}  (takt ${sg.barMs} ms)\n  tid   fasit      sub   bass   air   pres  kick snare noise cent\n")
            val step = sg.barMs / 2; var i = 0
            while (i < sg.frames.size) {
                val t0 = sg.pos[i]; var j = i; val fr = ArrayList<HardstyleFrame>()
                while (j < sg.frames.size && sg.pos[j] < t0 + step) { fr.add(sg.frames[j]); j++ }
                if (fr.isNotEmpty()) {
                    val k = sg.cleanKey.lastOrNull { it.first <= t0 }?.second ?: "-"
                    sb.append("%5.1fs %-9s %5.1f %5.1f %5.1f %5.1f %5.2f %5.2f %5.2f %5.0f\n".format(Locale.US, t0 / 1000.0, k,
                        db(fr.map { it.subLevel.toDouble() }.average()), db(fr.map { it.bassLevel.toDouble() }.average()),
                        db(fr.map { it.air.toDouble() }.average()), db(fr.map { it.presence.toDouble() }.average()),
                        fr.map { it.kick.toDouble() }.average(), fr.map { it.snare.toDouble() }.average(),
                        fr.map { it.noise.toDouble() }.average(), fr.map { it.centroid.toDouble() }.average()))
                }
                i = maxOf(j, i + 1)
            }
        }
        File(raw.parentFile, "listener-signal.txt").writeText(sb.toString())
    }

    /** Målingene per slag (SongListener.features) + fasit + gammel hjernes del → listener-features.csv, til train_listener.py. */
    @Test fun exportListenerFeatures() {
        assumeTrue("ingen opptak på denne maskinen", File(raw, "fft").isDirectory)
        val sb = StringBuilder("song,pos_ms,dur_ms,truth,old," + LISTENER_FEATURES.joinToString(",") + "\n")
        for ((si, sg) in songs().withIndex()) {
            if (sg.cleanKey.isEmpty()) continue
            val ln = SongListener(); ln.newTrack(sg.now[0])
            val old = HardstyleStructure(); old.newTrack(sg.now[0]); old.dropPrint = sg.print
            var slots = 0; var lastPos = -1L
            for (i in sg.frames.indices) {
                old.update(sg.frames[i], sg.now[i], sg.pos[i], -1L)
                ln.update(sg.frames[i], sg.now[i], sg.pos[i], -1L)
                if (ln.slots > slots) {
                    slots = ln.slots
                    val t = sg.cleanKey.lastOrNull { it.first <= sg.pos[i] }?.second ?: continue
                    val dur = if (lastPos < 0) 0L else sg.pos[i] - lastPos; lastPos = sg.pos[i]
                    sb.append("$si,${sg.pos[i]},$dur,$t,${norm(old.part.name)},")
                    sb.append(ln.features.joinToString(",") { "%.4f".format(Locale.US, it) }).append('\n')
                }
            }
        }
        File(raw.parentFile, "listener-features.csv").writeText(sb.toString())
    }

    private companion object {
        /** How long after a change Espen typically presses (moved back in the cleaned key). */
        const val REACTION_MS = 600L
        /** A key that starts later than this was switched on mid-song (starts on the app's own guess). */
        const val MID_SONG_START_MS = 5_000L
    }
}

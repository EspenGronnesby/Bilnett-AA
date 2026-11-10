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
                       val frames: List<HardstyleFrame>)

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
    private fun songs(): List<Song> {
        val fftDir = File(raw, "fft")
        val csvs = raw.listFiles { f -> f.name.endsWith(".csv") && f.name != "feedback.csv" }?.toList().orEmpty()
        return fftDir.listFiles { f -> f.name.endsWith(".fft.gz") }.orEmpty().sortedBy { it.name }.mapNotNull { fft ->
            val csv = csvFor(fft, csvs) ?: return@mapNotNull null
            val key = truth(csv); if (key.size < 8 || !structured(csv, fft.name)) return@mapNotNull null
            val fs = frames(fft); if (fs.size < 200) return@mapNotNull null
            val audio = HardstyleAudio()
            if (useTeacherTempo) audio.setTempoHint(teacher(csv)?.trustedBpm ?: 0f)
            Song(fft.name.drop(16), key, LongArray(fs.size) { fs[it].now }, LongArray(fs.size) { fs[it].pos },
                fs.map { audio.accept(it.fft, it.rate, it.now) })
        }
    }

    private class Score(val agree: Double, val perClass: Map<String, Double>, val found: Int, val trueDrops: Int, val extra: Int) {
        val balanced get() = listOf("INTRO", "BUILDUP", "DROP", "BREAKDOWN").map { perClass[it] ?: 0.0 }.average()
        val objective get() = balanced + .15 * found / trueDrops.coerceAtLeast(1) - .004 * extra
    }

    private fun evaluate(songs: List<Song>): Score {
        val total = HashMap<String, HashMap<String, Double>>()
        var trueDrops = 0; var found = 0; var extra = 0
        for (sg in songs) {
            val st = HardstyleStructure(); st.newTrack(sg.now[0])
            var prev = sg.now[0]; var last = ""; val auto = ArrayList<Long>()
            for (i in sg.frames.indices) {
                st.update(sg.frames[i], sg.now[i], sg.pos[i], -1L)
                val dt = (sg.now[i] - prev).coerceIn(0L, 200L) / 1000.0; prev = sg.now[i]
                val a = norm(st.part.name)
                if (a == "DROP" && last != "DROP") auto.add(sg.pos[i]); last = a
                val t = sg.key.lastOrNull { it.first <= sg.pos[i] }?.second ?: continue
                total.getOrPut(t) { HashMap() }.merge(a, dt, Double::plus)
            }
            val td = sg.key.zipWithNext().filter { (x, y) -> x.second != "DROP" && y.second == "DROP" }.map { it.second.first }
            trueDrops += td.size
            found += td.count { d -> auto.any { kotlin.math.abs(it - d) <= 3_000L } }
            extra += auto.count { x -> td.none { kotlin.math.abs(it - x) <= 3_000L } }
        }
        val secs = total.values.sumOf { it.values.sum() }
        val ok = total.entries.sumOf { (t, m) -> m[t] ?: 0.0 }
        val per = total.mapValues { (t, m) -> (m[t] ?: 0.0) / m.values.sum() }
        return Score(ok / secs, per, found, trueDrops, extra)
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

    @Test fun replayAgainstEspensAnswers() {
        val fftDir = File(raw, "fft")
        assumeTrue("ingen opptak på denne maskinen", fftDir.isDirectory)
        val csvs = raw.listFiles { f -> f.name.endsWith(".csv") && f.name != "feedback.csv" }?.toList().orEmpty()
        val total = HashMap<String, HashMap<String, Double>>()   // truth → auto → seconds
        val report = StringBuilder()
        var dropsTrue = 0; var dropsFound = 0; var dropsExtra = 0
        for (fft in fftDir.listFiles { f -> f.name.endsWith(".fft.gz") }.orEmpty().sortedBy { it.name }) {
            val csv = csvFor(fft, csvs) ?: continue
            if (!structured(csv, fft.name)) continue
            val key = truth(csv)
            if (key.size < 8) continue
            val fs = frames(fft)
            if (fs.size < 200) continue
            val audio = HardstyleAudio()
            val structure = HardstyleStructure()
            structure.newTrack(fs.first().now)
            val song = HashMap<String, HashMap<String, Double>>()
            var prevNow = fs.first().now
            var lastAuto = ""
            val autoDrops = ArrayList<Long>()
            for (fr in fs) {
                val f = audio.accept(fr.fft, fr.rate, fr.now)
                structure.update(f, fr.now, fr.pos, -1L)
                val dt = (fr.now - prevNow).coerceIn(0L, 200L) / 1000.0
                prevNow = fr.now
                val auto = norm(structure.part.name)
                if (auto == "DROP" && lastAuto != "DROP") autoDrops.add(fr.pos)
                lastAuto = auto
                // Espen's part at this position (the last bar start at or before it).
                val t = key.lastOrNull { it.first <= fr.pos }?.second ?: continue
                song.getOrPut(t) { HashMap() }.merge(auto, dt, Double::plus)
                total.getOrPut(t) { HashMap() }.merge(auto, dt, Double::plus)
            }
            // Drops: Espen's drop starts vs automatic drop starts (±3 s).
            val trueDrops = key.zipWithNext().filter { (a, b) -> a.second != "DROP" && b.second == "DROP" }.map { it.second.first }
            val found = trueDrops.count { d -> autoDrops.any { kotlin.math.abs(it - d) <= 3_000L } }
            val extra = autoDrops.count { a -> trueDrops.none { kotlin.math.abs(it - a) <= 3_000L } }
            dropsTrue += trueDrops.size; dropsFound += found; dropsExtra += extra
            val secs = song.values.sumOf { it.values.sum() }
            val ok = song.entries.sumOf { (t, m) -> m[t] ?: 0.0 }
            report.append("%-58s enig %3.0f %%  drop %d/%d  ekstra %d\n".format(Locale.US,
                fft.name.drop(16).take(58), 100 * ok / secs.coerceAtLeast(1e-9), found, trueDrops.size, extra))
        }
        assumeTrue("ingen sanger med fasit", total.isNotEmpty())
        val secs = total.values.sumOf { it.values.sum() }
        val ok = total.entries.sumOf { (t, m) -> m[t] ?: 0.0 }
        report.append("\nTOTALT enig %.0f %% (%.0f s med fasit), drop funnet %d/%d, ekstra drop %d\n"
            .format(Locale.US, 100 * ok / secs, secs, dropsFound, dropsTrue, dropsExtra))
        val cols = listOf("INTRO", "BUILDUP", "DROP", "BREAKDOWN", "GROOVE", "OUTRO", "ANTI_CLIMAX")
        report.append("\nDu sa \\ appen    " + cols.joinToString("") { "%11s".format(it.take(10)) } + "     treff\n")
        for (t in classes) {
            val m = total[t] ?: continue
            val n = m.values.sum()
            report.append("%-16s".format(t) + cols.joinToString("") { "%10.0fs".format(Locale.US, m[it] ?: 0.0) } +
                "  %5.0f %%\n".format(Locale.US, 100 * (m[t] ?: 0.0) / n))
        }
        println(report)
        File(raw.parentFile, "replay.txt").writeText(report.toString())
    }
}

package com.kododake.aabrowser.rave

import android.util.Log
import java.util.Locale
import kotlin.math.abs
import kotlin.math.roundToLong

/** One sung word with its own time window (ms into the song). */
internal data class LyricWord(val text: String, val startMs: Long, val endMs: Long, val syllables: Int)

/** One lyrics line. [text] is always the words joined by single spaces (or «♪» for an empty line). */
internal data class LyricLine(val startMs: Long, val endMs: Long, val text: String, val words: List<LyricWord>)

/** Where the word timing came from — shown in the song info panel. */
internal enum class LyricsTiming(val label: String) {
    WORDS("NetEase ord-synk"),
    ENHANCED("LRCLIB ord-synk"),
    GUESSED("LRCLIB linjer, ord gjettet")
}

internal class LyricsResult(val lines: List<LyricLine>, val plain: String?, val timing: LyricsTiming?)

/**
 * Fetches lyrics with as exact timing as we can get:
 * 1. NetEase «yrc» — a time for every word (free, no login; unofficial, so it may stop working).
 * 2. LRCLIB — usually only a time per line. Then the word timing is guessed from syllables,
 *    the song's own singing speed and (when known) the beat.
 */
internal object LyricsSource {
    private const val TAG = "Rave"

    /** [durMs] = song length from Spotify; [bpm] = beat tempo (0 = unknown). Runs on a background thread. */
    fun load(title: String, artist: String, album: String, durMs: Long, bpm: () -> Float): LyricsResult? {
        val clean = cleanTitle(title)
        val firstArtist = artist.split(",", "&", " feat").first().trim()
        // Both sources at the same time; NetEase gets at most ~9 s so it can never hold the lyrics back for long.
        var ne: List<LyricLine>? = null
        val neThread = Thread {
            ne = try { netease(clean, firstArtist, durMs) } catch (e: Exception) { Log.d(TAG, "netease feilet: $e"); null }
        }.apply { start() }
        val lrc = try { queryLrclib(clean, firstArtist, durMs / 1000L) } catch (e: Exception) { Log.d(TAG, "lrclib feilet: $e"); null }
        neThread.join(9_000L)
        val words = ne
        if (words != null && sameVersion(words, lrc?.first.orEmpty())) {
            Log.d(TAG, "tekst: netease ord-synk (${words.size} linjer)")
            return LyricsResult(words, lrc?.second, LyricsTiming.WORDS)
        }

        val (synced, plain) = lrc ?: return null
        if (synced.isEmpty()) return LyricsResult(emptyList(), plain, null)
        if (synced.any { it.words != null }) {
            Log.d(TAG, "tekst: lrclib ord-synk")
            return LyricsResult(fromEnhanced(synced, durMs), plain, LyricsTiming.ENHANCED)
        }
        val b = bpm()
        Log.d(TAG, "tekst: lrclib linjer, ord gjettes (bpm=$b)")
        return LyricsResult(estimate(synced, durMs, b), plain, LyricsTiming.GUESSED)
    }

    /** Removes "(feat. …)", "- Remastered" and the like, which often make the search miss. */
    fun cleanTitle(t: String): String =
        t.replace(Regex("""\s*[\(\[].*?(feat|with|remaster|version|edit|live).*?[\)\]]""", RegexOption.IGNORE_CASE), "")
            .replace(Regex("""\s+-\s+.*(remaster|version|edit|live).*$""", RegexOption.IGNORE_CASE), "").trim()

    fun norm(s: String) = s.lowercase(Locale.ROOT).replace(Regex("[^\\p{L}\\p{N}]+"), " ").trim()

    // ---------- NetEase (word timing) ----------

    private fun netease(clean: String, artist: String, durMs: Long): List<LyricLine>? {
        val headers = mapOf("Referer" to "https://music.163.com", "User-Agent" to "Mozilla/5.0")
        val json = httpGet("https://music.163.com/api/cloudsearch/pc?type=1&limit=10&s=${enc("$artist $clean")}", headers, tries = 1, timeoutMs = 3000) ?: return null
        val songs = org.json.JSONObject(json).optJSONObject("result")?.optJSONArray("songs") ?: return null
        val wantTitle = norm(clean)
        val wantArtist = norm(artist)
        if (wantArtist.isBlank() || wantTitle.isBlank()) return null
        val candidates = (0 until songs.length()).map { songs.getJSONObject(it) }.filter { s ->
            val ar = s.optJSONArray("ar")
            val artistOk = ar != null && (0 until ar.length()).any { i ->
                val n = norm(ar.getJSONObject(i).optString("name"))
                n == wantArtist || (n.length > 2 && (n.contains(wantArtist) || wantArtist.contains(n)))
            }
            val name = norm(s.optString("name"))
            val titleOk = name == wantTitle || name.startsWith(wantTitle)
            // Another version (radio edit, extended mix) has other timestamps → must be close in length.
            val lenOk = durMs <= 0 || abs(s.optLong("dt") - durMs) <= 3_000L
            artistOk && titleOk && lenOk
        }.sortedBy { if (durMs > 0) abs(it.optLong("dt") - durMs) else 0L }
        for (s in candidates.take(3)) {
            val lj = httpGet("https://music.163.com/api/song/lyric/v1?id=${s.optLong("id")}&lv=-1&yv=-1&kv=-1&tv=-1", headers, tries = 1, timeoutMs = 3000) ?: continue
            val yrc = org.json.JSONObject(lj).optJSONObject("yrc")?.optString("lyric").orEmpty()
            val lines = parseYrc(yrc)
            if (lines.size >= 4) return lines
        }
        return null
    }

    /**
     * NetEase may have another master of the song (other intro). Compare lines with the same text:
     * if NetEase is more than 1.5 s off LRCLIB in the median, its timing belongs to another version.
     */
    private fun sameVersion(ne: List<LyricLine>, lrc: List<LrcLine>): Boolean {
        if (lrc.isEmpty()) return true
        val byText = lrc.groupBy { norm(it.text) }
        val diffs = ne.mapNotNull { l ->
            byText[norm(l.text)]?.minOfOrNull { abs(it.startMs - l.startMs) }
        }.sorted()
        if (diffs.size < 3) return true
        val median = diffs[diffs.size / 2]
        if (median > 1_500L) Log.d(TAG, "netease forkastet: ${median} ms unna lrclib")
        return median <= 1_500L
    }

    private val yrcLine = Regex("""^\[(\d+),(\d+)](.*)$""")
    private val yrcWord = Regex("""\((\d+),(\d+),\d+\)""")

    /** `[lineStart,lineDur](wordStart,wordDur,0)Word (…)word` — JSON lines ({"t":…}) are credits and skipped. */
    internal fun parseYrc(text: String): List<LyricLine> {
        val out = ArrayList<LyricLine>()
        text.lineSequence().forEach { raw ->
            val m = yrcLine.find(raw.trim()) ?: return@forEach
            val lineStart = m.groupValues[1].toLong()
            val lineDur = m.groupValues[2].toLong()
            val body = m.groupValues[3]
            val tags = yrcWord.findAll(body).toList()
            val words = ArrayList<LyricWord>()
            var prevOpen = false   // the previous token ended without a space (word continues)
            tags.forEachIndexed { i, t ->
                val ws = t.groupValues[1].toLong()
                val we = ws + t.groupValues[2].toLong()
                val rawTxt = body.substring(t.range.last + 1, if (i + 1 < tags.size) tags[i + 1].range.first else body.length)
                val txt = rawTxt.trim()
                if (txt.isEmpty()) { prevOpen = false; return@forEachIndexed }
                // A token without letters («.», «,») belongs to the word before it. So does a syllable
                // that follows the previous one without a space: «be» «ca» «use» → «because».
                val glue = words.isNotEmpty() && (txt.none { it.isLetterOrDigit() } || (prevOpen && !rawTxt.first().isWhitespace()))
                val parts = txt.split(' ').filter { it.isNotBlank() }
                val step = (we - ws) / parts.size.coerceAtLeast(1)
                parts.forEachIndexed { k, w ->
                    val s0 = ws + k * step
                    val e0 = ws + (k + 1) * step
                    if (k == 0 && glue) {
                        val p = words.removeAt(words.size - 1)
                        val joined = p.text + w
                        words.add(LyricWord(joined, p.startMs, maxOf(p.endMs, e0), syllables(joined)))
                    } else words.add(LyricWord(w, s0, e0, syllables(w)))
                }
                prevOpen = !rawTxt.last().isWhitespace()
            }
            if (words.isEmpty()) return@forEach
            fixSqueezed(words)
            out.add(LyricLine(lineStart, maxOf(lineStart + lineDur, words.last().endMs), words.joinToString(" ") { it.text }, words))
        }
        return out.sortedBy { it.startMs }
    }

    /**
     * Repairs a common error in word timing: one word gets the time of the next («on» 1.77 s, «18» 0.09 s
     * in Kodak Black's «Love & War»), usually around numbers and slurred words. When a word is far too
     * short for its syllables and the word before it far too long, their shared time is split again by
     * syllables (the last word of a line weighted for being held).
     */
    internal fun fixSqueezed(words: MutableList<LyricWord>) {
        for (k in 1 until words.size) {
            val p = words[k - 1]
            val w = words[k]
            val perSylW = (w.endMs - w.startMs).toFloat() / w.syllables
            val perSylP = (p.endMs - p.startMs).toFloat() / p.syllables
            // Only where this error shows up: the line's last word, or a number. A quick «a» after a
            // genuinely held word in the middle of a line is left alone.
            if (k != words.size - 1 && w.text.none { it.isDigit() }) continue
            if (perSylW >= 100f || perSylP < 400f || perSylP < perSylW * 3f) continue
            val total = w.endMs - p.startMs
            val wp = p.syllables.toFloat()
            val ww = w.syllables * (if (k == words.size - 1) 1.8f else 1f)
            val cut = p.startMs + (total * wp / (wp + ww)).toLong()
            words[k - 1] = p.copy(endMs = cut)
            words[k] = w.copy(startMs = cut)
        }
    }

    // ---------- LRCLIB (line timing) ----------

    /** A line from an LRC file; [words] is set only for «enhanced» LRC with <mm:ss.xx> per word. */
    internal class LrcLine(val startMs: Long, val text: String, val words: List<Pair<Long, String>>?)

    private fun queryLrclib(clean: String, firstArtist: String, dur: Long): Pair<List<LrcLine>, String?>? {
        var obj: org.json.JSONObject? = null
        var url = "https://lrclib.net/api/get?track_name=${enc(clean)}&artist_name=${enc(firstArtist)}"
        if (dur > 0) url += "&duration=$dur"
        httpGet(url)?.let { obj = org.json.JSONObject(it) }
        if (obj == null || obj!!.isNull("syncedLyrics")) {
            bestMatch(httpGet("https://lrclib.net/api/search?track_name=${enc(clean)}&artist_name=${enc(firstArtist)}"), dur)?.let { obj = it }
        }
        if (obj == null || obj!!.isNull("syncedLyrics")) {
            bestMatch(httpGet("https://lrclib.net/api/search?q=${enc("$firstArtist $clean")}"), dur)?.let { if (obj == null || !it.isNull("syncedLyrics")) obj = it }
        }
        val o = obj ?: return null
        val synced = if (o.isNull("syncedLyrics")) "" else o.optString("syncedLyrics", "")
        val plain = if (o.isNull("plainLyrics")) null else o.optString("plainLyrics", "").takeIf { it.isNotBlank() }
        Log.d(TAG, "tekst funnet: ${o.optString("trackName")} synced=${synced.isNotBlank()}")
        return parseLrc(synced) to plain
    }

    /** Picks the hit with synced lyrics and the length closest to the song. */
    private fun bestMatch(json: String?, dur: Long): org.json.JSONObject? {
        if (json == null) return null
        val arr = org.json.JSONArray(json)
        var best: org.json.JSONObject? = null
        var bestScore = Double.MAX_VALUE
        for (i in 0 until arr.length()) {
            val o = arr.getJSONObject(i)
            val synced = !o.isNull("syncedLyrics")
            val plain = !o.isNull("plainLyrics")
            if (!synced && !plain) continue
            val d = if (o.isNull("duration")) -1.0 else o.optDouble("duration", -1.0)
            var score = if (dur > 0 && d > 0) abs(d - dur) else 30.0
            if (!synced) score += 1000.0
            if (score < bestScore) { bestScore = score; best = o }
        }
        return best
    }

    private val lrcTime = Regex("""\[(\d+):(\d+)(?:[.:](\d+))?]""")
    private val wordTime = Regex("""<(\d+):(\d+)(?:[.:](\d+))?>""")

    private fun ms(min: String, sec: String, fr: String) =
        min.toLong() * 60000 + sec.toLong() * 1000 + (if (fr.isEmpty()) 0L else fr.padEnd(3, '0').take(3).toLong())

    internal fun parseLrc(text: String): List<LrcLine> {
        val out = mutableListOf<LrcLine>()
        text.lineSequence().forEach { line ->
            val ms = lrcTime.findAll(line).toList()
            if (ms.isEmpty()) return@forEach
            val rest = line.substring(ms.last().range.last + 1)
            val tags = wordTime.findAll(rest).toList()
            val words = if (tags.isEmpty()) null else tags.mapIndexedNotNull { i, t ->
                val w = rest.substring(t.range.last + 1, if (i + 1 < tags.size) tags[i + 1].range.first else rest.length).trim()
                if (w.isEmpty()) null else ms(t.groupValues[1], t.groupValues[2], t.groupValues[3]) to w
            }.takeIf { it.isNotEmpty() }
            val plainText = rest.replace(wordTime, "").replace(Regex("\\s+"), " ").trim()
            ms.forEach { m -> out.add(LrcLine(ms(m.groupValues[1], m.groupValues[2], m.groupValues[3]), plainText, words)) }
        }
        return out.sortedBy { it.startMs }
    }

    /** Enhanced LRC: each word runs until the next word starts (the last one until the next line, at most 1.5 s). */
    private fun fromEnhanced(lrc: List<LrcLine>, durMs: Long): List<LyricLine> {
        val wordLines = lrc.filter { it.words != null }
        if (wordLines.size < lrc.count { it.text.isNotBlank() } / 2) return estimate(lrc, durMs, 0f)
        val guessed = estimate(lrc, durMs, 0f)
        return lrc.mapIndexed { i, l ->
            val next = lrc.getOrNull(i + 1)?.startMs ?: if (durMs > 0) durMs else l.startMs + 5_000L
            val tw = l.words
            if (tw == null) return@mapIndexed guessed[i]   // a line without word tags keeps its text
            val words = tw.flatMapIndexed { k, (s, w) ->
                val e = tw.getOrNull(k + 1)?.first ?: minOf(next - 60L, s + 1_500L)
                w.split(' ').filter { it.isNotBlank() }.let { parts ->
                    val step = (e - s).coerceAtLeast(60L) / parts.size
                    parts.mapIndexed { j, p -> LyricWord(p, s + j * step, s + (j + 1) * step, syllables(p)) }
                }
            }
            val fixed = words.toMutableList().also { fixSqueezed(it) }
            LyricLine(l.startMs, fixed.last().endMs, fixed.joinToString(" ") { it.text }, fixed)
        }
    }

    // ---------- Guessing word timing from line timing ----------

    private fun emptyLine(start: Long, next: Long) = LyricLine(start, next, "♪", emptyList())

    private val holdWords = Regex("^(o+h+|oh+|a+h+|ooh+|yeah+|ye+ah|woah+|whoa+|wo+|na+|la+|hey+|baby|love|night)$")

    /** Vowel groups ≈ syllables (good enough for English, Norwegian and most rap). */
    internal fun syllables(word: String): Int {
        val w = word.lowercase(Locale.ROOT).filter { it.isLetter() }
        // Numbers: roughly one syllable per digit («18» = eigh-teen).
        if (w.isEmpty()) return word.count { it.isDigit() }.coerceAtLeast(1)
        var n = 0
        var prev = false
        for (c in w) {
            val v = c in "aeiouyæøåéèáàíóúäöü"
            if (v && !prev) n++
            prev = v
        }
        // Silent English «e» at the end (make, time) — but not «the», «be», «little».
        if (w.length > 3 && w.endsWith('e') && !w.endsWith("le") && w[w.length - 2] !in "aeiouy" && n > 1) n--
        return n.coerceAtLeast(1)
    }

    /** How long a word tends to be held, relative to a plain syllable. */
    private fun weight(word: String, last: Boolean): Float {
        val clean = word.lowercase(Locale.ROOT).filter { it.isLetter() }
        var w = syllables(word).toFloat()
        if (holdWords.matches(clean)) w *= 1.6f
        if (Regex("(.)\\1\\1").containsMatchIn(clean)) w *= 1.8f   // «sooo», «yeahhh»
        if (last) w *= 1.8f                                         // singers hold the end of a line
        return w
    }

    /**
     * Spreads each line's words over the time that is actually sung, not the whole gap to the next
     * line: the song's own speed (median ms per syllable over lines that follow each other closely)
     * decides how long a line takes. With a known [bpm], word boundaries snap to 8th/16th notes.
     */
    internal fun estimate(lrc: List<LrcLine>, durMs: Long, bpm: Float): List<LyricLine> {
        val rates = lrc.indices.mapNotNull { i ->
            val next = lrc.getOrNull(i + 1) ?: return@mapNotNull null
            val syl = lrc[i].text.split(' ').filter { it.isNotBlank() }.sumOf { syllables(it) }
            if (syl < 3) null else (next.startMs - lrc[i].startMs).toFloat() / syl
        }.sorted()
        // The faster half = lines sung back to back (the slower half includes instrumental pauses).
        val fast = rates.take((rates.size + 1) / 2)
        val msPerSyl = (if (fast.isEmpty()) 230f else fast[fast.size / 2]).coerceIn(120f, 450f)
        val beatMs = if (bpm in 60f..220f) 60_000f / bpm else 0f

        return lrc.mapIndexed { i, l ->
            val next = lrc.getOrNull(i + 1)?.startMs ?: if (durMs > l.startMs) durMs else l.startMs + 5_000L
            val gap = (next - l.startMs).coerceAtLeast(200L)
            val texts = l.text.split(' ').filter { it.isNotBlank() }
            if (texts.isEmpty()) return@mapIndexed emptyLine(l.startMs, next)
            val weights = texts.mapIndexed { k, w -> weight(w, k == texts.size - 1) }
            val total = weights.sum()
            val sung = minOf(gap - 100L, (total * msPerSyl * 1.25f).toLong())
                .coerceAtLeast(minOf(gap - 50L, 400L)).coerceAtLeast(100L)
            // Raw boundaries, then snapped to the beat grid if one is known.
            var acc = 0f
            val bounds = LongArray(texts.size + 1)
            for (k in texts.indices) { bounds[k] = (sung * acc / total).toLong(); acc += weights[k] }
            bounds[texts.size] = sung
            // Rhythm: word lengths are rounded to 8th/16th notes, counted from the line start (LRC lines
            // usually start on the first sung word, which tends to sit on the beat). The beat phase itself
            // is not known here, so this evens out the rhythm rather than locking to the kick.
            if (beatMs > 0f) {
                val sylPerBeat = texts.sumOf { syllables(it) } / (sung / beatMs)
                val grid = if (sylPerBeat > 2.5f) beatMs / 4f else beatMs / 2f
                val snapped = LongArray(bounds.size) { k -> if (k == 0) 0L else ((bounds[k] / grid).roundToLong() * grid).toLong() }
                // Use the grid only if every word keeps a sensible length and the line still fits.
                val ok = (1 until snapped.size).all { snapped[it] - snapped[it - 1] >= minOf(grid.toLong(), 90L) } && snapped.last() <= gap - 60L
                if (ok) snapped.copyInto(bounds)
            }
            val words = texts.mapIndexed { k, w -> LyricWord(w, l.startMs + bounds[k], l.startMs + bounds[k + 1], syllables(w)) }
            LyricLine(l.startMs, words.last().endMs, words.joinToString(" ") { it.text }, words)
        }
    }

    // ---------- Vocal tempo (for the song info panel) ----------

    /** Syllables per second while singing: whole song (sung time only) and one line. */
    fun sylPerSec(lines: List<LyricLine>): Float {
        var syl = 0; var ms = 0L
        lines.forEach { l -> if (l.words.isNotEmpty()) { syl += l.words.sumOf { it.syllables }; ms += l.words.last().endMs - l.words.first().startMs } }
        return if (ms > 0) syl * 1000f / ms else 0f
    }

    fun sylPerSec(line: LyricLine): Float {
        if (line.words.isEmpty()) return 0f
        val ms = line.words.last().endMs - line.words.first().startMs
        return if (ms > 0) line.words.sumOf { it.syllables } * 1000f / ms else 0f
    }

    // ---------- HTTP ----------

    private fun enc(x: String) = java.net.URLEncoder.encode(x, "UTF-8")

    private fun httpGet(url: String, headers: Map<String, String> = emptyMap(), tries: Int = 4, timeoutMs: Int = 7000): String? {
        repeat(tries) { attempt ->
            val c = java.net.URL(url).openConnection() as java.net.HttpURLConnection
            c.connectTimeout = timeoutMs
            c.readTimeout = timeoutMs
            c.setRequestProperty("User-Agent", "Bilnett/1.0")
            headers.forEach { (k, v) -> c.setRequestProperty(k, v) }
            try {
                val code = c.responseCode
                if (code == 200) return c.inputStream.bufferedReader().readText()
                if (code == 404) return null
                Log.d(TAG, "http $code, forsøk ${attempt + 1}: ${url.substringBefore('?')}")
            } catch (e: Exception) {
                Log.d(TAG, "http feil: $e")
            } finally {
                c.disconnect()
            }
            if (attempt + 1 < tries) Thread.sleep(700L * (attempt + 1))
        }
        return null
    }
}

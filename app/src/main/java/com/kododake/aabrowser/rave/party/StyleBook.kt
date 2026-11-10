package com.kododake.aabrowser.rave.party

import com.kododake.aabrowser.rave.Genre
import org.json.JSONObject
import java.io.File

/**
 * What the Mac's style teacher heard in each song's 30 s preview (Essentia Discogs-EffNet,
 * 400 Discogs styles + BPM). Written by `tools/party-analyse/style_teacher.py`, pushed to
 * `files/style-book.json` by `sync.py`; keyed by [com.kododake.aabrowser.rave.GenreBook.key].
 * The model itself never runs on the phone (licence + needs real audio).
 */
internal class StyleBook(private val file: File) {
    data class Style(val styles: List<Pair<String, Float>>, val bpm: Float, val bpmConf: Float, val mood: SongMood? = null) {
        /** The teacher's genre and how sure it is (sum of the top styles in that genre family). */
        val genre: Pair<Genre, Float>? get() = styleToGenre(styles)
        /** BPM worth trusting (Essentia's confidence: < 1 is poor, > 3.5 excellent). */
        val trustedBpm: Float? get() = bpm.takeIf { bpmConf >= MIN_BPM_CONF && it in 60f..260f }
    }

    private var loadedAt = -1L
    private var styles: Map<String, Style> = emptyMap()

    /** Reads the file again only when it changed (a new push from the Mac). */
    fun lookup(key: String): Style? {
        val m = file.lastModified()
        if (m != loadedAt) {
            styles = try { if (file.exists()) parse(file.readText()) else emptyMap() } catch (_: Exception) { emptyMap() }
            loadedAt = m
        }
        return styles[key]
    }

    companion object {
        const val MIN_BPM_CONF = 1f
        /** The genre family must add up to at least this (sigmoid scores, top 5). */
        const val MIN_GENRE_SCORE = .25f

        fun parse(text: String): Map<String, Style> {
            val root = JSONObject(text)
            val out = HashMap<String, Style>()
            for (k in root.keys()) {
                val o = root.optJSONObject(k) ?: continue
                val arr = o.optJSONArray("styles") ?: continue   // tried, no preview found
                val list = (0 until arr.length()).mapNotNull { i ->
                    arr.optJSONArray(i)?.let { it.optString(0) to it.optDouble(1).toFloat() }
                }
                val m = o.optJSONObject("mood")
                val mood = m?.let {
                    fun f(name: String) = it.optDouble(name, 0.0).toFloat()
                    val th = it.optJSONArray("themes")
                    SongMood(f("aggressive"), f("happy"), f("party"), f("relaxed"), f("sad"), f("dance"), f("voice"), f("bright"),
                        if (th == null) emptyList() else (0 until th.length()).mapNotNull { i ->
                            th.optJSONArray(i)?.let { t -> t.optString(0) to t.optDouble(1).toFloat() } })
                }
                out[k] = Style(list, o.optDouble("bpm", 0.0).toFloat(), o.optDouble("bpmConf", 0.0).toFloat(), mood)
            }
            return out
        }

        /** Discogs style ("Parent---Style") → our genre family. */
        fun family(style: String): Genre? {
            val parent = style.substringBefore("---")
            val s = style.substringAfter("---")
            return when {
                parent == "Electronic" && s in HARD -> Genre.HARDSTYLE
                // RnB/Swing is filed under Hip Hop by Discogs, but sounds like pop (Bruno Mars).
                parent == "Hip Hop" && s == "RnB/Swing" -> Genre.POP
                parent == "Hip Hop" -> Genre.RAP
                s == "Reggaeton" || s == "Dembow" -> Genre.REGGAETON
                parent == "Reggae" -> Genre.REGGAE
                parent == "Electronic" && s in POP_ELECTRONIC -> Genre.POP
                parent == "Electronic" && s in EDM -> Genre.EDM
                parent == "Pop" || parent == "Funk / Soul" -> Genre.POP
                // Radio pop-rock (e.g. «Hey, Soul Sister») belongs with pop, not with rock drums.
                parent == "Rock" && s in POP_ROCK -> Genre.POP
                parent == "Rock" -> Genre.ROCK
                parent in CALM_PARENTS || (parent == "Electronic" && s in CALM_ELECTRONIC) -> Genre.STANDARD
                else -> null
            }
        }

        /** Sums the top styles per family; the strongest family wins if it is sure enough. */
        fun styleToGenre(styles: List<Pair<String, Float>>): Pair<Genre, Float>? {
            val sums = HashMap<Genre, Float>()
            for ((name, score) in styles) family(name)?.let { sums[it] = (sums[it] ?: 0f) + score }
            val best = sums.maxByOrNull { it.value } ?: return null
            return if (best.value >= MIN_GENRE_SCORE) best.key to best.value else null
        }

        private val HARD = setOf("Hardstyle", "Hardcore", "Gabber", "Jumpstyle", "Speedcore", "Happy Hardcore",
            "Hard Trance", "Hands Up", "Hard House", "Makina", "Breakcore")
        private val EDM = setOf("House", "Tech House", "Deep House", "Electro House", "Progressive House", "Big Room",
            "Dubstep", "Drum n Bass", "Future Bass", "Trance", "Tech Trance", "Progressive Trance", "Psy-Trance",
            "Techno", "Minimal Techno", "Electro", "Bass Music", "Breakbeat", "Moombahton", "Trap", "Garage House",
            "UK Garage", "Dance", "Eurodance", "Italodance", "Jungle", "Drumstep")
        private val POP_ELECTRONIC = setOf("Dance-pop", "Synth-pop", "Electropop", "Europop", "Indie Pop")
        private val POP_ROCK = setOf("Pop Rock", "Soft Rock", "Power Pop")
        private val CALM_ELECTRONIC = setOf("Ambient", "Downtempo", "Chillwave", "Trip Hop", "Lo-Fi")
        private val CALM_PARENTS = setOf("Folk, World, & Country", "Jazz", "Classical", "Blues", "Stage & Screen", "Non-Music")
    }
}

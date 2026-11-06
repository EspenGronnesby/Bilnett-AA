package com.kododake.aabrowser.rave

import android.util.Log
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.net.URLEncoder
import java.util.Locale
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.TimeUnit

/**
 * Similar artists from Deezer (free, no key). These carry the song's real mood far better than a
 * genre name: Scrim → $uicideboy$, Pouya, Bones; Metallica → Megadeth, Iron Maiden.
 */
internal object DeezerLookup {
    private val client = OkHttpClient.Builder().callTimeout(8, TimeUnit.SECONDS).build()
    private val cache = ConcurrentHashMap<String, List<String>>()
    private fun norm(s: String) = s.lowercase(Locale.ROOT).replace(Regex("[^\\p{L}\\p{N}]+"), " ").trim()

    /** Up to five artists similar to [artist], best match first; empty when Deezer has nothing. */
    fun related(artist: String, title: String): List<String> {
        val main = artist.split(Regex("\\s*(?:,|&| feat\\.? | featuring )\\s*", RegexOption.IGNORE_CASE)).first().trim()
        if (main.isBlank()) return emptyList()
        cache[norm(main)]?.let { return it }
        val id = artistId(main, title) ?: return emptyList()
        val names = get("https://api.deezer.com/artist/$id/related?limit=10")?.optJSONArray("data")?.let { arr ->
            (0 until arr.length()).map { arr.getJSONObject(it).optString("name") }
        }.orEmpty()
            // Collaboration entries ("A & B") and the artist itself are no use as a "similar artist".
            .filter { it.isNotBlank() && norm(it) != norm(main) && !it.contains(" & ") && !it.contains(" x ", true) }
            .take(5)
        Log.d("RaveVideo", "Deezer related to '$main': $names")
        if (names.isNotEmpty()) cache[norm(main)] = names
        return names
    }

    /**
     * The artist id from the track itself, so the right one of several same-named artists is used
     * (there are five "Scrim"s). Falls back to the most-followed artist with that exact name.
     */
    private fun artistId(main: String, title: String): Long? {
        val clean = title.replace(Regex("\\s*[-–(\\[].*$"), "").trim().ifBlank { title }
        get("https://api.deezer.com/search?limit=5&q=" + enc("$main $clean"))?.optJSONArray("data")?.let { arr ->
            for (i in 0 until arr.length()) {
                val a = arr.getJSONObject(i).optJSONObject("artist") ?: continue
                if (norm(a.optString("name")) == norm(main)) return a.optLong("id")
            }
        }
        val arr = get("https://api.deezer.com/search/artist?limit=10&q=" + enc(main))?.optJSONArray("data") ?: return null
        return (0 until arr.length()).map { arr.getJSONObject(it) }
            .filter { norm(it.optString("name")) == norm(main) }
            .maxByOrNull { it.optLong("nb_fan") }?.optLong("id")
    }

    /**
     * Song facts from Deezer: beat tempo (0 = Deezer does not know), loudness, release date and the
     * album's genres (e.g. "Rap/Hip Hop", "Dance") — a second opinion next to Apple's genre.
     */
    internal data class TrackFacts(val bpm: Float, val gainDb: Float?, val releaseDate: String, val genres: List<String> = emptyList())

    private val trackCache = ConcurrentHashMap<String, TrackFacts>()

    /**
     * The track that matches both artist and length (±3 s), so a remix or live version's BPM is
     * not used. Null when nothing matches.
     */
    fun track(artist: String, title: String, durS: Long): TrackFacts? {
        val main = artist.split(Regex("\\s*(?:,|&| feat\\.? | featuring )\\s*", RegexOption.IGNORE_CASE)).first().trim()
        val clean = LyricsSource.cleanTitle(title)
        if (main.isBlank() || clean.isBlank()) return null
        val key = "${norm(main)}|${norm(clean)}|$durS"
        trackCache[key]?.let { return it }
        val arr = get("https://api.deezer.com/search?limit=10&q=" + enc("$main $clean"))?.optJSONArray("data") ?: return null
        val hit = (0 until arr.length()).map { arr.getJSONObject(it) }.firstOrNull { t ->
            // «The Mamas & The Papas» is one artist, not «The Mamas» — accept the full name too.
            norm(t.optJSONObject("artist")?.optString("name").orEmpty()).let { n -> n == norm(main) || n == norm(artist) || n.startsWith(norm(main) + " ") } &&
                norm(t.optString("title")).startsWith(norm(clean)) &&
                (durS <= 0 || kotlin.math.abs(t.optLong("duration") - durS) <= 3)
        } ?: return null
        val t = get("https://api.deezer.com/track/${hit.optLong("id")}") ?: return null
        val albumId = t.optJSONObject("album")?.optLong("id") ?: 0L
        val genres = if (albumId > 0L) get("https://api.deezer.com/album/$albumId")?.optJSONObject("genres")
            ?.optJSONArray("data")?.let { arr -> (0 until arr.length()).map { arr.getJSONObject(it).optString("name") } }
            .orEmpty().filter { it.isNotBlank() } else emptyList()
        val facts = TrackFacts(
            bpm = t.optDouble("bpm", 0.0).toFloat(),
            gainDb = if (t.has("gain")) t.optDouble("gain").toFloat().takeIf { !it.isNaN() } else null,
            releaseDate = t.optString("release_date"),
            genres = genres
        )
        Log.d("Rave", "Deezer: ${t.optString("title")} bpm=${facts.bpm} gain=${facts.gainDb} sjanger=$genres")
        trackCache[key] = facts
        return facts
    }

    private fun enc(s: String) = URLEncoder.encode(s, "UTF-8")

    private fun get(url: String): JSONObject? = try {
        client.newCall(Request.Builder().url(url).build()).execute().use { r ->
            if (r.isSuccessful) JSONObject(r.body.string()).takeIf { !it.has("error") } else null
        }
    } catch (_: Exception) { null }
}

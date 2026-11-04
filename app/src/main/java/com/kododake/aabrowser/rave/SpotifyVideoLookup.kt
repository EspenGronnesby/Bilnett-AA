package com.kododake.aabrowser.rave

import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.net.URLEncoder
import java.util.Locale
import java.util.concurrent.TimeUnit

/** Spotify supplies the currently playing metadata; Apple catalog previews are visual only. */
internal object SpotifyVideoLookup {
    private val client = OkHttpClient.Builder().callTimeout(8, TimeUnit.SECONDS).build()
    private fun norm(s: String) = s.lowercase(Locale.ROOT).replace(Regex("[^\\p{L}\\p{N}]+"), " ").trim()

    enum class Source(val label: String) { SONG("Sang"), ALBUM("Album"), ARTIST("Artist"), VIBE("Vibe") }
    data class VideoClip(val url: String, val source: Source)

    /**
     * Ranked, de-duplicated video candidates: the song itself first, then the same album,
     * the same artist and finally videos with the same vibe (genre). [onUpdate] receives the
     * list after every step so the first video can start before the slower steps finish;
     * the lookup stops as soon as [isActive] turns false (the song changed).
     */
    fun findAll(
        title: String, artist: String, album: String,
        isActive: () -> Boolean = { true },
        onUpdate: (List<VideoClip>) -> Unit = {},
    ): List<VideoClip> {
        val out = LinkedHashMap<String, VideoClip>()
        val seenTracks = HashSet<String>()
        fun add(hits: List<JSONObject>, source: Source, max: Int = MAX) {
            val before = out.size
            for (h in hits) {
                if (out.size >= max) break
                val url = h.optString("previewUrl")
                // The same video can have different preview URLs in the NO and US stores.
                val track = norm(h.optString("artistName")) + "|" + norm(h.optString("trackName"))
                if (!valid(url) || url in out || !seenTracks.add(track)) continue
                out[url] = VideoClip(url, source)
            }
            if (out.size > before && isActive()) onUpdate(out.values.toList())
        }
        fun both(term: String) = if (isActive()) search(term, "no") + search(term, "us") else emptyList()

        val songHits = both("$artist $title")
        add(songHits.filter { norm(it.optString("trackName")) == norm(title) && sameArtist(it.optString("artistName"), artist) }, Source.SONG)

        // Spotify album names often carry "(Deluxe)" / "Remastered"; Apple's may not, or vice versa.
        val wantAlbum = norm(album.replace(Regex("\\s*[-–(\\[].*$"), ""))
        if (wantAlbum.isNotBlank()) {
            add(both("$artist $album").filter {
                val c = norm(it.optString("collectionName"))
                (c.startsWith(wantAlbum) || wantAlbum.startsWith(c)) && c.isNotBlank() && sameArtist(it.optString("artistName"), artist)
            }, Source.ALBUM)
        }

        add((songHits + both(artist)).filter { sameArtist(it.optString("artistName"), artist) }, Source.ARTIST)

        if (out.size < VIBE_WHEN_BELOW && isActive()) {
            val appleGenre = genreFor(title, artist)
            val wanted = genreFromApple(appleGenre)
            val vibe: List<JSONObject> = when {
                // Apple files hardstyle under "Dance"; searching known hardstyle artists works far better.
                wanted == Genre.HARDSTYLE -> HARDSTYLE_ARTISTS.shuffled().take(2).flatMap { name ->
                    search(name, "us").filter { norm(it.optString("artistName")).contains(norm(name)) }
                }
                wanted != null -> search(VIBE_TERMS.getValue(wanted), "us").filter { genreFromApple(it.optString("primaryGenreName")) == wanted }
                appleGenre != null -> search(appleGenre, "us").filter { it.optString("primaryGenreName").equals(appleGenre, ignoreCase = true) }
                else -> emptyList()
            }
            add(vibe.filterNot { sameArtist(it.optString("artistName"), artist) }.shuffled(), Source.VIBE, out.size + VIBE_COUNT)
        }
        return out.values.toList()
    }

    private val VIBE_TERMS = mapOf(Genre.RAP to "hip hop", Genre.ROCK to "rock", Genre.EDM to "edm", Genre.STANDARD to "pop")
    private val HARDSTYLE_ARTISTS = listOf("Brennan Heart", "Wildstylez", "Sub Zero Project", "Headhunterz", "Da Tweekaz", "D-Block & S-te-Fan")

    /** Apple Music's genre for the song (e.g. "Hip-Hop/Rap", "Rock", "Dance"), or null. */
    fun genreFor(title: String, artist: String): String? {
        // Spotify titles often carry extras ("- Remastered 2011", "(feat. X)") that Apple lacks.
        val clean = title.replace(Regex("\\s*[-–(\\[].*$"), "").trim().ifBlank { title }
        val mainArtist = artist.split(Regex("\\s*(?:,|&| feat\\.? | featuring )\\s*", RegexOption.IGNORE_CASE)).first()
        val hits = search("$mainArtist $clean", "no", "song") + search("$mainArtist $clean", "us", "song")
        val exact = hits.firstOrNull { norm(it.optString("trackName")).startsWith(norm(clean)) && sameArtist(it.optString("artistName"), artist) }
        val byArtist = hits.firstOrNull { sameArtist(it.optString("artistName"), artist) }
        (exact ?: byArtist)?.optString("primaryGenreName")?.takeIf { it.isNotBlank() }?.let { return it }
        // Last resort: the artist's own main genre.
        val artistHits = search(mainArtist, "no", "musicArtist") + search(mainArtist, "us", "musicArtist")
        return artistHits.firstOrNull { sameArtist(it.optString("artistName"), artist) }
            ?.optString("primaryGenreName")?.takeIf { it.isNotBlank() }
    }

    private fun sameArtist(candidate: String, artist: String): Boolean {
        val candidates = candidate.split(Regex("\\s*(?:,|&| feat\\.? | featuring )\\s*", RegexOption.IGNORE_CASE)).map(::norm)
        val wanted = artist.split(Regex("\\s*(?:,|&| feat\\.? | featuring )\\s*", RegexOption.IGNORE_CASE)).map(::norm)
        return wanted.any { it.isNotBlank() && it in candidates }
    }
    private const val MAX = 8
    private const val VIBE_WHEN_BELOW = 4
    private const val VIBE_COUNT = 5
    private fun valid(url: String) = url.startsWith("https://")

    private fun search(term: String, country: String, entity: String = "musicVideo"): List<JSONObject> {
        val encoded = URLEncoder.encode(term, "UTF-8")
        val req = Request.Builder().url("https://itunes.apple.com/search?term=$encoded&entity=$entity&limit=25&country=$country").build()
        return try {
            client.newCall(req).execute().use { response ->
                if (!response.isSuccessful) return emptyList()
                val arr = JSONObject(response.body.string()).optJSONArray("results") ?: return emptyList()
                (0 until arr.length()).map { arr.getJSONObject(it) }
            }
        } catch (_: Exception) { emptyList() }
    }
}

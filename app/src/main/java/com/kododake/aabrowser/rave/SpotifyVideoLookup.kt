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

    enum class Source(val label: String) { SONG("Sang"), ARTIST("Artist"), YOUTUBE("YouTube"), VIBE("Vibe") }
    enum class Kind { MP4, YOUTUBE }
    /** [url] is a preview URL for MP4 clips and a video id for YouTube ones. */
    data class VideoClip(val url: String, val source: Source, val kind: Kind = Kind.MP4)

    /**
     * At most one video per step, in this order: the song itself (Apple preview), another video
     * by the artist, the song's full music video on YouTube, and a video with the same vibe =
     * genre (festival footage on YouTube, else an Apple video in the same genre). [onUpdate] receives the list after every step so
     * the first video can start before the slower steps finish; the lookup stops as soon as
     * [isActive] turns false (the song changed).
     */
    fun findAll(
        title: String, artist: String,
        isActive: () -> Boolean = { true },
        onUpdate: (List<VideoClip>) -> Unit = {},
    ): List<VideoClip> {
        val out = LinkedHashMap<String, VideoClip>()
        val seenTracks = HashSet<String>()
        fun publish() { if (isActive()) onUpdate(out.values.toList()) }
        /** Adds the first usable Apple video; true when one was added. */
        fun addApple(hits: List<JSONObject>, source: Source): Boolean {
            for (h in hits) {
                val url = h.optString("previewUrl")
                // The same video can have different preview URLs in the NO and US stores.
                val track = norm(h.optString("artistName")) + "|" + norm(h.optString("trackName"))
                if (!valid(url) || url in out || track in seenTracks) continue
                seenTracks += track
                out[url] = VideoClip(url, source); publish(); return true
            }
            return false
        }
        fun addYouTube(hits: List<YouTubeLookup.Hit>, source: Source): Boolean {
            val h = hits.firstOrNull { it.id !in out } ?: return false
            out[h.id] = VideoClip(h.id, source, Kind.YOUTUBE); publish(); return true
        }
        fun both(term: String) = if (isActive()) search(term, "no") + search(term, "us") else emptyList()

        // 1. The song itself.
        val songHits = both("$artist $title")
        addApple(songHits.filter { norm(it.optString("trackName")) == norm(title) && sameArtist(it.optString("artistName"), artist) }, Source.SONG)

        // 2. Another video by the same artist.
        addApple((songHits + both(artist)).filter { sameArtist(it.optString("artistName"), artist) }, Source.ARTIST)

        // 3. The song's music video on YouTube.
        if (isActive()) addYouTube(YouTubeLookup.songFor(title, artist), Source.YOUTUBE)

        // 4. Same vibe: a video by a similar artist (Deezer), which matches the mood, not just the genre.
        if (isActive() && addYouTube(YouTubeLookup.vibeFor(artist, title), Source.VIBE) || !isActive()) {
            android.util.Log.d("RaveVideo", "findAll '$artist - $title' -> ${out.values.joinToString { it.source.label }}")
            return out.values.toList()
        }
        // Fallback when Deezer knows nothing: festival footage for the genre, else an Apple video in the genre.
        val appleGenre = genreFor(title, artist)
        val fromApple = genreFromApple(appleGenre)
        // Apple calls hardstyle "Dance"; for dance songs the artist's live footage (Defqon, Qlimax …) tells.
        val wanted = if (fromApple == Genre.EDM && YouTubeLookup.enabled && isActive() &&
            YouTubeLookup.looksHardstyle(YouTubeLookup.liveFor(artist))) Genre.HARDSTYLE else fromApple
        if (isActive() && !addYouTube(YouTubeLookup.festivalFor(wanted, appleGenre), Source.VIBE) && isActive()) {
            val vibe: List<JSONObject> = when {
                // Apple files hardstyle under "Dance"; searching known hardstyle artists works far better.
                wanted == Genre.HARDSTYLE -> HARDSTYLE_ARTISTS.shuffled().take(2).flatMap { name ->
                    search(name, "us").filter { norm(it.optString("artistName")).contains(norm(name)) }
                }
                wanted != null -> search(VIBE_TERMS.getValue(wanted), "us").filter { genreFromApple(it.optString("primaryGenreName")) == wanted }
                appleGenre != null -> search(appleGenre, "us").filter { it.optString("primaryGenreName").equals(appleGenre, ignoreCase = true) }
                else -> emptyList()
            }
            addApple(vibe.filterNot { sameArtist(it.optString("artistName"), artist) }.shuffled(), Source.VIBE)
        }
        android.util.Log.d("RaveVideo", "findAll '$artist - $title' -> ${out.values.joinToString { it.source.label }}")
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

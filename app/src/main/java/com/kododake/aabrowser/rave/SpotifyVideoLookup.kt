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

    enum class Source(val label: String) { SONG("Sang"), COVER("Cover"), ARTIST_ART("Artistbilde"), ALBUM("Album"), ARTIST("Artist"), YOUTUBE("YouTube"), VIBE("Vibe") }
    enum class Kind { MP4, YOUTUBE }
    /** [url] is a preview URL for MP4 clips and a video id for YouTube ones. */
    data class VideoClip(val url: String, val source: Source, val kind: Kind = Kind.MP4)

    /**
     * Ranked, de-duplicated videos. Apple first, as before: the song itself, the same album and
     * the same artist (up to [MAX]). YouTube comes on top of that, never instead of it: the
     * song's full music video and a video by a similar artist (Deezer). Apple genre videos fill
     * in when there are still few. [onUpdate] receives the list after every step so the first
     * video can start early; the lookup stops as soon as [isActive] turns false (song changed).
     */
    fun findAll(
        title: String, artist: String, album: String,
        isActive: () -> Boolean = { true },
        onUpdate: (List<VideoClip>) -> Unit = {},
    ): List<VideoClip> {
        val out = LinkedHashMap<String, VideoClip>()
        val seenTracks = HashSet<String>()
        fun publish() { if (isActive()) onUpdate(out.values.toList()) }
        fun appleCount() = out.values.count { it.kind == Kind.MP4 }
        /** Adds Apple videos until there are [max] Apple clips in the list. */
        fun add(hits: List<JSONObject>, source: Source, max: Int = MAX) {
            val before = out.size
            for (h in hits) {
                if (appleCount() >= max) break
                val url = h.optString("previewUrl")
                // The same video can have different preview URLs in the NO and US stores.
                val track = norm(h.optString("artistName")) + "|" + norm(h.optString("trackName"))
                if (!valid(url) || url in out || !seenTracks.add(track)) continue
                out[url] = VideoClip(url, source)
            }
            if (out.size > before) publish()
        }
        /** Adds one YouTube video (extra, not counted against the Apple limit). */
        fun addYouTube(hits: List<YouTubeLookup.Hit>, source: Source): Boolean {
            val h = hits.firstOrNull { it.id !in out } ?: return false
            out[h.id] = VideoClip(h.id, source, Kind.YOUTUBE); publish(); return true
        }
        fun both(term: String) = if (isActive()) search(term, "no") + search(term, "us") else emptyList()

        // Search with the main artist and the bare title: «BlocBoy JB, Drake» + «Look Alive (feat. Drake)»
        // finds little in Apple's store, «BlocBoy JB Look Alive» finds the video.
        val mainArtist = artist.split(Regex("\\s*(?:,|&| feat\\.? | featuring | x )\\s*", RegexOption.IGNORE_CASE)).first().trim().ifBlank { artist }
        // Cut « - Remastered» / «(feat. …)» / «[…]», but never a hyphen inside a word («E-Girls», «Hey-Ya»).
        val cleanTitle = title.replace(Regex("\\s+[-–]\\s+.*$|\\s*[(\\[].*$"), "").trim().ifBlank { title }

        fun titleMatches(name: String): Boolean {
            val t = norm(name)
            // Prefix match only when the title was actually shortened, and never on very short titles.
            return t == norm(title) || t == norm(cleanTitle) ||
                (cleanTitle != title && norm(cleanTitle).length >= 4 && t.startsWith(norm(cleanTitle) + " "))
        }
        /** Adds an Apple Music motion artwork stream (an .m3u8 loop). */
        fun addMotion(url: String?, source: Source) {
            if (url != null && valid(url) && url !in out && appleCount() < MAX) { out[url] = VideoClip(url, source); publish() }
        }

        // 0. The same picks as iBaila, first: the song's own music video from the artist's full video
        //    list (plain search often misses it), the animated album cover, the animated artist image.
        val songSearch = if (isActive()) search("$cleanTitle $mainArtist", "us", "song") else emptyList()
        val exactSong = songSearch.firstOrNull { titleMatches(it.optString("trackName")) && sameArtist(it.optString("artistName"), artist) }
        // Songs Apple lacks (e.g. Lil Peep «Star Shopping»): another song by the artist still gives the artist id.
        val songMeta = exactSong ?: songSearch.firstOrNull { sameArtist(it.optString("artistName"), artist) }
        val artistId = songMeta?.optLong("artistId")?.takeIf { it > 0 }
        // Album cover only from the song itself, never from another song's album (like iBaila).
        val collectionId = exactSong?.optLong("collectionId")?.takeIf { it > 0 }
        val artistVideos = if (artistId != null && isActive()) lookup(artistId, "musicVideo") else emptyList()
        add(artistVideos.filter { titleMatches(it.optString("trackName")) }, Source.SONG)
        if (collectionId != null && isActive()) addMotion(motionFrom("https://music.apple.com/us/album/$collectionId", ALBUM_MOTION_KEYS), Source.COVER)
        if (artistId != null && isActive()) addMotion(motionFrom("https://music.apple.com/us/artist/$artistId", ARTIST_MOTION_KEYS), Source.ARTIST_ART)

        // 1. The song itself (Apple search).
        val songHits = (both("$mainArtist $cleanTitle") + if (mainArtist != artist || cleanTitle != title) both("$artist $title") else emptyList())
        add(songHits.filter { titleMatches(it.optString("trackName")) && sameArtist(it.optString("artistName"), artist) }, Source.SONG)

        // 2. The same album. Spotify album names often carry "(Deluxe)" / "Remastered"; Apple's may not.
        val wantAlbum = norm(album.replace(Regex("\\s*[-–(\\[].*$"), ""))
        if (wantAlbum.isNotBlank() && isActive()) {
            add(both("$artist $album").filter {
                val c = norm(it.optString("collectionName"))
                (c.startsWith(wantAlbum) || wantAlbum.startsWith(c)) && c.isNotBlank() && sameArtist(it.optString("artistName"), artist)
            }, Source.ALBUM)
        }

        // 3. The same artist.
        add((artistVideos + songHits + both(mainArtist)).filter { sameArtist(it.optString("artistName"), artist) }, Source.ARTIST)

        // 4. Extra: the song's full music video on YouTube.
        if (YOUTUBE_ON && isActive()) addYouTube(YouTubeLookup.songFor(title, artist), Source.YOUTUBE)

        // 5. Extra: same vibe on YouTube – a video by a similar artist (Deezer); hardstyle gets festival footage.
        var vibeFromYouTube = YOUTUBE_ON && isActive() && addYouTube(YouTubeLookup.vibeFor(artist, title), Source.VIBE)

        // 6. Few videos so far: genre videos (YouTube festival footage, else Apple).
        if (appleCount() < VIBE_WHEN_BELOW && isActive()) {
            val appleGenre = genreFor(title, artist)
            val fromApple = genreFromApple(appleGenre)
            // Apple calls hardstyle "Dance"; for dance songs the artist's live footage (Defqon, Qlimax …) tells.
            val wanted = if (fromApple == Genre.EDM && YOUTUBE_ON && YouTubeLookup.enabled && isActive() &&
                YouTubeLookup.looksHardstyle(YouTubeLookup.liveFor(artist))) Genre.HARDSTYLE else fromApple
            if (YOUTUBE_ON && !vibeFromYouTube && isActive()) vibeFromYouTube = addYouTube(YouTubeLookup.festivalFor(wanted, appleGenre), Source.VIBE)
            val vibe: List<JSONObject> = when {
                // Apple files hardstyle under "Dance"; searching known hardstyle artists works far better.
                wanted == Genre.HARDSTYLE -> HARDSTYLE_ARTISTS.shuffled().take(2).flatMap { name ->
                    search(name, "us").filter { norm(it.optString("artistName")).contains(norm(name)) }
                }
                wanted != null -> search(VIBE_TERMS.getValue(wanted), "us").filter { genreFromApple(it.optString("primaryGenreName")) == wanted }
                appleGenre != null -> search(appleGenre, "us").filter { it.optString("primaryGenreName").equals(appleGenre, ignoreCase = true) }
                else -> emptyList()
            }
            if (isActive()) add(vibe.filterNot { sameArtist(it.optString("artistName"), artist) }.shuffled(), Source.VIBE, appleCount() + VIBE_COUNT)
        }
        android.util.Log.d("RaveVideo", "findAll '$artist - $title' -> ${out.values.joinToString { it.source.label + if (it.kind == Kind.YOUTUBE) "(YT)" else "" }}")
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
    /**
     * YouTube is switched off: the embedded player kept showing its own UI (spinner, titles) and
     * was unreliable. Set to true to bring back YouTube music videos and Deezer «vibe» videos.
     */
    private const val YOUTUBE_ON = false
    private const val MAX = 8
    private const val VIBE_WHEN_BELOW = 4
    private const val VIBE_COUNT = 5
    private fun valid(url: String) = url.startsWith("https://")

    // Apple Music web pages carry animated artwork as HLS loops; the first key found wins.
    // Square album motion and wide artist motion are cropped to fill the screen by SilentClipView.
    private val ALBUM_MOTION_KEYS = listOf("motionDetailSquare", "motionDetailTall")
    private val ARTIST_MOTION_KEYS = listOf("motionArtistWide16x9", "motionArtistFullscreen16x9", "motionArtistSquare1x1")
    private val M3U8 = Regex("https://mvod\\.itunes\\.apple\\.com[^\"\\\\]*\\.m3u8")

    /** The motion artwork stream on an Apple Music page, or null when it has none. */
    private fun motionFrom(pageUrl: String, keys: List<String>): String? = try {
        val req = Request.Builder().url(pageUrl).header("User-Agent", "Mozilla/5.0 (Macintosh)").build()
        client.newCall(req).execute().use { r ->
            if (!r.isSuccessful) return null
            val html = r.body.string()
            keys.firstNotNullOfOrNull { k ->
                val i = html.indexOf("\"$k\"")
                if (i < 0) null else M3U8.find(html.substring(i, minOf(html.length, i + 3000)))?.value
            }
        }
    } catch (_: Exception) { null }

    /** All items of [entity] for an Apple id (e.g. every music video by an artist). */
    private fun lookup(id: Long, entity: String): List<JSONObject> {
        val req = Request.Builder().url("https://itunes.apple.com/lookup?id=$id&entity=$entity&limit=100&country=us").build()
        return try {
            client.newCall(req).execute().use { response ->
                if (!response.isSuccessful) return emptyList()
                val arr = JSONObject(response.body.string()).optJSONArray("results") ?: return emptyList()
                (0 until arr.length()).map { arr.getJSONObject(it) }.filter { it.optString("wrapperType") != "artist" }
            }
        } catch (_: Exception) { emptyList() }
    }

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

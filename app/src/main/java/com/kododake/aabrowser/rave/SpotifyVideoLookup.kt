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
     * The videos for a song, best first: the song's own music video → animated album cover →
     * animated artist image → other videos from the album → other artist videos. Album and artist
     * videos are sorted by theme (same album, lyrics about the same things). Genre videos («Vibe»)
     * only when nothing else was found, so there is always at least one; no filling up to [MAX].
     * The viewer's favourite (watched longest) is put first by [RaveVideoCache.favouriteFirst].
     * [onUpdate] receives the list after every step so the first video can start early; the lookup
     * stops as soon as [isActive] turns false (the song changed).
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
            // A remix / live / acoustic version is not the song itself unless the playing title says so as often
            // («Live Forever (Live)» is not «Live Forever»).
            if (VERSION_WORDS.any { w -> count(t, w) > count(norm(title), w) }) return false
            // «X (Pt. 2)» is another song than «X»: part words and numbers must agree.
            if (numbers(name) != numbers(title)) return false
            // Extras like «(feat. Lil Tjay)» may be on either side: Apple «Mood Swings (feat. Lil Tjay)» = Spotify «Mood Swings».
            return t == norm(title) || t == norm(cleanTitle) || (bareTitle(name).isNotBlank() && bareTitle(name) == bareTitle(title)) ||
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

        // 1. The song itself (Apple search).
        val songHits = (both("$mainArtist $cleanTitle") + if (mainArtist != artist || cleanTitle != title) both("$artist $title") else emptyList())
        add(songHits.filter { titleMatches(it.optString("trackName")) && sameArtist(it.optString("artistName"), artist) }, Source.SONG)

        if (collectionId != null && isActive()) addMotion(motionFrom("https://music.apple.com/us/album/$collectionId", ALBUM_MOTION_KEYS), Source.COVER)

        // No video of the song itself: rank the artist videos by theme (same album, lyrics about the same
        // things – a girl, money, partying …) so the best fit is the first «Artist» clip, not a random one.
        val themeScores = if (out.values.none { it.source == Source.SONG } && isActive())
            themeScores(artistVideos.filter { !titleMatches(it.optString("trackName")) }, mainArtist, cleanTitle, collectionId, isActive)
            else emptyMap()

        if (artistId != null && isActive()) addMotion(motionFrom("https://music.apple.com/us/artist/$artistId", ARTIST_MOTION_KEYS), Source.ARTIST_ART)

        // 2. The same album. Spotify album names often carry "(Deluxe)" / "Remastered"; Apple's may not.
        val wantAlbum = norm(album.replace(Regex("\\s*[-–(\\[].*$"), ""))
        if (wantAlbum.isNotBlank() && isActive()) {
            add(both("$artist $album").filter {
                val c = norm(it.optString("collectionName"))
                (c.startsWith(wantAlbum) || wantAlbum.startsWith(c)) && c.isNotBlank() && sameArtist(it.optString("artistName"), artist) &&
                    !junkVideo(it.optString("trackName"))
            }.sortedByDescending { themeScores[it.optString("previewUrl")] ?: 0.0 }, Source.ALBUM)
        }

        // 3. The same artist.
        // Artist videos closest in theme first; interviews, trailers and visualizers last.
        val rankedArtistVideos = artistVideos.sortedWith(compareBy<JSONObject> { junkVideo(it.optString("trackName")) }
            .thenByDescending { themeScores[it.optString("previewUrl")] ?: 0.0 })
        add((rankedArtistVideos + songHits + both(mainArtist)).filter { sameArtist(it.optString("artistName"), artist) && !junkVideo(it.optString("trackName")) }, Source.ARTIST)

        // 4. Extra: the song's full music video on YouTube.
        if (YOUTUBE_ON && isActive()) addYouTube(YouTubeLookup.songFor(title, artist), Source.YOUTUBE)

        // 5. Extra: same vibe on YouTube – a video by a similar artist (Deezer); hardstyle gets festival footage.
        var vibeFromYouTube = YOUTUBE_ON && isActive() && addYouTube(YouTubeLookup.vibeFor(artist, title), Source.VIBE)

        // 6. Nothing found for the song, album or artist: genre videos, so there is always at least one
        //    video. No filling up otherwise – one good video is better than eight loose ones.
        if (out.isEmpty() && isActive()) {
            val appleGenre = genreFor(title, artist)
            val fromApple = genreFromApple(appleGenre)
            // Apple calls hardstyle "Dance"; for dance songs the artist's live footage (Defqon, Qlimax …) tells.
            val wanted = if (fromApple == Genre.EDM && YOUTUBE_ON && YouTubeLookup.enabled && isActive() &&
                YouTubeLookup.looksHardstyle(YouTubeLookup.liveFor(artist))) Genre.HARDSTYLE else fromApple
            if (YOUTUBE_ON && !vibeFromYouTube && isActive()) vibeFromYouTube = addYouTube(YouTubeLookup.festivalFor(wanted, appleGenre), Source.VIBE)
            // Same vibe: videos by artists Deezer calls similar (Supersci → Atmosphere, Brother Ali …),
            // then the genre. The vibe stash (VibeStash) is the last resort, in RaveActivity.
            if (isActive()) add(relatedVibe(artist, title, isActive), Source.VIBE, VIBE_COUNT)
            if (out.isEmpty() && isActive()) add(genreVideos(wanted, appleGenre).filterNot { sameArtist(it.optString("artistName"), artist) }.shuffled(), Source.VIBE, VIBE_COUNT)
        }
        android.util.Log.d("RaveVideo", "findAll '$artist - $title' -> ${out.values.joinToString { it.source.label + if (it.kind == Kind.YOUTUBE) "(YT)" else "" }}")
        return out.values.toList()
    }

    /** Apple music videos in a genre (hardstyle: known hardstyle artists, since Apple files it under "Dance"). */
    private fun genreVideos(wanted: Genre?, appleGenre: String?): List<JSONObject> = when {
        wanted == Genre.HARDSTYLE -> HARDSTYLE_ARTISTS.shuffled().take(2).flatMap { name ->
            search(name, "us").filter { norm(it.optString("artistName")).contains(norm(name)) }
        }
        wanted != null -> search(VIBE_TERMS.getValue(wanted), "us").filter { genreFromApple(it.optString("primaryGenreName")) == wanted }
        appleGenre != null -> search(appleGenre, "us").filter { it.optString("primaryGenreName").equals(appleGenre, ignoreCase = true) }
        else -> emptyList()
    }

    /**
     * Reserve videos with the same vibe when every clip of a song failed: similar artists first,
     * then the genre ([knownGenre] when Rave already has it). [exclude] = clips that already failed.
     */
    fun reserve(title: String, artist: String, exclude: Set<String>, count: Int, knownGenre: Genre? = null): List<VideoClip> {
        val related = relatedVibe(artist, title) { true }
        val appleGenre = if (related.size < count && knownGenre == null) genreFor(title, artist) else null
        val genre = if (related.size < count) genreVideos(knownGenre ?: genreFromApple(appleGenre), appleGenre).shuffled() else emptyList()
        return (related + genre).map { it.optString("previewUrl") }
            .filter { valid(it) && it !in exclude }.distinct().take(count)
            .map { VideoClip(it, Source.VIBE) }
    }

    /**
     * Same vibe: one music video each from the artists Deezer calls most similar (in Deezer's order).
     * Real vibe instead of «any hip hop video» (Supersci → Atmosphere, Brother Ali, CunninLynguists).
     */
    private fun relatedVibe(artist: String, title: String, isActive: () -> Boolean): List<JSONObject> {
        val out = ArrayList<JSONObject>()
        for (name in DeezerLookup.related(artist, title)) {
            if (!isActive() || out.size >= VIBE_COUNT + 2) break
            val id = search(name, "us", "musicArtist").firstOrNull { norm(it.optString("artistName")) == norm(name) }?.optLong("artistId") ?: continue
            lookup(id, "musicVideo").firstOrNull { valid(it.optString("previewUrl")) && !junkVideo(it.optString("trackName")) }?.let { out += it }
        }
        android.util.Log.d("RaveVideo", "vibe fra lignende artister: ${out.joinToString { it.optString("artistName").take(20) + " – " + it.optString("trackName").take(24) }}")
        return out
    }

    private val VIBE_TERMS = mapOf(Genre.RAP to "hip hop", Genre.ROCK to "rock", Genre.EDM to "edm", Genre.STANDARD to "pop", Genre.POP to "pop")
    private val HARDSTYLE_ARTISTS = listOf("Brennan Heart", "Wildstylez", "Sub Zero Project", "Headhunterz", "Da Tweekaz", "D-Block & S-te-Fan")

    /** Apple Music's genre for the song (e.g. "Hip-Hop/Rap", "Rock", "Dance"), or null. */
    fun genreFor(title: String, artist: String): String? = appleGenre(title, artist).first

    /**
     * Apple's genre and whether it came from this exact song (true) or only from another song /
     * the main genre of the same artist (false — a weaker hint).
     */
    fun appleGenre(title: String, artist: String): Pair<String?, Boolean> {
        // Spotify titles often carry extras ("- Remastered 2011", "(feat. X)") that Apple lacks.
        val clean = title.replace(Regex("\\s*[-–(\\[].*$"), "").trim().ifBlank { title }
        val mainArtist = artist.split(Regex("\\s*(?:,|&| feat\\.? | featuring )\\s*", RegexOption.IGNORE_CASE)).first()
        val hits = search("$mainArtist $clean", "no", "song") + search("$mainArtist $clean", "us", "song")
        val exact = hits.firstOrNull { norm(it.optString("trackName")).startsWith(norm(clean)) && sameArtist(it.optString("artistName"), artist) }
        val byArtist = hits.firstOrNull { sameArtist(it.optString("artistName"), artist) }
        exact?.optString("primaryGenreName")?.takeIf { it.isNotBlank() }?.let { return it to true }
        byArtist?.optString("primaryGenreName")?.takeIf { it.isNotBlank() }?.let { return it to false }
        // Last resort: the artist's own main genre.
        val artistHits = search(mainArtist, "no", "musicArtist") + search(mainArtist, "us", "musicArtist")
        return artistHits.firstOrNull { sameArtist(it.optString("artistName"), artist) }
            ?.optString("primaryGenreName")?.takeIf { it.isNotBlank() } to false
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
    /** Genre videos used only when nothing else was found (at least one video, a few to choose from). */
    private const val VIBE_COUNT = 3
    private fun valid(url: String) = url.startsWith("https://")

    // ---------- Theme: which artist video fits this song best ----------

    /** Lyrics are only a theme hint: short timeout so a slow LRCLIB never holds up the videos. */
    private val lyricsClient by lazy { client.newBuilder().callTimeout(4, TimeUnit.SECONDS).build() }
    private fun count(text: String, word: String) = Regex("(^| )${Regex.escape(word)}( |$)").findAll(text).count()
    private fun numbers(t: String): List<String> {
        // Featured artists («feat. 21 Savage», «with 50 Cent») do not count.
        val n = norm(t.replace(Regex("[(\\[]\\s*(feat|ft|with)\\b[^)\\]]*[)\\]]|\\s(feat|ft)\\.?\\s.*$", RegexOption.IGNORE_CASE), ""))
        return Regex("\\b(\\d+|pt|part|vol|ii|iii|iv)\\b").findAll(n).map { it.value.replace("part", "pt") }.toList()
    }
    private val VERSION_WORDS = listOf("remix", "live", "acoustic", "instrumental", "sped up", "slowed", "edit", "version")
    private const val THEME_CANDIDATES = 6
    private val JUNK_VIDEO = listOf("interview", "visualizer", "visualiser", "trailer", "behind the scenes",
        "documentary", "fire in the booth", "teaser", "making of", "commentary")
    private fun junkVideo(name: String): Boolean {
        val n = name.lowercase(Locale.ROOT)
        return JUNK_VIDEO.any { n.contains(it) } || Regex(" on [\"“]").containsMatchIn(n)
    }
    private fun bareTitle(t: String) = norm(t.replace(Regex("\\s+[-–]\\s+.*$|\\s*[(\\[].*$"), ""))

    // Common words that say nothing about the theme. Words like girl, baby, love, money stay in.
    private val STOP = ("the and you your that this with for but not are was were what when they them then just like got get " +
        "yeah yea uh oh ooh ayy huh hey know all can cause cuz don ain its i'm ima gon gonna wanna said say from out now how who " +
        "too off one see her him his she have has had she's he's it's that's there their what's where why will would could should " +
        "been being into onto than some any every each make made take let back come came going way still yes nah okay i'll you're we're " +
        "they're can't don't won't ain't i've you've me my mine our ours we us im dont cant wont thats youre").split(" ").toSet()

    private fun words(text: String?): Map<String, Int> =
        (text ?: "").lowercase(Locale.ROOT).split(Regex("[^\\p{L}']+"))
            .map { it.trim('\'') }.filter { it.length >= 3 && it !in STOP }
            .groupingBy { it }.eachCount()

    private fun cosine(a: Map<String, Int>, b: Map<String, Int>): Double {
        if (a.isEmpty() || b.isEmpty()) return 0.0
        val dot = a.entries.sumOf { (w, c) -> c.toDouble() * (b[w] ?: 0) }
        val na = kotlin.math.sqrt(a.values.sumOf { it.toDouble() * it }); val nb = kotlin.math.sqrt(b.values.sumOf { it.toDouble() * it })
        return if (na == 0.0 || nb == 0.0) 0.0 else dot / (na * nb)
    }

    /** Plain lyrics from LRCLIB, or null. */
    private fun lyricsFor(artist: String, title: String): String? = try {
        val url = "https://lrclib.net/api/search?track_name=${URLEncoder.encode(title, "UTF-8")}&artist_name=${URLEncoder.encode(artist, "UTF-8")}"
        lyricsClient.newCall(Request.Builder().url(url).header("User-Agent", "Bilnett Rave").build()).execute().use { r ->
            if (!r.isSuccessful) return null
            val arr = org.json.JSONArray(r.body.string())
            (0 until arr.length()).map { arr.getJSONObject(it) }
                .firstOrNull { !it.isNull("plainLyrics") && it.optString("plainLyrics").isNotBlank() }?.optString("plainLyrics")
        }
    } catch (_: Exception) { null }

    /**
     * Score 0..1 per artist video (by preview URL): +0.3 when the video's song is on the same album,
     * plus how alike the lyrics are (word overlap). Only the first few candidates are scored.
     */
    private fun themeScores(videos: List<JSONObject>, artist: String, title: String, collectionId: Long?, isActive: () -> Boolean): Map<String, Double> {
        val candidates = videos.filter { !junkVideo(it.optString("trackName")) && valid(it.optString("previewUrl")) }
            .distinctBy { bareTitle(it.optString("trackName")) }
        if (candidates.isEmpty()) return emptyMap()
        val albumTracks = if (collectionId != null) lookup(collectionId, "song").map { bareTitle(it.optString("trackName")) }.toSet() else emptySet()
        val inAlbum = candidates.filter { bareTitle(it.optString("trackName")) in albumTracks }
        val toScore = (inAlbum + candidates).distinctBy { it.optString("previewUrl") }.take(THEME_CANDIDATES)
        val mine = if (isActive()) words(lyricsFor(artist, title)) else emptyMap()
        val scores = toScore.associate { v ->
            val name = v.optString("trackName")
            val album = if (bareTitle(name) in albumTracks) 0.3 else 0.0
            // Song changed: stop fetching lyrics, the rest scores on album only.
            val text = if (mine.isEmpty() || !isActive()) 0.0 else cosine(mine, words(lyricsFor(artist, name.replace(Regex("\\s*[(\\[].*$"), ""))))
            v.optString("previewUrl") to album + text
        }
        android.util.Log.d("RaveVideo", "tema for '$title': " + toScore.joinToString { "${it.optString("trackName").take(28)}=${"%.2f".format(scores[it.optString("previewUrl")])}" })
        return scores
    }

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

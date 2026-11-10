package com.kododake.aabrowser.rave

import android.content.Context
import android.content.pm.PackageManager
import android.util.Log
import com.kododake.aabrowser.BuildConfig
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.net.URLEncoder
import java.security.MessageDigest
import java.util.Locale
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.TimeUnit

/**
 * Concert and festival footage from YouTube (laser shows, live sets): Apple has almost none.
 * Needs YOUTUBE_API_KEY in local.properties; without it every lookup returns an empty list.
 */
internal object YouTubeLookup {
    data class Hit(val id: String, val title: String, val channel: String = "")

    private val client = OkHttpClient.Builder().callTimeout(8, TimeUnit.SECONDS).build()
    private val key = BuildConfig.YOUTUBE_API_KEY
    // Search costs 100 of the 10 000 free daily units, so results are kept for the whole session.
    private val cache = ConcurrentHashMap<String, List<Hit>>()
    @Volatile private var pkg = ""
    @Volatile private var cert = ""

    val enabled get() = key.isNotBlank()

    /** The key is restricted to this Android app; Google checks these two values on each call. */
    fun init(context: Context) {
        if (pkg.isNotEmpty()) return
        pkg = context.packageName
        cert = try {
            val info = context.packageManager.getPackageInfo(pkg, PackageManager.GET_SIGNING_CERTIFICATES)
            val sig = info.signingInfo?.apkContentsSigners?.firstOrNull()?.toByteArray()
            sig?.let { MessageDigest.getInstance("SHA-1").digest(it).joinToString("") { b -> "%02X".format(b) } }.orEmpty()
        } catch (_: Exception) { "" }
    }

    private fun norm(s: String) = s.lowercase(Locale.ROOT).replace(Regex("[^\\p{L}\\p{N}]+"), " ").trim()

    // Whole words only ("live" must not match "Alive", "set" not "Sunset").
    private val LIVE_WORDS = listOf("live", "set", "festival", "concert", "tour", "aftermovie", "defqon 1", "defqon",
        "qlimax", "q dance", "reverze", "tomorrowland", "ultra music festival", "edc", "mainstage", "konsert", "full show")
    private val HARD_WORDS = listOf("defqon", "defqon 1", "qlimax", "q dance", "reverze", "hardstyle", "supremacy", "decibel outdoor")
    private fun hasWord(title: String, word: String) = " ${norm(title)} ".contains(" ${norm(word)} ")
    // Not a real music video: re-uploads, edits and talk.
    private val JUNK_WORDS = listOf("lyrics", "lyric", "reaction", "reacts", "slowed", "reverb", "sped up", "nightcore",
        "type beat", "cover", "karaoke", "full album", "album", "interview", "1 hour", "tutorial", "bass boosted",
        "8d", "visualizer", "visualiser", "audio", "legendado", "tradução", "traducida", "letra", "mix", "playlist")
    // «Artist - Topic» channels are YouTube's auto-uploads: just the album cover, no video.
    private fun junk(h: Hit, except: List<String> = emptyList()) =
        norm(h.channel).endsWith(" topic") || JUNK_WORDS.any { w -> w !in except && hasWord(h.title, w) }
    private fun byArtist(h: Hit, name: String) = hasWord(h.title, name) || norm(h.channel).startsWith(norm(name))
    private val HARDSTYLE_NAMES = listOf("Brennan Heart", "Wildstylez", "Sub Zero Project", "Headhunterz", "Da Tweekaz",
        "D-Block & S-te-Fan", "Coone", "Ran-D", "Frontliner", "Zatox", "D-Sturb", "Rebelion", "Phuture Noize", "Sefa",
        "Warface", "Radical Redemption", "Atmozfears", "Noisecontrollers", "Hard Driver", "Act of Rage", "Mandy",
        "Vertile", "Adrenalize", "B-Front", "Ecstatic", "Galactixx", "Audiotricz", "Psyko Punkz", "Devin Wild",
        "Max Enforcer", "Aftershock", "Rejecta", "Gunz for Hire", "Delete", "E-Force", "Sound Rush", "Demi Kanon")
        .map(::norm).toSet()

    /**
     * A video with the same mood: an official music video by an artist Deezer calls similar
     * (Scrim → $uicideboy$, Bones …). For hardstyle it is that artist live (Defqon, Qlimax: laser shows).
     */
    fun vibeFor(artist: String, title: String): List<Hit> {
        val related = DeezerLookup.related(artist, title)
        if (related.isEmpty()) return emptyList()
        val hard = norm(mainArtist(artist)) in HARDSTYLE_NAMES || related.count { norm(it) in HARDSTYLE_NAMES } >= 2
        // Rotate between the closest few so the same artist does not always give the same video.
        for (name in related.take(3).shuffled().take(2)) {
            val hits = if (hard)
                search("$name live").filter { byArtist(it, name) && LIVE_WORDS.any { w -> hasWord(it.title, w) } && !junk(it, listOf("mix")) }
            else
                search("$name official music video").filter { byArtist(it, name) && !junk(it) && !hasWord(it.title, "live") }
                    .sortedByDescending { hasWord(it.title, "official") }
            if (hits.isNotEmpty()) return hits.take(6).shuffled()
        }
        return emptyList()
    }
    @Volatile private var blockedUntil = 0L

    /** The song's own music video (full length, unlike Apple's 30 s previews). Official videos first. */
    fun songFor(title: String, artist: String): List<Hit> {
        val main = mainArtist(artist)
        val clean = title.replace(Regex("\\s*[-–(\\[].*$"), "").trim().ifBlank { title }
        if (main.isBlank() || clean.isBlank()) return emptyList()
        return search("$main $clean official video")
            .filter { (hasWord(it.title, main) || norm(it.channel).startsWith(norm(main))) && hasWord(it.title, clean) && !junk(it, listOf("lyrics", "lyric", "audio")) }
            // Official music video first, then lyric videos and audio uploads.
            .sortedWith(compareByDescending<Hit> { hasWord(it.title, "official") && !hasWord(it.title, "lyric") }
                .thenBy { hasWord(it.title, "lyric") || hasWord(it.title, "lyrics") || hasWord(it.title, "audio") })
    }

    private fun mainArtist(artist: String) =
        artist.split(Regex("\\s*(?:,|&| feat\\.? | featuring | x )\\s*", RegexOption.IGNORE_CASE)).first().trim()

    /** Live sets / concerts by this artist. */
    fun liveFor(artist: String): List<Hit> {
        val main = mainArtist(artist)
        if (main.isBlank()) return emptyList()
        return search("$main live").filter { h -> hasWord(h.title, main) && LIVE_WORDS.any { hasWord(h.title, it) } }
    }

    /** True when the artist's live footage is from hardstyle events (Apple files hardstyle as "Dance"). */
    fun looksHardstyle(live: List<Hit>) = live.count { h -> HARD_WORDS.any { hasWord(h.title, it) } } >= 2

    /** Festival / laser-show footage that matches the vibe of the genre. */
    fun festivalFor(genre: Genre?, appleGenre: String?): List<Hit> {
        val query = when (genre) {
            Genre.HARDSTYLE -> listOf("Defqon.1 live mainstage", "Qlimax live", "Q-dance hardstyle live laser show", "Reverze live").random()
            Genre.EDM -> listOf("Tomorrowland mainstage live", "Ultra Music Festival mainstage live", "EDC live mainstage").random()
            Genre.RAP -> listOf("Rolling Loud live performance", "hip hop festival live performance").random()
            Genre.ROCK -> listOf("Wacken live", "Download Festival live", "rock festival live concert").random()
            Genre.REGGAE -> listOf("Reggae Sumfest live", "Rototom Sunsplash live", "reggae festival live concert").random()
            Genre.REGGAETON -> listOf("Bad Bunny live concert", "Daddy Yankee live concert", "reggaeton festival live").random()
            else -> appleGenre?.takeIf { it.isNotBlank() }?.let { "$it live concert" } ?: "live concert festival"
        }
        return search(query).shuffled()
    }

    private fun search(query: String): List<Hit> {
        if (!enabled || System.currentTimeMillis() < blockedUntil) return emptyList()
        cache[query]?.let { return it }
        val q = URLEncoder.encode(query, "UTF-8")
        val req = Request.Builder()
            .url("https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true" +
                "&videoSyndicated=true&videoCategoryId=10&maxResults=15&safeSearch=moderate&q=$q&key=$key")
            .header("X-Android-Package", pkg)
            .header("X-Android-Cert", cert)
            .build()
        val hits = try {
            client.newCall(req).execute().use { r ->
                // 403 = daily quota used up (or key rejected): stop asking for an hour.
                if (r.code == 403) blockedUntil = System.currentTimeMillis() + 3_600_000
                if (!r.isSuccessful) { Log.w("RaveVideo", "YouTube search '$query' -> HTTP ${r.code}"); return emptyList() }
                val items = JSONObject(r.body.string()).optJSONArray("items") ?: return emptyList()
                (0 until items.length()).mapNotNull { i ->
                    val it = items.getJSONObject(i)
                    val id = it.optJSONObject("id")?.optString("videoId").orEmpty()
                    val snippet = it.optJSONObject("snippet")
                    val title = snippet?.optString("title").orEmpty()
                    val channel = snippet?.optString("channelTitle").orEmpty()
                    if (id.isBlank()) null
                    else Hit(id, android.text.Html.fromHtml(title, 0).toString(), android.text.Html.fromHtml(channel, 0).toString())
                }
            }
        } catch (e: Exception) { Log.w("RaveVideo", "YouTube search '$query' failed: ${e.javaClass.simpleName}"); return emptyList() }
        Log.d("RaveVideo", "YouTube '$query' -> ${hits.size}: ${hits.take(3).joinToString { it.title }}")
        cache[query] = hits
        return hits
    }
}

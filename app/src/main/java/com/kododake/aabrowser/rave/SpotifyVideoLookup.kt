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

    fun find(title: String, artist: String, album: String): String? {
        val primary = search("$artist $title", "no") + search("$artist $title", "us")
        primary.firstOrNull { norm(it.optString("trackName")) == norm(title) && sameArtist(it.optString("artistName"), artist) }
            ?.let { return it.optString("previewUrl").takeIf(::valid) }

        val albumHits = (search("$artist $album", "no") + search("$artist $album", "us"))
        albumHits.firstOrNull { norm(it.optString("collectionName")) == norm(album) && sameArtist(it.optString("artistName"), artist) }
            ?.let { it.optString("previewUrl").takeIf(::valid) }

        val artistHits = (search("$artist", "no") + search("$artist", "us"))
        return artistHits.firstOrNull { sameArtist(it.optString("artistName"), artist) }
            ?.optString("previewUrl")?.takeIf(::valid)
    }

    private fun sameArtist(candidate: String, artist: String): Boolean {
        val candidates = candidate.split(Regex("\\s*(?:,|&| feat\\.? | featuring )\\s*", RegexOption.IGNORE_CASE)).map(::norm)
        val wanted = artist.split(Regex("\\s*(?:,|&| feat\\.? | featuring )\\s*", RegexOption.IGNORE_CASE)).map(::norm)
        return wanted.any { it.isNotBlank() && it in candidates }
    }
    private fun valid(url: String) = url.startsWith("https://")

    private fun search(term: String, country: String): List<JSONObject> {
        val encoded = URLEncoder.encode(term, "UTF-8")
        val req = Request.Builder().url("https://itunes.apple.com/search?term=$encoded&entity=musicVideo&limit=25&country=$country").build()
        return try {
            client.newCall(req).execute().use { response ->
                if (!response.isSuccessful) return emptyList()
                val arr = JSONObject(response.body.string()).optJSONArray("results") ?: return emptyList()
                (0 until arr.length()).map { arr.getJSONObject(it) }
            }
        } catch (_: Exception) { emptyList() }
    }
}

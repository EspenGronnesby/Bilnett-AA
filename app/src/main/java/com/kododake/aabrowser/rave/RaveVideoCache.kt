package com.kododake.aabrowser.rave

import android.content.Context
import android.util.Log
import androidx.media3.common.util.UnstableApi
import androidx.media3.database.StandaloneDatabaseProvider
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.datasource.cache.CacheDataSource
import androidx.media3.datasource.cache.LeastRecentlyUsedCacheEvictor
import androidx.media3.datasource.cache.SimpleCache
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

/**
 * Keeps music videos on the phone so a song played before gets its video at once, even offline:
 * - the video files themselves (up to [MAX_BYTES], least recently played go first), and
 * - which videos each song has (so Apple is not searched again for 30 days).
 */
@UnstableApi
internal object RaveVideoCache {
    /** 1 GB ≈ 50–60 Apple music videos (16–20 MB each) or hundreds of animated covers. */
    private const val MAX_BYTES = 1L shl 30
    private const val LIST_MAX_AGE_MS = 30L * 24 * 60 * 60 * 1000
    /** A short list may come from a lookup where the network hiccupped: try again sooner. */
    private const val SHORT_LIST_MAX_AGE_MS = 3L * 24 * 60 * 60 * 1000
    private const val SHORT_LIST = 3
    /** Raise when the video picker changes, so stored lists are made again with the new rules. */
    private const val LIST_VERSION = 6
    private const val LIST_MAX_SONGS = 2000

    @Volatile private var cache: SimpleCache? = null

    private fun cache(ctx: Context): SimpleCache = cache ?: synchronized(this) {
        cache ?: SimpleCache(
            File(ctx.applicationContext.cacheDir, "rave-video"),
            LeastRecentlyUsedCacheEvictor(MAX_BYTES),
            StandaloneDatabaseProvider(ctx.applicationContext)
        ).also { cache = it }
    }

    /**
     * Reads from the phone when the clip is stored. [store] true: streams and stores it on the way
     * (only the song's own first-choice video); false: streams without storing (the other clips).
     */
    fun dataSource(ctx: Context, store: Boolean = true): CacheDataSource.Factory = CacheDataSource.Factory()
        .setCache(cache(ctx))
        .apply { if (!store) setCacheWriteDataSinkFactory(null) }
        .setUpstreamDataSourceFactory(
            DefaultHttpDataSource.Factory().setUserAgent("Mozilla/5.0").setAllowCrossProtocolRedirects(true)
        )
        .setFlags(CacheDataSource.FLAG_IGNORE_CACHE_ON_ERROR)

    fun warmUp(ctx: Context) {
        try { cache(ctx) } catch (e: Exception) { Log.d("RaveVideo", "videolager feilet: ${e.javaClass.simpleName}") }
        synchronized(this) { loadIndex(ctx) } // fills the favourite map, so the main thread never reads the file
    }

    // ---------- Which videos each song has ----------

    private var index: JSONObject? = null

    private fun indexFile(ctx: Context) = File(ctx.applicationContext.filesDir, "video-index.json")

    private fun loadIndex(ctx: Context): JSONObject = index ?: try {
        JSONObject(indexFile(ctx).readText())
    } catch (_: Exception) { JSONObject() }.also { idx ->
        index = idx
        idx.keys().forEach { k -> idx.optJSONObject(k)?.optJSONObject("watch")?.let { w -> favourite(w)?.let { favourites[k] = it } } }
    }

    /** Favourite clip per song, kept in memory so the main thread can ask without touching the disk. */
    private val favourites = java.util.concurrent.ConcurrentHashMap<String, String>()
    @Volatile private var lastWrite = 0L
    @Volatile private var dirty = false
    fun favouriteOf(key: String): String? = favourites[key]

    private fun writeIndex(ctx: Context, idx: JSONObject) {
        try {
            val tmp = File(indexFile(ctx).path + ".tmp")
            tmp.writeText(idx.toString())
            tmp.renameTo(indexFile(ctx))
            lastWrite = System.currentTimeMillis(); dirty = false
        } catch (e: Exception) { Log.d("RaveVideo", "kunne ikke lagre videoliste: ${e.javaClass.simpleName}") }
    }

    /** At least this much watching before a clip counts as the favourite of a song. */
    private const val FAVOURITE_MIN_MS = 15_000L

    /** Milliseconds watched per clip of a song (only while the video shows and the music plays). */
    @Synchronized
    fun addWatch(ctx: Context, key: String, url: String, ms: Long) {
        val idx = loadIndex(ctx)
        // The list may not be saved yet (first play, lookup still running): keep the time anyway.
        val e = idx.optJSONObject(key) ?: JSONObject().also { idx.put(key, it) }
        val watch = e.optJSONObject("watch") ?: JSONObject().also { e.put("watch", it) }
        val oldFavourite = favourite(watch)
        watch.put(url, watch.optLong(url) + ms)
        val newFavourite = favourite(watch)
        // One stored video per song: when a (new) favourite appears, every other clip of the song leaves the phone.
        if (newFavourite != null && newFavourite != oldFavourite) {
            Log.d("RaveVideo", "ny favoritt for '$key' (sett lengst)")
            favourites[key] = newFavourite
            val others = HashSet<String>()
            watch.keys().forEach { others += it }
            e.optJSONArray("clips")?.let { arr -> for (i in 0 until arr.length()) arr.optJSONObject(i)?.optString("url")?.let { others += it } }
            others.remove(newFavourite)
            others.forEach { forget(ctx, it) }
            writeIndex(ctx, idx)
            return
        }
        // Watch time alone is written at most once a minute (and when Rave goes to the background).
        dirty = true
        if (System.currentTimeMillis() - lastWrite > 60_000L) writeIndex(ctx, idx)
    }

    /** Writes pending watch time (call when Rave goes to the background). */
    @Synchronized
    fun flush(ctx: Context) { if (dirty) index?.let { writeIndex(ctx, it) } }

    private fun favourite(watch: JSONObject): String? =
        watch.keys().asSequence().maxByOrNull { watch.optLong(it) }?.takeIf { watch.optLong(it) >= FAVOURITE_MIN_MS }

    /** Puts the clip watched longest first (it is the one stored on the phone); otherwise unchanged. Fast (memory only). */
    fun favouriteFirst(key: String, clips: List<SpotifyVideoLookup.VideoClip>): List<SpotifyVideoLookup.VideoClip> {
        val fav = favourites[key] ?: return clips
        val i = clips.indexOfFirst { it.url == fav }
        return if (i <= 0) clips else listOf(clips[i]) + clips.filterIndexed { j, _ -> j != i }
    }

    private fun forget(ctx: Context, url: String) {
        try { cache(ctx).removeResource(url) } catch (_: Exception) { }
    }

    /** The stored video list for a song, or null when none or older than 30 days. */
    @Synchronized
    fun loadList(ctx: Context, key: String): List<SpotifyVideoLookup.VideoClip>? {
        val e = loadIndex(ctx).optJSONObject(key) ?: return null
        if (e.optInt("v") < LIST_VERSION) return null // made by an older picker: look up again once
        val arr = e.optJSONArray("clips") ?: return null
        val maxAge = if (arr.length() <= SHORT_LIST) SHORT_LIST_MAX_AGE_MS else LIST_MAX_AGE_MS
        if (System.currentTimeMillis() - e.optLong("at") > maxAge) return null
        val clips = (0 until arr.length()).mapNotNull { i ->
            val c = arr.optJSONObject(i) ?: return@mapNotNull null
            val source = SpotifyVideoLookup.Source.entries.firstOrNull { it.name == c.optString("source") } ?: return@mapNotNull null
            val kind = SpotifyVideoLookup.Kind.entries.firstOrNull { it.name == c.optString("kind") } ?: SpotifyVideoLookup.Kind.MP4
            SpotifyVideoLookup.VideoClip(c.optString("url"), source, kind)
        }.filter { it.url.isNotBlank() }
        return favouriteFirst(key, clips).ifEmpty { null }
    }

    /** Remembers a finished lookup. Empty results are not stored, so a later try can find videos. */
    @Synchronized
    fun saveList(ctx: Context, key: String, clips: List<SpotifyVideoLookup.VideoClip>) {
        if (clips.isEmpty()) return
        val idx = loadIndex(ctx)
        val arr = JSONArray()
        clips.forEach { arr.put(JSONObject().put("url", it.url).put("source", it.source.name).put("kind", it.kind.name)) }
        // Keep what has been watched when the list is made again (only for clips still in the list).
        val urls = clips.map { it.url }.toSet()
        val watch = idx.optJSONObject(key)?.optJSONObject("watch")?.let { w ->
            JSONObject().also { kept -> w.keys().forEach { u -> if (u in urls) kept.put(u, w.optLong(u)) } }
        }
        idx.put(key, JSONObject().put("v", LIST_VERSION).put("at", System.currentTimeMillis()).put("clips", arr)
            .apply { if (watch != null) put("watch", watch) })
        // Keep the newest songs only.
        if (idx.length() > LIST_MAX_SONGS) {
            idx.keys().asSequence().toList()
                .sortedBy { idx.optJSONObject(it)?.optLong("at") ?: 0L }
                .take(idx.length() - LIST_MAX_SONGS)
                .forEach { idx.remove(it) }
        }
        writeIndex(ctx, idx)
    }

    /** A clip that would not play is removed from the stored list too. */
    @Synchronized
    fun removeClip(ctx: Context, key: String, url: String) {
        val idx = loadIndex(ctx)
        val e = idx.optJSONObject(key) ?: return
        val arr = e.optJSONArray("clips") ?: return
        val kept = JSONArray()
        for (i in 0 until arr.length()) arr.optJSONObject(i)?.takeIf { it.optString("url") != url }?.let { kept.put(it) }
        if (kept.length() == 0) idx.remove(key) else e.put("clips", kept)
        writeIndex(ctx, idx)
    }
}

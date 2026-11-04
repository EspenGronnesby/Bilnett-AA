package com.kododake.aabrowser.rave

import android.content.Context
import android.net.Uri
import android.util.Log
import androidx.media3.common.util.UnstableApi
import androidx.media3.database.StandaloneDatabaseProvider
import androidx.media3.datasource.DataSpec
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.datasource.cache.CacheDataSource
import androidx.media3.datasource.cache.CacheWriter
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
    private const val LIST_MAX_SONGS = 2000
    private const val PRELOAD_BYTES = 3L * 1024 * 1024

    @Volatile private var cache: SimpleCache? = null

    private fun cache(ctx: Context): SimpleCache = cache ?: synchronized(this) {
        cache ?: SimpleCache(
            File(ctx.applicationContext.cacheDir, "rave-video"),
            LeastRecentlyUsedCacheEvictor(MAX_BYTES),
            StandaloneDatabaseProvider(ctx.applicationContext)
        ).also { cache = it }
    }

    /** Reads from the phone when the clip is stored, otherwise streams it and stores it on the way. */
    fun dataSource(ctx: Context): CacheDataSource.Factory = CacheDataSource.Factory()
        .setCache(cache(ctx))
        .setUpstreamDataSourceFactory(
            DefaultHttpDataSource.Factory().setUserAgent("Mozilla/5.0").setAllowCrossProtocolRedirects(true)
        )
        .setFlags(CacheDataSource.FLAG_IGNORE_CACHE_ON_ERROR)

    fun warmUp(ctx: Context) { try { cache(ctx) } catch (e: Exception) { Log.d("RaveVideo", "videolager feilet: ${e.javaClass.simpleName}") } }

    /** Fetches the start of a plain video file in the background, so «Neste» starts quickly too. */
    fun preload(ctx: Context, clip: SpotifyVideoLookup.VideoClip) {
        val url = clip.url
        // Only plain Apple video files; streams (.m3u8) are stored as they play.
        if (clip.kind != SpotifyVideoLookup.Kind.MP4 || !url.startsWith("https://") || url.endsWith(".m3u8")) return
        Thread {
            try {
                CacheWriter(dataSource(ctx).createDataSource(), DataSpec.Builder().setUri(Uri.parse(url)).setLength(PRELOAD_BYTES).build(), null, null).cache()
            } catch (e: Exception) { Log.d("RaveVideo", "forhåndslasting feilet: ${e.javaClass.simpleName}") }
        }.start()
    }

    // ---------- Which videos each song has ----------

    private var index: JSONObject? = null

    private fun indexFile(ctx: Context) = File(ctx.applicationContext.filesDir, "video-index.json")

    private fun loadIndex(ctx: Context): JSONObject = index ?: try {
        JSONObject(indexFile(ctx).readText())
    } catch (_: Exception) { JSONObject() }.also { index = it }

    private fun writeIndex(ctx: Context, idx: JSONObject) {
        try {
            val tmp = File(indexFile(ctx).path + ".tmp")
            tmp.writeText(idx.toString())
            tmp.renameTo(indexFile(ctx))
        } catch (e: Exception) { Log.d("RaveVideo", "kunne ikke lagre videoliste: ${e.javaClass.simpleName}") }
    }

    /** The stored video list for a song, or null when none or older than 30 days. */
    @Synchronized
    fun loadList(ctx: Context, key: String): List<SpotifyVideoLookup.VideoClip>? {
        val e = loadIndex(ctx).optJSONObject(key) ?: return null
        val arr = e.optJSONArray("clips") ?: return null
        val maxAge = if (arr.length() < SHORT_LIST) SHORT_LIST_MAX_AGE_MS else LIST_MAX_AGE_MS
        if (System.currentTimeMillis() - e.optLong("at") > maxAge) return null
        val clips = (0 until arr.length()).mapNotNull { i ->
            val c = arr.optJSONObject(i) ?: return@mapNotNull null
            val source = SpotifyVideoLookup.Source.entries.firstOrNull { it.name == c.optString("source") } ?: return@mapNotNull null
            val kind = SpotifyVideoLookup.Kind.entries.firstOrNull { it.name == c.optString("kind") } ?: SpotifyVideoLookup.Kind.MP4
            SpotifyVideoLookup.VideoClip(c.optString("url"), source, kind)
        }.filter { it.url.isNotBlank() }
        return clips.ifEmpty { null }
    }

    /** Remembers a finished lookup. Empty results are not stored, so a later try can find videos. */
    @Synchronized
    fun saveList(ctx: Context, key: String, clips: List<SpotifyVideoLookup.VideoClip>) {
        if (clips.isEmpty()) return
        val idx = loadIndex(ctx)
        val arr = JSONArray()
        clips.forEach { arr.put(JSONObject().put("url", it.url).put("source", it.source.name).put("kind", it.kind.name)) }
        idx.put(key, JSONObject().put("at", System.currentTimeMillis()).put("clips", arr))
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

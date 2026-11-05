package com.kododake.aabrowser.rave

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.util.Log
import androidx.media3.common.util.UnstableApi
import androidx.media3.database.StandaloneDatabaseProvider
import androidx.media3.datasource.DataSpec
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.datasource.cache.CacheDataSource
import androidx.media3.datasource.cache.CacheWriter
import androidx.media3.datasource.cache.NoOpCacheEvictor
import androidx.media3.datasource.cache.SimpleCache
import org.json.JSONObject
import java.io.File

/**
 * The vibe stash: two music videos per vibe (assets/vibe-lager.json), downloaded on Wi-Fi and never
 * cleared, so Rave always has a video that fits roughly – also with no signal in the car.
 */
@UnstableApi
internal object VibeStash {
    @Volatile private var cache: SimpleCache? = null
    @Volatile private var clips: Map<Genre, List<String>>? = null
    private val downloading = java.util.concurrent.atomic.AtomicBoolean(false)

    private fun cache(ctx: Context): SimpleCache = cache ?: synchronized(this) {
        cache ?: SimpleCache(
            File(ctx.applicationContext.filesDir, "vibe-lager"),
            NoOpCacheEvictor(), // never cleared: this is the last resort
            StandaloneDatabaseProvider(ctx.applicationContext)
        ).also { cache = it }
    }

    private fun clips(ctx: Context): Map<Genre, List<String>> = clips ?: try {
        val json = JSONObject(ctx.assets.open("vibe-lager.json").bufferedReader().use { it.readText() })
        Genre.entries.associateWith { g ->
            val arr = json.optJSONArray(g.name)
            if (arr == null) emptyList() else (0 until arr.length()).mapNotNull { arr.optJSONObject(it)?.optString("url")?.takeIf { u -> u.isNotBlank() } }
        }
    } catch (e: Exception) {
        Log.d("RaveVideo", "lager-lista feilet: ${e.javaClass.simpleName}"); emptyMap()
    }.also { clips = it }

    /** The stash videos for a vibe (unknown vibe: «Rolig»), in random order. */
    fun forGenre(ctx: Context, genre: Genre?): List<SpotifyVideoLookup.VideoClip> =
        (clips(ctx)[genre ?: Genre.STANDARD].orEmpty().ifEmpty { clips(ctx)[Genre.STANDARD].orEmpty() })
            .shuffled().map { SpotifyVideoLookup.VideoClip(it, SpotifyVideoLookup.Source.VIBE) }

    fun isStash(ctx: Context, url: String) = clips(ctx).values.any { url in it }

    /** Plays a stash video from the phone (downloads it if it is somehow missing). */
    fun dataSource(ctx: Context): CacheDataSource.Factory = CacheDataSource.Factory()
        .setCache(cache(ctx))
        .setUpstreamDataSourceFactory(DefaultHttpDataSource.Factory().setUserAgent("Mozilla/5.0").setAllowCrossProtocolRedirects(true))

    private fun onWifi(ctx: Context): Boolean {
        val cm = ctx.getSystemService(ConnectivityManager::class.java) ?: return false
        val caps = cm.getNetworkCapabilities(cm.activeNetwork) ?: return false
        // Real Wi-Fi only (an unlimited mobile plan is also «not metered», but this is ~200 MB).
        return caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) && caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    /** Downloads the stash in full, only on Wi-Fi. Missing videos are tried again next start. */
    fun downloadIfWifi(ctx: Context) {
        if (!downloading.compareAndSet(false, true)) return
        try {
            cache(ctx) // open the stash off the main thread
            val all = clips(ctx).values.flatten().distinct()
            // Videos taken out of the list are deleted, so the stash never grows past its own list.
            val c = cache(ctx)
            c.keys.filter { it !in all }.forEach { k ->
                try { c.removeResource(k); Log.d("RaveVideo", "lager: fjernet video som ikke lenger er i lista") } catch (_: Exception) { }
            }
            val missing = all.filter { !isComplete(ctx, it) }
            if (missing.isEmpty()) { Log.d("RaveVideo", "lager ferdig (${all.size} videoer)"); return }
            if (!onWifi(ctx)) { Log.d("RaveVideo", "lager venter på Wi-Fi (${missing.size} mangler)"); return }
            for (url in missing) {
                if (!onWifi(ctx)) break
                try {
                    CacheWriter(dataSource(ctx).createDataSource(), DataSpec(Uri.parse(url)), null, null).cache()
                } catch (e: Exception) { Log.d("RaveVideo", "lager-nedlasting feilet: ${e.javaClass.simpleName}") }
            }
            Log.d("RaveVideo", "lager ferdig: ${all.count { isComplete(ctx, it) }}/${all.size} videoer")
        } finally { downloading.set(false) }
    }

    private fun isComplete(ctx: Context, url: String): Boolean {
        val c = cache(ctx)
        val len = androidx.media3.datasource.cache.ContentMetadata.getContentLength(c.getContentMetadata(url))
        return len > 0 && c.isCached(url, 0, len)
    }
}

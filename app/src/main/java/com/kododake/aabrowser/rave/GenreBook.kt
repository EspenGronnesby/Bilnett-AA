package com.kododake.aabrowser.rave

import android.content.Context
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.util.Locale
import java.util.concurrent.Executors

/**
 * The genre list on the phone: every song played with Party on, what the app decided it was and
 * why (Apple, Deezer, the sound, or Espen). Shown in the analysis panel; tapping a song there sets
 * its genre by hand, which then applies from the first second the next time it plays.
 */
internal object GenreBook {
    internal data class Entry(
        val title: String, val artist: String,
        val apple: String, val deezer: String,
        /** What the song mostly got (label of [Genre]). */
        val genre: String,
        /** Why, e.g. "Apple: Hip-Hop/Rap", "lyd", "du". */
        val reason: String,
        val at: Long,
        /** Set by hand in the list; null = automatic. */
        val override: Genre? = null
    ) {
        val key: String get() = key(title, artist)
    }

    private const val MAX = 150
    private const val FILE = "genre-book.json"
    @Volatile private var entries: List<Entry>? = null
    /** One writer thread, so saves land in order. */
    private val writer = Executors.newSingleThreadExecutor()

    private fun norm(s: String) = s.lowercase(Locale.ROOT).replace(Regex("[^\\p{L}\\p{N}]+"), " ").trim()
    fun key(title: String, artist: String) = "${norm(artist)}|${norm(LyricsSource.cleanTitle(title))}"

    fun all(ctx: Context): List<Entry> = entries ?: synchronized(this) {
        entries ?: load(ctx).also { entries = it }
    }

    /** The genre Espen chose by hand for this song, or null. */
    fun overrideFor(ctx: Context, title: String, artist: String): Genre? {
        val k = key(title, artist)
        return all(ctx).firstOrNull { it.key == k }?.override
    }

    /** Adds or updates a song (newest first). A hand-set genre is kept. */
    fun record(ctx: Context, e: Entry) = synchronized(this) {
        val list = all(ctx)
        val old = list.firstOrNull { it.key == e.key }
        val merged = e.copy(override = old?.override,
            apple = e.apple.ifBlank { old?.apple.orEmpty() }, deezer = e.deezer.ifBlank { old?.deezer.orEmpty() })
        entries = (listOf(merged) + list.filterNot { it.key == e.key }).take(MAX)
        save(ctx)
    }

    /** Sets (or clears with null) the hand-picked genre for a song in the list. */
    fun setOverride(ctx: Context, key: String, g: Genre?) = synchronized(this) {
        entries = all(ctx).map { if (it.key == key) it.copy(override = g) else it }
        save(ctx)
    }

    private fun file(ctx: Context) = File(ctx.applicationContext.filesDir, FILE)

    private fun load(ctx: Context): List<Entry> = try {
        val f = file(ctx)
        if (!f.exists()) emptyList() else {
            val arr = JSONArray(f.readText())
            (0 until arr.length()).map { i ->
                val o = arr.getJSONObject(i)
                Entry(o.optString("title"), o.optString("artist"), o.optString("apple"), o.optString("deezer"),
                    o.optString("genre"), o.optString("reason"), o.optLong("at"),
                    o.optString("override").takeIf { it.isNotBlank() }?.let { n -> Genre.entries.firstOrNull { it.name == n } })
            }
        }
    } catch (e: Exception) { Log.d("RaveGenre", "sjangerliste kunne ikke leses: $e"); emptyList() }

    private fun save(ctx: Context) {
        val snapshot = entries.orEmpty()
        val f = file(ctx)
        // Off the UI thread; a small file (≤ 150 songs).
        writer.execute {
            try {
                val arr = JSONArray()
                snapshot.forEach { e ->
                    arr.put(JSONObject().put("title", e.title).put("artist", e.artist).put("apple", e.apple)
                        .put("deezer", e.deezer).put("genre", e.genre).put("reason", e.reason).put("at", e.at)
                        .put("override", e.override?.name ?: ""))
                }
                val tmp = File(f.parentFile, "$FILE.tmp")
                tmp.writeText(arr.toString())
                tmp.renameTo(f)
            } catch (e: Exception) { Log.d("RaveGenre", "sjangerliste kunne ikke lagres: $e") }
        }
    }
}

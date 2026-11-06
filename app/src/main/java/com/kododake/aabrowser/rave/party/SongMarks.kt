package com.kododake.aabrowser.rave.party

import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.util.Locale
import java.util.concurrent.Executors

/**
 * Espen's corrections of the song part («nå er det DROP» …), remembered per song so the next time
 * the song plays the analysis switches there by itself. Stored in `filesDir/song-marks.json`
 * (phone only). Read and changed on the main thread; saved on a background thread.
 */
internal class SongMarks(private val file: File) {
    data class Mark(val positionMs: Long, val part: String)

    private val io = Executors.newSingleThreadExecutor { r -> Thread(r, "song-marks").apply { isDaemon = true } }
    private val songs = LinkedHashMap<String, MutableList<Mark>>()
    private var loaded = false

    fun key(artist: String, title: String) = "${artist.trim().lowercase(Locale.ROOT)}|${title.trim().lowercase(Locale.ROOT)}"

    fun marks(key: String): List<Mark> { load(); return songs[key].orEmpty() }

    /** Adds a correction; any mark within ±4 s is replaced (the newest correction wins). */
    fun add(key: String, positionMs: Long, part: String) {
        if (positionMs < 0L || key.length < 3) return
        load()
        val list = songs.getOrPut(key) { mutableListOf() }
        list.removeAll { kotlin.math.abs(it.positionMs - positionMs) < SAME_MARK_MS }
        list.add(Mark(positionMs, part))
        list.sortBy { it.positionMs }
        // Most recently corrected songs last; keep the newest MAX_SONGS.
        songs.remove(key); songs[key] = list
        while (songs.size > MAX_SONGS) songs.remove(songs.keys.first())
        save()
    }

    fun clear() { load(); songs.clear(); save() }

    private fun load() {
        if (loaded) return
        loaded = true
        try {
            if (!file.exists()) return
            val root = JSONObject(file.readText())
            for (k in root.keys()) {
                val arr = root.getJSONArray(k)
                songs[k] = MutableList(arr.length()) { i ->
                    val o = arr.getJSONObject(i); Mark(o.getLong("t"), o.getString("p"))
                }
            }
        } catch (_: Exception) { songs.clear() }
    }

    private fun save() {
        val root = JSONObject()
        for ((k, list) in songs) root.put(k, JSONArray().apply {
            list.forEach { put(JSONObject().put("t", it.positionMs).put("p", it.part)) }
        })
        val text = root.toString()
        io.execute { try { file.writeText(text) } catch (_: Exception) { } }
    }

    private companion object {
        const val SAME_MARK_MS = 4_000L
        const val MAX_SONGS = 400
    }
}

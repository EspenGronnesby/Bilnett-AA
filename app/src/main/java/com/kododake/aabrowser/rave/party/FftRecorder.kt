package com.kododake.aabrowser.rave.party

import android.util.Log
import java.io.BufferedOutputStream
import java.io.DataOutputStream
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.zip.GZIPOutputStream

/**
 * Records the raw FFT frames Party mode analyses (gzip, one file per song), so the analysis can be
 * replayed on the Mac and tuned against Espen's feedback marks (`feedback.csv`) without guessing.
 *
 * Format (all big-endian, inside gzip):
 *   header: UTF "BNFFT1", UTF "artist – title"
 *   frame:  long uptimeMs, long songPositionMs, int sampleRateHz, short size, size bytes (Android FFT layout)
 *
 * Lives only on the phone (`filesDir/rave-analyse/fft/`), never in the repo. ~1–2 MB per song.
 * [record] is called from the Visualizer/microphone thread, the rest from the main thread.
 */
internal class FftRecorder(private val dir: File) {
    private var out: DataOutputStream? = null
    private var pendingTitle = ""
    private var pendingArtist = ""
    private var openTitle = ""
    private var openArtist = ""

    @Synchronized fun startSong(title: String, artist: String) {
        endSong()
        pendingTitle = title; pendingArtist = artist
    }

    @Synchronized fun record(fft: ByteArray, sampleRateHz: Int, nowMs: Long, positionMs: Long) {
        var o = out
        if (o == null) {
            if (pendingTitle.isBlank()) return
            o = open() ?: return
        }
        try {
            o.writeLong(nowMs); o.writeLong(positionMs); o.writeInt(sampleRateHz)
            o.writeShort(fft.size); o.write(fft)
        } catch (e: Exception) {
            Log.w("RaveGenre", "FFT-opptak stoppet", e)
            close()
        }
    }

    /** Song ended or app went to the background; the same song continues in a new file. */
    @Synchronized fun endSong() {
        if (out != null) { close(); pendingTitle = openTitle; pendingArtist = openArtist }
    }

    private fun open(): DataOutputStream? = try {
        dir.mkdirs()
        prune()
        val stamp = SimpleDateFormat("yyyyMMdd-HHmmss", Locale.US).format(Date())
        val safe = "$pendingArtist-$pendingTitle".lowercase(Locale.ROOT).replace(Regex("[^a-z0-9æøå]+"), "_").trim('_').take(60)
        val o = DataOutputStream(GZIPOutputStream(BufferedOutputStream(FileOutputStream(File(dir, "$stamp-$safe.fft.gz")), 64 * 1024)))
        o.writeUTF("BNFFT1"); o.writeUTF("$pendingArtist – $pendingTitle")
        openTitle = pendingTitle; openArtist = pendingArtist
        pendingTitle = ""; pendingArtist = ""
        out = o
        o
    } catch (e: Exception) {
        Log.w("RaveGenre", "kan ikke starte FFT-opptak", e)
        pendingTitle = ""; null
    }

    private fun close() {
        try { out?.close() } catch (_: Exception) { }
        out = null
    }

    private fun prune() {
        val files = dir.listFiles { f -> f.name.endsWith(".fft.gz") } ?: return
        if (files.size < MAX_FILES) return
        files.sortedBy { it.name }.take(files.size - MAX_FILES + 1).forEach { it.delete() }
    }

    private companion object { const val MAX_FILES = 200 }
}

package com.kododake.aabrowser.rave

import android.content.Context
import android.media.AudioDeviceInfo
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioRecord
import android.media.MediaRecorder
import android.util.Log
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.exp
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.roundToInt
import kotlin.math.sin

/**
 * Backup sound source for Party: the phone's microphone.
 *
 * With Android Auto over USB the music is sent digitally to the car through Android Auto's own
 * route, so Android's Visualizer (which listens to the phone's own output) only hears silence.
 * In the car the music is loud, so the microphone hears it fine. This records the mic, runs an
 * FFT and delivers it in the exact same byte format as Visualizer.getFft(), so the rest of the
 * analysis doesn't need to know where the sound came from.
 */
internal class MicFftSource(
    private val context: Context,
    private val size: Int,
    private val onFft: (fft: ByteArray, sampleRateHz: Int) -> Unit
) {
    @Volatile private var running = false
    private var thread: Thread? = null

    val isRunning: Boolean get() = running
    /** Name of the microphone in use, e.g. "bilens mikrofon (USB)" or "telefonens mikrofon". */
    @Volatile var deviceName: String = "telefonens mikrofon"
        private set

    /**
     * Prefer an external microphone — the car's (via the Android Auto / USB connection, or a
     * Bluetooth hands-free link) — over the phone's own. All inputs are logged so we can see in
     * the car what the phone is offered.
     */
    private fun preferredInput(): AudioDeviceInfo? {
        val am = context.getSystemService(AudioManager::class.java) ?: return null
        val inputs = am.getDevices(AudioManager.GET_DEVICES_INPUTS)
        for (d in inputs) Log.d("RaveGenre", "mikrofon funnet: type=${d.type} navn=${d.productName} id=${d.id}")
        val external = listOf(
            AudioDeviceInfo.TYPE_USB_DEVICE, AudioDeviceInfo.TYPE_USB_ACCESSORY, AudioDeviceInfo.TYPE_USB_HEADSET,
            AudioDeviceInfo.TYPE_BUS, AudioDeviceInfo.TYPE_BLUETOOTH_SCO, AudioDeviceInfo.TYPE_BLE_HEADSET
        )
        return external.firstNotNullOfOrNull { t -> inputs.firstOrNull { it.type == t } }
    }

    /** Returns false if the microphone can't be opened. */
    fun start(): Boolean {
        if (running) return true
        val rate = 44_100
        val minBuf = AudioRecord.getMinBufferSize(rate, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT)
        if (minBuf <= 0) return false
        val rec = try {
            // UNPROCESSED = no automatic gain/noise suppression, so drops stay louder than build-ups.
            AudioRecord(MediaRecorder.AudioSource.UNPROCESSED, rate, AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT, max(minBuf, size * 4)).takeIf { it.state == AudioRecord.STATE_INITIALIZED }
                ?: AudioRecord(MediaRecorder.AudioSource.MIC, rate, AudioFormat.CHANNEL_IN_MONO,
                    AudioFormat.ENCODING_PCM_16BIT, max(minBuf, size * 4))
        } catch (_: SecurityException) { return false } catch (_: Exception) { return false }
        if (rec.state != AudioRecord.STATE_INITIALIZED) { rec.release(); return false }
        val car = preferredInput()
        if (car != null && rec.setPreferredDevice(car)) {
            deviceName = "bilens mikrofon (${car.productName})"
        }
        Log.d("RaveGenre", "Party lytter via: $deviceName")
        running = true
        thread = Thread({ loop(rec, rate) }, "rave-mic").apply { isDaemon = true; start() }
        return true
    }

    fun stop() {
        running = false
        thread?.join(500)
        thread = null
    }

    private fun loop(rec: AudioRecord, rate: Int) {
        val hop = size / 2                     // 50 % overlap → ~43 frames per second at 2048
        val window = FloatArray(size) { (0.5f - 0.5f * cos(2.0 * PI * it / (size - 1))).toFloat() }
        val ring = FloatArray(size)
        val chunk = ShortArray(hop)
        val re = FloatArray(size)
        val im = FloatArray(size)
        val out = ByteArray(size)
        var peak = 1f
        try {
            rec.startRecording()
            while (running) {
                var read = 0
                while (read < hop && running) {
                    val n = rec.read(chunk, read, hop - read)
                    if (n <= 0) break
                    read += n
                }
                if (!running || read < hop) continue
                System.arraycopy(ring, hop, ring, 0, size - hop)
                for (i in 0 until hop) ring[size - hop + i] = chunk[i] / 32768f
                for (i in 0 until size) { re[i] = ring[i] * window[i]; im[i] = 0f }
                fft(re, im)
                // Slow auto-gain (peak falls over ~30 s) keeps values in Visualizer's byte range
                // without flattening the difference between a build-up and a drop.
                var frameMax = 0f
                for (k in 1 until size / 2) frameMax = max(frameMax, hypot(re[k], im[k]))
                peak = max(frameMax, max(1e-3f, peak * exp(-(hop.toFloat() / rate) / 30f)))
                val scale = 100f / peak
                fun b(v: Float): Byte = (v * scale).roundToInt().coerceIn(-128, 127).toByte()
                out[0] = b(re[0]); out[1] = b(re[size / 2])
                for (k in 1 until size / 2) { out[2 * k] = b(re[k]); out[2 * k + 1] = b(im[k]) }
                onFft(out.copyOf(), rate)
            }
        } catch (_: Exception) {
        } finally {
            try { rec.stop() } catch (_: Exception) { }
            rec.release()
            running = false
        }
    }

    /** In-place iterative radix-2 FFT (size must be a power of two). */
    private fun fft(re: FloatArray, im: FloatArray) {
        val n = re.size
        var j = 0
        for (i in 1 until n) {
            var bit = n shr 1
            while (j and bit != 0) { j = j xor bit; bit = bit shr 1 }
            j = j xor bit
            if (i < j) { var t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t }
        }
        var len = 2
        while (len <= n) {
            val ang = -2.0 * PI / len
            val wr = cos(ang).toFloat(); val wi = sin(ang).toFloat()
            var i = 0
            while (i < n) {
                var cr = 1f; var ci = 0f
                for (k in 0 until len / 2) {
                    val ar = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci
                    val ai = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr
                    re[i + k + len / 2] = re[i + k] - ar; im[i + k + len / 2] = im[i + k] - ai
                    re[i + k] += ar; im[i + k] += ai
                    val ncr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = ncr
                }
                i += len
            }
            len = len shl 1
        }
    }
}

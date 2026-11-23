package com.kododake.aabrowser.rave

import android.content.Context
import android.media.AudioDeviceInfo
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioRecord
import android.media.MediaRecorder
import android.util.Log
import kotlin.math.max

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
     * The sound comes through a microphone that cuts the bass: the car's own microphone, or the MIC
     * fallback (with the phone's processing). Recordings from such a microphone (6 Nov) had mid/bass
     * .4–.8 on hardstyle, the phone's UNPROCESSED microphone .05–.3, so the grit numbers differ
     * ([HardstyleAudio.setBassCutInput]). Not measured on every car microphone: an educated guess.
     */
    @Volatile var bassCut: Boolean = false
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
        var fallback = false
        val rec = try {
            // UNPROCESSED = no automatic gain/noise suppression, so drops stay louder than build-ups.
            AudioRecord(MediaRecorder.AudioSource.UNPROCESSED, rate, AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT, max(minBuf, size * 4)).takeIf { it.state == AudioRecord.STATE_INITIALIZED }
                ?: AudioRecord(MediaRecorder.AudioSource.MIC, rate, AudioFormat.CHANNEL_IN_MONO,
                    AudioFormat.ENCODING_PCM_16BIT, max(minBuf, size * 4)).also { fallback = true }
        } catch (_: SecurityException) { return false } catch (_: Exception) { return false }
        if (rec.state != AudioRecord.STATE_INITIALIZED) { rec.release(); return false }
        val car = preferredInput()
        val carMic = car != null && rec.setPreferredDevice(car)
        if (carMic) deviceName = "bilens mikrofon (${car!!.productName})"
        bassCut = fallback || carMic
        Log.d("RaveGenre", "Party lytter via: $deviceName${if (bassCut) " (kutter bass: gamle grit-tall for effektene)" else ""}")
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
        // The FFT itself is shared with the Rave website (rave-core PcmFft), byte for byte as before.
        val fft = PcmFft(size)
        val hop = fft.hop
        val chunk = ShortArray(hop)
        val samples = FloatArray(hop)
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
                for (i in 0 until hop) samples[i] = chunk[i] / 32768f
                onFft(fft.push(samples, rate), rate)
            }
        } catch (_: Exception) {
        } finally {
            try { rec.stop() } catch (_: Exception) { }
            rec.release()
            running = false
        }
    }
}

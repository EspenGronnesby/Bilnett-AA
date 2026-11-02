package com.kododake.aabrowser.rave

import android.Manifest
import android.content.ComponentName
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.location.LocationListener
import android.location.LocationManager
import android.media.MediaMetadata
import android.media.audiofx.Visualizer
import android.media.session.MediaController
import android.media.session.MediaSessionManager
import android.media.session.PlaybackState
import android.os.Bundle
import android.os.Looper
import android.os.SystemClock
import android.view.WindowInsets
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.MusicNote
import androidx.compose.material.icons.rounded.Pause
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.SkipNext
import androidx.compose.material.icons.rounded.SkipPrevious
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameNanos
import kotlinx.coroutines.delay
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInRoot
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import com.kododake.aabrowser.R
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.sin

/**
 * Rave: viser sangen som spilles i fullskjerm, med farger fra coveret som pulserer i takt med musikken.
 * Svartner når bilen kjører.
 */
class RaveActivity : ComponentActivity() {

    private var title by mutableStateOf("")
    private var artist by mutableStateOf("")
    private var art by mutableStateOf<Bitmap?>(null)
    private var colors by mutableStateOf(DEFAULT_COLORS)
    private var playing by mutableStateOf(false)
    private var level by mutableFloatStateOf(0f)
    private var beat by mutableFloatStateOf(0f)
    private var hardstyleOn by mutableStateOf(false)
    private var hardstyleFrame by mutableStateOf(HardstyleFrame())
    private val hardstyleAudio = HardstyleAudio()
    private var hardstyleAudioAt = 0L
    private var trackIdentity = ""
    private var controls by mutableStateOf(RaveControls())
    private fun buttonInteraction() { controls = controls.button(SystemClock.elapsedRealtime()) }
    private fun setHardstyle() {
        hardstyleOn = !hardstyleOn
        hardstyleAudio.reset()
        hardstyleFrame = HardstyleFrame()
        visualizer?.let { try { it.enabled = false; it.release() } catch (_: Exception) {} }
        visualizer = null
        startVisualizer()
    }
    private var reactive by mutableStateOf(false)
    private var hasAccess by mutableStateOf(true)
    private var driving by mutableStateOf(false)

    // Sangtekst
    private var showLyrics by mutableStateOf(false)
    private var lyrics by mutableStateOf<List<Pair<Long, String>>>(emptyList())
    private var plainLyrics by mutableStateOf<String?>(null)
    private var lyricsState by mutableStateOf("")
    private var pos by mutableLongStateOf(0L)
    private var lastState: PlaybackState? = null
    private var lyricsKey = ""

    // Musikkvideo
    private var videoId by mutableStateOf<String?>(null)
    private var videoOn by mutableStateOf(true)
    private var videoPlaying by mutableStateOf(false)
    private var videoKey = ""
    private var foreground by mutableStateOf(false)

    private var msm: MediaSessionManager? = null
    private var controller: MediaController? = null
    private var visualizer: Visualizer? = null
    private var locationManager: LocationManager? = null

    private var maxEnergy = 1f
    private var avgEnergy = 0f
    private var lastBeatAt = 0L

    private val listenerComponent by lazy { ComponentName(this, NowPlayingListener::class.java) }

    private val sessionsListener = MediaSessionManager.OnActiveSessionsChangedListener { list ->
        pickController(list ?: emptyList())
    }

    private val mediaCallback = object : MediaController.Callback() {
        override fun onMetadataChanged(metadata: MediaMetadata?) = updateMeta(metadata)
        override fun onPlaybackStateChanged(state: PlaybackState?) {
            lastState = state
            playing = state?.state == PlaybackState.STATE_PLAYING
        }
        override fun onSessionDestroyed() {
            pickController(safeSessions())
        }
    }

    private val locationListener = LocationListener { loc ->
        if (loc.hasSpeed()) {
            driving = if (driving) loc.speed > 1.0f else loc.speed > 2.5f
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { RaveScreen() }
    }

    override fun onResume() {
        super.onResume()
        try { window.insetsController?.hide(WindowInsets.Type.systemBars()) } catch (_: Exception) { }
    }

    override fun onStart() {
        super.onStart()
        hardstyleAudio.reset()
        hardstyleFrame = HardstyleFrame()
        startSessions()
        startVisualizer()
        startSpeedGate()
        foreground = true
    }

    override fun onStop() {
        super.onStop()
        foreground = false
        videoPlaying = false
        videoKey = ""
        videoId = null
        try { msm?.removeOnActiveSessionsChangedListener(sessionsListener) } catch (_: Exception) { }
        controller?.unregisterCallback(mediaCallback)
        controller = null
        visualizer?.let { try { it.enabled = false; it.release() } catch (_: Exception) { } }
        visualizer = null
        reactive = false
        try { locationManager?.removeUpdates(locationListener) } catch (_: Exception) { }
    }

    private fun safeSessions(): List<MediaController> =
        try { msm?.getActiveSessions(listenerComponent) ?: emptyList() } catch (_: SecurityException) { emptyList() }

    private fun startSessions() {
        try {
            val m = getSystemService(MediaSessionManager::class.java)
            msm = m
            m.addOnActiveSessionsChangedListener(sessionsListener, listenerComponent)
            hasAccess = true
            pickController(m.getActiveSessions(listenerComponent))
        } catch (_: SecurityException) {
            hasAccess = false
        }
    }

    private fun pickController(list: List<MediaController>) {
        // Spotify først, uansett om den spiller eller er på pause
        val next = list.firstOrNull { it.packageName == SPOTIFY }

        if (next != null && next.sessionToken == controller?.sessionToken) return
        controller?.unregisterCallback(mediaCallback)
        controller = next
        if (next == null) {
            title = ""; artist = ""; art = null; colors = DEFAULT_COLORS; playing = false
            lastState = null
            lyricsKey = ""; lyrics = emptyList(); plainLyrics = null; lyricsState = ""
            videoKey = ""; videoId = null; videoPlaying = false
            return
        }
        next.registerCallback(mediaCallback)
        updateMeta(next.metadata)
        lastState = next.playbackState
        playing = next.playbackState?.state == PlaybackState.STATE_PLAYING
    }

    private fun updateMeta(m: MediaMetadata?) {
        val identity = "${m?.getString(MediaMetadata.METADATA_KEY_MEDIA_ID)}|${m?.getString(MediaMetadata.METADATA_KEY_TITLE)}|${m?.getString(MediaMetadata.METADATA_KEY_ARTIST)}"
        if (identity != trackIdentity) {
            trackIdentity = identity
            hardstyleAudio.reset()
            hardstyleFrame = HardstyleFrame()
        }
        title = m?.getString(MediaMetadata.METADATA_KEY_TITLE).orEmpty()
        artist = m?.getString(MediaMetadata.METADATA_KEY_ARTIST)
            ?: m?.getString(MediaMetadata.METADATA_KEY_ALBUM_ARTIST).orEmpty()
        val bmp = m?.getBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART)
            ?: m?.getBitmap(MediaMetadata.METADATA_KEY_ART)
            ?: m?.getBitmap(MediaMetadata.METADATA_KEY_DISPLAY_ICON)
        art = bmp
        colors = extractColors(bmp)
        fetchLyrics(m)
        fetchSpotifyVideo(title, artist, m?.getString(MediaMetadata.METADATA_KEY_ALBUM).orEmpty())
    }

    // Spotify remains the sole audio source; lookup returns a silent visual companion.
    private fun fetchSpotifyVideo(track: String, artistName: String, album: String) {
        val key = "$artistName|$track|$album"
        if (key == videoKey) return
        videoKey = key
        videoId = null
        videoPlaying = false
        if (track.isBlank() || artistName.isBlank()) return
        Thread {
            val clip = SpotifyVideoLookup.find(track, artistName, album)
            runOnUiThread { if (videoKey == key && foreground) videoId = clip }
        }.start()
    }

    // ---------- Sangtekst (LRCLIB) ----------

    private fun positionMs(): Long {
        val st = lastState ?: return 0L
        var p = st.position
        if (st.state == PlaybackState.STATE_PLAYING) {
            p += ((SystemClock.elapsedRealtime() - st.lastPositionUpdateTime) * st.playbackSpeed).toLong()
        }
        return p
    }

    private fun fetchLyrics(m: MediaMetadata?) {
        val t = m?.getString(MediaMetadata.METADATA_KEY_TITLE).orEmpty()
        val a = artist
        val album = m?.getString(MediaMetadata.METADATA_KEY_ALBUM).orEmpty()
        val dur = (m?.getLong(MediaMetadata.METADATA_KEY_DURATION) ?: 0L) / 1000L
        val key = "$a|$t"
        if (key == lyricsKey) return
        lyricsKey = key
        lyrics = emptyList()
        plainLyrics = null
        if (t.isBlank()) { lyricsState = ""; return }
        lyricsState = "loading"
        Thread {
            val res = try { queryLrclib(t, a, album, dur) } catch (e: Exception) { android.util.Log.d("Rave", "tekst feilet: $e"); null }
            runOnUiThread {
                if (lyricsKey != key) return@runOnUiThread
                if (res == null || (res.first.isEmpty() && res.second.isNullOrBlank())) {
                    lyricsState = "none"
                } else {
                    lyrics = res.first
                    plainLyrics = res.second
                    lyricsState = "ok"
                }
            }
        }.start()
    }

    private fun httpGet(url: String): String? {
        repeat(4) { attempt ->
            val c = java.net.URL(url).openConnection() as java.net.HttpURLConnection
            c.connectTimeout = 7000
            c.readTimeout = 7000
            c.setRequestProperty("User-Agent", "Bilnett/1.0")
            try {
                val code = c.responseCode
                if (code == 200) return c.inputStream.bufferedReader().readText()
                if (code == 404) return null
                android.util.Log.d("Rave", "lrclib $code, forsøk ${attempt + 1}")
            } catch (e: Exception) {
                android.util.Log.d("Rave", "lrclib feil: $e")
            } finally {
                c.disconnect()
            }
            Thread.sleep(700L * (attempt + 1))
        }
        return null
    }

    /** Velger treffet med synkronisert tekst og lengde nærmest sangen. */
    private fun bestMatch(json: String?, dur: Long): org.json.JSONObject? {
        if (json == null) return null
        val arr = org.json.JSONArray(json)
        var best: org.json.JSONObject? = null
        var bestScore = Double.MAX_VALUE
        for (i in 0 until arr.length()) {
            val o = arr.getJSONObject(i)
            val synced = !o.isNull("syncedLyrics")
            val plain = !o.isNull("plainLyrics")
            if (!synced && !plain) continue
            val d = if (o.isNull("duration")) -1.0 else o.optDouble("duration", -1.0)
            var score = if (dur > 0 && d > 0) kotlin.math.abs(d - dur) else 30.0
            if (!synced) score += 1000.0
            if (score < bestScore) { bestScore = score; best = o }
        }
        return best
    }

    private fun queryLrclib(t: String, a: String, album: String, dur: Long): Pair<List<Pair<Long, String>>, String?>? {
        fun enc(x: String) = java.net.URLEncoder.encode(x, "UTF-8")
        // Fjern "(feat. …)", "- Remastered" o.l. som ofte gir bom
        val clean = t.replace(Regex("""\s*[\(\[].*?(feat|with|remaster|version|edit|live).*?[\)\]]""", RegexOption.IGNORE_CASE), "")
            .replace(Regex("""\s+-\s+.*(remaster|version|edit|live).*$""", RegexOption.IGNORE_CASE), "").trim()
        val firstArtist = a.split(",", "&", " feat").first().trim()
        var obj: org.json.JSONObject? = null
        var url = "https://lrclib.net/api/get?track_name=${enc(clean)}&artist_name=${enc(firstArtist)}"
        if (dur > 0) url += "&duration=$dur"
        httpGet(url)?.let { obj = org.json.JSONObject(it) }
        if (obj == null || obj!!.isNull("syncedLyrics")) {
            bestMatch(httpGet("https://lrclib.net/api/search?track_name=${enc(clean)}&artist_name=${enc(firstArtist)}"), dur)?.let { obj = it }
        }
        if (obj == null || obj!!.isNull("syncedLyrics")) {
            bestMatch(httpGet("https://lrclib.net/api/search?q=${enc("$firstArtist $clean")}"), dur)?.let { if (obj == null || !it.isNull("syncedLyrics")) obj = it }
        }
        val o = obj ?: return null
        val synced = if (o.isNull("syncedLyrics")) "" else o.optString("syncedLyrics", "")
        val plain = if (o.isNull("plainLyrics")) null else o.optString("plainLyrics", "").takeIf { it.isNotBlank() }
        android.util.Log.d("Rave", "tekst funnet: ${o.optString("trackName")} synced=${synced.isNotBlank()}")
        return parseLrc(synced) to plain
    }

    private fun parseLrc(text: String): List<Pair<Long, String>> {
        val re = Regex("""\[(\d+):(\d+)(?:[.:](\d+))?]""")
        val out = mutableListOf<Pair<Long, String>>()
        text.lineSequence().forEach { line ->
            val ms = re.findAll(line).toList()
            if (ms.isEmpty()) return@forEach
            val words = line.substring(ms.last().range.last + 1).trim()
            ms.forEach { m ->
                val min = m.groupValues[1].toLong()
                val sec = m.groupValues[2].toLong()
                val fr = m.groupValues[3]
                val frMs = if (fr.isEmpty()) 0L else fr.padEnd(3, '0').take(3).toLong()
                out.add((min * 60000 + sec * 1000 + frMs) to words)
            }
        }
        return out.sortedBy { it.first }
    }

    private fun startVisualizer() {
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            reactive = false
            return
        }
        try {
            val v = Visualizer(0)
            val range = Visualizer.getCaptureSizeRange()
            v.captureSize = (if (hardstyleOn) 2048 else 512).coerceIn(range[0], range[1])
            v.setDataCaptureListener(object : Visualizer.OnDataCaptureListener {
                override fun onWaveFormDataCapture(vis: Visualizer?, waveform: ByteArray?, samplingRate: Int) {}
                override fun onFftDataCapture(vis: Visualizer?, fft: ByteArray?, samplingRate: Int) {
                    if (fft != null) {
                        if (hardstyleOn) {
                            hardstyleAudioAt = SystemClock.uptimeMillis()
                            hardstyleFrame = hardstyleAudio.accept(fft, samplingRate / 1000, hardstyleAudioAt)
                        } else onFft(fft)
                    }
                }
            }, Visualizer.getMaxCaptureRate(), false, true)
            v.enabled = true
            visualizer = v
            reactive = true
        } catch (_: Exception) {
            reactive = false
        }
    }

    private fun onFft(fft: ByteArray) {
        var e = 0f
        var k = 1
        while (k <= 4 && 2 * k + 1 < fft.size) {
            e += hypot(fft[2 * k].toFloat(), fft[2 * k + 1].toFloat())
            k++
        }
        maxEnergy = max(maxEnergy * 0.995f, max(e, 1f))
        val norm = (e / maxEnergy).coerceIn(0f, 1f)
        level = level * 0.55f + norm * 0.45f
        avgEnergy = avgEnergy * 0.94f + e * 0.06f
        val now = SystemClock.uptimeMillis()
        if (playing && e > 6f && e > avgEnergy * 1.35f && e > maxEnergy * 0.35f && now - lastBeatAt > 260) {
            lastBeatAt = now
            beat = 1f
        }
    }

    private fun startSpeedGate() {
        if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) return
        try {
            val lm = getSystemService(LocationManager::class.java)
            locationManager = lm
            lm.requestLocationUpdates(LocationManager.GPS_PROVIDER, 1000L, 0f, locationListener, Looper.getMainLooper())
        } catch (_: Exception) { }
    }

    @Composable
    private fun RaveScreen() {
        val transportVisible = controls.transport
        val mediaTogglesVisible = controls.media
        LaunchedEffect(controls.touchedAt) {
            delay(10_000)
            controls = controls.expire(SystemClock.elapsedRealtime())
        }
        LaunchedEffect(Unit) { controls = controls.touch(SystemClock.elapsedRealtime()) }
        var announcement by remember { mutableStateOf(false) }
        LaunchedEffect(hardstyleOn) {
            announcement = hardstyleOn
            if (hardstyleOn) { delay(1200); announcement = false }
        }
        var visualTime by remember { mutableFloatStateOf(0f) }
        var audioIntensity by remember { mutableFloatStateOf(0f) }
        var coverCenter by remember { mutableStateOf<Offset?>(null) }
        var coverRadius by remember { mutableFloatStateOf(0f) }
        var sceneOrigin by remember { mutableStateOf(Offset.Zero) }
        var displayedFrame by remember { mutableStateOf(HardstyleFrame()) }
        LaunchedEffect(hardstyleOn, foreground, driving, playing) {
            if (!hardstyleOn || !foreground || driving) return@LaunchedEffect
            var previous = 0L
            while (true) {
                withFrameNanos { now ->
                    val dt = if (previous == 0L) 0f else ((now-previous)/1e9f).coerceAtMost(.05f)
                    previous = now
                    val fresh = reactive && SystemClock.uptimeMillis()-hardstyleAudioAt < 300
                    val target = if (!playing || !fresh && reactive) HardstyleFrame() else if (fresh) hardstyleFrame
                        else HardstyleFrame()
                    // Advance the scene only while the live signal has energy. FFT noise
                    // below the floor cannot keep the background drifting during silence.
                    val activity = maxOf(target.bass, target.kick, target.highs, target.highMotion,
                        target.spectrum.maxOrNull() ?: 0f)
                    if (playing && ((!reactive && !fresh) || activity > .025f)) {
                        visualTime += dt * if (!reactive && !fresh) .3f else (.35f + activity)
                    }
                    audioIntensity = if (playing && ((!reactive && !fresh) || activity > .025f)) activity.coerceIn(0f, 1f) else 0f
                    val mix = 1f-kotlin.math.exp(-dt/(if (playing) .025f else .12f))
                    fun blend(a: Float,b: Float) = a+(b-a)*mix
                    displayedFrame = HardstyleFrame(blend(displayedFrame.bass,target.bass),
                        blend(displayedFrame.kick,target.kick),blend(displayedFrame.highs,target.highs),
                        blend(displayedFrame.energy,target.energy),blend(displayedFrame.burst,target.burst),blend(displayedFrame.build,target.build),
                        spectrum = if (playing && fresh) target.spectrum else displayedFrame.spectrum.map {
                            val value = it * kotlin.math.exp(-dt / .07f)
                            if (value < .0001f) 0f else value
                        },
                        highMotion = blend(displayedFrame.highMotion, if (playing && fresh) target.highMotion else 0f))
                }
            }
        }

        val palette = colors
        val hardPalette = remember(colors) {
            (if (colors == DEFAULT_COLORS) listOf(Color.Cyan, Color(0xFFAA44FF), Color(0xFFFF44BB)) else colors).map { color ->
                val hsv = FloatArray(3)
                android.graphics.Color.RGBToHSV((color.red*255).toInt(), (color.green*255).toInt(), (color.blue*255).toInt(), hsv)
                hsv[1] = max(hsv[1], .7f); hsv[2] = max(hsv[2], .85f)
                Color(android.graphics.Color.HSVToColor(hsv))
            }.ifEmpty { listOf(Color.Cyan, Color(0xFFAA44FF)) }
        }
        val transition = rememberInfiniteTransition(label = "drift")
        val lightCycleMillis = if (hardstyleOn) 8_000 else 32_000
        val t by transition.animateFloat(
            initialValue = 0f,
            targetValue = (2 * PI).toFloat(),
            animationSpec = infiniteRepeatable(tween(lightCycleMillis, easing = LinearEasing)),
            label = "t"
        )

        var synthetic by remember { mutableFloatStateOf(0f) }
        LaunchedEffect(Unit) {
            val start = SystemClock.uptimeMillis()
            while (true) {
                withFrameNanos { }
                beat *= 0.9f
                if (showLyrics) pos = positionMs()
                if (!reactive) {
                    val phase = ((SystemClock.uptimeMillis() - start) % 500L) / 500f
                    synthetic = if (playing) (1f - phase).pow(3) * 0.7f else 0f
                }
            }
        }
        val raw = if (reactive) max(level, beat) else synthetic
        val energy by animateFloatAsState(raw, tween(80), label = "energy")
        val beatNow = beat

        Box(
            Modifier.fillMaxSize().background(Color(0xFF050505)).pointerInput(Unit) {
                awaitEachGesture {
                    val down = awaitFirstDown(requireUnconsumed = false)
                    controls = controls.touch(SystemClock.elapsedRealtime())
                    var validTap = !down.isConsumed
                    do {
                        val event = awaitPointerEvent()
                        val pointer = event.changes.firstOrNull { it.id == down.id }
                        validTap = validTap && event.changes.size == 1 && pointer != null &&
                            !pointer.isConsumed && (pointer.position-down.position).getDistance() <= viewConfiguration.touchSlop
                        awaitPointerEvent(PointerEventPass.Final)
                        validTap = validTap && event.changes.none { it.isConsumed }
                        controls = controls.touch(SystemClock.elapsedRealtime())
                        if (event.changes.none { it.pressed }) {
                            if (validTap) controls = controls.tap(SystemClock.elapsedRealtime())
                            break
                        }
                    } while (true)

                }
            }
        ) {
            Canvas(Modifier.fillMaxSize().onGloballyPositioned {
                sceneOrigin = it.positionInRoot()
            }) {
                val w = size.width
                val h = size.height
                val base = min(w, h)
                val lightTravel = if (hardstyleOn) .40f else .22f
                // Party lighting should hit with the music instead of only drifting
                // smoothly. Kick and bass pull each glow outward on every transient.
                val partyHit = if (hardstyleOn)
                    maxOf(displayedFrame.kick, displayedFrame.bass * .55f, displayedFrame.highMotion * .2f)
                else 0f
                palette.forEachIndexed { i, col ->
                    val a = t + i * 2.1f
                    val drift = Offset(w * (0.5f + lightTravel * cos(a)), h * (0.5f + lightTravel * .9f * sin(a * 1.3f)))
                    val hitAngle = i * 2.399963f
                    val hitOffset = Offset(cos(hitAngle), sin(hitAngle)) * (base * partyHit * .12f)
                    val c = drift + hitOffset
                    val r = base * (0.6f + 0.35f * energy) * (1f + partyHit * .1f)
                    drawCircle(
                        brush = Brush.radialGradient(
                            listOf(col.copy(alpha = ((0.45f + 0.35f * energy + partyHit * .18f)).coerceIn(0f,.95f)), Color.Transparent),
                        center = c, radius = r
                        ),
                        radius = r, center = c
                    )
                }
                if (beatNow > 0.02f) {
                    drawRect(
                        Brush.radialGradient(
                            listOf(palette.first().copy(alpha = 0.22f * beatNow), Color.Transparent),
                            center = center, radius = max(w, h) * 0.75f
                        )
                    )
                }
                drawRect(
                    Brush.radialGradient(
                        listOf(Color.Transparent, Color.Black.copy(alpha = 0.65f)),
                        center = center, radius = max(w, h) * 0.8f
                    )
                )
            }

            val showVideo = foreground && videoOn && videoPlaying && videoId != null && !driving
            if (foreground && videoOn && videoId != null) {
                androidx.compose.runtime.key(videoId) {
                    AndroidView(
                        factory = { ctx -> SilentClipView(ctx, videoId!!,
                            onFrame = { videoPlaying = true },
                            onFailure = { videoPlaying = false; videoId = null }) },
                        update = { it.setPlaying(playing && !driving) },
                        onRelease = { it.release() },
                        modifier = Modifier.fillMaxSize()
                    )
                }
            }

            if (hardstyleOn && foreground && !driving) {
                coverCenter?.let { center ->
                    HardstyleBackdrop(Modifier.fillMaxSize(), displayedFrame, visualTime, hardPalette, showVideo,
                        center, coverRadius, audioIntensity)
                }
            }
            if (showVideo && !(showLyrics && maxOf(resources.displayMetrics.widthPixels, resources.displayMetrics.heightPixels) > minOf(resources.displayMetrics.widthPixels, resources.displayMetrics.heightPixels))) VideoOverlay(transportVisible, mediaTogglesVisible, ::buttonInteraction) else
            BoxWithConstraints(
                Modifier.fillMaxSize()
                    .background(if (showVideo && showLyrics) Color.Black.copy(alpha = 0.55f) else Color.Transparent)
                    .padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                val wide = maxWidth > maxHeight
                if (wide && showLyrics) {
                    val layoutHeight = maxHeight.value
                    val layoutWidth = maxWidth.value
                    Row(
                        Modifier.fillMaxSize(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(24.dp)
                    ) {
                        val coverSize = min(min(layoutHeight * 0.66f, layoutWidth * 0.4f), 300f).dp
                        Column(
                            Modifier.weight(0.44f),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            ReactiveCover(coverSize, displayedFrame, hardPalette, sceneOrigin) { center, radius ->
                                coverCenter = center; coverRadius = radius
                            }
                            Spacer(Modifier.height(12.dp))
                            Info(Modifier.fillMaxWidth(), Alignment.CenterHorizontally, includeLyrics = false, transportVisible = transportVisible, mediaTogglesVisible = false, onTransportInteraction = ::buttonInteraction, modeButtonsAllowed = false)
                        }
                        Column(
                            Modifier.weight(0.56f).fillMaxHeight()
                                .clip(RoundedCornerShape(20.dp))
                                .background(Color.Black.copy(alpha = 0.24f))
                                .padding(horizontal = 18.dp, vertical = 12.dp),
                            horizontalAlignment = Alignment.Start
                        ) {
                            Box(
                                Modifier.weight(1f).fillMaxWidth(),
                                contentAlignment = Alignment.CenterStart
                            ) {
                                LyricsView(Alignment.Start)
                            }
                            if (mediaTogglesVisible || controls.hardstyle) {
                                Spacer(Modifier.height(12.dp))
                                ModeButtons(mediaTogglesVisible)
                            }
                        }
                    }
                } else {
                    val f = if (showLyrics) 0.62f else 1f
                    val artSize: Dp = if (wide) (min(maxHeight.value * 0.72f, 340f) * f).dp else (min(maxWidth.value * 0.75f, 340f) * f).dp
                    if (wide) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.Center) {
                        ReactiveCover(artSize, displayedFrame, hardPalette, sceneOrigin) { center, radius ->
                            coverCenter = center; coverRadius = radius
                        }
                        Spacer(Modifier.width(40.dp))
                        Info(Modifier.widthIn(max = if (showLyrics) 680.dp else 520.dp), Alignment.Start, transportVisible = transportVisible, mediaTogglesVisible = mediaTogglesVisible, onTransportInteraction = ::buttonInteraction)
                    }
                } else {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                        ReactiveCover(artSize, displayedFrame, hardPalette, sceneOrigin) { center, radius ->
                            coverCenter = center; coverRadius = radius
                        }
                        Spacer(Modifier.height(32.dp))
                        Info(Modifier, Alignment.CenterHorizontally, transportVisible = transportVisible, mediaTogglesVisible = mediaTogglesVisible, onTransportInteraction = ::buttonInteraction)
                    }
                }
                }
            }

            if (announcement && hardstyleOn && !driving) Text("PARTY ON", color=Color.White,
                modifier=Modifier.align(Alignment.TopCenter).padding(16.dp).background(Color.Black.copy(alpha=.7f)).padding(12.dp))
            if (!hasAccess) Notice("Rave trenger tilgang til hva som spilles.\nInnstillinger → Varsler → Enhetstilgang til varsler → Bilnett Rave.")
            if (driving) Notice("Parker bilen for å bruke Rave.", solid = true)
        }
    }

    /** Reserve exactly the normal cover slot so text and controls never move when toggling. */
    @Composable
    private fun ReactiveCover(
        size: Dp,
        frame: HardstyleFrame,
        palette: List<Color>,
        sceneOrigin: Offset,
        onPosition: (Offset, Float) -> Unit
    ) {
        if (!hardstyleOn) {
            Cover(size)
            return
        }
        Box(Modifier.size(size).onGloballyPositioned { coordinates ->
            val position = coordinates.positionInRoot() - sceneOrigin
            onPosition(
                Offset(position.x + coordinates.size.width/2f, position.y + coordinates.size.height/2f),
                min(coordinates.size.width, coordinates.size.height) * .5f
            )
        }, contentAlignment = Alignment.Center) {
            androidx.compose.runtime.key(trackIdentity, foreground, driving) {
                HardstyleOrb(Modifier.fillMaxSize(), frame, palette, roundedSquare = true)
            }
            Cover(size * .86f, scale = 1f + frame.kick * .045f)
        }
    }

    @Composable
    private fun Cover(size: Dp, scale: Float = 1f) {
        val mod = Modifier.size(size).graphicsLayer { scaleX=scale; scaleY=scale }
            .clip(RoundedCornerShape(20.dp))
        val bmp = art
        if (bmp != null) {
            Image(bmp.asImageBitmap(), contentDescription = null, contentScale = ContentScale.Crop, modifier = mod)
        } else {
            Box(mod.background(Color(0xFF161616)), contentAlignment = Alignment.Center) {
                Icon(Icons.Rounded.MusicNote, null, tint = Color(0x66FFFFFF), modifier = Modifier.size(size / 3))
            }
        }
    }

    @OptIn(ExperimentalLayoutApi::class)
    @Composable
    private fun Info(
        modifier: Modifier,
        align: Alignment.Horizontal,
        includeLyrics: Boolean = true,
        transportVisible: Boolean = true,
        mediaTogglesVisible: Boolean = true,
        onTransportInteraction: () -> Unit = {},
        modeButtonsAllowed: Boolean = true
    ) {
        val ta = if (align == Alignment.CenterHorizontally) TextAlign.Center else TextAlign.Start
        val narrow = align == Alignment.CenterHorizontally
        Column(modifier, horizontalAlignment = align) {
            Text(
                title.ifBlank { "Start Spotify" }, textAlign = ta, fontFamily = FontFamily.Default,
                color = Color(0xFFF5F2EC), fontSize = if (showLyrics) 20.sp else 36.sp, fontWeight = FontWeight.SemiBold,
                maxLines = if (showLyrics) 1 else 2, overflow = TextOverflow.Ellipsis, lineHeight = if (showLyrics) 24.sp else 40.sp
            )
            Spacer(Modifier.height(8.dp))
            Text(
                artist.ifBlank { "Spill av noe, så starter Rave" }, textAlign = ta, fontFamily = BodyFont,
                color = Color(0xB3F5F2EC), fontSize = if (showLyrics) 15.sp else 20.sp, maxLines = 1, overflow = TextOverflow.Ellipsis
            )
            if (showLyrics && includeLyrics) {
                Spacer(Modifier.height(18.dp))
                LyricsView(align)
            }
            if (transportVisible || mediaTogglesVisible || (modeButtonsAllowed && controls.hardstyle)) {
                Spacer(Modifier.height(if (showLyrics) 18.dp else 28.dp))
                FlowRow(verticalArrangement = Arrangement.spacedBy(12.dp), horizontalArrangement = Arrangement.spacedBy(28.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                    if (transportVisible) {
                        Control(Icons.Rounded.SkipPrevious, 44.dp, onTransportInteraction) { controller?.transportControls?.skipToPrevious() }
                        Spacer(Modifier.width(28.dp))
                        Control(if (playing) Icons.Rounded.Pause else Icons.Rounded.PlayArrow, 60.dp, onTransportInteraction) {
                            val tc = controller?.transportControls
                            if (playing) tc?.pause() else tc?.play()
                        }
                        Spacer(Modifier.width(28.dp))
                        Control(Icons.Rounded.SkipNext, 44.dp, onTransportInteraction) { controller?.transportControls?.skipToNext() }
                    }
                    }
                    if (modeButtonsAllowed && !narrow && (mediaTogglesVisible || (modeButtonsAllowed && controls.hardstyle))) ModeButtons(mediaTogglesVisible)
                }
                if (modeButtonsAllowed && narrow && (mediaTogglesVisible || (modeButtonsAllowed && controls.hardstyle))) {
                    Spacer(Modifier.height(12.dp))
                    ModeButtons(mediaTogglesVisible)
                }

            }
        }
    }

    @OptIn(ExperimentalLayoutApi::class)
    @Composable
    private fun ModeButtons(mediaVisible: Boolean) {
        FlowRow(horizontalArrangement=Arrangement.spacedBy(10.dp), verticalArrangement=Arrangement.spacedBy(8.dp)) {
            if (mediaVisible) {
                LyricsButton()
                if (videoId != null) VideoButton()
            }
            if (controls.hardstyle) {
                Box(Modifier.height(64.dp).clip(RoundedCornerShape(50))
                    .background(if(hardstyleOn) Color(0xFFF5F2EC) else Color(0x22FFFFFF))
                    .clickable { buttonInteraction(); setHardstyle() }.padding(horizontal=24.dp), contentAlignment=Alignment.Center) {
                    Text("Party", color=if(hardstyleOn) Color(0xFF0A0A0A) else Color(0xFFF5F2EC), fontSize=18.sp, fontWeight=FontWeight.SemiBold)
                }
            }
        }
    }

    @Composable
    private fun LyricsButton() {
        val on = showLyrics
        Box(
            Modifier.height(64.dp).clip(RoundedCornerShape(50))
                .background(if (on) Color(0xFFF5F2EC) else Color(0x22FFFFFF))
                .clickable { buttonInteraction(); showLyrics = !showLyrics; if (showLyrics) pos = positionMs() }
                .padding(horizontal = 24.dp),
            contentAlignment = Alignment.Center
        ) {
            Text("Tekst", fontFamily = FontFamily.Default, maxLines = 1, softWrap = false, color = if (on) Color(0xFF0A0A0A) else Color(0xFFF5F2EC), fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
        }
    }

    @Composable
    private fun VideoButton() {
        val on = videoOn
        Box(
            Modifier.height(64.dp).clip(RoundedCornerShape(50))
                .background(if (on) Color(0xFFF5F2EC) else Color(0x22FFFFFF))
                .clickable { buttonInteraction(); videoOn = !videoOn; videoPlaying = false }
                .padding(horizontal = 24.dp),
            contentAlignment = Alignment.Center
        ) {
            Text("Video", fontFamily = FontFamily.Default, maxLines = 1, softWrap = false,
                color = if (on) Color(0xFF0A0A0A) else Color(0xFFF5F2EC), fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
        }
    }

    @Composable
    private fun VideoOverlay(transportVisible: Boolean, mediaTogglesVisible: Boolean, onTransportInteraction: () -> Unit) {
        Box(
            Modifier.fillMaxSize().background(
                Brush.verticalGradient(0f to Color(0x66000000), 0.25f to Color.Transparent, 0.5f to Color.Transparent, 1f to Color(0xE6000000))
            )
        )
        Box(Modifier.fillMaxSize()) {
            if (showLyrics) {
                Box(Modifier.fillMaxSize().padding(horizontal = 24.dp), contentAlignment = Alignment.Center) {
                    LyricsView(Alignment.CenterHorizontally)
                }
            }
            Column(
                Modifier.fillMaxSize().padding(horizontal = 32.dp, vertical = 24.dp),
                verticalArrangement = Arrangement.Bottom,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(title, fontFamily = FontFamily.Default, color = Color(0xFFF5F2EC), fontSize = 30.sp, maxLines = 1, overflow = TextOverflow.Ellipsis,
                    textAlign = TextAlign.Center, style = TextStyle(shadow = Shadow(Color.Black, Offset(0f, 2f), 10f)))
                Text(artist, fontFamily = BodyFont, color = Color(0xCCF5F2EC), fontSize = 17.sp, maxLines = 1, overflow = TextOverflow.Ellipsis,
                    textAlign = TextAlign.Center, style = TextStyle(shadow = Shadow(Color.Black, Offset(0f, 2f), 8f)))
                if (transportVisible || mediaTogglesVisible || controls.hardstyle) {
                    Spacer(Modifier.height(14.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        if (transportVisible) {
                            Control(Icons.Rounded.SkipPrevious, 30.dp, onTransportInteraction) { controller?.transportControls?.skipToPrevious() }
                            Spacer(Modifier.width(12.dp))
                            Control(if (playing) Icons.Rounded.Pause else Icons.Rounded.PlayArrow, 38.dp, onTransportInteraction) {
                                val tc = controller?.transportControls
                                if (playing) tc?.pause() else tc?.play()
                            }
                            Spacer(Modifier.width(12.dp))
                            Control(Icons.Rounded.SkipNext, 30.dp, onTransportInteraction) { controller?.transportControls?.skipToNext() }
                        }
                    }
                    ModeButtons(mediaTogglesVisible)
                }
            }
        }
    }

    @Composable
    private fun LyricsView(align: Alignment.Horizontal) {
        val ta = if (align == Alignment.CenterHorizontally) TextAlign.Center else TextAlign.Start
        val dim = Color(0x66F5F2EC)
        Column(horizontalAlignment = align) {
            when {
                lyricsState == "loading" -> Text("Henter tekst …", color = dim, fontSize = 22.sp, textAlign = ta, fontFamily = BodyFont)
                lyrics.isNotEmpty() -> {
                    val idx = lyrics.indexOfLast { it.first <= pos + 250 }.coerceAtLeast(0)
                    for (i in (idx - 2)..(idx + 2)) {
                        val line = lyrics.getOrNull(i)?.second
                        val current = i == idx
                        Text(
                            when {
                                line == null -> " "
                                line.isBlank() -> "♪"
                                else -> line
                            },
                            color = if (current) Color(0xFFF5F2EC) else dim,
                            fontSize = if (current) 34.sp else 22.sp,
                            fontFamily = FontFamily.Default,
                            style = TextStyle(shadow = Shadow(Color.Black, Offset(0f, 2f), 10f)),
                            fontWeight = if (current) FontWeight.SemiBold else FontWeight.Normal,
                            lineHeight = if (current) 38.sp else 27.sp,
                            textAlign = ta,
                            maxLines = 2, overflow = TextOverflow.Ellipsis,
                            modifier = Modifier.padding(vertical = 3.dp)
                        )
                    }
                }
                plainLyrics != null -> Text(
                    plainLyrics.orEmpty(), color = Color(0xCCF5F2EC), fontSize = 20.sp, fontFamily = FontFamily.Default, lineHeight = 28.sp, textAlign = ta,
                    modifier = Modifier.heightIn(max = 220.dp).verticalScroll(rememberScrollState())
                )
                lyricsState == "none" -> Text("Fant ingen tekst til denne sangen", color = dim, fontSize = 22.sp, textAlign = ta, fontFamily = BodyFont)
                else -> Text("Spill av en sang for å se teksten", color = dim, fontSize = 22.sp, textAlign = ta, fontFamily = BodyFont)
            }
        }
    }

    @Composable
    private fun Control(icon: ImageVector, size: Dp, onInteraction: () -> Unit = {}, onClick: () -> Unit) {
        Box(
            Modifier.size(size + 20.dp).clip(RoundedCornerShape(50)).background(Color(0x22FFFFFF)).clickable {
                onInteraction()
                onClick()
            },
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, null, tint = Color(0xFFF5F2EC), modifier = Modifier.size(size))
        }
    }

    @Composable
    private fun Notice(text: String, solid: Boolean = false) {
        Box(
            Modifier.fillMaxSize().background(if (solid) Color(0xFF050505) else Color(0xCC050505)),
            contentAlignment = Alignment.Center
        ) {
            Text(text, color = Color(0xFFF5F2EC), fontSize = 24.sp, fontFamily = BodyFont, lineHeight = 32.sp, modifier = Modifier.padding(40.dp))
        }
    }

    companion object {
        private const val SPOTIFY = "com.spotify.music"
        private val BodyFont = FontFamily(Font(R.font.grenze_gotisch))
        private val DEFAULT_COLORS = listOf(Color(0xFF6B4F3A), Color(0xFF2E4A5C), Color(0xFF4A3550))

        fun extractColors(src: Bitmap?): List<Color> {
            if (src == null) return DEFAULT_COLORS
            return try {
                val soft = if (src.config == Bitmap.Config.HARDWARE) src.copy(Bitmap.Config.ARGB_8888, false) else src
                val s = Bitmap.createScaledBitmap(soft, 24, 24, true)
                val hsv = FloatArray(3)
                val candidates = mutableListOf<Pair<Float, FloatArray>>()
                for (x in 0 until s.width) for (y in 0 until s.height) {
                    android.graphics.Color.colorToHSV(s.getPixel(x, y), hsv)
                    candidates.add((hsv[1] * hsv[2]) to hsv.copyOf())
                }
                candidates.sortByDescending { it.first }
                val picked = mutableListOf<FloatArray>()
                for ((_, c) in candidates) {
                    if (picked.none { hueDistance(it[0], c[0]) < 35f }) picked.add(c)
                    if (picked.size == 3) break
                }
                while (picked.size < 3) picked.add(picked.firstOrNull()?.copyOf() ?: floatArrayOf(30f, 0.4f, 0.5f))
                picked.map { c ->
                    val v = floatArrayOf(c[0], c[1].coerceIn(0.35f, 0.85f), c[2].coerceIn(0.45f, 0.8f))
                    Color(android.graphics.Color.HSVToColor(v))
                }
            } catch (_: Exception) {
                DEFAULT_COLORS
            }
        }

        private fun hueDistance(a: Float, b: Float): Float {
            val d = abs(a - b) % 360f
            return if (d > 180f) 360f - d else d
        }
    }
}

package com.kododake.aabrowser.rave

import android.Manifest
import android.content.ComponentName
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.media.AudioManager
import android.media.MediaMetadata
import android.media.audiofx.Visualizer
import android.media.session.MediaController
import android.media.session.MediaSessionManager
import android.media.session.PlaybackState
import android.os.Bundle
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
import androidx.compose.foundation.border
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
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Apps
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
    // Party profile per genre (hardstyle, rap, rock, EDM, standard), detected automatically.
    private val genreDetector = GenreDetector()
    private val songPhase = HardstyleStructure()
    private val hardSubDetector = HardSubDetector()
    private var hardSub by mutableStateOf(HardSub.RAW)
    private var partLabelAt by mutableLongStateOf(0L)
    private var subChangedAt by mutableLongStateOf(0L)
    private var lastStrobeAt = 0L
    /** Live analysis panel (HUD): what the structure engine sees right now. */
    private var hudData by mutableStateOf(StructureHud())
    private var showAnalysis by mutableStateOf(true)
    private var lastHudAt = 0L
    private var lastHeavyFlashAt = 0L
    private var strobeColorIndex = 0
    // Party camera shake, computed once per frame; only the scene (background, particles, cover)
    // moves — buttons and text stay still so they can be tapped.
    private var shakeX by mutableFloatStateOf(0f)
    private var shakeY by mutableFloatStateOf(0f)
    private var shakeRotation by mutableFloatStateOf(0f)

    private fun Modifier.sceneShake(overscan: Boolean = false): Modifier = graphicsLayer {
        if (!hardstyleOn) return@graphicsLayer
        translationX = shakeX
        translationY = shakeY
        rotationZ = shakeRotation
        if (overscan && (shakeX != 0f || shakeY != 0f)) {
            val minSide = min(size.width, size.height).coerceAtLeast(1f)
            val zoom = 1f + 2f * hypot(shakeX, shakeY) / minSide + .02f * abs(shakeRotation)
            scaleX = zoom; scaleY = zoom
        }
    }
    private var songDurationMs = 0L
    private var screechShake by mutableFloatStateOf(0f)
    /** How lively the current song part is (hardstyle/EDM): low in intro/breakdown/outro. */
    private var phaseLevel by mutableFloatStateOf(1f)
    private var genre by mutableStateOf(Genre.HARDSTYLE)
    private var partyProfile by mutableStateOf(vibeProfile(1f, 0f))
    /** Seconds of loud music without a recognised drop (see the missed-drop safety net). */
    private var loudNoDropS = 0f
    // ---- Festival show (FestivalShow.kt) ----
    private val beatClock = BeatClock()
    private val flashBudget = FlashBudget()
    /** 0..1: the "breath in" before a drop darkens the scene (festival trick: dark, then hit). */
    private var dip by mutableFloatStateOf(0f)
    /** 0..1: the single big hit on the drop's first beat, fading out. */
    private var dropHit by mutableFloatStateOf(0f)
    private var lastPart = SongPart.INTRO
    /** When the current dip started (0 = none) and whether this build-up already used its dip. */
    private var dipStartedAt = 0L
    private var dipSpent = false
    /** Look inside a drop (changes every 8 bars and per drop): 0 shake, 1 spikes/ripples, 2 colours. */
    private var dropLook by mutableIntStateOf(0)
    private var flashesNow by mutableIntStateOf(0)
    /** Car sync: + fires the visuals earlier, − later (ms). Saved between sessions. */
    private var syncMs by mutableIntStateOf(0)
    private val syncTapper = SyncTapper()
    private var tapMode by mutableStateOf(false)
    private var tapCount by mutableIntStateOf(0)
    private fun stopTapTest() { tapMode = false; syncTapper.reset(); tapCount = 0 }
    private fun saveSync() { try { getSharedPreferences("rave", MODE_PRIVATE).edit().putInt("syncMs", syncMs).apply() } catch (_: Exception) { } }
    private var genreAnnouncedAt by mutableLongStateOf(0L)
    // Vibe meter (vertical slider): 0 = calm … 1 = full hardstyle/rock. In auto mode the app moves
    // it to fit the music; dragging it takes over until "Auto" is tapped. Remembered between sessions.
    private var vibeAuto by mutableStateOf(true)
    private var vibeManual by mutableFloatStateOf(1f)
    /** The slider value actually used right now (glides toward the auto target or the dragged value). */
    private var vibe by mutableFloatStateOf(1f)
    /** 0 = HARD reacts as hardstyle, 1 = as rock (see [GenreDetector.rockness]). */
    private var rockness by mutableFloatStateOf(.1f)
    /**
     * Where the slider is drawn in auto mode: the auto level times how much is happening in the
     * song right now (low in intro/breakdown, rising in the build-up, at the top on the drop).
     * Display only — the effects already follow the song part on their own.
     */
    private var vibeLive by mutableFloatStateOf(1f)
    private fun setVibe(v: Float?) {
        vibeAuto = v == null
        if (v != null) vibeManual = v.coerceIn(0f, 1f)
        try {
            getSharedPreferences("rave", MODE_PRIVATE).edit()
                .putBoolean("vibeAuto", vibeAuto).putFloat("vibe", vibeManual).apply()
        } catch (_: Exception) { }
    }
    /** Short name for a slider value, e.g. ROLIG, RAP, EDM, ROCK or the hardstyle sub-genre (RAW …). */
    private fun vibeLabel(v: Float): String = when {
        v < .125f -> "ROLIG"
        v < .375f -> "RAP"
        v < .75f -> "EDM"
        rockness >= .5f -> "ROCK"
        else -> hardSub.label
    }
    private fun autoVibeTarget(): Float =
        if (genreDetector.provenHardstyle) 1f else genreDetector.genre.vibeTarget()
    private var volume by mutableFloatStateOf(1f)
    private var volumeReadAt = 0L
    private var hardstyleFrame by mutableStateOf(HardstyleFrame())
    private val hardstyleAudio = HardstyleAudio()
    private var hardstyleAudioAt = 0L
    private var trackIdentity = ""
    private var controls by mutableStateOf(RaveControls())
    /** Party extras (vibe slider, synk, analyse) show with the other buttons while Party is on. */
    private val partyControls: Boolean get() = hardstyleOn && controls.transport
    private fun buttonInteraction() { controls = controls.button(SystemClock.elapsedRealtime()) }
    private fun setHardstyle() {
        hardstyleOn = !hardstyleOn
        stopTapTest()
        hardstyleAudio.reset()
        hardstyleFrame = HardstyleFrame()
        visualizer?.let { try { it.enabled = false; it.release() } catch (_: Exception) {} }
        visualizer = null
        val wasMic = micMode
        stopMic()
        startVisualizer()
        if (wasMic) startMic()
    }
    private var reactive by mutableStateOf(false)
    private var hasAccess by mutableStateOf(true)

    // Backup sound source: with Android Auto over USB the Visualizer only hears silence, so Party
    // falls back to the phone's microphone (the music is loud in the car).
    private var micSource: MicFftSource? = null
    private var micMode by mutableStateOf(false)
    @Volatile private var lastVisualizerSoundAt = 0L
    private var visualizerStartedAt = 0L

    /** Same handling for sound from the Visualizer and from the microphone. */
    private fun handleFft(fft: ByteArray, sampleRateHz: Int) {
        if (hardstyleOn) {
            hardstyleAudioAt = SystemClock.uptimeMillis()
            hardstyleFrame = hardstyleAudio.accept(fft, sampleRateHz, hardstyleAudioAt)
        } else onFft(fft)
    }

    private fun startMic() {
        if (micSource?.isRunning == true) return
        val src = MicFftSource(this, if (hardstyleOn) 2048 else 512) { fft, rate -> if (micMode) handleFft(fft, rate) }
        if (src.start()) { micSource = src; micMode = true; reactive = true; hardstyleAudio.reset() }
    }

    private fun stopMic() {
        micSource?.stop(); micSource = null; micMode = false
    }

    // Sangtekst
    private var showLyrics by mutableStateOf(true)  // Tekst er på som standard
    private var lyrics by mutableStateOf<List<Pair<Long, String>>>(emptyList())
    private var plainLyrics by mutableStateOf<String?>(null)
    private var lyricsState by mutableStateOf("")
    private var pos by mutableLongStateOf(0L)
    private var lastState: PlaybackState? = null
    private var lyricsKey = ""
    /** Chosen lyrics style (swipe the lyrics to change) and glass box vs. open text (double-tap). */
    private var lyricsStyle by mutableStateOf(LyricsStyle.SCROLL)
    private var lyricsGlass by mutableStateOf(true)
    private var lyricsToast by mutableStateOf<String?>(null)
    private var lyricsToastAt by mutableLongStateOf(0L)
    /** Bass/kick level for the «Bass-puls» style; set from the screen, which knows the Party frame. */
    private var lyricsPulse: () -> Float = { beat }

    private fun showLyricsToast(text: String) { lyricsToast = text; lyricsToastAt = SystemClock.uptimeMillis() }

    private fun stepLyricsStyle(dir: Int) {
        val all = LyricsStyle.entries
        lyricsStyle = all[(lyricsStyle.ordinal + dir + all.size) % all.size]
        showLyricsToast(lyricsStyle.label)
        saveLyricsPrefs()
    }

    /** Song whose «no lyrics found» message has been hidden (after 3 s or by a double-tap). */
    private var noLyricsHiddenFor by mutableStateOf("")

    private fun toggleLyricsGlass() {
        if (lyricsState == "none") noLyricsHiddenFor = lyricsKey
        lyricsGlass = !lyricsGlass
        showLyricsToast(if (lyricsGlass) "Frostet glass" else "Åpen, uten boks")
        saveLyricsPrefs()
    }

    private fun saveLyricsPrefs() {
        try { getSharedPreferences("rave", MODE_PRIVATE).edit().putString("lyricsStyle", lyricsStyle.name).putBoolean("lyricsGlass", lyricsGlass).apply() } catch (_: Exception) { }
    }

    // Musikkvideo
    private var videoClips by mutableStateOf<List<SpotifyVideoLookup.VideoClip>>(emptyList())
    private var videoIndex by mutableStateOf(0)
    private val videoId: String? get() = videoClips.getOrNull(videoIndex)?.url
    private var videoOn by mutableStateOf(true)
    private var videoPlaying by mutableStateOf(false)
    @Volatile private var videoKey = ""
    private val videoFailed = HashSet<String>()
    // Finished lookups per song, so coming back to Rave does not search everything again.
    private val videoCache = object : LinkedHashMap<String, List<SpotifyVideoLookup.VideoClip>>() {
        override fun removeEldestEntry(eldest: MutableMap.MutableEntry<String, List<SpotifyVideoLookup.VideoClip>>?) = size > 30
    }
    private var foreground by mutableStateOf(false)

    private var msm: MediaSessionManager? = null
    private var controller: MediaController? = null
    private var visualizer: Visualizer? = null

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

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        YouTubeLookup.init(applicationContext)
        // Open the video store off the main thread (disk + database work), so the first clip does not stutter.
        Thread { RaveVideoCache.warmUp(applicationContext) }.start()
        // Skjermen skal aldri slukke mens Rave vises (gjelder bare mens vinduet er synlig).
        window.addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        showAnalysis = try { getSharedPreferences("rave", MODE_PRIVATE).getBoolean("analysis", true) } catch (_: Exception) { true }
        syncMs = try { getSharedPreferences("rave", MODE_PRIVATE).getInt("syncMs", 0) } catch (_: Exception) { 0 }
            .coerceIn(-SYNC_LIMIT_MS, SYNC_LIMIT_MS)
        try {
            val prefs = getSharedPreferences("rave", MODE_PRIVATE)
            lyricsStyle = LyricsStyle.entries.firstOrNull { it.name == prefs.getString("lyricsStyle", null) } ?: LyricsStyle.SCROLL
            lyricsGlass = prefs.getBoolean("lyricsGlass", true)
        } catch (_: Exception) { }
        try {
            val prefs = getSharedPreferences("rave", MODE_PRIVATE)
            if (prefs.contains("vibeAuto")) {
                vibeAuto = prefs.getBoolean("vibeAuto", true)
                vibeManual = prefs.getFloat("vibe", 1f).coerceIn(0f, 1f)
            } else {
                // One-time move from the old genre buttons to the slider.
                val old = Genre.entries.firstOrNull { it.name == prefs.getString("genre", "AUTO") }
                vibeAuto = old == null
                if (old != null) vibeManual = old.vibeTarget()
                prefs.edit().putBoolean("vibeAuto", vibeAuto).putFloat("vibe", vibeManual).remove("genre").apply()
            }
        } catch (_: Exception) { }
        vibe = if (vibeAuto) 1f else vibeManual
        setContent {
            val cfg = androidx.compose.ui.platform.LocalConfiguration.current
            androidx.compose.runtime.CompositionLocalProvider(
                LocalRaveScale provides raveScaleFor(cfg.screenWidthDp.toFloat(), cfg.screenHeightDp.toFloat())
            ) { RaveScreen() }
        }
    }

    /** Viser systemlinjene igjen og lukker Rave, så bilen går tilbake til app-oversikten. Musikken spiller videre. */
    private fun exitToApps() {
        try { window.insetsController?.show(WindowInsets.Type.systemBars()) } catch (_: Exception) { }
        finish()
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
        foreground = true
    }

    override fun onStop() {
        super.onStop()
        foreground = false
        videoPlaying = false
        videoKey = ""
        clearVideos()
        try { msm?.removeOnActiveSessionsChangedListener(sessionsListener) } catch (_: Exception) { }
        controller?.unregisterCallback(mediaCallback)
        controller = null
        visualizer?.let { try { it.enabled = false; it.release() } catch (_: Exception) { } }
        visualizer = null
        stopMic()
        reactive = false
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
            videoKey = ""; clearVideos(); videoPlaying = false
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
            genreDetector.newTrack(SystemClock.uptimeMillis())
            songPhase.newTrack(SystemClock.uptimeMillis())
            loudNoDropS = 0f
            beatClock.reset(); dip = 0f; dropHit = 0f; lastPart = SongPart.INTRO; dropLook = 0
            dipStartedAt = 0L; dipSpent = false
            stopTapTest()   // a new song has a new beat grid
            hardSubDetector.newTrack()
            val t = m?.getString(MediaMetadata.METADATA_KEY_TITLE).orEmpty()
            val a = m?.getString(MediaMetadata.METADATA_KEY_ARTIST).orEmpty()
            if (t.isNotBlank() && a.isNotBlank()) Thread {
                val appleGenre = SpotifyVideoLookup.genreFor(t, a)
                runOnUiThread {
                    if (trackIdentity == identity) {
                        genreDetector.setAppleGenre(appleGenre, SystemClock.uptimeMillis())
                        genre = genreDetector.genre
                    }
                }
            }.start()
        }
        title = m?.getString(MediaMetadata.METADATA_KEY_TITLE).orEmpty()
        songDurationMs = m?.getLong(MediaMetadata.METADATA_KEY_DURATION) ?: 0L
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
        clearVideos()
        videoPlaying = false
        if (track.isBlank() || artistName.isBlank()) return
        videoCache[key]?.let { cached -> videoClips = cached.filter { it.url !in videoFailed }; return }
        Thread {
            // Played before (last 30 days): use the stored list, no searching; the clips play from the phone.
            RaveVideoCache.loadList(this, key)?.let { stored ->
                android.util.Log.d("RaveVideo", "fra lagret liste: '$key' -> ${stored.size} klipp")
                runOnUiThread {
                    if (videoKey != key) return@runOnUiThread
                    videoCache[key] = stored
                    if (foreground) videoClips = stored.filter { it.url !in videoFailed }
                }
                stored.getOrNull(1)?.let { RaveVideoCache.preload(this, it) }
                return@Thread
            }
            val clips = SpotifyVideoLookup.findAll(track, artistName, album,
                isActive = { videoKey == key },
                // Grow the list in place: the clip already playing keeps its index.
                onUpdate = { list -> runOnUiThread { if (videoKey == key && foreground) videoClips = list.filter { it.url !in videoFailed } } })
            // Only a complete lookup is remembered (an interrupted one may be missing videos).
            if (videoKey == key) {
                RaveVideoCache.saveList(this, key, clips)
                clips.getOrNull(1)?.let { RaveVideoCache.preload(this, it) }
            }
            runOnUiThread { if (videoKey == key) videoCache[key] = clips }
        }.start()
    }

    private fun clearVideos() { videoClips = emptyList(); videoIndex = 0 }

    private fun nextVideo() {
        if (videoClips.size < 2) return
        videoPlaying = false
        videoIndex = (videoIndex + 1) % videoClips.size
    }

    // A clip that will not play is dropped, and the next one takes its place.
    /** [permanent] false = it only failed for lack of network: skip it now, but keep it in the stored list. */
    private fun dropVideo(url: String, permanent: Boolean = true) {
        val i = videoClips.indexOfFirst { it.url == url }
        videoFailed += url
        val key = videoKey
        videoCache[key]?.let { list -> videoCache[key] = list.filter { it.url != url } }
        if (permanent) Thread { RaveVideoCache.removeClip(this, key, url) }.start()
        if (i < 0) return
        videoPlaying = false
        videoClips = videoClips.filterIndexed { j, _ -> j != i }
        if (videoIndex > i || videoIndex >= videoClips.size) videoIndex = (videoIndex - 1).coerceAtLeast(0)
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

    private val audioManager by lazy { getSystemService(AudioManager::class.java) }
    private fun readVolume(): Float = try {
        val am = audioManager
        val max = am.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
        if (max > 0) am.getStreamVolume(AudioManager.STREAM_MUSIC).toFloat() / max else 1f
    } catch (_: Exception) { 1f }

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
                        // Is the Visualizer actually hearing anything? (Silent under Android Auto/USB.)
                        var loud = 0
                        for (i in 2 until minOf(fft.size, 130)) loud = maxOf(loud, kotlin.math.abs(fft[i].toInt()))
                        if (loud > 2) lastVisualizerSoundAt = SystemClock.uptimeMillis()
                        if (!micMode) handleFft(fft, samplingRate / 1000)
                    }
                }
            }, Visualizer.getMaxCaptureRate(), false, true)
            v.enabled = true
            visualizer = v
            visualizerStartedAt = SystemClock.uptimeMillis()
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

    @Composable
    private fun RaveScreen() {
        val transportVisible = controls.transport
        val mediaTogglesVisible = controls.media
        LaunchedEffect(controls.touchedAt) {
            delay(3_000)
            controls = controls.expire(SystemClock.elapsedRealtime())
        }
        LaunchedEffect(Unit) { controls = controls.touch(SystemClock.elapsedRealtime()) }
        var announcement by remember { mutableStateOf<String?>(null) }
        // Short label when the Party profile changes, e.g. "ROCK", "RAP", "HARDSTYLE".
        var genreBanner by remember { mutableStateOf<String?>(null) }
        // Shown once per song (what the app thinks it is) and whenever the profile changes.
        var bannerShownFor by remember { mutableLongStateOf(genreAnnouncedAt) }
        fun genreName() = vibeLabel(if (vibeAuto) autoVibeTarget() else vibeManual)
        // One banner at a time: a newer text is never cleared early by an older one's timer.
        var bannerToken by remember { mutableIntStateOf(0) }
        suspend fun banner(text: String, ms: Long) {
            val token = ++bannerToken
            genreBanner = text; delay(ms)
            if (bannerToken == token) genreBanner = null
        }
        LaunchedEffect(genreAnnouncedAt) {
            if (genreAnnouncedAt > 0L && genreAnnouncedAt != bannerShownFor) {
                bannerShownFor = genreAnnouncedAt
                // Only auto mode announces what it found; a hand-picked vibe stays quiet.
                if (vibeAuto) banner(genreName(), 1600)
            }
        }
        // Hardstyle sub-genre found (e.g. "RAW", "UPTEMPO") and song parts ("BUILD-UP",
        // "FAKE DROP", "FØRSTE DROP", "SISTE DROP", "SYNGING").
        var subShownFor by remember { mutableLongStateOf(subChangedAt) }
        LaunchedEffect(subChangedAt) {
            if (subChangedAt > 0L && subChangedAt != subShownFor && hardWeight(vibe) > .5f && rockness < .5f) { subShownFor = subChangedAt; banner(genreName(), 1600) }
        }
        var partShownFor by remember { mutableLongStateOf(partLabelAt) }
        LaunchedEffect(partLabelAt) {
            if (partLabelAt > 0L && partLabelAt != partShownFor && vibe >= .5f && songPhase.label.isNotBlank()) {
                partShownFor = partLabelAt
                banner(songPhase.label, 1300)
            }
        }
        var partyAnnounceReady by remember { mutableStateOf(false) }
        LaunchedEffect(hardstyleOn) {
            // Not on first start, only when Party is switched.
            if (!partyAnnounceReady) { partyAnnounceReady = true; return@LaunchedEffect }
            announcement = if (hardstyleOn) "PARTY ON" else "PARTY OFF"
            delay(1200); announcement = null
        }
        var visualTime by remember { mutableFloatStateOf(0f) }
        var audioIntensity by remember { mutableFloatStateOf(0f) }
        var coverCenter by remember { mutableStateOf<Offset?>(null) }
        var coverRadius by remember { mutableFloatStateOf(0f) }
        var sceneOrigin by remember { mutableStateOf(Offset.Zero) }
        var displayedFrame by remember { mutableStateOf(HardstyleFrame()) }
        // Spectrum eased every display frame (FFT only arrives ~20x/s): quick rise, slower fall.
        val smoothSpectrum = remember { FloatArray(SPECTRUM_BANDS) }
        val shakeDirection = remember { FloatArray(2) } // [angle, armed]
        val density = androidx.compose.ui.platform.LocalDensity.current
        LaunchedEffect(hardstyleOn, foreground, playing) {
            if (!hardstyleOn || !foreground) { shakeX = 0f; shakeY = 0f; shakeRotation = 0f; dip = 0f; dropHit = 0f; return@LaunchedEffect }
            var previous = 0L
            while (true) {
                withFrameNanos { now ->
                    val dt = if (previous == 0L) 0f else ((now-previous)/1e9f).coerceAtMost(.05f)
                    previous = now
                    val fresh = reactive && SystemClock.uptimeMillis()-hardstyleAudioAt < 300
                    val rawTarget = if (!playing || !fresh && reactive) HardstyleFrame() else if (fresh) hardstyleFrame
                        else HardstyleFrame()
                    // Advance the scene only while the live signal has energy. FFT noise
                    // below the floor cannot keep the background drifting during silence.
                    val activity = maxOf(rawTarget.bass, rawTarget.kick, rawTarget.highs, rawTarget.highMotion,
                        rawTarget.spectrum.maxOrNull() ?: 0f)
                    if (playing && ((!reactive && !fresh) || activity > .025f)) {
                        visualTime += dt * if (!reactive && !fresh) .3f else (.35f + activity)
                    }
                    audioIntensity = if (playing && ((!reactive && !fresh) || activity > .025f)) activity.coerceIn(0f, 1f) else 0f
                    val mix = 1f-kotlin.math.exp(-dt/(if (playing) .025f else .12f))
                    fun blend(a: Float,b: Float) = a+(b-a)*mix
                    // Vibe meter: what the visuals react to and how strongly, from the slider value.
                    val nowMs = SystemClock.uptimeMillis()
                    if (playing && fresh) genre = genreDetector.update(rawTarget, nowMs)
                    genreAnnouncedAt = genreDetector.announcedAt
                    // Rounded so the UI isn't recomposed every frame for invisible changes.
                    rockness = kotlin.math.round(genreDetector.rockness * 100f) / 100f
                    // Auto glides visibly to where the music belongs; a dragged value follows the finger.
                    val vibeGoal = if (vibeAuto) autoVibeTarget() else vibeManual
                    val glided = vibe + (vibeGoal - vibe) * (1f - kotlin.math.exp(-dt / if (vibeAuto) .6f else .12f))
                    vibe = if (abs(vibeGoal - glided) < .002f) vibeGoal else glided
                    val v = vibe
                    val r = rockness
                    val hardW = hardWeight(v)
                    // Beat clock: pump on the PREDICTED beat (slightly early) instead of after the kick
                    // is heard. The analysis (genre, song parts) still uses the detected kick.
                    if (!playing || !fresh) beatClock.reset()
                    val clockOn = v >= BEAT_CLOCK_FROM_VIBE
                    val clockKick = if (playing && fresh && clockOn) beatClock.pulse(rawTarget, nowMs, BEAT_LEAD_MS + syncMs) else null
                    val visualInput = if (clockKick != null) rawTarget.copy(kick = clockKick) else rawTarget
                    val shapedFull = vibeShape(visualInput, v, r)
                    // Song structure (hardstyle/EDM): calm intro, rising build-up, max chaos on the drop.
                    val phaseIntensity = if (playing && fresh)
                        songPhase.update(rawTarget, nowMs, positionMs(), if (songDurationMs > 0L) songDurationMs else -1L) else 1f
                    partLabelAt = songPhase.labelAt
                    // HUD: only while shown, at most ~7 times a second (no needless recomposition).
                    if (showAnalysis && hardstyleOn && nowMs - lastHudAt >= 150L) { hudData = songPhase.hud; lastHudAt = nowMs }
                    if (playing && fresh && hardW > 0f) { hardSub = hardSubDetector.update(rawTarget, nowMs); subChangedAt = hardSubDetector.changedAt }
                    // How much the song structure holds the effects back: full from EDM up, but live
                    // drums (rock) don't build to drops, so rockness lets go of it at the top.
                    // At the very top the song structure only holds back half as much (rock mode had
                    // none, which is part of why it felt harder): still calmer in intro/breakdown,
                    // max on the drop. Real rock lets go of it completely.
                    val sw = structureWeight(v) * (1f - hardW * max(r, .5f))
                    // Safety net: loud music for a long time without a recognised drop means the drop
                    // was missed — then stop holding back (why some hardstyle felt better in rock mode).
                    // Build-ups and breakdowns are meant to hold back, so they never count.
                    val heldOnPurpose = songPhase.part == SongPart.DROP || songPhase.part == SongPart.BUILDUP ||
                        songPhase.part == SongPart.BREAKDOWN || songPhase.part == SongPart.ANTI_CLIMAX
                    if (!playing || heldOnPurpose || rawTarget.energy < .3f) loudNoDropS = 0f
                    else if (rawTarget.energy > .55f) loudNoDropS += dt
                    val missedDrop = ((loudNoDropS - 20f) / 10f).coerceIn(0f, 1f)
                    val pi = max(1f + (phaseIntensity - 1f) * sw, .9f * missedDrop)
                    val inDrop = sw > 0f && songPhase.part == SongPart.DROP
                    // Strobe and ripples wait until a drop has proven real (2 s) — no chaos on fake drops.
                    val effectsOn = sw <= .5f || songPhase.effectsAllowed || missedDrop >= 1f
                    // Hardstyle-only extras (sub-genre feel, screech tremble) fade in toward the top
                    // and fade out as the song sounds more like rock.
                    val hsW = hardW * (1f - r)
                    val sub = hardSub
                    fun subMul(x: Float) = 1f + (x - 1f) * hsW
                    phaseLevel = pi.coerceAtMost(1f)
                    // Auto: let the slider ride the song. Structured songs follow the song part;
                    // the rest follow how full the music sounds right now.
                    val live = if (!playing) 0f else
                        (sw * pi.coerceAtMost(1f) + (1f - sw) * rawTarget.energy.coerceIn(0f, 1f)).coerceIn(0f, 1f)
                    val liveGoal = v * (.35f + .65f * live)
                    val liveNext = vibeLive + (liveGoal - vibeLive) * (1f - kotlin.math.exp(-dt / .35f))
                    // Rounded so the slider redraws only when it visibly moves.
                    vibeLive = kotlin.math.round(liveNext * 200f) / 200f
                    screechShake = hsW * when {
                        songPhase.part == SongPart.DROP && effectsOn -> sub.screech * (if (songPhase.dropKind == DropKind.LAST) 1.3f else 1f)
                        songPhase.part == SongPart.DROP -> .5f * sub.screech
                        else -> 0f
                    }
                    val shaped = when {
                        sw <= 0f -> shapedFull
                        // In the drop the effects follow the music's own heaviness (no forced full
                        // input — Espen prefers a bit too little over too much chaos).
                        inDrop -> shapedFull.copy(heavy = (shapedFull.heavy * pi).coerceAtMost(1f),
                            grit = if (effectsOn) shapedFull.grit else 0f)
                        // Outside the drop: keep pumping to every beat; only the chaos is held back.
                        else -> shapedFull.copy(
                            heavy = (shapedFull.heavy * pi).coerceAtMost(1f),
                            kick = shapedFull.kick * (.6f + .4f * pi.coerceAtMost(1f)),
                            grit = if (missedDrop >= 1f) shapedFull.grit else shapedFull.grit * (1f - sw)
                        )
                    }
                    // ---- Festival show rules (FestivalShow.kt) ----
                    val showW = structureWeight(v) * (1f - .7f * r * hardW)
                    val hud = songPhase.hud
                    val part = songPhase.part
                    // Build-up RISES (denser particles, pump on the snare roll) instead of only being held back.
                    val buildRise = if (part == SongPart.BUILDUP) hud.build.coerceIn(0f, 1f) * showW else 0f
                    // Breath in before the drop: last bar of the phrase in a ready build-up, or a
                    // build-up near its peak → the scene darkens; the drop then hits out of the dark.
                    // "Last bar of the phrase" is only trusted once a drop has locked the phrase grid.
                    val hadDip = dip > .3f || dipStartedAt > 0L || dipSpent   // read before the reset below
                    if (part != SongPart.BUILDUP) { dipStartedAt = 0L; dipSpent = false }
                    val dipWanted = if (part == SongPart.BUILDUP && hud.ready && !dipSpent) showW * maxOf(
                        if (songPhase.drops >= 1 && hud.barInPhrase == 8) 1f else 0f,
                        ((hud.build - PRE_DROP_BUILD_START) / (1f - PRE_DROP_BUILD_START)).coerceIn(0f, 1f)) else 0f
                    if (dipWanted > .3f && dipStartedAt == 0L) dipStartedAt = nowMs
                    // Never stay dark: one dip per build-up, at most PRE_DROP_DIP_MAX_MS.
                    if (dipStartedAt > 0L && nowMs - dipStartedAt > PRE_DROP_DIP_MAX_MS) dipSpent = true
                    val dipGoal = if (dipSpent) 0f else dipWanted
                    val dipNext = if (part == SongPart.DROP) 0f
                        else dip + (dipGoal - dip) * (1f - kotlin.math.exp(-dt / if (dipGoal > dip) .3f else .5f))
                    dip = kotlin.math.round(dipNext * 100f) / 100f
                    // The drop lands: ONE big hit on beat one (strobe only after the drop is confirmed).
                    // Full strength when it came out of a breath-in (a real build-up); softer otherwise,
                    // since an unprepared drop may still turn out to be a fake.
                    if (part == SongPart.DROP && lastPart != SongPart.DROP && showW > .3f && flashBudget.tryFlash(nowMs))
                        dropHit = if (hadDip) 1f else DROP_HIT_UNSURE
                    else if (dropHit > 0f) dropHit = (dropHit * kotlin.math.exp(-dt / DROP_HIT_DECAY_S)).let { if (it < .01f) 0f else it }
                    lastPart = part
                    // A new look every 8 bars (one phrase) and for each drop, so a long drop never goes flat.
                    val inShowDrop = part == SongPart.DROP && showW > 0f
                    dropLook = if (inShowDrop) (hud.phrase + songPhase.drops) % 3 else 0
                    val lookSpike = if (!inShowDrop) 1f else when (dropLook) { 1 -> 1.2f; else -> .95f }
                    val lookShake = if (!inShowDrop) 1f else when (dropLook) { 0 -> 1.15f; 1 -> .75f; else -> .9f }
                    val lookParticles = if (inShowDrop && dropLook == 1) 1.1f else 1f
                    flashesNow = flashBudget.perSecond(nowMs)
                    val p = vibeProfile(v, r)
                    // Strobe only in the drop; shake/particles/spikes follow the song part.
                    partyProfile = PartyProfile(
                        p.spike * (.75f + .25f * pi) * subMul(sub.spike) * lookSpike,
                        p.particles * (.6f + .4f * pi) * subMul(sub.particles) * (1f + .8f * buildRise) * lookParticles,
                        p.shake * pi * subMul(sub.shake) * lookShake,
                        p.strobe * (if (effectsOn && pi >= .9f) 1f else 0f) * subMul(sub.strobe),
                        p.density * (1f + .5f * buildRise), p.softness)
                    val target = if (buildRise > 0f) shaped.copy(kick = max(shaped.kick, shaped.snare * .6f * buildRise)) else shaped
                    val liveSpectrum = playing && fresh
                    for (i in 0 until SPECTRUM_BANDS) {
                        val goal = if (liveSpectrum) target.spectrum[i] else 0f
                        val current = smoothSpectrum[i]
                        val tau = if (goal > current) .022f else .13f
                        var value = current + (goal - current) * (1f - kotlin.math.exp(-dt / tau))
                        if (value < .0001f) value = 0f
                        smoothSpectrum[i] = value
                    }
                    displayedFrame = HardstyleFrame(blend(displayedFrame.bass,target.bass),
                        // Hits (kick, burst) pass straight through: smoothing them only made them late and soft.
                        if (clockOn) target.kick else blend(displayedFrame.kick, target.kick),blend(displayedFrame.highs,target.highs),
                        blend(displayedFrame.energy,target.energy),if (clockOn) target.burst else blend(displayedFrame.burst, target.burst),blend(displayedFrame.build,target.build),
                        spectrum = smoothSpectrum.toList(),
                        highMotion = blend(displayedFrame.highMotion, if (playing && fresh) target.highMotion else 0f),
                        heavy = blend(displayedFrame.heavy, target.heavy),
                        grit = blend(displayedFrame.grit, target.grit),
                        bpm = target.bpm, snare = target.snare, crash = target.crash, sub = target.sub, level = target.level, screech = blend(displayedFrame.screech, target.screech),
                        bassLevel = target.bassLevel, air = target.air, subLevel = target.subLevel,
                        presence = target.presence, beat = target.beat)
                    // Camera shake (Trap Nation style): each kick punches the scene in a new random
                    // direction and settles with the kick's decay; screeches add a light tremble.
                    with(density) {
                        val f = displayedFrame
                        val ramp = loudRamp(volume)
                        val punch = partyProfile.shake * f.kick * volumeGain(volume) *
                            (f.heavy * (10.dp.toPx() + loudness(volume) * 4.dp.toPx()) * (1f + ramp * .8f) + ramp * 5.dp.toPx())
                        val tremble = screechShake * f.screech * 7.dp.toPx() * volumeGain(volume)
                        if (f.kick < .3f) shakeDirection[1] = 1f
                        if (f.kick > .55f && shakeDirection[1] == 1f) {
                            shakeDirection[1] = 0f
                            shakeDirection[0] = (Math.random() * 2 * PI).toFloat()
                        }
                        val s = (SystemClock.uptimeMillis() % 1_000_000L) / 1000f
                        val wobble = punch * .35f + tremble
                        val x = cos(shakeDirection[0]) * punch + sin(s * 61f) * wobble
                        val y = sin(shakeDirection[0]) * punch + cos(s * 47f) * wobble
                        val big = punch + tremble > .5f
                        shakeX = if (big) x else 0f
                        shakeY = if (big) y else 0f
                        // A hint of rotation only on heavy hits (max ~0.8°).
                        shakeRotation = if (big) (f.heavy * f.kick * .8f * if (shakeDirection[0] > PI) -1f else 1f) else 0f
                    }
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
        // Drop look 2: the colours rotate (one step per phrase), like an LD switching palettes.
        val showPalette = if (dropLook == 2 && hardPalette.size > 1) hardPalette.drop(1) + hardPalette.take(1) else hardPalette
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
                val nowMs = SystemClock.uptimeMillis()
                if (nowMs - volumeReadAt > 250) {
                    volumeReadAt = nowMs
                    volume = readVolume()
                    // Visualizer silent for 2.5 s while music plays → listen through the microphone;
                    // switch back when the Visualizer hears sound again.
                    if (playing && visualizer != null && !micMode && nowMs - visualizerStartedAt > 2_500L &&
                        nowMs - lastVisualizerSoundAt > 2_500L &&
                        checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) startMic()
                    if (micMode && nowMs - lastVisualizerSoundAt < 500L) { stopMic(); hardstyleAudio.reset() }
                }
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
        lyricsPulse = { if (hardstyleOn) max(displayedFrame.kick, displayedFrame.bass * .6f) else beat }

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
            // Background shakes with the scene, slightly zoomed in so its edges never show.
            Canvas(Modifier.fillMaxSize().onGloballyPositioned {
                sceneOrigin = it.positionInRoot()
            }.sceneShake(overscan = true)) {
                val w = size.width
                val h = size.height
                val base = min(w, h)
                val lightTravel = if (hardstyleOn) .40f else .22f
                // Party lighting should hit with the music instead of only drifting
                // smoothly. Kick and bass pull each glow outward on every transient.
                // Background lights follow the song part too: calm parts flash much less.
                val partyHit = if (hardstyleOn) (.3f + .7f * phaseLevel) *
                    (maxOf(displayedFrame.kick, displayedFrame.bass * .55f, displayedFrame.highMotion * .2f) +
                        displayedFrame.heavy * displayedFrame.kick * .4f +
                        (displayedFrame.spectrum.maxOrNull() ?: 0f) * .25f * volumeGain(volume)).coerceAtMost(1.6f)
                else 0f
                val heavyFlash = if (hardstyleOn) displayedFrame.heavy * displayedFrame.kick * (.6f + .4f * loudness(volume)) else 0f
                // Sub bass → glow; screech → colour shift toward the next palette colour.
                val showOn = if (hardstyleOn) structureWeight(vibe) else 0f
                val subGlow = .12f * displayedFrame.sub * displayedFrame.bass * showOn
                val screechTint = (displayedFrame.screech * .7f * showOn).coerceAtMost(.7f)
                palette.forEachIndexed { i, paletteColor ->
                    val col = if (screechTint > .01f) androidx.compose.ui.graphics.lerp(paletteColor, palette[(i + 1) % palette.size], screechTint) else paletteColor
                    val a = t + i * 2.1f
                    val drift = Offset(w * (0.5f + lightTravel * cos(a)), h * (0.5f + lightTravel * .9f * sin(a * 1.3f)))
                    val hitAngle = i * 2.399963f
                    val hitOffset = Offset(cos(hitAngle), sin(hitAngle)) * (base * partyHit * .12f)
                    val c = drift + hitOffset
                    val r = base * (0.6f + 0.35f * energy) * (1f + partyHit * .1f)
                    drawCircle(
                        brush = Brush.radialGradient(
                            listOf(col.copy(alpha = ((0.45f + 0.35f * energy + partyHit * .18f + subGlow)).coerceIn(0f,.95f)), Color.Transparent),
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
                // Breath in before the drop: the lights go almost dark.
                if (dip > .01f) drawRect(Color.Black.copy(alpha = PRE_DROP_DIP_DEPTH * dip))
                // Strobe: max volume + heavy distorted kicks (zaag etc.) flash the whole scene,
                // alternating cover colours. Kick decays in ~85 ms, so each flash is short.
                // Rock flashes on cymbal crashes instead; rap and standard have no strobe.
                // HARD mixes the two: hardstyle flashes on heavy kicks, rock on cymbals.
                val strobeSource = max(displayedFrame.kick * displayedFrame.heavy, displayedFrame.crash * hardWeight(vibe))
                // Hardstyle strobes from 70 % volume (max chaos on the drop); others from 85 %.
                val strobeFrom = .85f - .15f * hardWeight(vibe)
                val strobeRaw = if (hardstyleOn) partyProfile.strobe * strobeSource *
                    ((volume - strobeFrom) / .15f).coerceIn(0f, 1f) else 0f
                // Safety: never more than 2.5 flashes per second (under the 3 Hz limit for people
                // sensitive to flashing light) — matters at uptempo, where kicks come 3+ times/s.
                val strobeNow = SystemClock.uptimeMillis()
                // All flash types share one budget: at most 3 full-screen flashes in any second.
                if (strobeRaw > .3f && strobeNow - lastStrobeAt >= 400L && flashBudget.tryFlash(strobeNow)) { lastStrobeAt = strobeNow; strobeColorIndex++ }
                val strobe = if (strobeNow - lastStrobeAt < 120L) strobeRaw else 0f
                if (strobe > 0.03f) {
                    // Each flash takes the next cover colour.
                    // Mixed with white: no saturated (red) colour flashes.
                    val strobeColor = androidx.compose.ui.graphics.lerp(hardPalette[strobeColorIndex % hardPalette.size], Color.White, STROBE_WHITE_MIX)
                    drawRect(strobeColor.copy(alpha = (0.45f * strobe).coerceAtMost(.45f)))
                    drawRect(
                        Brush.radialGradient(
                            listOf(Color.White.copy(alpha = 0.35f * strobe), Color.Transparent),
                            center = center, radius = max(w, h) * 0.6f
                        )
                    )
                }
                // The white heavy-flash obeys the same 2.5-flashes-per-second cap as the strobe.
                val flashNow = SystemClock.uptimeMillis()
                if (heavyFlash > .3f && flashNow - lastHeavyFlashAt >= 400L && flashNow - lastStrobeAt >= 120L &&
                    flashBudget.tryFlash(flashNow)) lastHeavyFlashAt = flashNow
                if (heavyFlash > 0.02f && flashNow - lastHeavyFlashAt < 120L) {
                    drawRect(
                        Brush.radialGradient(
                            listOf(Color.White.copy(alpha = 0.25f * heavyFlash), Color.Transparent),
                            center = center, radius = max(w, h) * 0.9f
                        )
                    )
                }
                // The drop's single big hit (fades out over ~0.6 s).
                val hit = dropHit
                if (hit > .02f) drawRect(
                    Brush.radialGradient(
                        listOf(Color.White.copy(alpha = .6f * hit), hardPalette.first().copy(alpha = .3f * hit), Color.Transparent),
                        center = center, radius = max(w, h) * .9f
                    )
                )
                drawRect(
                    Brush.radialGradient(
                        listOf(Color.Transparent, Color.Black.copy(alpha = 0.65f)),
                        center = center, radius = max(w, h) * 0.8f
                    )
                )
            }

            val showVideo = foreground && videoOn && videoPlaying && videoId != null
            if (foreground && videoOn && videoId != null) {
                androidx.compose.runtime.key(videoId) {
                    AndroidView(
                        factory = { ctx ->
                            val clip = videoClips[videoIndex]; val url = clip.url
                            if (clip.kind == SpotifyVideoLookup.Kind.YOUTUBE)
                                YouTubeClipView(ctx, url, onFrame = { videoPlaying = true }, onFailure = { dropVideo(url) })
                            else SilentClipView(ctx, url, onFrame = { videoPlaying = true }, onFailure = { permanent -> dropVideo(url, permanent) })
                        },
                        update = { (it as ClipPlayer).setPlaying(playing) },
                        onRelease = { (it as ClipPlayer).release() },
                        // The music video shakes with the scene too (zoomed slightly so edges never show).
                        modifier = Modifier.fillMaxSize().sceneShake(overscan = true)
                    )
                }
            }

            if (hardstyleOn && foreground) {
                coverCenter?.let { center ->
                    HardstyleBackdrop(Modifier.fillMaxSize().graphicsLayer { alpha = 1f - PRE_DROP_DIP_DEPTH * dip }.sceneShake(),
                        displayedFrame, visualTime, showPalette, showVideo,
                        center, coverRadius, audioIntensity, volume, particles = partyProfile.particles,
                        density = partyProfile.density, softness = partyProfile.softness)
                }
            }
            // Same layout with or without video: cover, title and controls stay in place,
            // the music video just plays behind them with a dark veil for readability.
            BoxWithConstraints(
                Modifier.fillMaxSize()
                    .background(when {
                        showVideo -> Color.Black.copy(alpha = 0.55f)
                        else -> Color.Transparent
                    })
                    .padding(24.u),
                contentAlignment = Alignment.Center
            ) {
                val wide = maxWidth > maxHeight
                // On wide screens (the car): cover with title and buttons underneath. Centered
                // without lyrics; slides smoothly to the left when lyrics come in on the right.
                if (wide) {
                    val layoutHeight = maxHeight.value
                    val layoutWidth = maxWidth.value
                    val lyricsShift by animateFloatAsState(
                        if (showLyrics) 1f else 0f,
                        tween(350, easing = androidx.compose.animation.core.CubicBezierEasing(.77f, 0f, .175f, 1f)),
                        label = "lyricsShift"
                    )
                    Row(
                        Modifier.fillMaxSize(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Cover gets what is left after title, artist and buttons (~150 dp scaled),
                        // so everything always fits vertically — tuned for the Kenwood 800x480 screen.
                        val scale = LocalRaveScale.current
                        val coverSize = minOf(layoutHeight - 150f * scale, layoutWidth * 0.4f, 300f * scale).coerceAtLeast(120f).dp
                        Column(
                            Modifier.weight(0.44f + 0.56f * (1f - lyricsShift)),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            ReactiveCover(coverSize, displayedFrame, showPalette, sceneOrigin) { center, radius ->
                                coverCenter = center; coverRadius = radius
                            }
                            Spacer(Modifier.height(12.u))
                            Info(Modifier.fillMaxWidth(), Alignment.CenterHorizontally, includeLyrics = false, transportVisible = transportVisible, mediaTogglesVisible = false, onTransportInteraction = ::buttonInteraction, modeButtonsAllowed = false, compact = true)
                        }
                        if (lyricsShift > 0.001f) {
                            Spacer(Modifier.width((24f * lyricsShift).u))
                            Column(
                                Modifier.weight(0.56f * lyricsShift).fillMaxHeight()
                                    .graphicsLayer { alpha = lyricsShift }
                                    .clip(RoundedCornerShape(20.u))
                                    .then(
                                        if (lyricsGlass) Modifier
                                            .background(Brush.verticalGradient(listOf(Color(0x33141018), Color(0x4D0A080C))))
                                            .background(Brush.verticalGradient(listOf(Color(0x24FFFFFF), Color(0x0DFFFFFF))))
                                            .border(1.dp, Color(0x29FFFFFF), RoundedCornerShape(20.u))
                                        else Modifier
                                    )
                                    .padding(horizontal = 18.u, vertical = 12.u),
                                horizontalAlignment = Alignment.Start
                            ) {
                                LyricsSwipeArea(Modifier.weight(1f).fillMaxWidth()) {
                                    LyricsView(Alignment.Start, fill = true)
                                }
                                if (showLyrics && (mediaTogglesVisible || partyControls)) {
                                    Spacer(Modifier.height(12.u))
                                    ModeButtons(mediaTogglesVisible)
                                }
                            }
                        }
                    }
                    // Without lyrics the mode buttons sit in the top-right corner: always free,
                    // so they never cover the play buttons, even on the small Kenwood screen.
                    if (!showLyrics && (mediaTogglesVisible || partyControls)) {
                        Box(Modifier.align(Alignment.TopEnd)) { ModeButtons(mediaTogglesVisible, stackGenres = true) }
                    }
                } else {
                    val f = if (showLyrics) 0.62f else 1f
                    val artSize: Dp = if (wide) (min(maxHeight.value * 0.72f, 340f * LocalRaveScale.current) * f).dp else (min(maxWidth.value * 0.75f, 340f * LocalRaveScale.current) * f).dp
                    if (wide) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.Center) {
                        ReactiveCover(artSize, displayedFrame, showPalette, sceneOrigin) { center, radius ->
                            coverCenter = center; coverRadius = radius
                        }
                        Spacer(Modifier.width(40.u))
                        Info(Modifier.widthIn(max = if (showLyrics) 680.u else 520.u), Alignment.Start, transportVisible = transportVisible, mediaTogglesVisible = mediaTogglesVisible, onTransportInteraction = ::buttonInteraction)
                    }
                } else {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                        ReactiveCover(artSize, displayedFrame, showPalette, sceneOrigin) { center, radius ->
                            coverCenter = center; coverRadius = radius
                        }
                        Spacer(Modifier.height(32.u))
                        Info(Modifier, Alignment.CenterHorizontally, transportVisible = transportVisible, mediaTogglesVisible = mediaTogglesVisible, onTransportInteraction = ::buttonInteraction)
                    }
                }
                }
            }

            if (hardstyleOn && showAnalysis && vibe >= .5f)
                AnalysisHud(Modifier.align(Alignment.TopStart).padding(start = if (partyControls) 100.u else 12.u, end = 12.u, bottom = 12.u,
                    top = if (transportVisible) 96.u else 12.u))
            // Vibe slider: shown with the other buttons (one tap) while Party is on.
            if (partyControls) BoxWithConstraints(
                Modifier.align(Alignment.CenterStart).fillMaxHeight()
                    .padding(start = 16.u, top = 76.u, bottom = 16.u),
                contentAlignment = Alignment.CenterStart
            ) {
                VibeSlider(minOf(maxHeight - 62.u, 300.u).coerceAtLeast(120.u))
            }
            if (genreBanner != null && hardstyleOn && announcement == null) Text(genreBanner!!, color=Color.White,
                modifier=Modifier.align(Alignment.TopCenter).padding(16.u).background(Color.Black.copy(alpha=.7f)).padding(12.u))
            if (announcement != null) Text(announcement!!, color=Color.White,
                modifier=Modifier.align(Alignment.TopCenter).padding(16.u).background(Color.Black.copy(alpha=.7f)).padding(12.u))
            if (!hasAccess) Notice("Rave trenger tilgang til hva som spilles.\nInnstillinger → Varsler → Enhetstilgang til varsler → Bilnett Rave.")
            // Tilbake til app-oversikten i bilen (Rave skjuler ellers systemlinjene).
            // Vises sammen med pause/skip etter ett trykk, øverst i venstre hjørne.
            if (transportVisible) Box(Modifier.align(Alignment.TopStart).padding(16.u)) {
                Control(Icons.Rounded.Apps, 44.u, ::buttonInteraction) { exitToApps() }
            }
        }
    }

    /** Reserve exactly the normal cover slot so text and controls never move when toggling. */
    // 5 quick taps on the cover switch Party on/off (with a short «PARTY ON/OFF» label).
    private var coverTaps = 0
    private var coverFirstTap = 0L

    /** Counts taps anywhere on the cover square. Not consumed, so a tap still shows the buttons. */
    private fun Modifier.partyTaps(): Modifier = pointerInput(Unit) {
        awaitEachGesture {
            val down = awaitFirstDown(requireUnconsumed = false)
            var isTap = true
            while (true) {
                val event = awaitPointerEvent()
                val c = event.changes.firstOrNull { it.id == down.id }
                if (c == null) { isTap = false; break }
                if ((c.position - down.position).getDistance() > viewConfiguration.touchSlop) isTap = false
                if (!c.pressed) break
            }
            if (!isTap) return@awaitEachGesture
            val now = SystemClock.uptimeMillis()
            if (coverTaps == 0 || now - coverFirstTap > 1_500L) { coverTaps = 1; coverFirstTap = now } else coverTaps++
            if (coverTaps >= 5) { coverTaps = 0; setHardstyle() }
        }
    }

    @Composable
    private fun ReactiveCover(
        size: Dp,
        frame: HardstyleFrame,
        palette: List<Color>,
        sceneOrigin: Offset,
        onPosition: (Offset, Float) -> Unit
    ) {
        if (!hardstyleOn) {
            Box(Modifier.size(size).partyTaps()) { Cover(size) }
            return
        }
        Box(Modifier.size(size).partyTaps().onGloballyPositioned { coordinates ->
            val position = coordinates.positionInRoot() - sceneOrigin
            onPosition(
                Offset(position.x + coordinates.size.width/2f, position.y + coordinates.size.height/2f),
                min(coordinates.size.width, coordinates.size.height) * .5f
            )
        }.sceneShake(), contentAlignment = Alignment.Center) {
            androidx.compose.runtime.key(trackIdentity, foreground) {
                HardstyleOrb(Modifier.fillMaxSize(), frame, palette, roundedSquare = true, volume = volume, spikeGain = partyProfile.spike)
            }
            Cover(size * .86f, scale = 1f + frame.kick * (.045f + frame.heavy * .09f) * volumeGain(volume) * (.4f + .6f * phaseLevel))
            // Snare → a short glow around the cover's edge (its own hero, so the kick isn't doing everything).
            val edge = frame.snare * structureWeight(vibe)
            if (edge > .05f) Canvas(Modifier.size(size * .9f)) {
                drawRoundRect(Color.White.copy(alpha = (.55f * edge).coerceAtMost(.55f)),
                    cornerRadius = androidx.compose.ui.geometry.CornerRadius(this.size.minDimension * .12f),
                    style = androidx.compose.ui.graphics.drawscope.Stroke(3.dp.toPx()))
            }
        }
    }

    @Composable
    private fun Cover(size: Dp, scale: Float = 1f) {
        val mod = Modifier.size(size).graphicsLayer { scaleX=scale; scaleY=scale }
            .clip(RoundedCornerShape(20.u))
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
        modeButtonsAllowed: Boolean = true,
        /** Smaller title/artist, as in the lyrics layout. The car layout always uses this. */
        compact: Boolean = showLyrics
    ) {
        val ta = if (align == Alignment.CenterHorizontally) TextAlign.Center else TextAlign.Start
        val narrow = align == Alignment.CenterHorizontally
        Column(modifier, horizontalAlignment = align) {
            Text(
                title.ifBlank { "Start Spotify" }, textAlign = ta, fontFamily = FontFamily.Default,
                color = Color(0xFFF5F2EC), fontSize = if (compact) 20.us else 36.us, fontWeight = FontWeight.SemiBold,
                maxLines = if (compact) 1 else 2, overflow = TextOverflow.Ellipsis, lineHeight = if (compact) 24.us else 40.us
            )
            Spacer(Modifier.height(8.u))
            Text(
                artist.ifBlank { "Spill av noe, så starter Rave" }, textAlign = ta, fontFamily = BodyFont,
                color = Color(0xB3F5F2EC), fontSize = if (compact) 15.us else 20.us, maxLines = 1, overflow = TextOverflow.Ellipsis
            )
            if (showLyrics && includeLyrics) {
                Spacer(Modifier.height(18.u))
                LyricsView(align)
            }
            if (transportVisible || mediaTogglesVisible || (modeButtonsAllowed && partyControls)) {
                Spacer(Modifier.height(if (compact) 18.u else 28.u))
                FlowRow(verticalArrangement = Arrangement.spacedBy(12.u), horizontalArrangement = Arrangement.spacedBy(28.u)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                    if (transportVisible) {
                        Control(Icons.Rounded.SkipPrevious, 44.u, onTransportInteraction) { controller?.transportControls?.skipToPrevious() }
                        Spacer(Modifier.width(28.u))
                        Control(if (playing) Icons.Rounded.Pause else Icons.Rounded.PlayArrow, 60.u, onTransportInteraction) {
                            val tc = controller?.transportControls
                            if (playing) tc?.pause() else tc?.play()
                        }
                        Spacer(Modifier.width(28.u))
                        Control(Icons.Rounded.SkipNext, 44.u, onTransportInteraction) { controller?.transportControls?.skipToNext() }
                    }
                    }
                    if (modeButtonsAllowed && !narrow && (mediaTogglesVisible || (modeButtonsAllowed && partyControls))) ModeButtons(mediaTogglesVisible)
                }
                if (modeButtonsAllowed && narrow && (mediaTogglesVisible || (modeButtonsAllowed && partyControls))) {
                    Spacer(Modifier.height(12.u))
                    ModeButtons(mediaTogglesVisible)
                }

            }
        }
    }

    @OptIn(ExperimentalLayoutApi::class)
    @Composable
    private fun ModeButtons(mediaVisible: Boolean, stackGenres: Boolean = false) {
        Column(horizontalAlignment = if (stackGenres) Alignment.End else Alignment.Start) {
        FlowRow(horizontalArrangement=Arrangement.spacedBy(10.u), verticalArrangement=Arrangement.spacedBy(8.u)) {
            if (mediaVisible) {
                LyricsButton()
                if (videoId != null) VideoButton()
                if (videoOn && videoClips.size > 1) NextVideoButton()
            }
            // No Party button: 5 quick taps switch Party on/off.
        }
        // With Party on: the analysis toggle (the vibe slider itself sits on the left edge).
        if (partyControls) {
            Spacer(Modifier.height(10.u))
            if (stackGenres) Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(6.u)) { GenreChips() }
            else FlowRow(horizontalArrangement = Arrangement.spacedBy(8.u), verticalArrangement = Arrangement.spacedBy(6.u)) { GenreChips() }
        }
        }
    }

    @Composable
    private fun GenreChips() {
        // Toggle for the live analysis panel (so Espen can give feedback on what is detected).
        Box(
            Modifier.height(42.u).clip(RoundedCornerShape(50))
                .background(if (showAnalysis) Color(0xFFF5F2EC) else Color(0x22FFFFFF))
                .clickable {
                    buttonInteraction(); showAnalysis = !showAnalysis; if (!showAnalysis) stopTapTest()
                    try { getSharedPreferences("rave", MODE_PRIVATE).edit().putBoolean("analysis", showAnalysis).apply() } catch (_: Exception) { }
                }
                .padding(horizontal = 18.u),
            contentAlignment = Alignment.Center
        ) {
            Text("Analyse", maxLines = 1, softWrap = false, fontSize = 15.us, fontWeight = FontWeight.SemiBold,
                color = if (showAnalysis) Color(0xFF0A0A0A) else Color(0xFFF5F2EC))
        }
        // Car sync (shown with the analysis): nudge the visuals earlier/later, or tap along to measure.
        if (showAnalysis) {
            @Composable
            fun pill(text: String, on: Boolean = false, onClick: () -> Unit) = Box(
                Modifier.height(42.u).clip(RoundedCornerShape(50))
                    .background(if (on) Color(0xFFF5F2EC) else Color(0x22FFFFFF))
                    .clickable { buttonInteraction(); onClick() }
                    .padding(horizontal = 16.u),
                contentAlignment = Alignment.Center
            ) {
                Text(text, maxLines = 1, softWrap = false, fontSize = 15.us, fontWeight = FontWeight.SemiBold,
                    color = if (on) Color(0xFF0A0A0A) else Color(0xFFF5F2EC))
            }
            Row(horizontalArrangement = Arrangement.spacedBy(6.u), verticalAlignment = Alignment.CenterVertically) {
                pill("−") { syncMs = (syncMs - SYNC_STEP_MS).coerceAtLeast(-SYNC_LIMIT_MS); saveSync() }
                Text("Synk ${if (syncMs > 0) "+" else ""}$syncMs ms", maxLines = 1, softWrap = false,
                    fontSize = 15.us, color = Color(0xFFF5F2EC))
                pill("+") { syncMs = (syncMs + SYNC_STEP_MS).coerceAtMost(SYNC_LIMIT_MS); saveSync() }
            }
            // Measured on finger DOWN (a normal click fires on release, ~100 ms late).
            Box(
                Modifier.height(42.u).clip(RoundedCornerShape(50))
                    .background(if (tapMode) Color(0xFFF5F2EC) else Color(0x22FFFFFF))
                    .pointerInput(Unit) {
                        awaitEachGesture {
                            val down = awaitFirstDown()
                            down.consume()
                            buttonInteraction()
                            when {
                                // The calibration only matters where the beat clock is used.
                                vibe < BEAT_CLOCK_FROM_VIBE -> stopTapTest()
                                !tapMode -> { tapMode = true; syncTapper.reset(); tapCount = 0 }
                                // No beat found yet: a tap cancels instead of hanging forever.
                                !beatClock.active -> stopTapTest()
                                else -> {
                                syncTapper.tap(down.uptimeMillis, hardstyleFrame)?.let { syncMs = it; saveSync(); tapMode = false }
                                tapCount = syncTapper.taps
                                }
                            }
                        }
                    }
                    .padding(horizontal = 16.u),
                contentAlignment = Alignment.Center
            ) {
                Text(when {
                    vibe < BEAT_CLOCK_FROM_VIBE -> "Synk: skru opp vibe"
                    !tapMode -> "Trykk i takt"
                    !beatClock.active -> "Venter på takt (trykk = avbryt)"
                    else -> "Trykk på slaget $tapCount/$SYNC_TAPS"
                }, maxLines = 1, softWrap = false, fontSize = 15.us, fontWeight = FontWeight.SemiBold,
                    color = if (tapMode) Color(0xFF0A0A0A) else Color(0xFFF5F2EC))
            }
        }
    }

    /** Accent from the Timetracker app (hsl 271 81% 61%). */
    /** Dragging takes over from auto; saved when the finger lifts. */
    private fun dragVibe(v: Float) { vibeAuto = false; vibeManual = v.coerceIn(0f, 1f) }

    /**
     * The vibe meter: a vertical slider, calm at the bottom and full hardstyle/rock at the top.
     * No labels: the filled length shows the level. Drag or tap anywhere on it; "Auto" hands it back to the app.
     */
    @Composable
    private fun VibeSlider(trackHeight: Dp) {
        val thumb = 40.u
        val trackWidth = 8.u
        val cream = Color(0xFFF5F2EC)
        Column {
            Row {
                Box(
                    Modifier.width(64.u).height(trackHeight).pointerInput(Unit) {
                        val thumbPx = thumb.toPx()
                        fun valueAt(y: Float) =
                            (1f - (y - thumbPx / 2f) / (size.height - thumbPx).coerceAtLeast(1f)).coerceIn(0f, 1f)
                        awaitEachGesture {
                            val down = awaitFirstDown()
                            down.consume()
                            buttonInteraction()
                            dragVibe(valueAt(down.position.y))
                            try {
                                while (true) {
                                    val change = awaitPointerEvent().changes.firstOrNull { it.id == down.id } ?: break
                                    if (!change.pressed) break
                                    change.consume()
                                    dragVibe(valueAt(change.position.y))
                                }
                            } finally {
                                setVibe(vibeManual)
                                buttonInteraction()
                            }
                        }
                    }
                ) {
                    Canvas(Modifier.fillMaxSize()) {
                        val tp = thumb.toPx(); val tw = trackWidth.toPx()
                        val cx = size.width / 2f
                        val top = tp / 2f; val bottom = size.height - tp / 2f
                        // Read while drawing: in auto the slider moves with the song without recomposing.
                        val shown = if (vibeAuto) vibeLive else vibeManual
                        val y = bottom - shown * (bottom - top)
                        // Plain slider: grey track, white fill and a white thumb.
                        val corner = androidx.compose.ui.geometry.CornerRadius(tw / 2f)
                        drawRoundRect(Color(0x22FFFFFF), Offset(cx - tw / 2f, top - tw / 2f),
                            androidx.compose.ui.geometry.Size(tw, bottom - top + tw), corner)
                        drawRoundRect(cream, Offset(cx - tw / 2f, y),
                            androidx.compose.ui.geometry.Size(tw, bottom - y + tw / 2f), corner)
                        drawCircle(Color.Black.copy(alpha = .3f), tp / 2f + 2.dp.toPx(), Offset(cx, y))
                        drawCircle(cream, tp / 2f, Offset(cx, y))
                    }
                }
            }
            Spacer(Modifier.height(12.u))
            Box(
                Modifier.height(42.u).clip(RoundedCornerShape(50))
                    .background(if (vibeAuto) cream else Color(0x22FFFFFF))
                    .clickable { buttonInteraction(); setVibe(null) }
                    .padding(horizontal = 18.u),
                contentAlignment = Alignment.Center
            ) {
                Text("Auto", maxLines = 1, softWrap = false, fontSize = 15.us, fontWeight = FontWeight.SemiBold,
                    color = if (vibeAuto) Color(0xFF0A0A0A) else cream)
            }
        }
    }

    @Composable
    private fun LyricsButton() {
        val on = showLyrics
        Box(
            Modifier.height(64.u).clip(RoundedCornerShape(50))
                .background(if (on) Color(0xFFF5F2EC) else Color(0x22FFFFFF))
                .clickable { buttonInteraction(); showLyrics = !showLyrics; if (showLyrics) pos = positionMs() }
                .padding(horizontal = 24.u),
            contentAlignment = Alignment.Center
        ) {
            Text("Tekst", fontFamily = FontFamily.Default, maxLines = 1, softWrap = false, color = if (on) Color(0xFF0A0A0A) else Color(0xFFF5F2EC), fontSize = 18.us, fontWeight = FontWeight.SemiBold)
        }
    }

    @Composable
    private fun NextVideoButton() {
        val clip = videoClips.getOrNull(videoIndex) ?: return
        Box(
            Modifier.height(64.u).clip(RoundedCornerShape(50))
                .background(Color(0x22FFFFFF))
                .clickable { buttonInteraction(); nextVideo() }
                .padding(horizontal = 24.u),
            contentAlignment = Alignment.Center
        ) {
            Text("Neste · ${videoIndex + 1}/${videoClips.size} · ${clip.source.label}",
                fontFamily = FontFamily.Default, maxLines = 1, softWrap = false,
                color = Color(0xFFF5F2EC), fontSize = 18.us, fontWeight = FontWeight.SemiBold)
        }
    }

    @Composable
    private fun VideoButton() {
        val on = videoOn
        Box(
            Modifier.height(64.u).clip(RoundedCornerShape(50))
                .background(if (on) Color(0xFFF5F2EC) else Color(0x22FFFFFF))
                .clickable { buttonInteraction(); videoOn = !videoOn; videoPlaying = false }
                .padding(horizontal = 24.u),
            contentAlignment = Alignment.Center
        ) {
            Text("Video", fontFamily = FontFamily.Default, maxLines = 1, softWrap = false,
                color = if (on) Color(0xFF0A0A0A) else Color(0xFFF5F2EC), fontSize = 18.us, fontWeight = FontWeight.SemiBold)
        }
    }

    /** Live analysis panel: section, phrase position and the meters behind the decisions. */
    @Composable
    private fun AnalysisHud(modifier: Modifier) {
        val h = hudData
        val dim = Color(0xB3F5F2EC)
        Column(
            modifier.widthIn(max = 260.u).clip(RoundedCornerShape(14.u))
                .background(Color.Black.copy(alpha = .55f)).padding(horizontal = 12.u, vertical = 10.u)
        ) {
            Text(h.part, color = Color(0xFFF5F2EC), fontSize = 18.us, fontWeight = FontWeight.SemiBold, maxLines = 1)
            Text("${vibeLabel(vibe)} · %.0f BPM".format(h.bpm),
                color = dim, fontSize = 12.us, maxLines = 1)
            Text("Lyd: ${if (micMode) (micSource?.deviceName ?: "mikrofon") else "telefonens lyd"}", color = dim, fontSize = 12.us, maxLines = 1)
            Text("takt ${h.barInPhrase}/8 · frase ${h.phrase} · ${if (h.ready) "klar for drop" else "ikke klar"}",
                color = dim, fontSize = 12.us, maxLines = 1)
            Spacer(Modifier.height(6.u))
            @Composable
            fun meter(name: String, value: Float, text: String) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(name, color = dim, fontSize = 11.us, modifier = Modifier.width(62.u), maxLines = 1)
                    Box(Modifier.width(110.u).height(6.u).clip(RoundedCornerShape(3.u)).background(Color(0x22FFFFFF))) {
                        Box(Modifier.fillMaxHeight().fillMaxWidth(value.coerceIn(0f, 1f)).clip(RoundedCornerShape(3.u))
                            .background(Color(0xFFF5F2EC)))
                    }
                    Spacer(Modifier.width(6.u))
                    Text(text, color = dim, fontSize = 11.us, maxLines = 1)
                }
                Spacer(Modifier.height(3.u))
            }
            meter("Sub-bass", (h.subRelDb + 12f) / 24f, "%+.0f dB".format(h.subRelDb))
            meter("Diskant", (h.airTrendDb + 6f) / 12f, "%+.0f dB".format(h.airTrendDb))
            meter("Build-up", h.build, "%.0f %%".format(h.build * 100f))
            meter("Zaag/grit", h.grit / .6f, "%.2f".format(h.grit))
            meter("Screech", h.screech, "%.2f".format(h.screech))
            meter("Rock", rockness, "%.0f %%".format(rockness * 100f))
            Text("takt-klokke ${if (beatClock.active) "på" else "av"} · look ${dropLook + 1} · blink/s $flashesNow${if (dip > .05f) " · pust inn" else ""}",
                color = dim, fontSize = 11.us, maxLines = 1)
        }
    }

    /**
     * Drag the lyrics sideways to change style (left = next, right = previous, like flipping pages); double-tap to switch
     * between the glass box and open text. Taps are not consumed, so the screen's own tap handling
     * (showing the controls) still works.
     */
    @Composable
    private fun LyricsSwipeArea(modifier: Modifier, content: @Composable () -> Unit) {
        var dragX by remember { mutableFloatStateOf(0f) }
        var dragging by remember { mutableStateOf(false) }
        val shownX by animateFloatAsState(dragX, if (dragging) androidx.compose.animation.core.snap() else androidx.compose.animation.core.spring(dampingRatio = .75f), label = "swipe")
        var lastTapAt by remember { mutableLongStateOf(0L) }
        val threshold = with(androidx.compose.ui.platform.LocalDensity.current) { 64.u.toPx() }
        Box(
            modifier.pointerInput(Unit) {
                awaitEachGesture {
                    val down = awaitFirstDown(requireUnconsumed = false)
                    var dx = 0f
                    var moved = false      // finger left the tap area: not a tap any more
                    var swiping = false    // a sideways drag that moves the lyrics
                    while (true) {
                        val event = awaitPointerEvent()
                        val c = event.changes.firstOrNull { it.id == down.id } ?: break
                        dx = c.position.x - down.position.x
                        val dy = c.position.y - down.position.y
                        if (!moved && kotlin.math.hypot(dx, dy) > viewConfiguration.touchSlop) {
                            moved = true
                            swiping = abs(dx) > abs(dy)
                        }
                        if (swiping) { dragging = true; dragX = dx; c.consume() }
                        if (!c.pressed) {
                            // Short tap: second one within 320 ms toggles glass/open. Consumed, so the
                            // double-tap does not also count towards unlocking the hidden buttons.
                            val short = c.uptimeMillis - down.uptimeMillis < 300L
                            if (!moved && short) {
                                if (c.uptimeMillis - lastTapAt < 320L) { c.consume(); toggleLyricsGlass(); lastTapAt = 0L }
                                else lastTapAt = c.uptimeMillis
                            }
                            break
                        }
                    }
                    dragging = false
                    dragX = 0f
                    if (swiping) {
                        if (dx < -threshold) stepLyricsStyle(1) else if (dx > threshold) stepLyricsStyle(-1)
                    }
                }
            }
        ) {
            Box(
                Modifier.fillMaxSize().graphicsLayer {
                    translationX = shownX * .6f
                    alpha = 1f - (abs(shownX) / 500f).coerceAtMost(.6f)
                },
                contentAlignment = Alignment.CenterStart
            ) {
                content()
            }
            // Style name + dots for a moment after a change.
            val toast = lyricsToast
            LaunchedEffect(lyricsToastAt) { if (toast != null) { delay(1400); lyricsToast = null } }
            if (toast != null) {
                Column(Modifier.align(Alignment.TopCenter), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(toast, color = Color(0xFFF5F2EC), fontSize = 15.us, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Default,
                        modifier = Modifier.clip(RoundedCornerShape(50)).background(Color(0x99000000)).padding(horizontal = 14.u, vertical = 6.u))
                    Spacer(Modifier.height(8.u))
                    StyleDots(lyricsStyle)
                }
            }
        }
    }

    @Composable
    private fun LyricsView(align: Alignment.Horizontal, fill: Boolean = false) {
        val ta = if (align == Alignment.CenterHorizontally) TextAlign.Center else TextAlign.Start
        val dim = Color(0x66F5F2EC)
        Column(horizontalAlignment = align) {
            when {
                lyricsState == "loading" -> Text("Henter tekst …", color = dim, fontSize = 22.us, textAlign = ta, fontFamily = BodyFont)
                lyrics.isNotEmpty() -> {
                    val now = pos + 250
                    val idx = lyrics.indexOfLast { it.first <= now }.coerceAtLeast(0)
                    val start = lyrics[idx].first
                    val end = lyrics.getOrNull(idx + 1)?.first ?: (start + 5_000L)
                    // A long instrumental after a line must not slow the word timing down to a crawl.
                    val dur = minOf(end - start, maxOf(1_500L, lyrics[idx].second.length * 90L)).coerceAtLeast(1L)
                    val progress = ((now - start).toFloat() / dur).coerceIn(0f, 1f)
                    // Text colour from the cover, lifted so it reads on a dark background.
                    val accent = remember(colors) { colors.maxByOrNull { maxOf(it.red, it.green, it.blue) - minOf(it.red, it.green, it.blue) }?.let { brighten(it) } ?: Color(0xFFFF7A3D) }
                    StyledLyrics(lyricsStyle, lyrics, idx, progress, align, accent, lyricsPulse, if (fill) Modifier.fillMaxSize() else Modifier.fillMaxWidth().height(260.u))
                }
                plainLyrics != null -> Text(
                    plainLyrics.orEmpty(), color = Color(0xCCF5F2EC), fontSize = 20.us, fontFamily = FontFamily.Default, lineHeight = 28.us, textAlign = ta,
                    modifier = Modifier.heightIn(max = 220.u).verticalScroll(rememberScrollState())
                )
                lyricsState == "none" -> {
                    // Shown briefly, then fades away so it does not hang on screen for the whole song.
                    val key = lyricsKey
                    LaunchedEffect(key) { delay(3_000); noLyricsHiddenFor = key }
                    val a by animateFloatAsState(if (noLyricsHiddenFor == key) 0f else 1f, tween(600), label = "noLyrics")
                    Text("Fant ingen tekst til denne sangen", color = dim, fontSize = 22.us, textAlign = ta, fontFamily = BodyFont,
                        modifier = Modifier.graphicsLayer { alpha = a })
                }
                else -> Text("Spill av en sang for å se teksten", color = dim, fontSize = 22.us, textAlign = ta, fontFamily = BodyFont)
            }
        }
    }

    @Composable
    private fun Control(icon: ImageVector, size: Dp, onInteraction: () -> Unit = {}, onClick: () -> Unit) {
        Box(
            Modifier.size(size + 20.u).clip(RoundedCornerShape(50)).background(Color(0x22FFFFFF)).clickable {
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
            Text(text, color = Color(0xFFF5F2EC), fontSize = 24.us, fontFamily = BodyFont, lineHeight = 32.us, modifier = Modifier.padding(40.u))
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

/** One scale factor for the whole Rave screen: 1.0 on a phone in landscape, larger on big
 * car screens, smaller on small ones, so proportions and positions stay the same everywhere. */
internal val LocalRaveScale = androidx.compose.runtime.staticCompositionLocalOf { 1f }

private fun raveScaleFor(widthDp: Float, heightDp: Float): Float {
    val wide = widthDp > heightDp
    // Reference = Android Auto on a 6.8" Kenwood (800x480): the app gets about 720x480 dp
    // → scale 1.0. Phone landscape lands at ~1.0 too; big car screens scale up.
    val scale = if (wide) min(heightDp / 400f, widthDp / 720f) else min(widthDp / 400f, heightDp / 720f)
    return scale.coerceIn(.7f, 2.2f)
}

internal val Int.u: Dp @Composable get() = (this * LocalRaveScale.current).dp
internal val Float.u: Dp @Composable get() = (this * LocalRaveScale.current).dp
private val Double.u: Dp @Composable get() = (this.toFloat() * LocalRaveScale.current).dp
internal val Int.us: androidx.compose.ui.unit.TextUnit @Composable get() = (this * LocalRaveScale.current).sp

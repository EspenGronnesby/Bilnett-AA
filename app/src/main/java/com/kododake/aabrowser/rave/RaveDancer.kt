package com.kododake.aabrowser.rave

import android.graphics.BitmapFactory
import android.os.SystemClock
import androidx.compose.foundation.Canvas
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.withContext
import java.util.concurrent.ConcurrentHashMap
import kotlin.math.*
import kotlin.random.Random

/**
 * Decides when the dancer is on screen. Only counts time while music plays:
 * first visit after 30–45 s, then every 60–120 s, sooner on a heavy drop.
 * Each visit: slide in (1.2 s), dance 8 s, slide out (1.2 s).
 */
internal class DancerDirector {
    enum class Phase { HIDDEN, ENTER, DANCE, EXIT }

    private val random = Random(SystemClock.uptimeMillis())
    @Volatile var phase = Phase.HIDDEN
        private set
    private var phaseStart = 0L
    private var lastUpdate = 0L
    private var hiddenPlayedMs = 0L
    private var waitMs = 30_000L + random.nextLong(15_000L)
    private val danceMs = 8_000L
    /** -1 = bottom-left corner, 1 = bottom-right corner. */
    var side = 1
        private set

    /** Returns visibility 0..1 (0 = fully below the screen edge). */
    fun update(now: Long, playing: Boolean, heavy: Float): Float {
        val dt = if (lastUpdate == 0L) 0L else (now - lastUpdate).coerceIn(0L, 500L)
        lastUpdate = now
        when (phase) {
            Phase.HIDDEN -> {
                if (playing) hiddenPlayedMs += dt
                val dropShortcut = heavy > .6f && hiddenPlayedMs > 20_000L
                if (playing && (hiddenPlayedMs >= waitMs || dropShortcut)) {
                    side = if (random.nextBoolean()) 1 else -1
                    start(Phase.ENTER, now)
                }
            }
            Phase.ENTER -> if (now - phaseStart >= SLIDE_MS) start(Phase.DANCE, now)
            Phase.DANCE -> if (!playing || now - phaseStart >= danceMs) start(Phase.EXIT, now)
            Phase.EXIT -> if (now - phaseStart >= SLIDE_MS) {
                hiddenPlayedMs = 0L
                waitMs = 60_000L + random.nextLong(60_000L)
                start(Phase.HIDDEN, now)
            }
        }
        val p = ((now - phaseStart).toFloat() / SLIDE_MS).coerceIn(0f, 1f)
        return when (phase) {
            Phase.HIDDEN -> 0f
            Phase.ENTER -> easeOut(p)
            Phase.DANCE -> 1f
            Phase.EXIT -> 1f - easeOut(p)
        }
    }

    private fun start(next: Phase, now: Long) { phase = next; phaseStart = now }

    private companion object {
        const val SLIDE_MS = 1200L
        fun easeOut(t: Float) = 1f - (1f - t).pow(3)
    }
}

/**
 * Koko the ghost (Snow-White, 1933, «St. James Infirmary») pops up in a bottom corner now and then
 * and does his real gliding dance: the rotoscoped Cab Calloway glide cut out of the film itself
 * (assets/koko, 194 frames at 12.5 fps, feet aligned). Each visit continues where the last one
 * stopped, so you see a new part of the dance every time.
 *
 * Memory: all frames decoded would be ~60 MB, so only a small window ahead of the playhead is
 * kept decoded (in the background); the compressed webp files are read from assets as needed.
 */
@Composable
internal fun RaveDancer(modifier: Modifier, frameOf: () -> HardstyleFrame, volume: Float, playing: Boolean) {
    val context = LocalContext.current
    val names = remember {
        runCatching { context.assets.list(KOKO_DIR)?.filter { it.endsWith(".webp") }?.sorted() }
            .getOrNull().orEmpty()
    }
    if (names.isEmpty()) return
    val director = remember { DancerDirector() }
    val currentPlaying by rememberUpdatedState(playing)
    var visible by remember { mutableFloatStateOf(0f) }
    var tick by remember { mutableLongStateOf(0L) }
    val dance = remember { DanceClip() }
    val decoded = remember { ConcurrentHashMap<Int, ImageBitmap>() }

    // Background decoder: keeps the next few frames ready and forgets the ones behind.
    LaunchedEffect(names) {
        withContext(Dispatchers.Default) {
            var lastAt = -1
            while (isActive) {
                val at = dance.position.toInt()
                // Nothing moved since last round: the window is already decoded, just wait.
                if (at == lastAt) { delay(if (director.phase == DancerDirector.Phase.HIDDEN) 300L else 25L); continue }
                lastAt = at
                val wanted = (0 until DECODE_AHEAD).map { (at + it) % names.size }.toSet()
                decoded.keys.filter { it !in wanted && it != dance.shown }.forEach { decoded.remove(it) }
                for (i in wanted) {
                    if (decoded.containsKey(i)) continue
                    runCatching {
                        context.assets.open("$KOKO_DIR/${names[i]}").use { BitmapFactory.decodeStream(it) }
                    }.getOrNull()?.let { decoded[i] = it.asImageBitmap() }
                }
                delay(if (director.phase == DancerDirector.Phase.HIDDEN) 300L else 25L)
            }
        }
    }
    // Own clock: the director advances (and the figure redraws) even when the music
    // pauses or the audio frame stops changing. Checks only 5x/s while hidden.
    LaunchedEffect(Unit) {
        var last = 0L
        while (true) {
            withFrameNanos { }
            val now = SystemClock.uptimeMillis()
            val f = frameOf()
            visible = director.update(now, currentPlaying, f.heavy)
            val dt = if (last == 0L) 0f else ((now - last) / 1000f).coerceAtMost(.5f)
            last = now
            // The film's own timing: 12.5 frames per second, never sped up by the beat.
            if (director.phase != DancerDirector.Phase.HIDDEN && currentPlaying) {
                dance.position = (dance.position + dt * KOKO_FPS) % names.size
                dance.sway += dt
            }
            if (director.phase == DancerDirector.Phase.HIDDEN) delay(200) else tick = now
        }
    }
    Canvas(modifier) {
        @Suppress("UNUSED_VARIABLE") val redraw = tick
        if (visible <= 0f) return@Canvas
        val index = dance.position.toInt().coerceIn(0, names.size - 1)
        // If a frame isn't decoded yet, keep showing the previous one rather than blinking.
        val image = decoded[index]?.also { dance.shown = index } ?: decoded[dance.shown] ?: return@Canvas

        val figureHeight = min(size.height * .34f, size.width * .38f)
        val figureWidth = figureHeight * image.width / image.height
        val margin = 16.dp.toPx() + figureWidth * .35f
        // Gentle drift and lean on top of the dance (no hops, no kick-squash).
        val glide = sin(dance.sway * 2.4f) * figureWidth * .05f
        val feetX = (if (director.side > 0) size.width - margin else margin) + glide
        val feetY = size.height - 8.dp.toPx() + (1f - visible) * figureHeight * 1.15f
        val feet = Offset(feetX, feetY)
        val tilt = sin(dance.sway * 2.4f + .6f) * 1.5f
        // Brighter at high volume, a bit dimmer when quiet.
        val alpha = (.75f + .25f * volumeGain(volume)).coerceIn(0f, 1f)

        rotate(tilt, pivot = feet) {
            // Mirror on the left side so the dance mostly moves toward the middle.
            scale(scaleX = if (director.side > 0) 1f else -1f, scaleY = 1f, pivot = feet) {
                val dst = IntOffset((feet.x - figureWidth / 2f).toInt(), (feet.y - figureHeight).toInt())
                val dstSize = IntSize(figureWidth.toInt(), figureHeight.toInt())
                drawImage(image, IntOffset.Zero, IntSize(image.width, image.height), dst, dstSize, alpha = alpha)
            }
        }
    }
}

/** Playback state of the dance clip (read by the decoder thread too). */
private class DanceClip {
    /** Fractional frame index; kept between visits so each visit shows the next part. */
    @Volatile var position = 0f
    /** Last frame actually drawn (kept decoded as a fallback). */
    @Volatile var shown = 0
    /** Seconds of dancing, drives the small drift/lean. */
    var sway = 0f
}

private const val KOKO_DIR = "koko"
private const val KOKO_FPS = 12.5f
/** ~1.3 s of frames decoded ahead (~5 MB). */
private const val DECODE_AHEAD = 16

package com.kododake.aabrowser.rave

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.animateFloat
import androidx.compose.material.icons.rounded.MusicNote
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.draw.clip
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.snapshotFlow
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.withTimeoutOrNull
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.BlurEffect
import androidx.compose.ui.graphics.TileMode
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.CompositingStrategy
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import kotlin.math.abs
import kotlin.random.Random

/** Ways to show synced lyrics. Order = the order you swipe through them. */
internal enum class LyricsStyle(val label: String) {
    SCROLL("Myk rulling"),
    WORDS("Ord for ord"),
    KARAOKE("Karaoke-fyll"),
    BIG("Én stor linje"),
    BASS("Bass-puls");
}

private val Bright = Color(0xFFF5F2EC)
private val Dim = Color(0x66F5F2EC)
private val Faint = Color(0x40F5F2EC)
private val TextShadow = Shadow(Color(0xA6000000), Offset(0f, 2f), 12f)

private fun lineText(lines: List<LyricLine>, i: Int): String? =
    lines.getOrNull(i)?.text?.let { it.ifBlank { "♪" } }

/**
 * Synced lyrics in the chosen style.
 * [nowMs] is the song time as heard. Every line carries a time per word (real from NetEase,
 * or guessed from syllables and the song's singing speed), so a held word fills slowly.
 */
@Composable
internal fun StyledLyrics(
    style: LyricsStyle,
    lines: List<LyricLine>,
    idx: Int,
    nowMs: Long,
    align: Alignment.Horizontal,
    accent: Color,
    pulse: () -> Float,
    /** Fill the lyrics panel (car layout) or a fixed height (portrait, under the title). */
    sizeModifier: Modifier,
    /** A known pause in the singing: show a music note instead of the old line. */
    pause: Boolean = false,
    /** The line that comes after the pause (shown faintly under the note). */
    upcoming: String? = null
) {
    run {
        val h = sizeModifier
        val ta = if (align == Alignment.CenterHorizontally) TextAlign.Center else TextAlign.Start
        Box(h, contentAlignment = if (align == Alignment.CenterHorizontally) Alignment.Center else Alignment.CenterStart) {
            // The scrolling list keeps its own context, so it gets no pause note.
            val showPause = pause && style != LyricsStyle.SCROLL
            AnimatedContent(showPause, transitionSpec = { fadeIn(tween(400)) togetherWith fadeOut(tween(300)) }, label = "pause") { p ->
                if (p) PauseNote(upcoming, align, ta, accent, pulse)
                else when (style) {
                    LyricsStyle.SCROLL -> ScrollLyrics(lines, idx, align, ta)
                    LyricsStyle.WORDS -> WordLyrics(lines, idx, nowMs, align, ta, accent, pulse)
                    LyricsStyle.KARAOKE -> KaraokeLyrics(lines, idx, nowMs, align, ta, accent)
                    LyricsStyle.BIG -> BigLineLyrics(lines, idx, align, ta)
                    LyricsStyle.BASS -> BassLyrics(lines, idx, accent, pulse)
                }
            }
        }
    }
}

/** A pause in the singing: a music note that breathes and bounces gently with the beat. */
@Composable
private fun PauseNote(upcoming: String?, align: Alignment.Horizontal, ta: TextAlign, accent: Color, pulse: () -> Float) {
    val breath = androidx.compose.animation.core.rememberInfiniteTransition(label = "breath")
    val b by breath.animateFloat(.55f, 1f, androidx.compose.animation.core.infiniteRepeatable(tween(1400), androidx.compose.animation.core.RepeatMode.Reverse), label = "b")
    Column(Modifier.fillMaxWidth(), horizontalAlignment = align) {
        androidx.compose.material3.Icon(
            androidx.compose.material.icons.Icons.Rounded.MusicNote, null, tint = accent,
            modifier = Modifier.height(72.u).width(72.u).graphicsLayer {
                val k = pulse().coerceIn(0f, 1f)
                val s = 1f + k * .12f
                scaleX = s; scaleY = s
                alpha = b
                translationY = -k * 10f
            }
        )
        if (!upcoming.isNullOrBlank()) {
            Spacer(Modifier.height(30.u))
            Text(upcoming, color = Faint, fontSize = 22.us, fontWeight = FontWeight.SemiBold, textAlign = ta,
                maxLines = 2, overflow = TextOverflow.Ellipsis, fontFamily = FontFamily.Default)
        }
    }
}

/** Apple Music-like: the list glides up, lines far from the current one get faint and blurry. */
@Composable
private fun ScrollLyrics(lines: List<LyricLine>, idx: Int, align: Alignment.Horizontal, ta: TextAlign) {
    BoxWithConstraints(Modifier.fillMaxSize()) {
        val half = maxHeight / 2
        val state = rememberLazyListState(initialFirstVisibleItemIndex = idx)
        val density = LocalDensity.current
        LaunchedEffect(idx) {
            // Content padding of half the height puts an item's top in the middle; scroll on by
            // half the item's height so its centre lands in the middle.
            // Wait until the line has been measured, so lines that wrap are centred too.
            val itemH = withTimeoutOrNull(500) {
                snapshotFlow { state.layoutInfo.visibleItemsInfo.firstOrNull { it.index == idx }?.size }.filterNotNull().first()
            } ?: with(density) { 52.dp.roundToPx() }
            state.animateScrollToItem(idx, itemH / 2)
        }
        LazyColumn(
            state = state,
            userScrollEnabled = false,
            contentPadding = PaddingValues(vertical = half),
            horizontalAlignment = align,
            modifier = Modifier.fillMaxSize()
                .graphicsLayer { compositingStrategy = CompositingStrategy.Offscreen }
                .drawWithContent {
                    drawContent()
                    drawRect(
                        Brush.verticalGradient(0f to Color.Transparent, .2f to Color.Black, .8f to Color.Black, 1f to Color.Transparent),
                        blendMode = BlendMode.DstIn
                    )
                }
        ) {
            itemsIndexed(lines) { i, _ ->
                val d = abs(i - idx)
                val alpha by animateFloatAsState(if (d == 0) 1f else (.5f - d * .1f).coerceAtLeast(.12f), tween(500), label = "a")
                val blur by animateFloatAsState(if (d == 0) 0f else (d * 1.4f).coerceAtMost(5f), tween(500), label = "b")
                val scale by animateFloatAsState(if (d == 0) 1f else .94f, spring(dampingRatio = .7f, stiffness = Spring.StiffnessLow), label = "s")
                Text(
                    lineText(lines, i).orEmpty(),
                    color = Bright, fontSize = 30.us, lineHeight = 36.us, fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Default, textAlign = ta,
                    style = TextStyle(shadow = TextShadow),
                    modifier = Modifier.fillMaxWidth().padding(vertical = 8.u)
                        .graphicsLayer {
                            this.alpha = alpha; scaleX = scale; scaleY = scale
                            transformOrigin = androidx.compose.ui.graphics.TransformOrigin(
                                if (ta == TextAlign.Center) .5f else 0f, .5f)
                            val r = blur.dp.toPx()
                            renderEffect = if (r > .5f) BlurEffect(r, r, TileMode.Decal) else null
                        }
                )
            }
        }
    }
}

/**
 * TikTok-like: words pop in one by one; the longest word gets the cover colour.
 * A word that lands on a hard hit in the music (louder than usual) grows a little.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun WordLyrics(lines: List<LyricLine>, idx: Int, nowMs: Long, align: Alignment.Horizontal, ta: TextAlign, accent: Color, pulse: () -> Float) {
    val timed = remember(idx, lines) { lines.getOrNull(idx)?.words.orEmpty() }
    val words = remember(timed) { timed.map { it.text }.ifEmpty { listOf("♪") } }
    val longest = words.maxOfOrNull { it.length } ?: 0
    // Loudness when each word appeared (-1 = not yet), and a slow average so «hard» is relative to the song.
    val hit = remember(idx, lines) { FloatArray(words.size) { -1f } }
    val avg = remember { floatArrayOf(.4f) }
    Column(horizontalAlignment = align) {
        key(idx) {
            FlowRow(horizontalArrangement = if (ta == TextAlign.Center) Arrangement.Center else Arrangement.Start) {
                words.forEachIndexed { k, w ->
                    val w0 = timed.getOrNull(k)
                    // A word pops in just as it is sung (40 ms early so the spring animation lands on it).
                    val shown = w0 == null || nowMs >= w0.startMs - 40L
                    // A held word (> 0.7 s) glows in the cover colour while it is being sung.
                    val holding = w0 != null && w0.endMs - w0.startMs > 700L && nowMs in w0.startMs..w0.endMs
                    if (shown && hit[k] < 0f) {
                        val v = pulse().coerceIn(0f, 1f)
                        hit[k] = v
                        avg[0] = avg[0] * .85f + v * .15f
                    }
                    // Up to ~15 % bigger, only when clearly above the song's normal level.
                    val extra = if (hit[k] > .5f) ((hit[k] - avg[0] - .15f) / .4f).coerceIn(0f, 1f) * .15f else 0f
                    val s by animateFloatAsState(if (shown) 1f + extra else .3f, spring(dampingRatio = .42f, stiffness = 500f), label = "w")
                    val a by animateFloatAsState(if (shown) 1f else 0f, tween(120), label = "wa")
                    Text(
                        w, fontSize = 42.us, lineHeight = 48.us, fontWeight = FontWeight.Black, fontFamily = FontFamily.Default,
                        color = if (holding || (w.length == longest && words.size > 1)) accent else Bright,
                        style = TextStyle(shadow = TextShadow),
                        modifier = Modifier.padding(end = 10.u).graphicsLayer { scaleX = s; scaleY = s; alpha = a; translationY = (1f - s) * 20f }
                    )
                }
            }
        }
        // No preview of the next line here: only the words being sung, for the vibe.
    }
}

/**
 * Karaoke: the current line fills with colour word by word, each word over exactly the time it is
 * sung (a held word fills slowly). A small ball lands on each word as it starts and hops to the next
 * one just before that word begins, like karaoke videos.
 */
@Composable
private fun KaraokeLyrics(lines: List<LyricLine>, idx: Int, nowMs: Long, align: Alignment.Horizontal, ta: TextAlign, accent: Color) {
    val cur = lines.getOrNull(idx)
    val line = lineText(lines, idx).orEmpty()
    val words = cur?.words.orEmpty()
    // Character offset where each word starts (the line text is the words joined by single spaces).
    val starts = remember(cur) {
        var c = 0
        words.map { w -> c.also { c += w.text.length + 1 } }
    }
    // Characters filled: whole finished words + the sung part of the current word.
    val done = if (words.isEmpty()) 0 else {
        val k = words.indexOfLast { it.startMs <= nowMs }
        if (k < 0) 0 else {
            val w = words[k]
            val f = ((nowMs - w.startMs).toFloat() / (w.endMs - w.startMs).coerceAtLeast(1L)).coerceIn(0f, 1f)
            (starts[k] + (w.text.length * f).toInt()).coerceAtMost(line.length)
        }
    }
    var layout by remember(line) { mutableStateOf<TextLayoutResult?>(null) }
    val ballR = with(LocalDensity.current) { 7.u.toPx() }
    val jump = with(LocalDensity.current) { 22.u.toPx() }
    Column(horizontalAlignment = align) {
        Text(
            buildAnnotatedString {
                withStyle(SpanStyle(color = Bright)) { append(line.take(done)) }
                withStyle(SpanStyle(color = Color(0x52F5F2EC))) { append(line.drop(done)) }
            },
            fontSize = 36.us, lineHeight = 42.us, fontWeight = FontWeight.ExtraBold, fontFamily = FontFamily.Default,
            textAlign = ta, maxLines = 3, overflow = TextOverflow.Ellipsis, style = TextStyle(shadow = TextShadow),
            onTextLayout = { layout = it },
            modifier = Modifier.padding(top = 30.u).drawWithContent {
                drawContent()
                val l = layout ?: return@drawWithContent
                if (words.isEmpty()) return@drawWithContent
                val len = l.layoutInput.text.length
                if (len == 0) return@drawWithContent
                // Word centre (x) and top of its text line (y).
                fun spot(k: Int): Offset {
                    val a = starts[k].coerceAtMost(len - 1)
                    val b = (starts[k] + words[k].text.length - 1).coerceIn(a, len - 1)
                    val first = l.getBoundingBox(a)
                    val last = l.getBoundingBox(b)
                    return Offset((first.left + last.right) / 2f, l.getLineTop(l.getLineForOffset(a)))
                }
                val k = words.indexOfLast { it.startMs <= nowMs }.coerceAtLeast(0)
                val from = spot(k)
                val next = words.getOrNull(k + 1)
                // The ball sits on the word while it is sung and hops during the last ≤ 300 ms before the next word.
                val t = if (next == null || nowMs < words[0].startMs) 0f else {
                    val hop = minOf(300L, next.startMs - words[k].startMs).coerceAtLeast(1L)
                    ((nowMs - (next.startMs - hop)).toFloat() / hop).coerceIn(0f, 1f)
                }
                val to = if (next != null) spot(k + 1) else from
                // Arc: lands on each word (t = 0), highest halfway to the next one.
                val x = from.x + (to.x - from.x) * t
                val base = from.y + (to.y - from.y) * t - ballR - 2f
                val y = base - jump * 4f * t * (1f - t)
                drawCircle(Color.Black.copy(alpha = .35f), ballR * 1.25f, Offset(x, y + 2f))
                drawCircle(accent, ballR, Offset(x, y))
            }
        )
        Spacer(Modifier.height(30.u))
        Text(lineText(lines, idx + 1).orEmpty(), color = Dim, fontSize = 22.us, fontWeight = FontWeight.SemiBold,
            textAlign = ta, maxLines = 2, overflow = TextOverflow.Ellipsis, fontFamily = FontFamily.Default)
    }
}

/** Only the line being sung, big; it glides in from below. Easiest to read from the driver's seat. */
@Composable
private fun BigLineLyrics(lines: List<LyricLine>, idx: Int, align: Alignment.Horizontal, ta: TextAlign) {
    Column(horizontalAlignment = align) {
        AnimatedContent(
            idx,
            transitionSpec = {
                (slideInVertically(tween(420)) { it / 3 } + fadeIn(tween(420))) togetherWith
                    (slideOutVertically(tween(260)) { -it / 4 } + fadeOut(tween(260)))
            },
            label = "big"
        ) { i ->
            Text(lineText(lines, i).orEmpty(), color = Bright, fontSize = 48.us, lineHeight = 52.us, fontWeight = FontWeight.Black,
                fontFamily = FontFamily.Default, textAlign = ta, maxLines = 3, overflow = TextOverflow.Ellipsis,
                style = TextStyle(shadow = TextShadow), modifier = Modifier.fillMaxWidth())
        }
        Spacer(Modifier.height(30.u))
        Text(lineText(lines, idx + 1).orEmpty(), color = Faint, fontSize = 20.us, fontWeight = FontWeight.SemiBold,
            textAlign = ta, maxLines = 1, overflow = TextOverflow.Ellipsis, fontFamily = FontFamily.Default)
    }
}

/** Trap Nation-like: big capitals in the middle that glow, grow and shake with the bass. */
@Composable
private fun BassLyrics(lines: List<LyricLine>, idx: Int, accent: Color, pulse: () -> Float) {
    Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
        BassLine(lineText(lines, idx).orEmpty().uppercase(), accent, pulse)
        Spacer(Modifier.height(30.u))
        Text(lineText(lines, idx + 1).orEmpty().uppercase(), color = Color(0x8CFFFFFF), fontSize = 15.us,
            fontWeight = FontWeight.Bold, letterSpacing = androidx.compose.ui.unit.TextUnit(4f, androidx.compose.ui.unit.TextUnitType.Sp),
            textAlign = TextAlign.Center, maxLines = 1, overflow = TextOverflow.Ellipsis, fontFamily = FontFamily.Default)
    }
}

/** Own composable so only this text redraws on every beat. */
@Composable
private fun BassLine(text: String, accent: Color, pulse: () -> Float) {
    val glow = remember(accent) { lerpToWhite(accent, .25f) }
    // The pulse is read only inside graphicsLayer, so a beat redraws without re-measuring the text.
    Box(Modifier.fillMaxWidth().graphicsLayer {
        val k = pulse().coerceIn(0f, 1f)
        val s = 1f + k * .07f
        scaleX = s; scaleY = s
        translationX = (Random.nextFloat() - .5f) * k * 14f
        translationY = (Random.nextFloat() - .5f) * k * 14f
    }) {
        // Strong glow layer that fades in on the beat, on top of a steady soft glow.
        Text(
            text, color = Color.White, fontSize = 44.us, lineHeight = 46.us, fontWeight = FontWeight.Black,
            fontFamily = FontFamily.Default, textAlign = TextAlign.Center, maxLines = 3, overflow = TextOverflow.Ellipsis,
            style = TextStyle(shadow = Shadow(glow, Offset.Zero, 50f)),
            modifier = Modifier.fillMaxWidth().graphicsLayer { alpha = pulse().coerceIn(0f, 1f) }
        )
        Text(
            text, color = Color.White, fontSize = 44.us, lineHeight = 46.us, fontWeight = FontWeight.Black,
            fontFamily = FontFamily.Default, textAlign = TextAlign.Center, maxLines = 3, overflow = TextOverflow.Ellipsis,
            style = TextStyle(shadow = Shadow(glow, Offset.Zero, 12f)),
            modifier = Modifier.fillMaxWidth()
        )
    }
}

private fun lerpToWhite(c: Color, t: Float) = Color(c.red + (1 - c.red) * t, c.green + (1 - c.green) * t, c.blue + (1 - c.blue) * t, 1f)

/** Small dots that show which style is chosen. */
@Composable
internal fun StyleDots(current: LyricsStyle) {
    Row(horizontalArrangement = Arrangement.spacedBy(6.u), verticalAlignment = Alignment.CenterVertically) {
        LyricsStyle.entries.forEach { s ->
            val on = s == current
            Box(
                Modifier.height(8.u).width(if (on) 22.u else 8.u)
                    .clip(RoundedCornerShape(50))
                    .background(if (on) Color.White else Color(0x55FFFFFF))
            )
        }
    }
}

/** Cover colours are often dark; push to full brightness and mix in a little white so text reads. */
internal fun brighten(c: Color): Color {
    val m = maxOf(c.red, c.green, c.blue).coerceAtLeast(.01f)
    return lerpToWhite(Color(c.red / m, c.green / m, c.blue / m), .3f)
}

package com.kododake.aabrowser.rave

import android.os.SystemClock
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.Canvas
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Dp
import androidx.compose.foundation.layout.requiredSize
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntSize
import kotlin.math.*

/** One soft white dot, reused (tinted) for bokeh particles and light bursts instead of a new gradient per draw. */
private val softDot: ImageBitmap by lazy {
    val size = 64
    val bmp = android.graphics.Bitmap.createBitmap(size, size, android.graphics.Bitmap.Config.ARGB_8888)
    val paint = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply {
        shader = android.graphics.RadialGradient(size / 2f, size / 2f, size / 2f,
            intArrayOf(0xFFFFFFFF.toInt(), 0x88FFFFFF.toInt(), 0x22FFFFFF, 0x00FFFFFF),
            floatArrayOf(0f, .25f, .6f, 1f), android.graphics.Shader.TileMode.CLAMP)
    }
    android.graphics.Canvas(bmp).drawCircle(size / 2f, size / 2f, size / 2f, paint)
    bmp.asImageBitmap()
}

private fun DrawScope.drawSoftDot(center: Offset, radius: Float, alpha: Float, tint: ColorFilter) {
    val d = (radius * 2f).toInt().coerceAtLeast(2)
    drawImage(softDot, srcOffset = IntOffset.Zero, srcSize = IntSize(softDot.width, softDot.height),
        dstOffset = IntOffset((center.x - d / 2f).toInt(), (center.y - d / 2f).toInt()), dstSize = IntSize(d, d),
        alpha = alpha.coerceIn(0f, 1f), colorFilter = tint, blendMode = BlendMode.Screen)
}

/** Music driven particles emitted from the cover center. The shared scene Canvas
 * supplies the same background lighting as normal mode. */
@Composable
internal fun HardstyleBackdrop(modifier: Modifier, frameOf: () -> HardstyleFrame, timeOf: () -> Float, colors: List<Color>, video: Boolean,
    coverCenter: Offset, coverRadius: Float, intensityOf: () -> Float, volume: Float = 1f, profile: () -> PartyProfile) {
    val ripples = remember { RippleBank() }
    // Accumulated particle clock: phase += dt * speed. (Multiplying the ever-growing time by a speed
    // that changes with the music made every particle jump on each beat.)
    val clock = remember { FloatArray(2) }
    // Particles listen to what the ring/shake/ripples do NOT use: vocals, melody, hi-hats and
    // snares. Every driver is eased, so the motion glides instead of twitching.
    // [vocal, vocal hit, sparkle (snare/hats), highs, drop]
    val mood = remember { FloatArray(5) }
    val sparkle = remember { IntArray(2) } // [seed for which particles twinkle, armed]
    val flashes = remember { FloatArray(224) } // per-particle twinkle, fading out on its own
    val tints = remember(colors) { colors.map { ColorFilter.tint(it, BlendMode.Modulate) } }
    Canvas(modifier) {
        // Audio values are read here, while drawing, so they don't recompose the screen every frame.
        val frame = frameOf(); val intensity = intensityOf()
        val p = profile(); val particles = p.particles; val density = p.density; val softness = p.softness
        val gain = volumeGain(volume)
        val ramp = loudRamp(volume)
        val c = coverCenter
        val span = max(size.width, size.height)
        var highActivity = 0f
        for (band in 32 until SPECTRUM_BANDS) highActivity += frame.spectrum[band]
        highActivity = (highActivity / 16f).coerceIn(0f, 1f)
        val shimmer = max(frame.highMotion, highActivity * .35f)
        val nowMs = SystemClock.uptimeMillis()
        val dt = if (clock[1] == 0f) 0f else ((nowMs % 1_000_000L) / 1000f - clock[1]).coerceIn(0f, .1f)
        clock[1] = (nowMs % 1_000_000L) / 1000f
        fun ease(i: Int, target: Float, rise: Float, fall: Float) {
            val tau = if (target > mood[i]) rise else fall
            mood[i] += (target - mood[i]) * (1f - exp(-dt / tau))
        }
        val hats = max(frame.snare, frame.crash)
        // A new snare / hi-hat hit lights up a fresh random handful of particles.
        if (hats < .3f) sparkle[1] = 1
        val newHit = hats > .7f && sparkle[1] == 1
        if (newHit) { sparkle[1] = 0; sparkle[0]++ }
        val flashDecay = exp(-dt / .35f)
        ease(0, frame.vocal, .12f, .6f)
        ease(1, frame.vocalHit, .05f, .5f)
        ease(2, hats, .03f, .3f)
        ease(3, max(max(frame.highs, shimmer * .6f), frame.build * .6f), .15f, .5f)
        ease(4, frame.heavy, .15f, .8f)
        val vocal = mood[0]; val vocalHit = mood[1]; val twinkle = mood[2]; val highs = mood[3]; val drop = mood[4]
        val speed = (.07f + intensity * .10f + vocal * .16f + vocalHit * .22f + highs * .06f + drop * .18f) *
            (.6f + .4f * gain) * (1f + ramp * .3f) * particles
        clock[0] = (clock[0] + dt * speed) % 10_000f
        // Ripples only on lots of bass AND distortion together (zaag etc.). Clean bass,
        // kicks, highs and quiet drops do not trigger them.
        ripples.update(nowMs, frame.bass, frame.grit,
            ((.4f + frame.grit * .6f) * frame.bass * gain * (1f + ramp * .4f)).coerceAtMost(1.4f))
        val reach = span * 1.1f
        for (r in 0 until RippleBank.SIZE) {
            val age = nowMs - ripples.born[r]
            val strength = ripples.strength[r]
            val life = 1100L - (strength * 250f).toLong()
            if (strength <= 0f || age !in 0 until life) continue
            val q = age.toFloat() / life
            val eased = 1f - (1f - q) * (1f - q) * (1f - q)
            val radius = coverRadius + reach * eased
            val fade = (1f - q) * (1f - q) * strength
            val color = colors[r % colors.size]
            // Soft wide band, a mid glow and a sharp front edge, blended as light.
            drawCircle(color.copy(alpha = (.10f * fade).coerceAtMost(1f)), radius, c,
                style = Stroke((10.dp.toPx() + 30.dp.toPx() * strength) * (1f - q * .6f)), blendMode = BlendMode.Screen)
            drawCircle(color.copy(alpha = (.22f * fade).coerceAtMost(1f)), radius, c,
                style = Stroke(5.dp.toPx() + 4.dp.toPx() * strength), blendMode = BlendMode.Screen)
            drawCircle(Color.White.copy(alpha = (.35f * fade).coerceAtMost(1f)), radius, c,
                style = Stroke(1.2.dp.toPx() + 1.5.dp.toPx() * strength))
        }
        // From 70 % volume up to 100 %, up to twice as many particles join in (never more than 224).
        val baseCount = (112 * density).toInt()
        val count = ((112 + 112 * ramp) * density).toInt().coerceIn(12, 224)
        val streak = drop * drop * (1f + ramp) / softness
        // Each particle has a deterministic direction and its own steady speed. It is born just
        // beyond the cover, glides straight outward (growing, as if towards the camera),
        // fades at the edge and is emitted again.
        for (i in 0 until count) {
            val band = frame.spectrum[32 + i % 16]
            val own = .8f + .4f * ((i * 0.754877f) % 1f)
            val phase = (i * .618034f + clock[0] * own) % 1f
            val angle = i * 2.399963f
            val travel = .8f + vocalHit * .15f + drop * .25f / softness
            val distance = coverRadius + span * phase * phase * travel
            val direction = Offset(cos(angle), sin(angle))
            val position = c + direction * distance
            // Twinkle: on each snare/hi-hat a different ~1 in 6 particles lights up, then fades out softly.
            if (newHit && ((i * 0.618034f + sparkle[0] * 0.381966f) % 1f) < .17f) flashes[i] = max(flashes[i], twinkle.coerceAtLeast(.7f))
            else flashes[i] *= flashDecay
            val flash = flashes[i]
            // Vocals and melody lead; build-ups and drops add light too (calm start, max on the drop).
            val musicalGlow = (vocal * .45f + vocalHit * .3f + highs * .2f + band * .15f + flash * .6f +
                drop * .5f + frame.energy * .2f).coerceIn(0f, 1f)
            // Fade in right after birth (no popping) and out towards the edge.
            val edgeFade = (1f - phase).coerceIn(0f, 1f) * (phase * 10f).coerceAtMost(1f)
            val alpha = edgeFade * (.14f + musicalGlow * .76f) * (if (video) .72f else 1f) * (if (i >= baseCount) ramp else 1f) / softness
            if (alpha < .01f) continue
            // Depth: small and dim near the cover, bigger as they come "closer".
            val depth = .45f + 1.1f * phase
            val radius = (1.2f + vocal * 1.8f + vocalHit * 1.4f + flash * 2.2f + drop * 1.2f) *
                (.6f + .4f * gain) * (1f + ramp * .4f) * softness * depth
            val col = colors[i % colors.size]
            // Soft profiles (rap) draw glowing bokeh instead of sharp sparks.
            if (softness > 1.2f) {
                drawSoftDot(position, radius * 2.2f, alpha, tints[i % tints.size])
            } else {
                drawSoftDot(position, radius * 3f, alpha * .45f, tints[i % tints.size])
                if (streak > .15f) {
                    // Motion streaks only deep in a heavy drop: a short trail back towards the cover.
                    val tail = position - direction * (radius * 4f * streak * (.5f + phase))
                    drawLine(col.copy(alpha = alpha), tail, position, strokeWidth = radius * 1.1f,
                        cap = StrokeCap.Round, blendMode = BlendMode.Screen)
                } else drawCircle(if (flash > .2f) lerp(col, Color.White, flash * .6f).copy(alpha = alpha) else col.copy(alpha = alpha),
                    radius, position, blendMode = BlendMode.Screen)
            }
        }
    }
}

/** Echo layers, Trap Nation style: each lags a bit more, spikes a bit harder and is a bit smoother. */
private val LAYER_DELAY_MS = longArrayOf(0L, 45L, 90L, 140L, 190L)
private val LAYER_EXPONENT = floatArrayOf(1f, 1.12f, 1.3f, 1.36f, 1.5f)
private val LAYER_SMOOTH = intArrayOf(0, 1, 2, 2, 3)
private const val POINTS = 128

/** Mirrored frequency contours; motion comes from FFT values, never an oscillator. */
@Composable
internal fun HardstyleOrb(
    modifier: Modifier, frameOf: () -> HardstyleFrame, colors: List<Color>,
    roundedSquare: Boolean = false, volume: Float = 1f, spikeGain: () -> Float = { 1f },
    breath: () -> Float = { 0f }, aberration: () -> Float = { 0f }, shape: OrbShape? = null
) {
    val path = remember { Path() }
    val history = remember { SpectrumHistory() }
    val layers = remember { Array(LAYER_DELAY_MS.size) { FloatArray(SPECTRUM_BANDS) } }
    val scratch = remember { FloatArray(SPECTRUM_BANDS) }
    val volumeLayer = remember { FloatArray(SPECTRUM_BANDS) }
    val points = remember { FloatArray((POINTS + 1) * 2) }
    val layer0Points = remember { FloatArray((POINTS + 1) * 2) }
    // Layer colours from the cover: a bright (not pure white) core, then the cover colours outward.
    val layerColors = remember(colors) {
        val a = colors[0]; val b = colors[1 % colors.size]; val c = colors[2 % colors.size]
        listOf(lerp(a, Color.White, .55f), a, b, c, lerp(a, b, .5f))
    }
    val burstTints = remember(colors) { colors.map { ColorFilter.tint(it, BlendMode.Modulate) } }
    val sweepCache = remember { arrayOfNulls<Brush>(LAYER_DELAY_MS.size) }
    val sweepKey = remember { arrayOfNulls<Any>(1) }
    val sweepCenter = remember { LongArray(1) }
    Canvas(modifier) {
        val frame = frameOf()
        val now = SystemClock.uptimeMillis()
        history.push(now, frame.spectrum)
        for (layer in layers.indices) {
            history.sampleInto(now, LAYER_DELAY_MS[layer], layers[layer])
            smoothBands(layers[layer], LAYER_SMOOTH[layer], scratch)
        }
        if (sweepKey[0] !== layerColors || sweepCenter[0] != center.packedValue) {
            // Gentle colour drift around the shape (mirrored, like the spectrum).
            for (l in 1 until layerColors.size) {
                val x = layerColors[l]; val y = layerColors[(l % (layerColors.size - 1)) + 1]
                sweepCache[l] = Brush.sweepGradient(listOf(x, lerp(x, y, .6f), x, lerp(x, y, .6f), x), center)
            }
            sweepKey[0] = layerColors; sweepCenter[0] = center.packedValue
        }
        val side = min(size.width, size.height)
        val base = side * (if (roundedSquare) .45f else .34f)
        val heavy = frame.heavy
        val gain = volumeGain(volume)
        // Loud playback makes a drop hit even harder.
        val drive = heavy * (.7f + .3f * loudness(volume))
        // At (near) 100 % volume the ring takes off: today's max becomes 70 % of the new max.
        val boost = maxVolumeBoost(volume)
        val kickExpansion = boost * (if (roundedSquare) frame.kick*(.035f + drive*.16f) else frame.kick*(.11f + drive*.14f)) * gain
        val maximumDisplacement = min(36.dp.toPx() + drive*70.dp.toPx(), side * (.12f + drive*.22f)) * gain * boost * spikeGain()
        // Big, but never so big that spikes cover the text or leave the screen.
        val displacementCap = side * .38f * boost
        val spikeCurve = 1f - drive*.5f
        // Breathes with the overall loudness, together with the cover.
        val radius = base * (1f + kickExpansion) * (1f + breath() * .05f)
        // Exaggerated spikes on drops: tall bands grow much more than low ones. The top 25 % of the
        // cap is a soft knee, so peaks round off instead of being cut flat.
        fun spike(values: FloatArray, i: Int, extra: Float, exponent: Float): Float {
            var v = mirroredSpectrumValue(values, i, POINTS).coerceIn(0f, 1f)
            if (exponent != 1f) v = v.pow(exponent)
            val d = v.pow(spikeCurve) * (1f + drive * v) * maximumDisplacement * extra
            val knee = displacementCap * .75f
            return if (d <= knee) d else knee + (displacementCap - knee) * tanh((d - knee) / (displacementCap - knee))
        }
        fun buildPath(values: FloatArray, extra: Float = 1f, exponent: Float = 1f) {
            for (i in 0..POINTS) {
                val angle = i * 2f * PI.toFloat() / POINTS - PI.toFloat() / 2
                val ca = cos(angle); val sa = sin(angle)
                val contour = if (roundedSquare)
                    (abs(ca).pow(8) + abs(sa).pow(8)).pow(-1f/8f) else 1f
                val displacement = spike(values, i, extra, exponent)
                // Displace outward along the local normal so square sides stay in their layout slot.
                val x = ca * radius * contour
                val y = sa * radius * contour
                val nx = if (roundedSquare) sign(x) * abs(ca).pow(7) else ca
                val ny = if (roundedSquare) sign(y) * abs(sa).pow(7) else sa
                val length = hypot(nx, ny).coerceAtLeast(.0001f)
                points[i*2] = center.x + x + nx / length * displacement
                points[i*2+1] = center.y + y + ny / length * displacement
            }
            // Smooth outline: quadratic curves through the midpoints between neighbouring points.
            path.rewind()
            path.moveTo((points[0] + points[2]) / 2f, (points[1] + points[3]) / 2f)
            for (i in 1..POINTS) {
                val n = if (i == POINTS) 1 else i + 1
                path.quadraticTo(points[i*2], points[i*2+1], (points[i*2] + points[n*2]) / 2f, (points[i*2+1] + points[n*2+1]) / 2f)
            }
            path.close()
        }
        // Extra line that fades in from 70 % to 100 % volume, so loud playback is visible.
        val volumeLine = loudRamp(volume)
        if (volumeLine > .01f) {
            history.sampleInto(now, 70L, volumeLayer)
            buildPath(volumeLayer, 1.18f)
            val c = colors[1 % colors.size]
            drawPath(path, c.copy(alpha = .06f * volumeLine))
            drawPath(path, c.copy(alpha = .85f * volumeLine),
                style = Stroke(2.dp.toPx(), join = StrokeJoin.Round))
        }
        // Extra exploding outer layer on heavy drops.
        if (drive > .2f) {
            buildPath(layers[0], 1.35f)
            val glow = colors.last()
            drawPath(path, glow.copy(alpha = (drive*.6f).coerceAtMost(1f)),
                style = Stroke(2.5.dp.toPx(), join = StrokeJoin.Round))
        }
        // The two outer echo layers come in with the drop / loud playback (calm start, max on drop).
        val outer = max(drive * 1.4f, loudRamp(volume) * .5f).coerceIn(0f, 1f)
        for (layer in layers.lastIndex downTo 0) {
            val presence = if (layer >= 3) outer * (if (layer == 4) .8f else 1f) else 1f
            if (presence < .02f) continue
            buildPath(layers[layer], 1f, LAYER_EXPONENT[layer])
            val color = layerColors[layer]
            if (layer == 0) {
                // Soft bloom under the core line: three widening, fading strokes (cheap, no blur pass).
                points.copyInto(layer0Points)
                shape?.let { sh ->
                    for (k in 0..POINTS) { sh.points[k*2] = points[k*2] - center.x; sh.points[k*2+1] = points[k*2+1] - center.y }
                    sh.ready = true; sh.drive = drive; sh.bass = frame.bass; sh.kick = frame.kick
                }
                val g = (.6f + frame.bass * .5f + drive * frame.kick * .9f).coerceAtMost(1.6f)
                val glowColor = colors[0]
                if (!BLOOM_ENABLED) {
                    drawPath(path, glowColor.copy(alpha = (.05f * g).coerceAtMost(1f)),
                        style = Stroke(20.dp.toPx() + drive*frame.kick*10.dp.toPx(), join = StrokeJoin.Round))
                    drawPath(path, glowColor.copy(alpha = (.09f * g).coerceAtMost(1f)),
                        style = Stroke(10.dp.toPx() + drive*frame.kick*6.dp.toPx(), join = StrokeJoin.Round))
                }
                // Chromatic split on heavy kicks: red and blue copies of the core line pull apart.
                val split = aberration()
                if (split > .5f) {
                    translate(split, 0f) { drawPath(path, Color(0xFFFF2050).copy(alpha = .55f),
                        style = Stroke(2.dp.toPx(), join = StrokeJoin.Round), blendMode = BlendMode.Screen) }
                    translate(-split, 0f) { drawPath(path, Color(0xFF2080FF).copy(alpha = .55f),
                        style = Stroke(2.dp.toPx(), join = StrokeJoin.Round), blendMode = BlendMode.Screen) }
                }
                drawPath(path, glowColor.copy(alpha = (.16f * g).coerceAtMost(1f)),
                    style = Stroke(4.5.dp.toPx(), join = StrokeJoin.Round))
                drawPath(path, color.copy(alpha = .14f))
                drawPath(path, color.copy(alpha = .95f),
                    style = Stroke(1.6.dp.toPx(), cap = StrokeCap.Round, join = StrokeJoin.Round))
            } else {
                drawPath(path, color.copy(alpha = .08f * presence))
                drawPath(path, sweepCache[layer]!!, alpha = (if (layer <= 2) .6f else .5f) * presence,
                    style = Stroke(2.dp.toPx(), cap = StrokeCap.Round, join = StrokeJoin.Round))
            }
        }
        // Light bursts on the biggest frequency peaks (reused soft dot, blended as light).
        for (i in 0 until POINTS step 4) {
            val v = mirroredSpectrumValue(layers[0], i, POINTS).coerceIn(0f, 1f)
            if (v <= .55f) continue
            val strength = ((v - .55f) / .45f * (.2f + drive * .65f) * gain).coerceIn(0f, 1f)
            val tip = Offset(layer0Points[i*2], layer0Points[i*2+1])
            val r = 8.dp.toPx() + v * 20.dp.toPx() * (1f + drive)
            drawSoftDot(tip, r, strength, burstTints[i % burstTints.size])
        }
        if (frame.kick > .03f || frame.burst > .03f) {
            val pulse = max(frame.kick, frame.burst)
            drawCircle(colors.first().copy(alpha=(pulse*(.4f+drive*.4f)*gain).coerceAtMost(1f)),
                base*(1.1f+(1-pulse)*(.65f+drive*.5f)),style=Stroke(.8.dp.toPx()+drive*pulse*4.dp.toPx()))
        }
    }
}

/** Real bloom on the ring. Set to false to fall back to the cheap stroke glow (e.g. if it runs hot). */
internal const val BLOOM_ENABLED = true

/** Ring outline shared from HardstyleOrb to its glow (points relative to the centre). */
internal class OrbShape {
    val points = FloatArray((POINTS + 1) * 2)
    var ready = false
    var drive = 0f; var bass = 0f; var kick = 0f
}

/** Soft blurred glow behind the ring. Rendered at half resolution and scaled up 2x, so the blur
 * costs a quarter as much, and the layer is larger than the cover so spikes are never clipped. */
@Composable
internal fun HardstyleOrbGlow(coverSize: Dp, shape: OrbShape, frameOf: () -> HardstyleFrame, colors: List<Color>, volumeOf: () -> Float,
    introScale: () -> Float = { 1f }) {
    val path = remember { Path() }
    val density = LocalDensity.current
    val blur = remember(density) {
        val r = with(density) { 9.dp.toPx() }
        android.graphics.RenderEffect.createBlurEffect(r, r, android.graphics.Shader.TileMode.DECAL).asComposeRenderEffect()
    }
    Canvas(Modifier.requiredSize(coverSize * 1.2f).graphicsLayer { val s = 2f * introScale(); scaleX = s; scaleY = s; renderEffect = blur }) {
        frameOf() // redraw every frame with the music
        if (!shape.ready) return@Canvas
        val c = center
        path.rewind()
        val pts = shape.points
        fun x(i: Int) = c.x + pts[i*2] * .5f
        fun y(i: Int) = c.y + pts[i*2+1] * .5f
        path.moveTo((x(0) + x(1)) / 2f, (y(0) + y(1)) / 2f)
        for (i in 1..POINTS) {
            val n = if (i == POINTS) 1 else i + 1
            path.quadraticTo(x(i), y(i), (x(i) + x(n)) / 2f, (y(i) + y(n)) / 2f)
        }
        path.close()
        val g = ((.55f + shape.bass * .45f + shape.drive * shape.kick * .8f) * volumeGain(volumeOf())).coerceAtMost(1.4f)
        drawPath(path, colors[0].copy(alpha = (.5f * g).coerceAtMost(1f)),
            style = Stroke(4.dp.toPx() + shape.drive * shape.kick * 3.dp.toPx(), join = StrokeJoin.Round))
        drawPath(path, colors[1 % colors.size].copy(alpha = (.12f * g).coerceAtMost(1f)))
    }
}

/** Grey noise tile for the film-grain overlay. */
internal val grainTexture: ImageBitmap by lazy {
    val n = 128
    val rnd = java.util.Random(7)
    val px = IntArray(n * n) { val v = 64 + rnd.nextInt(128); (0xFF shl 24) or (v shl 16) or (v shl 8) or v }
    android.graphics.Bitmap.createBitmap(px, n, n, android.graphics.Bitmap.Config.ARGB_8888).asImageBitmap()
}

/** Light moving average across neighbouring bands (radius in bands); outer echo layers look softer. */
private fun smoothBands(values: FloatArray, radius: Int, scratch: FloatArray) {
    if (radius <= 0) return
    values.copyInto(scratch)
    for (i in values.indices) {
        var sum = 0f; var weight = 0f
        for (k in -radius..radius) {
            val j = (i + k).coerceIn(0, values.lastIndex)
            val w = (radius + 1 - abs(k)).toFloat()
            sum += scratch[j] * w; weight += w
        }
        values[i] = sum / weight
    }
}

/** Fixed ring buffer of ripples, spawned on strong bass that is also distorted. */
internal class RippleBank {
    companion object { const val SIZE = 8 }
    val born = LongArray(SIZE) { -100_000L }
    val strength = FloatArray(SIZE)
    private var next = 0
    private var armed = true
    private var lastSpawn = 0L
    fun update(now: Long, bass: Float, grit: Float, power: Float) {
        if (bass < .5f) armed = true
        if (armed && bass > .72f && grit > .35f && now - lastSpawn > 160L) {
            armed = false
            lastSpawn = now
            born[next] = now
            strength[next] = power
            next = (next + 1) % SIZE
        }
    }
}

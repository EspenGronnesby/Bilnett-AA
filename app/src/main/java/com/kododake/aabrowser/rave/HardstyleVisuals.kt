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
internal fun HardstyleBackdrop(modifier: Modifier, frame: HardstyleFrame, time: Float, colors: List<Color>, video: Boolean,
    coverCenter: Offset, coverRadius: Float, intensity: Float, volume: Float = 1f, particles: Float = 1f,
    density: Float = 1f, softness: Float = 1f) {
    val ripples = remember { RippleBank() }
    // Accumulated particle clock: phase += dt * speed. (Multiplying the ever-growing time by a speed
    // that changes with the music made every particle jump on each beat.)
    val clock = remember { FloatArray(2) }
    val tints = remember(colors) { colors.map { ColorFilter.tint(it, BlendMode.Modulate) } }
    Canvas(modifier) {
        val gain = volumeGain(volume)
        val ramp = loudRamp(volume)
        val c = coverCenter
        val span = max(size.width, size.height)
        var highActivity = 0f
        for (band in 32 until SPECTRUM_BANDS) highActivity += frame.spectrum[band]
        highActivity = (highActivity / 16f).coerceIn(0f, 1f)
        val shimmer = max(frame.highMotion, highActivity * .35f)
        val beatKick = max(frame.kick, frame.bass * .35f)
        val heavyHit = frame.heavy * beatKick
        val speed = (.10f + intensity * .20f + frame.energy * .08f + frame.heavy * .35f) * (.6f + .4f * gain) * (1f + ramp * .4f) * particles
        val nowMs = SystemClock.uptimeMillis()
        val dt = if (clock[1] == 0f) 0f else ((nowMs % 1_000_000L) / 1000f - clock[1]).coerceIn(0f, .1f)
        clock[1] = (nowMs % 1_000_000L) / 1000f
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
            val p = age.toFloat() / life
            val eased = 1f - (1f - p) * (1f - p) * (1f - p)
            val radius = coverRadius + reach * eased
            val fade = (1f - p) * (1f - p) * strength
            val color = colors[r % colors.size]
            // Soft wide band, a mid glow and a sharp front edge, blended as light.
            drawCircle(color.copy(alpha = (.10f * fade).coerceAtMost(1f)), radius, c,
                style = Stroke((10.dp.toPx() + 30.dp.toPx() * strength) * (1f - p * .6f)), blendMode = BlendMode.Screen)
            drawCircle(color.copy(alpha = (.22f * fade).coerceAtMost(1f)), radius, c,
                style = Stroke(5.dp.toPx() + 4.dp.toPx() * strength), blendMode = BlendMode.Screen)
            drawCircle(Color.White.copy(alpha = (.35f * fade).coerceAtMost(1f)), radius, c,
                style = Stroke(1.2.dp.toPx() + 1.5.dp.toPx() * strength))
        }
        // From 70 % volume up to 100 %, up to twice as many particles join in (never more than 224).
        val baseCount = (112 * density).toInt()
        val count = ((112 + 112 * ramp) * density).toInt().coerceIn(12, 224)
        val streak = heavyHit * (1f + ramp) / softness
        // Each particle has a deterministic direction and its own steady speed. It is born just
        // beyond the cover, flies outward (growing, as if towards the camera), fades at the edge
        // and is emitted again.
        for (i in 0 until count) {
            val band = frame.spectrum[32 + i % 16]
            val own = .8f + .4f * ((i * 0.754877f) % 1f)
            val phase = (i * .618034f + clock[0] * own) % 1f
            val angle = i * 2.399963f + sin(time * .35f + i) * shimmer * .08f
            val travel = .78f + frame.burst * .35f + beatKick * .18f + heavyHit * .4f / softness
            val distance = coverRadius + span * phase * phase * travel
            val direction = Offset(cos(angle), sin(angle))
            val position = c + direction * distance
            val musicalGlow = (frame.energy * .28f + frame.bass * .25f + frame.highs * .18f + shimmer * .45f + band * .25f).coerceIn(0f, 1f)
            // Fade in right after birth (no popping) and out towards the edge.
            val edgeFade = (1f - phase).coerceIn(0f, 1f) * (phase * 10f).coerceAtMost(1f)
            val alpha = edgeFade * (.18f + musicalGlow * .72f) * (if (video) .72f else 1f) * (if (i >= baseCount) ramp else 1f) / softness
            if (alpha < .01f) continue
            // Depth: small and dim near the cover, bigger as they come "closer".
            val depth = .45f + 1.1f * phase
            val radius = (1.3f + musicalGlow * 3.2f + beatKick * 1.8f + heavyHit * 2.5f) * (.6f + .4f * gain) * (1f + ramp * .5f) * softness * depth
            val col = colors[i % colors.size]
            // Soft profiles (rap) draw glowing bokeh instead of sharp sparks.
            if (softness > 1.2f) {
                drawSoftDot(position, radius * 2.2f, alpha, tints[i % tints.size])
            } else {
                drawSoftDot(position, radius * 3f, alpha * .45f, tints[i % tints.size])
                if (streak > .15f) {
                    // Motion streaks on heavy drops: a short trail back towards the cover.
                    val tail = position - direction * (radius * 4f * streak * (.5f + phase))
                    drawLine(col.copy(alpha = alpha), tail, position, strokeWidth = radius * 1.1f,
                        cap = StrokeCap.Round, blendMode = BlendMode.Screen)
                } else drawCircle(col.copy(alpha = alpha), radius, position, blendMode = BlendMode.Screen)
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
    modifier: Modifier, frame: HardstyleFrame, colors: List<Color>,
    roundedSquare: Boolean = false, volume: Float = 1f, spikeGain: Float = 1f
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
        val maximumDisplacement = min(36.dp.toPx() + drive*70.dp.toPx(), side * (.12f + drive*.22f)) * gain * boost * spikeGain
        // Big, but never so big that spikes cover the text or leave the screen.
        val displacementCap = side * .38f * boost
        val spikeCurve = 1f - drive*.5f
        val radius = base * (1f + kickExpansion)
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
                val g = (.6f + frame.bass * .5f + drive * frame.kick * .9f).coerceAtMost(1.6f)
                val glowColor = colors[0]
                drawPath(path, glowColor.copy(alpha = (.05f * g).coerceAtMost(1f)),
                    style = Stroke(20.dp.toPx() + drive*frame.kick*10.dp.toPx(), join = StrokeJoin.Round))
                drawPath(path, glowColor.copy(alpha = (.09f * g).coerceAtMost(1f)),
                    style = Stroke(10.dp.toPx() + drive*frame.kick*6.dp.toPx(), join = StrokeJoin.Round))
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

/** Phone media volume 0..1 -> visual strength. Low volume = calm, max = full power. */
internal fun volumeGain(volume: Float): Float = .35f + .65f * volume.coerceIn(0f, 1f).pow(1.5f)
/** 1.0 below 90 % volume, rising to 1/0.7 (~1.43x) at 100 %. */
internal fun maxVolumeBoost(volume: Float): Float = 1f + (1f / .7f - 1f) * ((volume - .9f) / .1f).coerceIn(0f, 1f)
/** 0 below 70 % volume, rising to 1 at 100 %. */
internal fun loudRamp(volume: Float): Float = ((volume - .7f) / .3f).coerceIn(0f, 1f)
/** 0 below 75 % volume, 1 at max. */
internal fun loudness(volume: Float): Float = ((volume - .75f) / .25f).coerceIn(0f, 1f)

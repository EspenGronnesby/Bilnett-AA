package com.kododake.aabrowser.rave

import android.os.SystemClock
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.Canvas
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.Stroke
import kotlin.math.*

/** Music driven particles emitted from the cover center. The shared scene Canvas
 * supplies the same background lighting as normal mode. */
@Composable
internal fun HardstyleBackdrop(modifier: Modifier, frame: HardstyleFrame, time: Float, colors: List<Color>, video: Boolean,
    coverCenter: Offset, coverRadius: Float, intensity: Float, volume: Float = 1f) {
    val ripples = remember { RippleBank() }
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
        val speed = (.10f + intensity * .20f + frame.energy * .08f + frame.heavy * .35f) * (.6f + .4f * gain) * (1f + ramp * .4f)
        // Ripples only on lots of bass AND distortion together (zaag etc.). Clean bass,
        // kicks, highs and quiet drops do not trigger them.
        val now = SystemClock.uptimeMillis()
        ripples.update(now, frame.bass, frame.grit,
            ((.4f + frame.grit * .6f) * frame.bass * gain * (1f + ramp * .4f)).coerceAtMost(1.4f))
        val reach = span * 1.1f
        for (r in 0 until RippleBank.SIZE) {
            val age = now - ripples.born[r]
            val strength = ripples.strength[r]
            val life = 1100L - (strength * 250f).toLong()
            if (strength <= 0f || age !in 0 until life) continue
            val p = age.toFloat() / life
            val eased = 1f - (1f - p) * (1f - p)
            val radius = coverRadius + reach * eased
            val fade = (1f - p) * (1f - p) * strength
            val color = colors[r % colors.size]
            // Soft wide band plus a sharp front edge.
            drawCircle(color.copy(alpha = (.10f * fade).coerceAtMost(1f)), radius, c,
                style = Stroke((10.dp.toPx() + 30.dp.toPx() * strength) * (1f - p * .6f)))
            drawCircle(color.copy(alpha = (.55f * fade).coerceAtMost(1f)), radius, c,
                style = Stroke(1.5.dp.toPx() + 2.5.dp.toPx() * strength))
        }
        // From 70 % volume up to 100 %, up to twice as many particles join in.
        val count = 112 + (112 * ramp).toInt()
        // Each particle has a deterministic direction and phase. It is born just
        // beyond the cover, travels outward, fades at the edge, then is emitted again.
        for (i in 0 until count) {
            val band = frame.spectrum[32 + i % 16]
            val phase = (i * .618034f + time * speed * (1f + band * 1.8f)) % 1f
            val angle = i * 2.399963f + sin(time * .35f + i) * shimmer * .08f
            val distance = coverRadius + span * phase * phase * (.78f + frame.burst * .35f + beatKick * .18f + heavyHit * .4f)
            val direction = Offset(cos(angle), sin(angle))
            val position = c + direction * distance
            val musicalGlow = (frame.energy * .28f + frame.bass * .25f + frame.highs * .18f + shimmer * .45f + band * .25f).coerceIn(0f, 1f)
            val edgeFade = (1f - phase).coerceIn(0f, 1f)
            val alpha = edgeFade * (.18f + musicalGlow * .72f) * (if (video) .72f else 1f) * (if (i >= 112) ramp else 1f)
            val radius = (1.3f + musicalGlow * 3.2f + beatKick * 1.8f + heavyHit * 2.5f) * (.6f + .4f * gain) * (1f + ramp * .5f)
            drawCircle(colors[i % colors.size].copy(alpha = alpha), radius, position)
        }
    }
}

/** Mirrored frequency contours; motion comes from FFT values, never an oscillator. */
@Composable
internal fun HardstyleOrb(
    modifier: Modifier, frame: HardstyleFrame, colors: List<Color>,
    roundedSquare: Boolean = false, volume: Float = 1f
) {
    val path = remember { Path() }
    val history = remember { SpectrumHistory() }
    val layers = remember { Array(3) { FloatArray(SPECTRUM_BANDS) } }
    val volumeLayer = remember { FloatArray(SPECTRUM_BANDS) }
    val points = remember { FloatArray(129 * 2) }
    Canvas(modifier) {
        val now = SystemClock.uptimeMillis()
        history.push(now, frame.spectrum)
        for (layer in 0..2) history.sampleInto(now, layer * 35L, layers[layer])
        val side = min(size.width, size.height)
        val base = side * (if (roundedSquare) .45f else .34f)
        val heavy = frame.heavy
        val gain = volumeGain(volume)
        // Loud playback makes a drop hit even harder.
        val drive = heavy * (.7f + .3f * loudness(volume))
        // At (near) 100 % volume the ring takes off: today's max becomes 70 % of the new max.
        val boost = maxVolumeBoost(volume)
        val kickExpansion = boost * (if (roundedSquare) frame.kick*(.035f + drive*.16f) else frame.kick*(.11f + drive*.14f)) * gain
        val maximumDisplacement = min(36.dp.toPx() + drive*70.dp.toPx(), side * (.12f + drive*.22f)) * gain * boost
        // Big, but never so big that spikes cover the text or leave the screen.
        val displacementCap = side * .38f * boost
        val spikeCurve = 1f - drive*.5f
        val radius = base * (1f + kickExpansion)
        // Exaggerated spikes on drops: tall bands grow much more than low ones.
        fun spike(values: FloatArray, i: Int, extra: Float = 1f): Float {
            val v = mirroredSpectrumValue(values, i).coerceIn(0f, 1f)
            return min(v.pow(spikeCurve) * (1f + drive * v) * maximumDisplacement * extra, displacementCap)
        }
        fun buildPath(values: FloatArray, extra: Float = 1f) {
            for (i in 0..128) {
                val angle = i * 2f * PI.toFloat() / 128 - PI.toFloat() / 2
                val contour = if (roundedSquare)
                    (abs(cos(angle)).pow(8) + abs(sin(angle)).pow(8)).pow(-1f/8f) else 1f
                val displacement = spike(values, i, extra)
                // Displace outward along the local normal so square sides stay in their layout slot.
                val x = cos(angle) * radius * contour
                val y = sin(angle) * radius * contour
                val nx = if (roundedSquare) sign(x) * abs(cos(angle)).pow(7) else cos(angle)
                val ny = if (roundedSquare) sign(y) * abs(sin(angle)).pow(7) else sin(angle)
                val length = hypot(nx, ny).coerceAtLeast(.0001f)
                points[i*2] = center.x + x + nx / length * displacement
                points[i*2+1] = center.y + y + ny / length * displacement
            }
            path.reset()
            path.moveTo(points[0], points[1])
            for (i in 1..128) path.lineTo(points[i*2], points[i*2+1])
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
        for (layer in 2 downTo 0) {
            buildPath(layers[layer])
            val color = colors[layer % colors.size]
            drawPath(path, color.copy(alpha = if (layer == 0) .12f else .08f))
            drawPath(path, color.copy(alpha = if (layer == 0) .95f else .55f),
                style = Stroke(if (layer == 0) 1.5.dp.toPx() else 2.dp.toPx(), join = StrokeJoin.Round))
            if (layer == 0) drawPath(path, color.copy(alpha = (.10f + frame.bass*.12f + drive*frame.kick*.25f).coerceAtMost(1f)),
                style = Stroke(6.dp.toPx() + drive*frame.kick*8.dp.toPx(), join = StrokeJoin.Round))
        }
        // Light bursts on the biggest frequency peaks. `points` holds layer 0 here,
        // because the layer loop above builds layer 0 last.
        for (i in 0 until 128 step 4) {
            val v = mirroredSpectrumValue(layers[0], i).coerceIn(0f, 1f)
            if (v <= .55f) continue
            val strength = ((v - .55f) / .45f * (.2f + drive * .65f) * gain).coerceIn(0f, 1f)
            val tip = Offset(points[i*2], points[i*2+1])
            val r = 8.dp.toPx() + v * 20.dp.toPx() * (1f + drive)
            drawCircle(Brush.radialGradient(listOf(colors[i % colors.size].copy(alpha = strength), Color.Transparent),
                center = tip, radius = r), radius = r, center = tip)
        }
        if (frame.kick > .03f || frame.burst > .03f) {
            val pulse = max(frame.kick, frame.burst)
            drawCircle(colors.first().copy(alpha=(pulse*(.4f+drive*.4f)*gain).coerceAtMost(1f)),
                base*(1.1f+(1-pulse)*(.65f+drive*.5f)),style=Stroke(2f+drive*pulse*4.dp.toPx()))
        }
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

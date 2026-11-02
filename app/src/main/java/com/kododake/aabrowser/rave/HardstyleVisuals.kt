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
    coverCenter: Offset, coverRadius: Float, intensity: Float) {
    Canvas(modifier) {
        val c = coverCenter
        val span = max(size.width, size.height)
        var highActivity = 0f
        for (band in 32 until SPECTRUM_BANDS) highActivity += frame.spectrum[band]
        highActivity = (highActivity / 16f).coerceIn(0f, 1f)
        val shimmer = max(frame.highMotion, highActivity * .35f)
        val beatKick = max(frame.kick, frame.bass * .35f)
        val speed = .10f + intensity * .20f + frame.energy * .08f
        // Each particle has a deterministic direction and phase. It is born just
        // beyond the cover, travels outward, fades at the edge, then is emitted again.
        for (i in 0 until 112) {
            val band = frame.spectrum[32 + i % 16]
            val phase = (i * .618034f + time * speed * (1f + band * 1.8f)) % 1f
            val angle = i * 2.399963f + sin(time * .35f + i) * shimmer * .08f
            val distance = coverRadius + span * phase * phase * (.78f + frame.burst * .35f + beatKick * .18f)
            val direction = Offset(cos(angle), sin(angle))
            val position = c + direction * distance
            val musicalGlow = (frame.energy * .28f + frame.bass * .25f + frame.highs * .18f + shimmer * .45f + band * .25f).coerceIn(0f, 1f)
            val edgeFade = (1f - phase).coerceIn(0f, 1f)
            val alpha = edgeFade * (.18f + musicalGlow * .72f) * (if (video) .72f else 1f)
            val radius = 1.3f + musicalGlow * 3.2f + beatKick * 1.8f
            drawCircle(colors[i % colors.size].copy(alpha = alpha), radius, position)
        }
    }
}

/** Mirrored frequency contours; motion comes from FFT values, never an oscillator. */
@Composable
internal fun HardstyleOrb(
    modifier: Modifier, frame: HardstyleFrame, colors: List<Color>,
    roundedSquare: Boolean = false
) {
    val path = remember { Path() }
    val history = remember { SpectrumHistory() }
    val layers = remember { Array(3) { FloatArray(SPECTRUM_BANDS) } }
    val points = remember { FloatArray(129 * 2) }
    Canvas(modifier) {
        val now = SystemClock.uptimeMillis()
        history.push(now, frame.spectrum)
        for (layer in 0..2) history.sampleInto(now, layer * 35L, layers[layer])
        val side = min(size.width, size.height)
        val base = side * (if (roundedSquare) .45f else .34f)
        val kickExpansion = if (roundedSquare) frame.kick*.035f else frame.kick*.11f
        val maximumDisplacement = min(36.dp.toPx(), side * .12f)
        for (layer in 2 downTo 0) {
            val radius = base * (1f + kickExpansion)
            for (i in 0..128) {
                val angle = i * 2f * PI.toFloat() / 128 - PI.toFloat() / 2
                val contour = if (roundedSquare)
                    (abs(cos(angle)).pow(8) + abs(sin(angle)).pow(8)).pow(-1f/8f) else 1f
                val displacement = mirroredSpectrumValue(layers[layer], i) * maximumDisplacement
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
            val color = colors[layer % colors.size]
            drawPath(path, color.copy(alpha = if (layer == 0) .12f else .08f))
            drawPath(path, color.copy(alpha = if (layer == 0) .95f else .55f),
                style = Stroke(if (layer == 0) 1.5.dp.toPx() else 2.dp.toPx(), join = StrokeJoin.Round))
            if (layer == 0) drawPath(path, color.copy(alpha = .10f + frame.bass*.12f),
                style = Stroke(6.dp.toPx(), join = StrokeJoin.Round))
        }
        if (frame.kick > .03f || frame.burst > .03f) {
            val pulse = max(frame.kick, frame.burst)
            drawCircle(colors.first().copy(alpha=pulse*.4f),base*(1.1f+(1-pulse)*.65f),style=Stroke(2f))
        }
    }
}

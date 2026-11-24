package com.kododake.aabrowser.rave

import android.os.SystemClock
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.Canvas
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Dp
import androidx.compose.foundation.layout.requiredSize
import kotlin.math.*

// ════════ Samme lys som nettsiden: lysstøv, lysbølger, nordlysskjær, snare-glød ════════
// Alt tegnes som mykt lys i coverfargene, lagt oppå hverandre (additivt). Tallene står i rave-core
// (FestivalShow.kt: DUST_*, HALO_*, WAVE_*, EDGE_*, BACKLIGHT_*); her står bare tegningen.

/**
 * Det jevnede bakgrunnslyset og dropet-flagget, oppdatert én gang per bilde i effektløkken i RaveActivity
 * (samme regler som `WebPartyEngine.tick`): lyset svulmer mykt med bassen i stedet for å slå.
 */
internal class PartyLight {
    /** Bakgrunnslysene (0..1,6) og sub-bassens glød, jevnet. */
    var partyHit = 0f; private set
    var subGlow = 0f; private set
    /** Snare-gløden (0..[EDGE_GLOW_MAX]); tilstand, så bare snare-lerretet tegnes på nytt. */
    var edgeGlow by mutableFloatStateOf(0f); private set
    /** Dropet er på: bare da kommer lysbølger, og støvet har full fart. */
    var dropOn = false; private set
    var phaseLevel = 1f; private set
    private var edgeLevel = 0f

    fun reset() { partyHit = 0f; subGlow = 0f; edgeGlow = 0f; edgeLevel = 0f; dropOn = false; phaseLevel = 1f }

    fun update(dt: Float, f: HardstyleFrame, maxBand: Float, phaseLevel: Float, volume: Float, showOn: Float, drop: Boolean) {
        fun eased(from: Float, goal: Float, attackS: Float, releaseS: Float) =
            from + (goal - from) * (1f - exp(-dt / if (goal > from) attackS else releaseS))
        val hitGoal = ((.3f + .7f * phaseLevel) *
            (max(max(f.kick, f.bass * .55f), f.highMotion * .2f) + f.heavy * f.kick * .4f + maxBand * .25f * volumeGain(volume))).coerceAtMost(1.6f)
        partyHit = eased(partyHit, hitGoal, BACKLIGHT_ATTACK_S, BACKLIGHT_RELEASE_S).let { if (it < .001f) 0f else it }
        subGlow = eased(subGlow, .12f * f.sub * f.bass * showOn, BACKLIGHT_ATTACK_S, BACKLIGHT_RELEASE_S)
        edgeLevel = eased(edgeLevel, f.snare.coerceIn(0f, 1f) * showOn, EDGE_GLOW_ATTACK_S, EDGE_GLOW_RELEASE_S)
        edgeGlow = (EDGE_GLOW_MAX * edgeLevel).let { if (it < .004f) 0f else it }
        dropOn = drop; this.phaseLevel = phaseLevel
    }
}

private const val DOT_PX = 64
/** Ferdige myke prikker, én per farge, laget én gang (nøkkel: RGB). */
private val dotBitmaps = HashMap<Int, android.graphics.Bitmap>()

/** Et mykt lyspunkt: klokkekurve exp(−4,5 r²), løftet til 0 ved kanten (ingen kant noe sted). Som `softDot` på nettsiden. */
private fun bellDot(rgb: Int): android.graphics.Bitmap = dotBitmaps.getOrPut(rgb and 0xFFFFFF) {
    if (dotBitmaps.size > 48) dotBitmaps.clear()
    val px = IntArray(DOT_PX * DOT_PX)
    val mid = (DOT_PX - 1) / 2f
    for (y in 0 until DOT_PX) for (x in 0 until DOT_PX) {
        val r = hypot(x - mid, y - mid) / (DOT_PX / 2f)
        val a = if (r >= 1f) 0f else max(exp(-4.5f * r * r) - .0111f, 0f) / .9889f
        px[y * DOT_PX + x] = ((a * 255f).roundToInt() shl 24) or (rgb and 0xFFFFFF)
    }
    android.graphics.Bitmap.createBitmap(px, DOT_PX, DOT_PX, android.graphics.Bitmap.Config.ARGB_8888)
}

private fun mixRgb(a: Color, toRgb: Int, t: Float): Int {
    val r = a.red * 255f + (((toRgb shr 16) and 255) - a.red * 255f) * t
    val g = a.green * 255f + (((toRgb shr 8) and 255) - a.green * 255f) * t
    val b = a.blue * 255f + ((toRgb and 255) - a.blue * 255f) * t
    return (r.roundToInt() shl 16) or (g.roundToInt() shl 8) or b.roundToInt()
}

private fun frac(x: Float) = x - floor(x)

/** Alt lysstøvet, bølgene og skjæret trenger mellom bilder: ingen allokering per bilde. */
private class DustState {
    var palette: List<Color>? = null
    var halo = emptyArray<android.graphics.Bitmap>()
    var tint = emptyArray<android.graphics.Bitmap>()
    var white = emptyArray<android.graphics.Bitmap>()
    val mood = FloatArray(6)          // vokal, vokal-slag, glitter (snare/hats), diskant, drop, svulming
    val flashes = FloatArray(PARTICLES_MAX)
    val lit = FloatArray(PARTICLES_MAX)
    val born = LongArray(WAVE_COUNT) { -100_000L }
    val strength = FloatArray(WAVE_COUNT)
    var nextWave = 0
    var waveArmed = true
    var lastSpawn = 0L
    var armed = true
    var seed = 0
    var clock = 0f
    var drift = 0f
    var lastAt = 0L
    val strokes = FloatArray(WAVE_STROKES) { k ->
        (cos(PI / 2 * k / WAVE_STROKES).pow(2) - cos(PI / 2 * (k + 1) / WAVE_STROKES).pow(2)).toFloat()
    }
    val bitmapPaint = android.graphics.Paint(android.graphics.Paint.FILTER_BITMAP_FLAG).apply { blendMode = android.graphics.BlendMode.PLUS }
    val wavePaint = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply {
        style = android.graphics.Paint.Style.STROKE; strokeJoin = android.graphics.Paint.Join.ROUND
        blendMode = android.graphics.BlendMode.PLUS
    }
    val src = android.graphics.Rect(0, 0, DOT_PX, DOT_PX)
    val dst = android.graphics.RectF()

    /** Prikkene for denne paletten: ren farge (skjæret), og støvets to blandinger mot auraens varme hvite. */
    fun ensure(colors: List<Color>) {
        if (palette == colors) return
        palette = colors
        halo = Array(colors.size) { bellDot(mixRgb(colors[it], CORE_COLOR, 0f)) }
        tint = Array(colors.size) { bellDot(mixRgb(colors[it], CORE_COLOR, DUST_TINT_MIX)) }
        white = Array(colors.size) { bellDot(mixRgb(colors[it], CORE_COLOR, DUST_WHITE_MIX)) }
    }

    fun stamp(canvas: android.graphics.Canvas, bitmap: android.graphics.Bitmap, cx: Float, cy: Float, w: Float, h: Float, alpha: Float) {
        bitmapPaint.alpha = (alpha.coerceIn(0f, 1f) * 255f).roundToInt()
        dst.set(cx - w / 2f, cy - h / 2f, cx + w / 2f, cy + h / 2f)
        canvas.drawBitmap(bitmap, src, dst, bitmapPaint)
    }
}

private fun ease(state: DustState, i: Int, target: Float, rise: Float, fall: Float, dt: Float) {
    val tau = if (target > state.mood[i]) rise else fall
    state.mood[i] += (target - state.mood[i]) * (1f - exp(-dt / tau))
}

/**
 * Nordlysskjæret, lysbølgene og lysstøvet bak coveret (samme som `ParticleLayer` på nettsiden). Selve scenelyset
 * tegnes av bakgrunnslerretet i RaveActivity. [coverSideOf]/[cornerOf]: coverets side og hjørneradius i hvile (px).
 * Draw-kall per bilde: 2 (skjær) + opptil 9 per bølge (vanligvis 0) + ett per synlig korn (høyst [PARTICLES_MAX]).
 */
@Composable
internal fun HardstyleBackdrop(modifier: Modifier, frameOf: () -> HardstyleFrame, light: PartyLight, colors: List<Color>, video: Boolean,
    coverCenter: Offset, coverSideOf: () -> Float, cornerOf: () -> Float, volume: Float = 1f, profile: () -> PartyProfile,
    fx: PartySettings = PartySettings()) {
    val s = remember { DustState() }
    Canvas(modifier) {
        // Lyd leses her, under tegning, så skjermen ikke komponeres på nytt hver gang.
        val e = frameOf()
        val side = coverSideOf()
        if (side <= 0f || colors.isEmpty()) return@Canvas
        s.ensure(colors)
        val p = profile()
        val softness = p.softness
        val amount = p.particles.coerceIn(.4f, 1.3f)
        val gain = volumeGain(volume); val ramp = loudRamp(volume)
        val span = max(size.width, size.height)
        val half = side / 2f
        val dim = if (video) VIDEO_LIGHT_DIM else 1f
        val now = SystemClock.uptimeMillis()
        val dt = if (s.lastAt == 0L) 0f else ((now - s.lastAt) / 1000f).coerceIn(0f, .1f)
        s.lastAt = now
        val dropOn = light.dropOn
        val hats = max(e.snare, e.crash)
        if (hats < .3f) s.armed = true
        val newHit = hats > .7f && s.armed
        if (newHit) { s.armed = false; s.seed++ }
        val flashDecay = exp(-dt / DUST_TWINKLE_DECAY_S)
        var highActivity = 0f
        for (band in 32 until SPECTRUM_BANDS) highActivity += e.spectrum[band]
        highActivity = (highActivity / 16f).coerceIn(0f, 1f)
        val shimmerHigh = max(e.highMotion, highActivity * .35f)
        ease(s, 0, e.vocal, .15f, .6f, dt)
        ease(s, 1, e.vocalHit, .08f, .5f, dt)
        ease(s, 2, hats, .06f, .3f, dt)
        ease(s, 3, max(max(e.highs, shimmerHigh * .6f), e.build * .6f), .15f, .5f, dt)
        ease(s, 4, if (dropOn) max(e.heavy, .6f) else e.heavy * .5f, .4f, 1.2f, dt)
        ease(s, 5, min(light.partyHit, 1.2f) / 1.2f, .05f, .25f, dt)
        val vocal = s.mood[0]; val vocalHit = s.mood[1]; val twinkle = s.mood[2]; val highs = s.mood[3]; val drop = s.mood[4]; val swell = s.mood[5]
        // Én jevn, rolig fart: litt raskere i dropet, ingen hopp (farten glir mot ny verdi).
        val particleDrift = if (dropOn) 1f else PARTICLE_CALM_SPEED
        val driftGoal = particleDrift * (.8f + .2f * drop + .1f * vocal) * (.85f + .15f * gain) * (.7f + .3f * amount) / DUST_DRIFT_S
        s.drift += (driftGoal - s.drift) * (if (s.drift == 0f) 1f else 1f - exp(-dt / DUST_PACE_EASE_S))
        s.clock = (s.clock + dt * s.drift) % 10_000f
        val cx = coverCenter.x; val cy = coverCenter.y

        drawIntoCanvas { composeCanvas ->
            val canvas = composeCanvas.nativeCanvas
            // Nordlysskjæret: to store, myke lys i coverfargene som sakte går rundt coveret og svulmer med bassen.
            val round = ((now / 1000f) % HALO_ROUND_S) / HALO_ROUND_S * 2f * PI.toFloat()
            val grow = 1f + HALO_SWELL * swell
            val haloW = side * HALO_WIDTH * grow; val haloH = side * HALO_HEIGHT * grow
            val haloAlpha = (HALO_REST + HALO_GAIN * swell * (HALO_GAIN_CALM + (1f - HALO_GAIN_CALM) * light.phaseLevel)) * dim
            for (k in 0 until 2) {
                val a = round + k * PI.toFloat()
                s.stamp(canvas, s.halo[k % colors.size], cx + cos(a) * side * HALO_OFFSET, cy + sin(a) * side * HALO_OFFSET * HALO_SQUASH,
                    haloW, haloH, haloAlpha)
            }

            // Lysbølger: bare i dropet, på mye bass OG forvrengning, og ikke for ofte.
            if (e.bass < WAVE_REARM_BASS) s.waveArmed = true
            if (s.waveArmed && dropOn && e.bass > WAVE_BASS_FROM && e.grit > WAVE_GRIT_FROM && now - s.lastSpawn > fx.rippleGapMs) {
                s.waveArmed = false; s.lastSpawn = now
                s.born[s.nextWave] = now
                s.strength[s.nextWave] = min((.4f + e.grit * .6f) * e.bass * gain * (1f + ramp * .4f), 1.4f)
                s.nextWave = (s.nextWave + 1) % WAVE_COUNT
            }
            // En bred, myk, RUND lysring (Espen 2026-11-24: runde, ikke firkantede), ~9 strøk oppå hverandre, smal til
            // bred. Tegnes bak coveret, så coveret skjuler den delen av sirkelen som ligger innenfor hjørnene.
            val paint = s.wavePaint
            // Espens innstillinger (styrke og bredde; 1× = tallene i FestivalShow.kt), lest hvert bilde.
            val waveAlpha = fx.waveAlpha; val widthFrom = fx.waveWidthFrom; val widthTo = fx.waveWidthTo
            for (r in 0 until WAVE_COUNT) {
                val age = now - s.born[r]
                val st = s.strength[r]
                if (st <= 0f || age < 0 || age >= WAVE_LIFE_MS) continue
                val q = age.toFloat() / WAVE_LIFE_MS
                val eased = 1f - (1f - q).pow(WAVE_SLOWDOWN)
                val out = side * (WAVE_START + WAVE_REACH * eased)
                val width = side * (widthFrom + (widthTo - widthFrom) * eased)
                val fade = min(q * WAVE_FADE_IN, 1f) * (1f - q).pow(WAVE_FADE_OUT_CURVE) * (.5f + .5f * min(st, 1f)) * waveAlpha * dim
                if (fade < .004f) continue
                val rgb = mixRgb(colors[r % colors.size], CORE_COLOR, WAVE_WHITE_MIX)
                val radius = half + out
                for (k in 0 until WAVE_STROKES) {
                    paint.color = ((fade * s.strokes[k] * 255f).roundToInt().coerceIn(0, 255) shl 24) or rgb
                    paint.strokeWidth = width * (k + 1) / WAVE_STROKES
                    canvas.drawCircle(cx, cy, radius, paint)
                }
            }

            // Lysstøv: fødes ved coverkanten, svever sakte utover med mild sidesvai, borte lenge før kanten.
            val base = PARTICLES_BASE; val most = PARTICLES_MAX
            val baseCount = (base * p.density).toInt()
            val count = ((base + (most - base) * ramp) * p.density).toInt().coerceIn(12, most)
            val showing = count * (DUST_CALM_SHARE + (1f - DUST_CALM_SHARE) * drop)
            val up = 1f - exp(-dt / DUST_ATTACK_S); val down = 1f - exp(-dt / DUST_RELEASE_S)
            val sizeAll = (.85f + .15f * gain) * (1f + ramp * .2f) * (.8f + .2f * softness) * density
            val lift = e.energy * .45f + highs * .25f + vocal * .25f + vocalHit * .15f + drop * .35f
            val reach = span * DUST_REACH
            val invSoft = 1f / sqrt(softness)
            for (i in 0 until count) {
                val h1 = frac(i * .754877f); val h2 = frac(i * .56984f); val h3 = frac(i * .438579f)
                val phase = frac(i * .618034f + s.clock * (.7f + .6f * h1))
                if (newHit && frac(i * .618034f + s.seed * .381966f) < DUST_TWINKLE_SHARE) s.flashes[i] = max(twinkle, DUST_TWINKLE_MIN)
                else s.flashes[i] *= flashDecay
                // Hvert korn lyser opp med sitt eget bånd og musikken, og dør sakte ut.
                val goal = (DUST_REST + (1f - DUST_REST) * (lift + e.spectrum[32 + i % 16] * DUST_BAND_GAIN + s.flashes[i] * DUST_TWINKLE_GAIN)).coerceIn(0f, 1f)
                s.lit[i] += (goal - s.lit[i]) * (if (goal > s.lit[i]) up else down)
                val shown = ((showing - i) / 10f).coerceIn(0f, 1f) * (if (i >= baseCount) ramp else 1f)
                val big = i % DUST_BIG_EVERY == 3
                val edgeFade = min(phase * DUST_FADE_IN, 1f) * (1f - phase).pow(DUST_FADE_OUT_CURVE)
                val glitter = 1f - DUST_SHIMMER + DUST_SHIMMER * sin(s.clock * 45f * (.6f + h2) + i * 1.7f)
                val alpha = edgeFade * s.lit[i] * glitter * shown * (if (big) DUST_BIG_ALPHA else 1f) * dim * (.6f + .4f * amount) * invSoft
                if (alpha < .008f) continue
                val angle = i * 2.399963f + DUST_SWAY * sin(s.clock * 19f * (.6f + .8f * h2) + i)
                val dx = cos(angle); val dy = sin(angle)
                // Fra coverets (firkantede) kant, ikke fra en sirkel inne i det.
                val start = half * DUST_START / max(abs(dx), abs(dy))
                val distance = start + reach * phase.pow(DUST_PATH_CURVE)
                val d = (if (big) DUST_BIG_DP else DUST_SMALL_DP) * (.6f + .8f * h3) * (.85f + .4f * phase) * sizeAll * 2f
                val dot = (if (i % DUST_WHITE_EVERY == 1) s.white else s.tint)[i % colors.size]
                s.stamp(canvas, dot, cx + dx * distance, cy + dy * distance, d, d, min(alpha, 1f))
            }
        }
    }
}


/** Den myke, varmhvite snare-gløden rett utenfor coverkanten tegnes ÉN gang per coverstørrelse (skygge uten indre del). */
private fun edgeSprite(side: Float, radius: Float, density: Float): android.graphics.Bitmap {
    val blur = EDGE_GLOW_BLUR_DP * density; val spread = EDGE_GLOW_SPREAD_DP * density
    val pad = ceil(blur + spread).toInt() + 2
    val size = ceil(side).toInt() + 2 * pad
    val bitmap = android.graphics.Bitmap.createBitmap(size, size, android.graphics.Bitmap.Config.ARGB_8888)
    val canvas = android.graphics.Canvas(bitmap)
    val o = (size - side) / 2f
    val glow = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply {
        color = (0xFF000000.toInt() or CORE_COLOR)
        alpha = (255f * EDGE_GLOW_ALPHA).roundToInt()
        // CSS-uskarphet B tilsvarer sigma B/2; BlurMaskFilter regner radius → sigma ≈ 0,58 r + 0,5.
        maskFilter = android.graphics.BlurMaskFilter(((blur / 2f - .5f) / .57735f).coerceAtLeast(1f), android.graphics.BlurMaskFilter.Blur.NORMAL)
    }
    canvas.drawRoundRect(o - spread, o - spread, o + side + spread, o + side + spread, radius + spread, radius + spread, glow)
    // Ingenting innenfor coverkanten: gløden legger seg aldri over coveret.
    val hole = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply {
        xfermode = android.graphics.PorterDuffXfermode(android.graphics.PorterDuff.Mode.CLEAR)
    }
    canvas.drawRoundRect(o, o, o + side, o + side, radius, radius, hole)
    return bitmap
}

/** Snare-gløden: følger coverets puls ([coverScaleOf]) og kommer fra [PartyLight.edgeGlow] (opp 40 ms, ned 250 ms). */
@Composable
internal fun PartyEdgeGlow(slot: Dp, coverSide: Dp, cornerRadius: Dp, light: PartyLight, coverScaleOf: () -> Float) {
    val density = LocalDensity.current
    val sidePx = with(density) { coverSide.toPx() }
    val radiusPx = with(density) { cornerRadius.toPx() }
    val sprite = remember(sidePx, radiusPx, density.density) { edgeSprite(sidePx, radiusPx, density.density).asImageBitmap() }
    Canvas(Modifier.requiredSize(slot)) {
        val glow = light.edgeGlow
        if (glow <= 0f) return@Canvas
        val c = Offset(size.width / 2f, size.height / 2f)
        scale(coverScaleOf(), c) {
            drawImage(sprite, Offset(c.x - sprite.width / 2f, c.y - sprite.height / 2f), alpha = glow.coerceAtMost(1f))
        }
    }
}

/**
 * Bakgrunnslysenes gradienter, laget én gang per palett (og skjermstørrelse) i stedet for hvert bilde: blobbene har
 * radius 1 og tegnes skalert/flyttet, alfa settes ved tegning. Samme utseende som før (farge → gjennomsiktig).
 */
internal class BackdropBrushes {
    private var palette: List<Color>? = null
    private var blobs = emptyArray<Brush>()
    private var vignette: Brush? = null
    private var beat: Brush? = null
    private var sizeKey = Offset.Zero
    private var beatColor = Color.Unspecified

    fun blob(colors: List<Color>, i: Int): Brush {
        if (palette != colors) {
            palette = colors
            blobs = Array(colors.size) { Brush.radialGradient(listOf(colors[it], Color.Transparent), center = Offset.Zero, radius = 1f) }
        }
        return blobs[i % blobs.size]
    }

    /** Mørk kant (svart ut mot hjørnene); alfa settes ved tegning. */
    fun vignette(center: Offset, radius: Float, w: Float, h: Float): Brush {
        if (sizeKey != Offset(w, h)) { sizeKey = Offset(w, h); vignette = null; beat = null }
        return vignette ?: Brush.radialGradient(listOf(Color.Transparent, Color.Black), center = center, radius = radius).also { vignette = it }
    }

    fun beat(center: Offset, radius: Float, color: Color, w: Float, h: Float): Brush {
        if (sizeKey != Offset(w, h)) { sizeKey = Offset(w, h); vignette = null; beat = null }
        if (beatColor != color) { beatColor = color; beat = null }
        return beat ?: Brush.radialGradient(listOf(color, Color.Transparent), center = center, radius = radius).also { beat = it }
    }
}


// ════════ Party-auraen (ring) rundt coveret ════════
// Formen regnes ut av kjernens OrbGeometry (samme som nettsiden); her tegnes bare det ferdige:
// fylte lag med coverfargene som fargehjul (additivt lys), kjernen (nesten hvitt lys inntil coveret) og
// en uskarp glød bak. Coveret ligger oppå og dekker alt innenfor sin egen kant, så ingenting klippes ut.

/** Gløden tegnes i denne andelen av full oppløsning og skaleres opp (uskarpheten koster en fjerdedel). */
private const val GLOW_SCALE = .5f

/** Alle ting auraen gjenbruker mellom bilder: ingen Path, Brush eller Stroke lages per bilde. */
private class AuraCache {
    val path = Path()
    val glowPath = Path()
    var wheelColors: List<Color>? = null
    val wheels = arrayOfNulls<Brush>(ORB_LAYERS.size)

    /** Coverfargene som flyter rundt ringen (AURA_COLOR_ROUNDS runder), sentrert i (0,0); laget per palett og lag. */
    fun wheel(colors: List<Color>, layer: Int): Brush {
        if (wheelColors !== colors && wheelColors != colors) {
            wheelColors = colors
            wheels.fill(null)
        }
        return wheels[layer] ?: run {
            val n = colors.size * AURA_COLOR_ROUNDS
            val shift = auraLayerColorShift(layer)
            Brush.sweepGradient(List(n + 1) { k -> colors[(k + shift) % colors.size] }, Offset.Zero).also { wheels[layer] = it }
        }
    }
}

/**
 * Lukket kurve gjennom lagets punkter (kjernens `points`/`curves`), dreid [cosT]/[sinT] og ganget med [scale].
 * Dreiingen er den motsatte av den tegneflaten får, så formen står stille mens fargehjulet (børsten) driver.
 */
private fun buildAuraPath(path: Path, p: FloatArray, c: FloatArray, scale: Float, cosT: Float, sinT: Float) {
    path.rewind()
    path.moveTo((p[0] * cosT + p[1] * sinT) * scale, (-p[0] * sinT + p[1] * cosT) * scale)
    var o = 0
    while (o < c.size) {
        path.cubicTo(
            (c[o] * cosT + c[o + 1] * sinT) * scale, (-c[o] * sinT + c[o + 1] * cosT) * scale,
            (c[o + 2] * cosT + c[o + 3] * sinT) * scale, (-c[o + 2] * sinT + c[o + 3] * cosT) * scale,
            (c[o + 4] * cosT + c[o + 5] * sinT) * scale, (-c[o + 4] * sinT + c[o + 5] * cosT) * scale)
        o += 6
    }
    path.close()
}

/** Det nesten hvite lyset langs coverkanten: mange tynne streker med fallende styrke, tegnet ÉN gang per coverstørrelse. */
private fun coreSprite(side: Float, radius: Float, density: Float): ImageBitmap {
    val reach = CORE_REACH_DP * density
    val size = ceil(side + 2f * reach + 2f).toInt().coerceAtLeast(2)
    val bitmap = android.graphics.Bitmap.createBitmap(size, size, android.graphics.Bitmap.Config.ARGB_8888)
    val canvas = android.graphics.Canvas(bitmap)
    val paint = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply {
        style = android.graphics.Paint.Style.STROKE
        xfermode = android.graphics.PorterDuffXfermode(android.graphics.PorterDuff.Mode.ADD)
        color = (0xFF000000.toInt() or CORE_COLOR)
        alpha = (255f * CORE_DENSITY / CORE_STROKES).roundToInt().coerceIn(1, 255)
    }
    val o = (size - side) / 2f
    for (k in 1..CORE_STROKES) {
        val t = k.toFloat() / CORE_STROKES
        paint.strokeWidth = 2f * reach * t * t
        canvas.drawRoundRect(o, o, o + side, o + side, radius, radius, paint)
    }
    return bitmap.asImageBitmap()
}

/**
 * Auraen rundt coveret. Formen kommer ferdig fra [orb] (oppdatert på tegnetråden i effektløkken i RaveActivity);
 * her tegnes bare. [coverSide]/[cornerRadius] er coverets side og hjørneradius i hvile (uten puls: den ligger i
 * kjernens `coverScale`). Per bilde: tre fylte lag + kjernen + gløden (to fyll og en kant) i et halvstort, uskarpt lag.
 */
@Composable
internal fun PartyAura(orb: OrbGeometry, coverSide: Dp, cornerRadius: Dp, colors: List<Color>,
    coverScaleOf: () -> Float, frameOf: () -> HardstyleFrame) {
    val density = LocalDensity.current
    val cache = remember { AuraCache() }
    val sidePx = with(density) { coverSide.toPx() }
    val radiusPx = with(density) { cornerRadius.toPx() }
    val blurPx = with(density) { BLOOM_BLUR_DP.dp.toPx() }
    // Akkurat plassen auraen kan trenge: coveret ved største puls pluss lengste rekkevidde, pluss glødens uskarphet.
    val boxPx = ceil(sidePx * ORB_EXTENT + BLOOM_ROOM_BLURS * blurPx) * 2f
    val boxDp = with(density) { boxPx.toDp() }
    val core = remember(sidePx, radiusPx, density.density) { coreSprite(sidePx, radiusPx, density.density) }
    val blur = remember(density) {
        val r = blurPx * GLOW_SCALE
        android.graphics.RenderEffect.createBlurEffect(r, r, android.graphics.Shader.TileMode.DECAL).asComposeRenderEffect()
    }
    val rimStroke = remember(density) { Stroke(with(density) { BLOOM_RIM_DP.dp.toPx() } * GLOW_SCALE, join = StrokeJoin.Round) }
    val layers = orb.layerCount

    // Gløden bak: hele auraen som ett mykt lys, uskarpt (halv oppløsning, skalert opp 2x).
    Canvas(Modifier.requiredSize(boxDp * GLOW_SCALE).graphicsLayer { scaleX = 1f / GLOW_SCALE; scaleY = 1f / GLOW_SCALE; renderEffect = blur }) {
        frameOf() // tegnes på nytt hver gang musikken beveger seg
        if (sidePx <= 0f) return@Canvas
        val open = orb.open; val glow = orb.glow
        val outer = layers - 1
        val back = colors[BLOOM_BACK_COLOR % colors.size]; val main = colors[BLOOM_MAIN_COLOR % colors.size]
        translate(size.width / 2f, size.height / 2f) {
            buildAuraPath(cache.glowPath, orb.points(outer), orb.curves(outer), GLOW_SCALE, 1f, 0f)
            drawPath(cache.glowPath, back.copy(alpha = min(glow * (BLOOM_BACK_ALPHA + BLOOM_BACK_OPEN * open), 1f)), blendMode = BlendMode.Plus)
            buildAuraPath(cache.glowPath, orb.points(0), orb.curves(0), GLOW_SCALE, 1f, 0f)
            drawPath(cache.glowPath, main.copy(alpha = min(glow * (BLOOM_MAIN_ALPHA + BLOOM_MAIN_OPEN * open), 1f)), blendMode = BlendMode.Plus)
            drawPath(cache.glowPath, main.copy(alpha = min(glow * BLOOM_RIM_ALPHA, 1f)), style = rimStroke, blendMode = BlendMode.Plus)
        }
    }
    // Selve auraen: bakerste (tregeste, største) lag først, hovedformen sist, lagt oppå hverandre som lys.
    Canvas(Modifier.requiredSize(boxDp)) {
        frameOf()
        if (sidePx <= 0f) return@Canvas
        translate(size.width / 2f, size.height / 2f) {
            for (l in layers - 1 downTo 0) {
                val alpha = auraLayerAlpha(l) * orb.alpha(l)
                if (alpha < .005f) continue
                val turn = auraLayerDrift(l) * orb.drift * 360f
                val radians = turn * (PI.toFloat() / 180f)
                buildAuraPath(cache.path, orb.points(l), orb.curves(l), 1f, cos(radians), sin(radians))
                rotate(turn, Offset.Zero) {
                    drawPath(cache.path, cache.wheel(colors, l), alpha = min(alpha, 1f), blendMode = BlendMode.Plus)
                }
            }
            val shown = coverScaleOf()
            scale(shown, Offset.Zero) {
                drawImage(core, Offset(-core.width / 2f, -core.height / 2f), alpha = min(CORE_REST + CORE_GAIN * orb.glow, 1f), blendMode = BlendMode.Plus)
            }
        }
    }
}



/** Grey noise tile for the film-grain overlay. */
internal val grainTexture: ImageBitmap by lazy {
    val n = 128
    val rnd = java.util.Random(7)
    val px = IntArray(n * n) { val v = 64 + rnd.nextInt(128); (0xFF shl 24) or (v shl 16) or (v shl 8) or v }
    android.graphics.Bitmap.createBitmap(px, n, n, android.graphics.Bitmap.Config.ARGB_8888).asImageBitmap()
}


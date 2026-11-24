package com.kododake.aabrowser.rave

import kotlin.math.PI
import kotlin.math.ceil
import kotlin.math.cos
import kotlin.math.exp
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.sin
import kotlin.math.tanh

// ════════ Party-auraen: alle justerbare tall (appen og nettsiden bruker de samme) ════════
//
// Auraen er ETT lydspekter lagt rundt coveret, speilet venstre/høyre: dyp bass øverst (kl. 12), så
// lysere og lysere lyder nedover begge sider til diskanten nederst (kl. 6). Bak hovedformen ligger
// noen få lag av SAMME spekter som er tregere, jevnere og større (dybden). Tegningen fyller formene
// med coverfargene; her regnes bare formen ut.

/** Antall punkter rundt ringen (speilet venstre/høyre, så 65 er unike), jevnt fordelt langs omrisset. */
const val ORB_SEGMENTS = 128

/**
 * Ett frekvensområde = ett stykke av ringen. Hvert område måles mot SITT EGET nivå, så både bass og
 * lyse lyder gir buler, på hvert sitt sted og i hvert sitt tempo.
 * @param fromHz/toHz frekvensene området viser (lavest nærmest kl. 12)
 * @param span andel av veien fra kl. 12 til kl. 6
 * @param attackS/releaseS hvor fort bulene stiger / faller (sekunder, samlet for begge filtertrinn)
 * @param share størrelse i forhold til fullt utslag ([ORB_AMP])
 */
class OrbBandSpec(val fromHz: Float, val toHz: Float, val span: Float, val attackS: Float, val releaseS: Float, val share: Float)

val ORB_BANDS: List<OrbBandSpec> = listOf(
    //           Hz fra     til   span attack release andel
    OrbBandSpec(   45f,   120f, .24f, .065f, .250f, 1.00f),  // dyp bass: toppen, de største bulene
    OrbBandSpec(  120f,   500f, .28f, .055f, .220f, .80f),   // kick-bass: øvre hjørner og øvre del av sidene
    OrbBandSpec(  500f,  2500f, .27f, .045f, .190f, .60f),   // mellomtone: sidene
    OrbBandSpec( 2500f, 10000f, .21f, .040f, .160f, .45f),   // diskant: nederst, små myke bølger
)

/**
 * Ett lag av formen. Lag 0 er hovedformen; de neste ligger bak og er samme spekter, bare tregere,
 * jevnere og større (som et ekko). Legg til / fjern rader for flere / færre lag.
 * @param slow ganges med områdets attack/release (1 = som tabellen over)
 * @param smoothPasses ekstra jevning rundt ringen (flere = rundere, bredere buler)
 * @param size ganges med utslaget
 * @param restAlpha synlighet når auraen er lukket (open = 0); 1 når den er helt åpen
 */
class OrbLayerSpec(val slow: Float, val smoothPasses: Int, val size: Float, val restAlpha: Float)

val ORB_LAYERS: List<OrbLayerSpec> = listOf(
    //           treghet jevning størrelse alfa lukket
    OrbLayerSpec(1.0f,      0,  1.00f, .55f),   // 0 hovedformen
    OrbLayerSpec(1.7f,      3,  1.22f, .30f),   // 1 bak: litt tregere og større
    OrbLayerSpec(2.8f,      7,  1.42f, .15f),   // 2 bakerst: tregest, rundest, størst
)

// ---- Form og avstander (andel av coverets side, der ikke annet står) ----
/** Avstand fra coveret til auraens kant når den hviler. Omrisset er coverets eget (samme hjørneradius). */
const val ORB_GAP = .02f
/** Kurvens spenning (Catmull-Rom): 1/6 = vanlig, lavere = strammere. */
const val ORB_CURVE_TENSION = .16f
/** Jevning rundt ringen av hele spekteret (alle lag): runde, myke buler, og ingen søm mellom områdene. */
const val ORB_SMOOTH_PASSES = 2

// ---- Utslag ----
/** Hovedformens største utslag når auraen er helt åpen (ganges med områdets andel og maks-volum-boost). */
const val ORB_AMP = .23f
/** Ingen del av auraen går lenger ut fra coveret enn dette, uansett lyd, volum og lag. */
const val ORB_REACH_MAX = .21f
/** Lukket aura (open = 0) viser bare så mye av utslaget. */
const val ORB_REST_AMP = .06f
/** De øverste 25 % mot taket er en myk knekk (tanh), så toppene rundes av i stedet for å kuttes. */
const val ORB_KNEE = .75f
/** Kontrast innen hvert område: 1 = rett fram, høyere = bulene skiller seg mer fra resten. */
const val ORB_CONTRAST = 1.6f
/** Størrelsen følger områdets nivå med denne kurven: under 1 = også svakere partier viser formen sin. */
const val ORB_LEVEL_CURVE = .5f
/** De aller laveste frekvensene (ved kl. 12) vektes ned til dette, og opp til 1 over områdets første del: to buler, ikke én topp. */
const val ORB_TOP_WEIGHT = .55f
const val ORB_TOP_WEIGHT_SPAN = .35f
/**
 * Bunnen buler også på bassen (Espen 2026-11-23: «lite skjer nede, veldig mye oppe»): de nederste
 * [ORB_BOTTOM_SPAN] av veien fra kl. 12 til kl. 6 får en speilet kopi av toppens bassbuler, opp til
 * [ORB_BOTTOM_BASS] av toppens størrelse helt nederst, og mindre oppover sidene. Diskanten vinner der den er større.
 */
const val ORB_BOTTOM_BASS = .8f
const val ORB_BOTTOM_SPAN = .3f
/** Høye topper vokser så mye ekstra når bassen er tung (heavy = 1). */
const val ORB_HEAVY_PEAK = .2f
/**
 * Fartsgrense: ingen del av formen flytter seg fortere enn dette (andel av coverets side per sekund).
 * .7 = høyst ca. 1,2 % av siden per bilde ved 60 bilder i sekundet. Bulene følger takten, men hopper aldri.
 */
const val ORB_MAX_SPEED = .7f
/** Profilens «spike» begrenses til dette. */
const val ORB_SPIKE_MAX = 2f

// ---- I takt ----
/** Hele formen pumper så vidt utover på hvert slag (andel av side), ved åpen aura og tung bass. */
const val ORB_PUMP = .01f
/** Andel av pumpen som også vises uten tung bass. */
const val ORB_PUMP_CALM = .4f
const val ORB_PUMP_ATTACK_S = .05f
const val ORB_PUMP_RELEASE_S = .18f

// ---- Nivå: hvert område måles mot seg selv ----
// Nesten alt er RELATIVT (hvert område mot sin egen topp og sangens eget nivå), så formen tåler at
// kildene har ulik skala. Bare tre små gulv er absolutte tall i rå FFT-enheter, og de står derfor
// per kilde ([OrbSource]): PCM = PcmFft (nettsiden, og mikrofonen på telefonen), VIS = Android Visualizer.
/** PCM: trekkes fra rå-nivået, så svak støy ikke flimrer i diskanten. */
const val ORB_NOISE_FLOOR = 1.5f
/** PCM: et område normaliseres aldri mot mindre enn dette (rå FFT-enheter): stille forblir stille. */
const val ORB_REF_FLOOR = 5f
/** Visualizer: samme tre gulv i Visualizer-skala (8 bit, ca. 2–4 ganger høyere tall enn PCM). Anslag, ikke målt i bil. */
const val ORB_VIS_NOISE_FLOOR = 2.5f
const val ORB_VIS_REF_FLOOR = 12f
const val ORB_VIS_OPEN_MIN_LEVEL = 10f
/** «Nå»-referansen faller så fort (sekunder). */
const val ORB_REF_DECAY_S = 3f
/** Sangreferansen: opp over ~2 s, ned over ~25 s; området måles mot minst denne andelen av den. */
const val ORB_SONG_UP_S = 2f
const val ORB_SONG_DOWN_S = 25f
const val ORB_SONG_SHARE = .55f
/** Ingen ny lyd på så lenge → formen glir mot ro. */
const val ORB_HOLD_S = 1f

// ---- Auraen åpner seg ----
const val ORB_OPEN_UP_S = 1.5f
const val ORB_OPEN_DOWN_S = 3f
/** Sangdelens styrke (phaseLevel): ved FROM er auraen MIN åpen, ved FROM + RANGE helt åpen. */
const val ORB_OPEN_PHASE_FROM = .4f
const val ORB_OPEN_PHASE_RANGE = .5f
const val ORB_OPEN_PHASE_MIN = .35f
/** Lydnivå nå / sangens eget nivå: under FROM lukket, fra FROM + RANGE fullt. */
const val ORB_OPEN_LOUD_FROM = .12f
const val ORB_OPEN_LOUD_RANGE = .45f
/** PCM: svakere enn dette (sum av områdenes topper, rå enheter) regnes som stillhet. */
const val ORB_OPEN_MIN_LEVEL = 4f

/**
 * Where the FFT bytes come from. The two sources use different scales for the same music, so the three
 * absolute floors (noise, smallest reference, «silence») are kept per source; everything else in
 * [OrbGeometry] is relative to the sound's own level and needs no source.
 *
 * - [PCM]: [PcmFft] — the website's shared sound, and the phone's microphone. Slow auto-gain: the
 *   loudest bin of the last ~30 s is 100, whatever the volume.
 * - [VISUALIZER]: Android's `Visualizer.getFft()` — 8-bit real/imaginary parts (largest magnitude ~181).
 *   The app leaves the scaling mode at its default (normalised), and its recordings (2026-11, 48 kHz,
 *   1024 bytes) show a typical level 2–4 times PCM's, with 1–2 units of quantisation noise.
 *
 * Why a source parameter and not self-measured floors: a floor measured from the sound itself cannot
 * tell «quiet music» from «noise», which is exactly what the floors are for. The numbers for
 * [VISUALIZER] are estimates from recordings and must be checked on the phone (in the car, low volume).
 */
enum class OrbSource(val noiseFloor: Float, val refFloor: Float, val openMinLevel: Float) {
    PCM(ORB_NOISE_FLOOR, ORB_REF_FLOOR, ORB_OPEN_MIN_LEVEL),
    VISUALIZER(ORB_VIS_NOISE_FLOOR, ORB_VIS_REF_FLOOR, ORB_VIS_OPEN_MIN_LEVEL),
}

// ---- Glød (bloom) ----
/** Glød når auraen hviler; resten følger bassen. */
const val ORB_GLOW_REST = .25f
const val ORB_GLOW_GAIN = 1.5f
const val ORB_GLOW_ATTACK_S = .08f
const val ORB_GLOW_RELEASE_S = .35f

// ---- Fargedrift ----
/** Fargene driver sakte rundt: så mange sekunder per runde. Bare lyset rører seg, aldri coveret. */
const val ORB_DRIFT_S = 50f

// ---- Tegningen (appen og nettsiden tegner hver for seg, men med de samme tallene) ----
// Lagene fylles med coverfargene som flyter rundt ringen, halvt gjennomsiktige og lagt oppå hverandre
// som lys (additivt). Bakerste lag tegnes først, hovedformen sist.
/** Hovedformens fyll (0..1), ganges med lagets [OrbGeometry.alpha]. */
const val AURA_MAIN_ALPHA = .5f
/** Hvert lag bak er så mye svakere enn laget foran (.6 = 60 %). */
const val AURA_BACK_FALL = .6f
/** Coverfargene går så mange ganger rundt ringen. */
const val AURA_COLOR_ROUNDS = 2
/** Hvert lag bak starter så mange farger lenger ut i fargehjulet, så lagene får ulik farge på samme sted. */
const val AURA_LAYER_COLOR_STEP = 1
/** Annethvert lag driver motsatt vei rundt ringen (fargene glir forbi hverandre). */
const val AURA_COUNTER_DRIFT = true

/** Fyll-alfa for lag [layer] (0 = hovedformen) før lagets egen [OrbGeometry.alpha]. */
fun auraLayerAlpha(layer: Int): Float = AURA_MAIN_ALPHA * AURA_BACK_FALL.pow(layer)
/** Hvor mange farger lag [layer] er forskjøvet i fargehjulet. */
fun auraLayerColorShift(layer: Int): Int = layer * AURA_LAYER_COLOR_STEP
/** Retningen fargene driver for lag [layer]: 1 eller −1 (ganges med [OrbGeometry.drift]). */
fun auraLayerDrift(layer: Int): Float = if (AURA_COUNTER_DRIFT && layer % 2 == 1) -1f else 1f

// Kjernen: det nesten hvite, varme lyset tett inntil coveret.
/** Hvor langt kjernen rekker ut fra coverkanten (dp). */
const val CORE_REACH_DP = 11f
/** Kjernens farge (varm hvit, 0xRRGGBB). Lysstøv, lysbølger og snare-gløden blandes mot den samme. */
const val CORE_COLOR = 0xFFF8EC
/** Kjernens styrke når auraen hviler, og hvor mye gløden ([OrbGeometry.glow]) legger til. */
const val CORE_REST = .22f
const val CORE_GAIN = .33f
/** Kjernen er så mange tynne streker oppå hverandre (jevn uttoning uten blur) … */
const val CORE_STROKES = 56
/** … med så mye lys til sammen (hver strek har alfa DENSITY / STROKES). */
const val CORE_DENSITY = 1.3f

// Gløden (bloom): hele auraen som ett mykt lys bak coveret, uskarpt.
/** Uskarpheten (dp). */
const val BLOOM_BLUR_DP = 9f
/** Lerretet trenger så mange ganger uskarpheten i ekstra marg, så gløden aldri kuttes. */
const val BLOOM_ROOM_BLURS = 2.5f
/** Bakerste lag i gløden: hvilken coverfarge, styrke lukket, og tillegg når auraen er helt åpen (ganges med glow). */
const val BLOOM_BACK_COLOR = 1
const val BLOOM_BACK_ALPHA = .2f
const val BLOOM_BACK_OPEN = .25f
/** Hovedformen i gløden: sterkere, i første coverfarge. */
const val BLOOM_MAIN_COLOR = 0
const val BLOOM_MAIN_ALPHA = .45f
const val BLOOM_MAIN_OPEN = .25f
/** Myk kant på hovedformen i gløden (styrke og bredde i dp), så hvilende aura er en glød rundt coveret. */
const val BLOOM_RIM_ALPHA = .6f
const val BLOOM_RIM_DP = 4f

// ---- Teknisk ----
/** Lengste tidssteg som regnes med (sekunder); lengre hakk hoppes ikke igjennom. */
const val ORB_MAX_DT = .05f
/** Filtrene regnes i like små steg uansett bildefrekvens (30/60/120 fps gir samme bevegelse). */
const val ORB_SUBSTEP_S = 1f / 120f

// ---- Coverets puls (auraen følger coveret, så stor og brå puls = aura som hopper) ----
/** Coveret «puster» så mye med bassen (andel av størrelsen). */
const val COVER_BREATH_PULSE = .05f
/** Pulsen på hvert kick (andel av størrelsen): rolig bass + ekstra ved tung bass. Størst ca. 4 %. */
const val COVER_KICK_PULSE = .015f
const val COVER_KICK_PULSE_HEAVY = .025f
/** Største coverpuls som finnes (pust + kick + tung bass, fullt volum, i dropet): 1,09. */
const val COVER_PULSE_MAX = 1f + COVER_BREATH_PULSE + COVER_KICK_PULSE + COVER_KICK_PULSE_HEAVY
/**
 * Lerretets marg: ingen del av auraen er lenger fra coverets MIDTE enn dette (andel av coverets side),
 * uansett puls og utslag = halve coveret ved største puls + lengste rekkevidde. Legg til plass for
 * glødens uskarphet ([BLOOM_ROOM_BLURS] × [BLOOM_BLUR_DP]) når lerretet lages.
 */
const val ORB_EXTENT = .5f * COVER_PULSE_MAX + ORB_REACH_MAX
/** Kicket jevnes før det når coveret: opp på ca. 30 ms, ned på ca. 140 ms. */
const val COVER_KICK_ATTACK_S = .03f
const val COVER_KICK_RELEASE_S = .14f

/**
 * The cover's pulse scale: 1 = at rest, never above [COVER_PULSE_MAX]. The cover is drawn with it and
 * the aura is shaped around it ([OrbGeometry.update]'s `coverScale`), so the two always fit. Both the website
 * (WebPartyEngine.tick) and the app (RaveActivity's frame loop → `ReactiveCover`) call it; the app eases the kick
 * with [easeCoverKick] first and feeds the result to the cover's `graphicsLayer` and to the aura.
 * @param breath 0..1, the slow swell with the bass
 * @param kick 0..1, eased first with [easeCoverKick]
 * @param heavy 0..1; [volume] 0..1; [phaseLevel] the song part's strength (0..1)
 */
fun coverPulseScale(breath: Float, kick: Float, heavy: Float, volume: Float, phaseLevel: Float): Float =
    (1f + breath * COVER_BREATH_PULSE + kick * (COVER_KICK_PULSE + heavy * COVER_KICK_PULSE_HEAVY) * volumeGain(volume) * (.4f + .6f * phaseLevel))
        .coerceIn(1f, COVER_PULSE_MAX)

/** One step of the kick the cover pulses with: quick up, slower down ([dt] seconds since the last picture). */
fun easeCoverKick(eased: Float, kick: Float, dt: Float): Float {
    if (!(dt > 0f)) return eased
    val tau = if (kick > eased) COVER_KICK_ATTACK_S else COVER_KICK_RELEASE_S
    return eased + (kick - eased) * (1f - exp(-min(dt, .1f) / tau))
}

/**
 * The shape of the Party aura, shared by the app and the website: pure maths, no drawing.
 * One instance per aura. Call [update] once per picture, then read the finished outlines.
 *
 * The aura is ONE spectrum wrapped round the cover, mirrored left/right: deep bass at 12 o'clock,
 * brighter sounds down both sides, treble at 6 ([ORB_BANDS]: each range has its own stretch of the
 * ring, is measured against its own level and moves at its own speed). [ORB_LAYERS] are the same
 * spectrum again, slower, smoother and bigger: the layers behind the main shape.
 *
 * At rest every layer is the cover's own outline (a rounded rectangle with the cover's corner radius)
 * a small even gap outside it; the aura opens ([open]) while music plays.
 *
 * Units: pixels relative to the cover's centre (x right, y down). **`side` always means the cover's
 * side length in pixels at rest** (the album cover itself, without its pulse — that is `coverScale`).
 *
 * Robust against bad input: a cover that is not measured yet (`side` 0, negative or NaN), a corner
 * radius bigger than half the side, and NaN numbers give a collapsed or resting shape, never an
 * exception and never NaN points.
 *
 * **Threads: ONE thread only — the drawing thread.** [update], [reset], setting [source] and every
 * read of the buffers ([points], [curves], [foot], [alpha], [level], [offsetAt]) must happen on the same
 * thread; the buffers are reused, so a read from another thread sees half-written shapes. Nothing here
 * is locked. The sound arrives on another thread (the Visualizer's or the microphone's): the ONLY
 * thread-safe bridge is [HardstyleAudio.readDisplay], which copies the display spectrum into a buffer
 * the drawing thread owns. Call it on the drawing thread right before [update], and pass that buffer.
 *
 * No allocation per picture: every array is made once and reused.
 */
class OrbGeometry(private val layers: List<OrbLayerSpec> = ORB_LAYERS, private val ranges: List<OrbBandSpec> = ORB_BANDS) {
    val layerCount: Int = layers.size
    val segments: Int get() = ORB_SEGMENTS

    /**
     * Where the FFT bytes come from: picks the absolute floors ([OrbSource]). Set it when the app switches
     * between the Visualizer and the microphone (the website is always [OrbSource.PCM]).
     */
    var source: OrbSource = OrbSource.PCM

    /** 0..1: 0 = resting tight against the cover, 1 = fully open. */
    var open = 0f
        private set
    /** 0..1: strength of the glow (follows the bass softly). */
    var glow = ORB_GLOW_REST
        private set
    /** No layer is ever further than this from the cover's edge (px), in this picture. */
    var reachPx = 0f
        private set
    /** 0..1: how far the slow drift of the colours has come round the ring (wraps). */
    var drift = 0f
        private set

    private val half = ORB_SEGMENTS / 2          // points 0..half are unique, the rest are mirrored
    private val unique = half + 1
    private val rangeCount = ranges.size
    // Per point: which range it shows, where in the display spectrum it listens, its weight and speed.
    private val rangeOf = IntArray(unique)
    private val listenAt = FloatArray(unique)
    private val weight = FloatArray(unique)
    private val attackAt = FloatArray(unique)
    private val releaseAt = FloatArray(unique)

    private val raw = FloatArray(unique)
    private val target = Array(layerCount) { FloatArray(unique) }   // where each point is heading (0..1)
    private val stage1 = Array(layerCount) { FloatArray(unique) }
    private val stage2 = Array(layerCount) { FloatArray(unique) }   // the shown level (0..1)
    private val offsets = Array(layerCount) { FloatArray(unique) }  // px outward from the cover's edge
    private val points = Array(layerCount) { FloatArray(ORB_SEGMENTS * 2) }
    private val curves = Array(layerCount) { FloatArray(ORB_SEGMENTS * 6) }
    private val foot = FloatArray(ORB_SEGMENTS * 2)
    private val edgeX = FloatArray(unique); private val edgeY = FloatArray(unique)
    private val normalX = FloatArray(unique); private val normalY = FloatArray(unique)
    private val reference = FloatArray(rangeCount) { ORB_REF_FLOOR }
    private val songReference = FloatArray(rangeCount)
    private val peaks = FloatArray(rangeCount)
    private val alphas = FloatArray(layerCount) { layers[it].restAlpha }
    private val levels = FloatArray(layerCount)
    private var bassLevel = 0f
    private var totalSong = 0f
    private var loudRel = 0f
    private var lastVersion = Int.MIN_VALUE
    private var staleS = ORB_HOLD_S
    private var pump = 0f
    private var bassGlow = 0f
    private var shapedSide = 0f

    init {
        val total = ranges.sumOf { it.span.toDouble() }.toFloat()
        var r = 0; var start = 0f
        for (j in 0..half) {
            val t = j.toFloat() / half * total
            while (r < rangeCount - 1 && t >= start + ranges[r].span) { start += ranges[r].span; r++ }
            val within = ((t - start) / ranges[r].span).coerceIn(0f, 1f)
            val from = displayBandAt(ranges[r].fromHz); val to = displayBandAt(ranges[r].toHz)
            rangeOf[j] = r
            listenAt[j] = from + (to - from) * within
            // The very lowest frequencies count less: the top gets two round bulges instead of one peak at 12.
            val rise = if (r == 0) (within / ORB_TOP_WEIGHT_SPAN).coerceIn(0f, 1f) else 1f
            weight[j] = ranges[r].share * (ORB_TOP_WEIGHT + (1f - ORB_TOP_WEIGHT) * rise * rise * (3f - 2f * rise))
            attackAt[j] = ranges[r].attackS; releaseAt[j] = ranges[r].releaseS
        }
    }

    /**
     * New song: closed aura, forgotten levels. Nothing jumps: the colour drift keeps going, and a shape
     * that was out glides back to rest at the speed limit ([ORB_MAX_SPEED]: at most ~0.3 s), never outward.
     */
    fun reset() {
        for (l in 0 until layerCount) {
            target[l].fill(0f); stage1[l].fill(0f); stage2[l].fill(0f)
            alphas[l] = layers[l].restAlpha; levels[l] = 0f
        }
        for (r in 0 until rangeCount) { reference[r] = source.refFloor; songReference[r] = 0f }
        bassLevel = 0f; totalSong = 0f; loudRel = 0f; staleS = ORB_HOLD_S; pump = 0f; bassGlow = 0f
        open = 0f; glow = ORB_GLOW_REST
    }

    /**
     * One picture.
     * Same thread as every read of the buffers (see the class comment).
     * @param dt seconds since the previous picture (real time; long gaps are handled here)
     * @param playing false = paused: the aura closes
     * @param bands raw display spectrum ([DisplaySpectrum.bands] / [HardstyleAudio.readDisplay])
     * @param bandsVersion its version; a changed number means «a new FFT frame arrived»
     * @param side the cover's side length in px at rest (see the class comment)
     * @param cornerRadius the cover's corner radius in px at rest
     * @param coverScale the cover's pulse scale (1 = at rest, [coverPulseScale]); the aura grows with it
     * @param phaseLevel the song part's strength (~.4 intro … 1 drop)
     * @param spike the profile's spike amount (~.4–1.6)
     * @param volume playback volume 0..1
     * @param heavy,kick from the shown frame (0..1)
     * @param pulse the beat clock's pulse 0..1, or null when the beat isn't locked (then [kick] pumps)
     */
    fun update(dt: Float, playing: Boolean, bands: FloatArray, bandsVersion: Int, side: Float, cornerRadius: Float,
        coverScale: Float, phaseLevel: Float, spike: Float, volume: Float, heavy: Float, kick: Float, pulse: Float?) {
        val elapsed = if (dt > 0f) min(dt, 5f) else 0f   // also turns NaN into 0
        staleS = min(staleS + elapsed, 10f)
        if (bandsVersion != lastVersion) {
            lastVersion = bandsVersion
            if (playing) listen(bands, staleS.coerceIn(.001f, .2f))
            staleS = 0f
        }
        // Hold the last heard shape between FFT frames (no interpolation: that would lag the music);
        // glide to rest when the sound has stopped coming or the music is paused.
        val live = playing && staleS < ORB_HOLD_S
        if (!live) { for (l in 0 until layerCount) target[l].fill(0f); loudRel = 0f; bassLevel = 0f }

        val step = min(elapsed, ORB_MAX_DT)
        val steps = if (step > 0f) max(1, ceil(step / ORB_SUBSTEP_S - .01f).toInt()) else 0
        val h = if (steps > 0) step / steps else 0f
        smoothLevels(steps, h)
        val pumpGoal = if (live) sane(pulse ?: kick).coerceIn(0f, 1f) else 0f
        val pumpUp = rate(h, ORB_PUMP_ATTACK_S); val pumpDown = rate(h, ORB_PUMP_RELEASE_S)
        repeat(steps) { pump += (pumpGoal - pump) * (if (pumpGoal > pump) pumpUp else pumpDown) }
        if (pumpGoal == 0f && pump < .0005f) pump = 0f

        val phaseOpen = ORB_OPEN_PHASE_MIN + (1f - ORB_OPEN_PHASE_MIN) *
            ((sane(phaseLevel) - ORB_OPEN_PHASE_FROM) / ORB_OPEN_PHASE_RANGE).coerceIn(0f, 1f)
        val loudOpen = ((loudRel - ORB_OPEN_LOUD_FROM) / ORB_OPEN_LOUD_RANGE).coerceIn(0f, 1f)
        val openGoal = if (playing) phaseOpen * loudOpen else 0f
        open += (openGoal - open) * rate(step, if (openGoal > open) ORB_OPEN_UP_S else ORB_OPEN_DOWN_S)
        if (openGoal == 0f && open < .0005f) open = 0f

        val bassGoal = (bassLevel * ORB_GLOW_GAIN).coerceAtMost(1f)
        bassGlow += (bassGoal - bassGlow) * rate(step, if (bassGoal > bassGlow) ORB_GLOW_ATTACK_S else ORB_GLOW_RELEASE_S)
        glow = (ORB_GLOW_REST + (1f - ORB_GLOW_REST) * bassGlow * (.3f + .7f * open)).coerceIn(0f, 1f)
        for (l in 0 until layerCount) alphas[l] = layers[l].restAlpha + (1f - layers[l].restAlpha) * open
        drift = (drift + elapsed / ORB_DRIFT_S) % 1f

        shape(side, cornerRadius, coverScale, sane(spike), sane(volume), sane(heavy).coerceIn(0f, 1f), step)
    }

    /** `x,y` per point (px from the centre), [segments] points, closed (the last joins the first). */
    fun points(layer: Int): FloatArray = points[layer]

    /**
     * The same outline as a closed curve THROUGH the points: per segment `c1x,c1y,c2x,c2y,x,y`
     * (6 numbers × [segments]). Draw: `moveTo(points[0], points[1])`, then one `cubicTo` per segment.
     */
    fun curves(layer: Int): FloatArray = curves[layer]

    /** The (pulsing) cover's own edge: `x,y` per point, where every layer's light starts. */
    fun foot(): FloatArray = foot

    /** 0..1: weaker while the aura is closed. */
    fun alpha(layer: Int): Float = alphas[layer]
    /** 0..1: the layer's average level right now (for colour / light). */
    fun level(layer: Int): Float = levels[layer]
    /** Px outward from the cover's edge for one point of one layer (for tests and effects on the tips). */
    fun offsetAt(layer: Int, point: Int): Float {
        val p = ((point % ORB_SEGMENTS) + ORB_SEGMENTS) % ORB_SEGMENTS
        return offsets[layer][if (p <= half) p else ORB_SEGMENTS - p]
    }

    /** NaN / infinite → 0, so one bad number can never poison the filters. */
    private fun sane(value: Float): Float = if (value.isFinite()) value else 0f

    private fun rate(seconds: Float, tau: Float): Float = if (seconds > 0f) 1f - exp(-seconds / tau) else 0f

    /** A new FFT frame: where every point of every layer is heading. [dt] = seconds since the last one. */
    private fun listen(bands: FloatArray, dt: Float) {
        val lastBand = bands.size - 1
        val floors = source
        peaks.fill(0f)
        if (lastBand < 0) raw.fill(0f)
        else for (j in 0..half) {
            val position = listenAt[j].coerceIn(0f, lastBand.toFloat())
            val index = position.toInt()
            val next = min(index + 1, lastBand)
            val heard = bands[index] + (bands[next] - bands[index]) * (position - index) - floors.noiseFloor
            raw[j] = if (heard > 0f && heard.isFinite()) heard else 0f
            peaks[rangeOf[j]] = max(peaks[rangeOf[j]], raw[j])
        }
        var total = 0f
        for (r in 0 until rangeCount) {
            val peak = peaks[r]
            songReference[r] = follow(songReference[r], peak, dt)
            // Never normalise against less than part of the song's loud level: quiet parts stay quiet.
            reference[r] = max(floors.refFloor, max(peak, max(reference[r] * exp(-dt / ORB_REF_DECAY_S), songReference[r] * ORB_SONG_SHARE)))
            total += peak
        }
        totalSong = follow(totalSong, total, dt)
        loudRel = if (total < floors.openMinLevel) 0f else (total / max(totalSong, .001f)).coerceIn(0f, 1f)
        // The SHAPE within a range is measured against its loudest frequency right now (so it always shows
        // which frequencies stand out); the SIZE against the range's own reference.
        val main = target[0]
        var bass = 0f; var bassPoints = 0
        for (j in 0..half) {
            val r = rangeOf[j]; val peak = peaks[r]
            val v = if (peak > 0f) (raw[j] / peak).pow(ORB_CONTRAST) * (peak / reference[r]).coerceIn(0f, 1f).pow(ORB_LEVEL_CURVE) else 0f
            if (r == 0) { bass += v; bassPoints++ }
            main[j] = v.coerceIn(0f, 1f) * weight[j]
        }
        bassLevel = if (bassPoints > 0) (bass / bassPoints).coerceIn(0f, 1f) else 0f
        // Bottom: a mirrored copy of the top's bass bulges (soft ramp up the sides, strongest at 6 o'clock).
        val bottomFrom = (half * (1f - ORB_BOTTOM_SPAN)).toInt()
        for (j in bottomFrom + 1..half) {
            val t = (j - bottomFrom).toFloat() / (half - bottomFrom)
            val ramp = t * t * (3f - 2f * t)
            main[j] = max(main[j], main[half - j] * ORB_BOTTOM_BASS * ramp)
        }
        repeat(ORB_SMOOTH_PASSES) { blur(main) }
        for (l in 1 until layerCount) {
            main.copyInto(target[l])
            repeat(layers[l].smoothPasses) { blur(target[l]) }
        }
    }

    /** Song reference: up over ~2 s (one click can't set it), down over ~25 s. */
    private fun follow(reference: Float, value: Float, dt: Float): Float =
        if (value > reference) reference + (value - reference) * (1f - exp(-dt / ORB_SONG_UP_S))
        else reference * exp(-dt / ORB_SONG_DOWN_S)

    /** One soft pass around the ring (both ends mirror, like the ring itself). */
    private fun blur(values: FloatArray) {
        var previous = values[1]
        for (j in 0..half) {
            val current = values[j]
            val next = if (j < half) values[j + 1] else previous
            values[j] = .25f * previous + .5f * current + .25f * next
            previous = current
        }
    }

    /**
     * Two one-pole filters in a row per point (second order: no kink when a new FFT frame lands),
     * faster up than down, in equal small steps so the picture rate doesn't matter.
     */
    private fun smoothLevels(steps: Int, h: Float) {
        for (l in 0 until layerCount) {
            val slow = layers[l].slow
            val goal = target[l]; val first = stage1[l]; val second = stage2[l]
            var sum = 0f
            for (j in 0..half) {
                // Each stage gets half the time, so the two together land near the table's value.
                val up = rate(h, attackAt[j] * slow * .5f); val down = rate(h, releaseAt[j] * slow * .5f)
                val t = goal[j]; var a = first[j]; var b = second[j]
                repeat(steps) {
                    a += (t - a) * (if (t > a) up else down)
                    b += (a - b) * (if (a > b) up else down)
                }
                if (t == 0f && a < .0001f) { a = 0f; if (b < .0001f) b = 0f }
                first[j] = a; second[j] = b
                // The two end points count half in the average (they are not mirrored).
                sum += if (j == 0 || j == half) b * .5f else b
            }
            levels[l] = (sum / half).coerceIn(0f, 1f)
        }
    }

    /** Soft ceiling: straight up to [ORB_KNEE] of [cap], then rounding off towards it. */
    private fun knee(value: Float, cap: Float): Float {
        if (cap <= 0f) return 0f
        val from = cap * ORB_KNEE
        return if (value <= from) value else from + (cap - from) * tanh((value - from) / (cap - from))
    }

    /**
     * The cover's edge as a rounded rectangle: [unique] points from 12 o'clock clockwise to 6, evenly
     * spaced along the outline, with the outward normal. [halfSide], [radius] in px (already pulsing).
     */
    private fun outline(halfSide: Float, radius: Float) {
        val r = if (radius > 0f) min(radius, halfSide) else 0f     // (also NaN → 0; halfSide is never negative here)
        val flat = halfSide - r                       // half a side's straight part
        val arc = (PI / 2).toFloat() * r
        val length = 4f * flat + 2f * arc             // from 12 o'clock down one side to 6 o'clock
        for (j in 0..half) {
            var s = length * j / half
            if (j == 0 || s < flat) {                 // top, going right
                edgeX[j] = if (j == 0) 0f else s; edgeY[j] = -halfSide; normalX[j] = 0f; normalY[j] = -1f; continue
            }
            s -= flat
            if (s < arc && r > 0f) {                  // top right corner
                val a = s / r
                normalX[j] = sin(a); normalY[j] = -cos(a)
                edgeX[j] = flat + r * normalX[j]; edgeY[j] = -flat + r * normalY[j]; continue
            }
            s -= arc
            if (s < 2f * flat) {                      // right side, going down
                edgeX[j] = halfSide; edgeY[j] = -flat + s; normalX[j] = 1f; normalY[j] = 0f; continue
            }
            s -= 2f * flat
            if (s < arc && r > 0f && j < half) {      // bottom right corner
                val a = s / r
                normalX[j] = cos(a); normalY[j] = sin(a)
                edgeX[j] = flat + r * normalX[j]; edgeY[j] = flat + r * normalY[j]; continue
            }
            s -= arc
            edgeX[j] = if (j == half) 0f else (flat - s).coerceIn(0f, flat)   // bottom, going left
            edgeY[j] = halfSide; normalX[j] = 0f; normalY[j] = 1f
        }
    }

    private fun shape(coverSide: Float, cornerRadius: Float, coverScale: Float, spike: Float, volume: Float, heavy: Float, step: Float) {
        // A cover that isn't measured yet (0), or a nonsense size: everything collapses to the centre.
        val side = if (coverSide > 0f && coverSide.isFinite()) coverSide else 0f
        val scale = if (coverScale.isFinite()) coverScale.coerceIn(.1f, 10f) else 1f
        outline(side * .5f * scale, cornerRadius * scale)
        val openAmp = ORB_REST_AMP + (1f - ORB_REST_AMP) * open
        val drive = spike.coerceIn(0f, ORB_SPIKE_MAX) * volumeGain(volume)
        val full = side * ORB_AMP * maxVolumeBoost(volume) * openAmp
        val gap = side * ORB_GAP
        val pumpPx = side * ORB_PUMP * pump * open * (ORB_PUMP_CALM + (1f - ORB_PUMP_CALM) * heavy)
        // Nothing reaches further than this beyond the resting gap.
        val ceiling = max(side * ORB_REACH_MAX - gap, 0f)
        reachPx = gap + ceiling
        // The speed limit; a new cover size is taken at once (nothing to glide from).
        val resized = side != shapedSide
        shapedSide = side
        val furthest = side * ORB_MAX_SPEED * step
        for (i in 0 until ORB_SEGMENTS) {
            val j = if (i <= half) i else ORB_SEGMENTS - i
            foot[i * 2] = if (i <= half) edgeX[j] else -edgeX[j]; foot[i * 2 + 1] = edgeY[j]
        }
        for (l in 0 until layerCount) {
            val size = layers[l].size
            val off = offsets[l]; val level = stage2[l]; val p = points[l]
            for (j in 0..half) {
                val v = level[j]
                val wanted = gap + knee((v * (1f + ORB_HEAVY_PEAK * heavy * v) * drive * full + pumpPx) * size, ceiling)
                val o = if (resized) wanted else (off[j] + (wanted - off[j]).coerceIn(-furthest, furthest)).coerceIn(gap, gap + ceiling)
                off[j] = o
                val x = edgeX[j] + normalX[j] * o
                val y = edgeY[j] + normalY[j] * o
                p[j * 2] = x; p[j * 2 + 1] = y
                if (j in 1 until half) { val m = ORB_SEGMENTS - j; p[m * 2] = -x; p[m * 2 + 1] = y }
            }
            // Closed Catmull-Rom through the points, as cubic Bezier control points.
            val c = curves[l]
            for (i in 0 until ORB_SEGMENTS) {
                val i0 = ((i + ORB_SEGMENTS - 1) % ORB_SEGMENTS) * 2
                val i1 = i * 2
                val i2 = ((i + 1) % ORB_SEGMENTS) * 2
                val i3 = ((i + 2) % ORB_SEGMENTS) * 2
                val o = i * 6
                c[o] = p[i1] + (p[i2] - p[i0]) * ORB_CURVE_TENSION
                c[o + 1] = p[i1 + 1] + (p[i2 + 1] - p[i0 + 1]) * ORB_CURVE_TENSION
                c[o + 2] = p[i2] - (p[i3] - p[i1]) * ORB_CURVE_TENSION
                c[o + 3] = p[i2 + 1] - (p[i3 + 1] - p[i1 + 1]) * ORB_CURVE_TENSION
                c[o + 4] = p[i2]; c[o + 5] = p[i2 + 1]
            }
        }
    }
}

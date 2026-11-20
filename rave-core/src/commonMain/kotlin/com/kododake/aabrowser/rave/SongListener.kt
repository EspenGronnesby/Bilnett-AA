package com.kododake.aabrowser.rave

import kotlin.math.ln
import kotlin.math.log10
import kotlin.math.max

// ---- «Lytt først»-analysen (steg 2, 2026-11-19): hører sangen og sammenligner den bare med seg selv ----
// Ingen faste dB-terskler for sangdeler: alt måles som «hvor høyt er dette i DENNE sangen» (posisjon mellom
// sangens egne p10 og p90). Vinduene er i slag/takter. Tallene under er musikk-logikk, ikke tilpasset sanger.
/** En takt er 4 slag; lytteren regner hvert slag («slot»), så en ny del merkes etter ~ett halvt slag, ikke en hel takt. */
private const val SLOTS_PER_BAR = 4
/** Antall slag sangen må ha spilt før lytteren uttaler seg (3 takter). */
private const val WARMUP_SLOTS = 16
/** «Nå» = siste to slag (en halv takt). */
private const val NOW_SLOTS = 2
/** «Rett før» = fire slag (en takt) rett før «nå». */
private const val BEFORE_SLOTS = 4
/** Sangen må ha minst så mange dB mellom sin stille og sin fulle sub for at det finnes en struktur å høre. */
private const val MIN_RANGE_DB = 3f
/** Drop: «nå» må ligge i sangens øvre del, og ha hoppet minst så mye av sangens egen sub-spennvidde. */
private const val DROP_POS = .6f
private const val DROP_JUMP = .25f
/** Under en build-up (vi venter dropet) holdes hoppet lavere: sub er borte, så alt som kommer tilbake teller. */
private const val DROP_JUMP_BUILD = .18f
/** Ut av drop: fylden ligger så mye under dropets eget nivå i en hel takt (fire slag på rad). */
private const val DROP_FALL = .35f
/** Et drop varer minst to takter, og et nytt drop (utenom rett etter en build-up) venter to takter. */
private const val MIN_DROP_SLOTS = 8
private const val REDROP_GAP_SLOTS = 8
/** Build-up: sub er under dette (relativt) og høyden/snare/nærvær stiger. */
private const val BUILD_SUB_POS = .55f
private const val BUILD_RISE = .15f

/** Navnene på målingene lytteren regner per slag ([SongListener.features]) — brukes til å trene en modell mot fasiten. */
val LISTENER_FEATURES = listOf("posSub", "posFull", "posPre", "jump", "airRise", "presRise", "noiseRise", "centRise",
    "snareNow", "snareRatio", "kickNow", "level", "range", "subDelta", "airPos", "presPos")

/** Plassene til [BuildUpModel]s 12 grunnmålinger i [SongListener.features]. */
private val MODEL_BASE = intArrayOf(0, 1, 3, 4, 5, 6, 7, 9, 13, 14, 15, 11)
private val MODEL_LAGS = intArrayOf(2, 4, 8)

class SongListener {
    var part = SongPart.INTRO; private set
    var dropKind = DropKind.NONE; private set
    var label = ""; private set
    var labelAt = 0L; private set
    /** 0..1: hvor full denne delen er sammenlignet med resten av sangen så langt. */
    var level = 0f; private set
    /** 0..1: hvor sannsynlig en build-up / et drop er akkurat nå (sangens egne mål). */
    var pBuild = 0f; private set
    var pDrop = 0f; private set
    var drops = 0; private set
    /** Målingene for siste slag, i rekkefølgen [LISTENER_FEATURES] (alle selvrelative: mot sangens egne p10–p90). */
    val features = FloatArray(LISTENER_FEATURES.size)
    /** Skygge: build-up-modellens sannsynlighet (glattet over fire slag) og uglattet. Styrer ingenting. */
    var pBuildModel = 0f; private set
    /** Siste input til [BuildUpModel] (48 tall) og kravet til hopp for å melde drop nå — brukes til å vise «hvorfor» i AI-treneren. */
    val modelInput = FloatArray(MODEL_BASE.size * (1 + MODEL_LAGS.size))
    var jumpNeeded = DROP_JUMP; private set
    var pBuildModelRaw = 0f; private set
    private val modelHistory = ArrayList<FloatArray>(); private val modelProbs = ArrayList<Float>()
    /** Råverdier for siste slag: sub-, høyde- og nærværs-nivå i dB, antall kick og snare (til offline-analyse og rettings-verktøyet). */
    val levels = FloatArray(5)
    /** Lengden på et slag akkurat nå (ms). */
    val slotLengthMs get() = slotMs
    /** Antall slag lukket så langt (for å vite når [features] er ferske). */
    val slots get() = sub.size
    val effectsAllowed get() = part == SongPart.DROP

    // Slag-målinger (én verdi per slag)
    private val sub = ArrayList<Float>(); private val air = ArrayList<Float>(); private val pres = ArrayList<Float>()
    private val noise = ArrayList<Float>(); private val cent = ArrayList<Float>()
    private val kicks = ArrayList<Int>(); private val snares = ArrayList<Int>()
    private var sumNoise = 0f; private var sumCent = 0f
    private var sumSub = 0f; private var sumAir = 0f; private var sumPres = 0f; private var nFrames = 0
    private var nKicks = 0; private var nSnares = 0
    private var prevKick = 0f; private var prevSnare = 0f
    private var slotStart = -1L; private var slotMs = 400f
    private val bpmRing = FloatArray(32); private var bpmN = 0

    private var hitRun = 0
    private var lastFrame: HardstyleFrame? = null
    /** Slag-nummer der sangen sist hoppet/ble pauset: «rett før»-vinduene bruker bare slag etter dette. */
    private var gapAt = 0
    private var dropRef = 0f; private var fallRun = 0; private var buildRun = 0; private var noBuildRun = 0
    private var partSince = 0; private var intensity = .4f
    /** Rekkefølge: lengden (i slag) på forrige build-up, så neste kan ventes like lang. */
    private var lastBuildSlots = 0; private var buildStart = 0

    fun newTrack(now: Long) {
        noise.clear(); cent.clear(); sub.clear(); air.clear(); pres.clear(); kicks.clear(); snares.clear()
        sumNoise = 0f; sumCent = 0f; sumSub = 0f; sumAir = 0f; sumPres = 0f; nFrames = 0; nKicks = 0; nSnares = 0; prevKick = 0f; prevSnare = 0f
        slotStart = now; slotMs = 400f; bpmN = 0
        part = SongPart.INTRO; dropKind = DropKind.NONE; label = ""; labelAt = now
        level = 0f; pBuild = 0f; pDrop = 0f; drops = 0
        modelHistory.clear(); modelProbs.clear(); pBuildModel = 0f; pBuildModelRaw = 0f
        lastFrame = null; gapAt = 0; hitRun = 0; dropRef = 0f; fallRun = 0; buildRun = 0; noBuildRun = 0; partSince = 0; intensity = .4f
        lastBuildSlots = 0; buildStart = 0
    }

    /** Samme form som [HardstyleStructure.update]: returnerer styrke 0.35–1.3 (ikke i bruk ennå). */
    fun update(f: HardstyleFrame, now: Long, positionMs: Long = -1L, durationMs: Long = -1L): Float {
        if (slotStart < 0) newTrack(now)
        // Appen mater samme lydbilde flere ganger per skjermbilde: et bilde telles bare én gang
        // (ellers veier live-målingene annerledes enn avspillingen i testen). Klokka går videre uansett.
        if (f !== lastFrame) {
            lastFrame = f
            if (f.bpm in 100f..260f) { bpmRing[bpmN % bpmRing.size] = fold(f.bpm); bpmN++ }
            // Kick og snare telles på stigende kant.
            if (f.kick > .7f && prevKick <= .7f) nKicks++
            if (f.snare > .5f && prevSnare <= .5f) nSnares++
            prevKick = f.kick; prevSnare = f.snare
            sumNoise += f.noise; sumCent += ln(max(f.centroid, 250f)); sumSub += f.subLevel; sumAir += f.air; sumPres += f.presence; nFrames++
        }

        val gap = now - slotStart
        if (gap > 4_000L) { // pause / hopp i sangen: ikke fyll inn tomme slag, og start vinduene på nytt
            slotStart = now; resetSlot()
            gapAt = sub.size; hitRun = 0; fallRun = 0; buildRun = 0; noBuildRun = 0
            return intensity
        }
        if (gap >= slotMs) {
            closeSlot(positionMs, durationMs, now)
            slotStart += slotMs.toLong().coerceAtLeast(1L)
            resetSlot()
            slotMs = nextSlotMs()
        }
        return intensity
    }

    private fun resetSlot() { sumNoise = 0f; sumCent = 0f; sumSub = 0f; sumAir = 0f; sumPres = 0f; nFrames = 0; nKicks = 0; nSnares = 0 }

    /** Tempo brettet inn i 100–200 BPM, så halv/dobbel takt ikke flytter slagene. */
    private fun fold(b: Float): Float { var x = b; while (x >= 200f) x /= 2f; while (x < 100f) x *= 2f; return x }

    /** Slaglengde fra medianen av de siste tempomålingene; endres bare når den avviker mer enn 3 % (ingen hopping). */
    private fun nextSlotMs(): Float {
        val n = minOf(bpmN, bpmRing.size)
        if (n < 8) return slotMs
        val med = bpmRing.copyOf(n).also { it.sort() }[n / 2]
        val want = 60_000f / med
        return if (kotlin.math.abs(want - slotMs) > slotMs * .03f) want else slotMs
    }

    private fun db(x: Float) = 20f * log10(max(x, 2.5f))

    private fun closeSlot(pos: Long, dur: Long, now: Long) {
        val n = max(nFrames, 1)
        sub.add(db(sumSub / n)); air.add(db(sumAir / n)); pres.add(db(sumPres / n))
        noise.add(sumNoise / n); cent.add(sumCent / n); kicks.add(nKicks); snares.add(nSnares)
        val c = sub.size
        levels[0] = sub[c - 1]; levels[1] = air[c - 1]; levels[2] = pres[c - 1]; levels[3] = nKicks.toFloat(); levels[4] = nSnares.toFloat()
        partSince++
        if (c < WARMUP_SLOTS) { setPart(SongPart.INTRO, pos, now, dur); return }
        // Etter pause/hopp trengs nok sammenhengende slag til «nå» og «rett før» før vi uttaler oss igjen.
        if (c - gapAt < NOW_SLOTS + BEFORE_SLOTS + 4) return

        val ss = sub.sorted()
        val p10 = ss[(c * .1f).toInt()]; val p90 = ss[(c * .9f).toInt().coerceAtMost(c - 1)]
        val range = p90 - p10
        val sRange = p90 - p10
        val aS = air.sorted(); val aRange = aS[(c * .9f).toInt().coerceAtMost(c - 1)] - aS[(c * .1f).toInt()]
        val pS = pres.sorted(); val pRange = pS[(c * .9f).toInt().coerceAtMost(c - 1)] - pS[(c * .1f).toInt()]
        fun posS(x: Float) = ((x - p10) / sRange.coerceAtLeast(.1f)).coerceIn(-.5f, 1.5f)
        fun mean(l: List<Float>, from: Int, to: Int): Float { var s = 0f; for (i in from until to) s += l[i]; return s / (to - from) }

        val curSub = mean(sub, c - NOW_SLOTS, c)
        fun posA(x: Float) = ((x - aS[(c * .1f).toInt()]) / aRange.coerceAtLeast(1f)).coerceIn(-.5f, 1.5f)
        fun posP(x: Float) = ((x - pS[(c * .1f).toInt()]) / pRange.coerceAtLeast(1f)).coerceIn(-.5f, 1.5f)
        /** Fylde = den svakeste av sub og lys klang (høyde + nærvær), hver mot sangens egen spennvidde: et drop trenger begge. */
        fun full(from: Int, to: Int) = minOf(posS(mean(sub, from, to)), (posA(mean(air, from, to)) + posP(mean(pres, from, to))) / 2f)
        val posSub = posS(curSub)
        val posNow = full(c - NOW_SLOTS, c); val posPre = full(c - NOW_SLOTS - BEFORE_SLOTS, c - NOW_SLOTS)
        val barPos = full(c - 4, c)
        val kickNow = kicks.takeLast(NOW_SLOTS).sum()
        val kickBar = kicks.takeLast(4).sum()

        // Fylde i forhold til sangen selv: rang av sub, høyde og nærvær blant alle slag hørt så langt.
        fun rank(l: List<Float>, x: Float): Float { var k = 0; for (v in l) if (v < x) k++; return k / c.toFloat() }
        val curAir = mean(air, c - NOW_SLOTS, c); val curPres = mean(pres, c - NOW_SLOTS, c)
        level = (rank(sub, curSub) + rank(air, curAir) + rank(pres, curPres)) / 3f

        // Stigning: høyde / nærvær / snare nå mot rett før — målt mot sangens egen spennvidde.
        val airRise = (curAir - mean(air, c - NOW_SLOTS - BEFORE_SLOTS, c - NOW_SLOTS)) / aRange.coerceAtLeast(1f)
        val presRise = (curPres - mean(pres, c - NOW_SLOTS - BEFORE_SLOTS, c - NOW_SLOTS)) / pRange.coerceAtLeast(1f)
        val snareNow = snares.takeLast(4).sum(); val snareBefore = snares.subList(c - 8, c - 4).sum()
        val snareRise = snareNow >= 3 && snareNow >= snareBefore * 1.5f
        val nS = noise.sorted(); val cS = cent.sorted()
        val noiseRise = (mean(noise, c - NOW_SLOTS, c) - mean(noise, c - NOW_SLOTS - BEFORE_SLOTS, c - NOW_SLOTS)) /
            (nS[(c * .9f).toInt().coerceAtMost(c - 1)] - nS[(c * .1f).toInt()]).coerceAtLeast(.02f)
        val centRise = (mean(cent, c - NOW_SLOTS, c) - mean(cent, c - NOW_SLOTS - BEFORE_SLOTS, c - NOW_SLOTS)) /
            (cS[(c * .9f).toInt().coerceAtMost(c - 1)] - cS[(c * .1f).toInt()]).coerceAtLeast(.05f)
        // Build-up = minst to av tre tegn: høyde/nærvær stiger, snare-trommerulle, støy/lysere klang.
        val signs = (if (airRise > BUILD_RISE || presRise > BUILD_RISE) 1 else 0) + (if (snareRise) 1 else 0) +
            (if (noiseRise > BUILD_RISE || centRise > BUILD_RISE) 1 else 0)
        val rising = signs >= 2
        features[0] = posSub; features[1] = posNow; features[2] = posPre; features[3] = posNow - posPre
        features[4] = airRise; features[5] = presRise; features[6] = noiseRise; features[7] = centRise
        features[8] = snareNow.toFloat(); features[9] = snareNow / (snareBefore + 1f); features[10] = kickNow.toFloat()
        features[11] = level; features[12] = range
        features[13] = posSub - posS(mean(sub, c - NOW_SLOTS - BEFORE_SLOTS, c - NOW_SLOTS))
        features[14] = posA(curAir); features[15] = posP(curPres)
        runModel()
        val buildEvidence = range >= MIN_RANGE_DB && posSub < BUILD_SUB_POS && rising
        pBuild = if (range < MIN_RANGE_DB) 0f else
            (((BUILD_SUB_POS - posSub) / BUILD_SUB_POS).coerceIn(0f, 1f) * .5f +
                (max(airRise, presRise) / (2 * BUILD_RISE)).coerceIn(0f, 1f) * .5f)

        // Hvor lenge en build-up pleier å vare i denne sangen (rekkefølgen), så dropet kan ventes.
        val buildSlots = partSince
        // Rekkefølge: en build-up like lang som forrige ventes å ende i drop → da holder et mindre hopp.
        val expectDrop = part == SongPart.BUILDUP && lastBuildSlots > 0 && buildSlots >= lastBuildSlots - 2
        val jumpNeeded = if (expectDrop) DROP_JUMP_BUILD else DROP_JUMP
        this.jumpNeeded = jumpNeeded
        val jump = posNow - posPre
        pDrop = if (range < MIN_RANGE_DB) 0f else (jump / jumpNeeded).coerceIn(0f, 1f) * (if (kickNow > 0) 1f else .3f)
        val fromBuild = part == SongPart.BUILDUP
        val hit = range >= MIN_RANGE_DB && posNow >= DROP_POS && jump >= jumpNeeded && kickNow >= 1 && part != SongPart.DROP &&
            (fromBuild || partSince >= REDROP_GAP_SLOTS || drops == 0)
        hitRun = if (hit) hitRun + 1 else 0
        // Et svært tydelig hopp (dobbelt så stort som kravet) meldes med én gang; ellers må det holde i to slag.
        val dropHit = hitRun >= 2 || (hit && jump >= jumpNeeded * 2f)

        buildRun = if (buildEvidence) buildRun + 1 else 0
        noBuildRun = if (buildEvidence) 0 else noBuildRun + 1

        if (part == SongPart.DROP) {
            dropRef += (barPos - dropRef) * .05f  // dropets eget nivå, følger rolig med (ikke en topp)
            val fell = partSince >= MIN_DROP_SLOTS && (barPos < dropRef - DROP_FALL || kickBar == 0)
            fallRun = if (fell) fallRun + 1 else 0
            if (fallRun >= SLOTS_PER_BAR) { // dropet er over: build-up hvis det stiger, ellers breakdown
                setPart(if (buildEvidence) SongPart.BUILDUP else SongPart.BREAKDOWN, pos, now, dur); fallRun = 0
            }
        } else if (dropHit) {
            drops++
            setPart(SongPart.DROP, pos, now, dur)
            dropKind = if (drops == 1) DropKind.FIRST else if (dur > 0 && pos >= dur * .6f) DropKind.LAST else DropKind.MIDDLE
            dropRef = posNow; fallRun = 0
        } else when (part) {
            SongPart.INTRO, SongPart.GROOVE, SongPart.BREAKDOWN -> if (buildRun >= 2) setPart(SongPart.BUILDUP, pos, now, dur)
            SongPart.BUILDUP -> if (noBuildRun >= SLOTS_PER_BAR * 2) setPart(if (drops == 0) SongPart.INTRO else SongPart.BREAKDOWN, pos, now, dur)
            else -> {}
        }
        if (dur > 0 && pos > dur - 20_000L && drops > 0 && part != SongPart.DROP) setPart(SongPart.OUTRO, pos, now, dur)

        intensity += (.35f + .95f * level - intensity) * .25f
    }

    /** Modellen ser på de 12 grunnmålingene nå og endringen mot 2, 4 og 8 slag siden (som ved treningen). */
    private fun runModel() {
        val base = FloatArray(MODEL_BASE.size) { features[MODEL_BASE[it]] }
        modelHistory.add(base)
        val x = FloatArray(base.size * (1 + MODEL_LAGS.size))
        for (i in base.indices) x[i] = base[i]
        for ((li, lag) in MODEL_LAGS.withIndex()) {
            val past = modelHistory[max(modelHistory.size - 1 - lag, 0)]
            for (i in base.indices) x[base.size * (li + 1) + i] = base[i] - past[i]
        }
        x.copyInto(modelInput)
        pBuildModelRaw = BuildUpModel.probability(x)
        modelProbs.add(pBuildModelRaw)
        val from = max(0, modelProbs.size - 4)
        var sum = 0f; for (i in from until modelProbs.size) sum += modelProbs[i]
        pBuildModel = sum / (modelProbs.size - from)
    }

    private fun setPart(p: SongPart, pos: Long, now: Long, dur: Long) {
        if (p == part) return
        if (part == SongPart.BUILDUP) lastBuildSlots = partSince
        part = p; partSince = 0
        if (p != SongPart.DROP) dropKind = DropKind.NONE
        label = p.name; labelAt = now
    }
}

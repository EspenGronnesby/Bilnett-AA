package com.kododake.aabrowser.rave

import kotlin.math.exp

/**
 * Build-up-modellen (steg 3 lettvekt, laget av tools/party-analyse/train_listener.py – ikke rediger for hånd).
 * Logistisk regresjon trent på Espens fasit, 48 målinger: 12 nå + endring mot 2, 4 og 8 slag siden
 * (rekkefølge: posSub, posFull, jump, airRise, presRise, noiseRise, centRise, snareRatio, subDelta, airPos, presPos, level). Gir sannsynlighet 0..1 for build-up.
 */
object BuildUpModel {
    val FEATURES = listOf("posSub", "posFull", "jump", "airRise", "presRise", "noiseRise", "centRise", "snareRatio", "subDelta", "airPos", "presPos", "level", "posSub_d2", "posFull_d2", "jump_d2", "airRise_d2", "presRise_d2", "noiseRise_d2", "centRise_d2", "snareRatio_d2", "subDelta_d2", "airPos_d2", "presPos_d2", "level_d2", "posSub_d4", "posFull_d4", "jump_d4", "airRise_d4", "presRise_d4", "noiseRise_d4", "centRise_d4", "snareRatio_d4", "subDelta_d4", "airPos_d4", "presPos_d4", "level_d4", "posSub_d8", "posFull_d8", "jump_d8", "airRise_d8", "presRise_d8", "noiseRise_d8", "centRise_d8", "snareRatio_d8", "subDelta_d8", "airPos_d8", "presPos_d8", "level_d8")
    private val MEAN = floatArrayOf(0.604989f, 0.369052f, -0.022550f, 0.003546f, 0.001263f, -0.007736f, -0.004343f, 0.452479f, -0.002574f, 0.514553f, 0.625993f, 0.518606f, -0.003532f, -0.002178f, -0.001745f, -0.001503f, -0.002013f, -0.000704f, -0.000558f, -0.002329f, 0.000396f, 0.000661f, 0.000794f, -0.000678f, -0.006615f, -0.004224f, -0.002577f, -0.002605f, -0.003841f, -0.001394f, -0.000247f, -0.005382f, 0.002192f, 0.001230f, 0.001718f, -0.001286f, -0.016774f, -0.011043f, -0.004556f, -0.005963f, -0.008150f, -0.004558f, -0.001358f, -0.011245f, 0.004781f, 0.001807f, 0.003624f, -0.002904f)
    private val SCALE = floatArrayOf(0.394031f, 0.357661f, 0.302211f, 0.369880f, 0.258595f, 0.279170f, 0.300725f, 0.617616f, 0.335287f, 0.385349f, 0.378248f, 0.192611f, 0.319914f, 0.292111f, 0.392444f, 0.516163f, 0.347128f, 0.329272f, 0.370190f, 0.659531f, 0.425802f, 0.346967f, 0.253352f, 0.140057f, 0.402007f, 0.356920f, 0.470245f, 0.596473f, 0.396527f, 0.413966f, 0.479737f, 0.888308f, 0.518502f, 0.396295f, 0.298350f, 0.159635f, 0.485649f, 0.421951f, 0.445867f, 0.520429f, 0.375824f, 0.397813f, 0.435999f, 0.805177f, 0.498481f, 0.428594f, 0.356629f, 0.185601f)
    private val COEF = floatArrayOf(-0.826653f, 0.008891f, -0.060809f, -0.085557f, -0.157477f, 0.070622f, 0.072187f, -0.019927f, -0.006541f, 0.304405f, 0.964466f, 0.004674f, 0.142750f, 0.058845f, 0.039833f, 0.017909f, 0.093826f, 0.013872f, -0.078482f, 0.040577f, 0.019899f, -0.092206f, -0.059928f, 0.040550f, 0.094969f, 0.053813f, -0.011901f, 0.023786f, -0.033167f, -0.024431f, -0.114357f, -0.021872f, -0.013206f, -0.045642f, -0.151080f, 0.049685f, 0.085348f, 0.057163f, -0.117100f, -0.019614f, -0.137129f, 0.045559f, -0.056692f, 0.179557f, 0.043623f, -0.003390f, -0.183923f, 0.183650f)
    private const val BIAS = -0.656804f

    fun probability(x: FloatArray): Float {
        var z = BIAS
        for (i in COEF.indices) z += COEF[i] * (x[i] - MEAN[i]) / SCALE[i]
        return (1.0 / (1.0 + exp(-z.toDouble()))).toFloat()
    }
}

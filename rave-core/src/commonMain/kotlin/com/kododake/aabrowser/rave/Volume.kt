package com.kododake.aabrowser.rave

import kotlin.math.pow

// Volume curves for Party (moved from the app's HardstyleVisuals.kt so the website uses the same).
/** Phone media volume 0..1 -> visual strength. Low volume = calm, max = full power. */
fun volumeGain(volume: Float): Float = .35f + .65f * volume.coerceIn(0f, 1f).pow(1.5f)
/** 1.0 below 90 % volume, rising to 1/0.7 (~1.43x) at 100 %. */
fun maxVolumeBoost(volume: Float): Float = 1f + (1f / .7f - 1f) * ((volume - .9f) / .1f).coerceIn(0f, 1f)
/** 0 below 70 % volume, rising to 1 at 100 %. */
fun loudRamp(volume: Float): Float = ((volume - .7f) / .3f).coerceIn(0f, 1f)
/** 0 below 75 % volume, 1 at max. */
fun loudness(volume: Float): Float = ((volume - .75f) / .25f).coerceIn(0f, 1f)

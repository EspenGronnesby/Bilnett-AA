package com.kododake.aabrowser.rave

import kotlin.math.abs
import kotlin.math.pow
import kotlin.math.roundToLong

private val SPEC = Regex("%([+]?)(?:\\.(\\d+))?([dsbf%])")

actual fun String.fmt(vararg args: Any?): String {
    var i = 0
    return SPEC.replace(this) { m ->
        val plus = m.groupValues[1] == "+"
        val digits = m.groupValues[2].toIntOrNull()
        when (m.groupValues[3]) {
            "%" -> "%"
            "f" -> {
                val v = (args.getOrNull(i++) as? Number)?.toDouble() ?: 0.0
                val text = fixed(v, digits ?: 6)
                if (plus && v >= 0) "+$text" else text
            }
            "d" -> {
                val v = (args.getOrNull(i++) as? Number)?.toLong() ?: 0L
                if (plus && v >= 0) "+$v" else "$v"
            }
            else -> args.getOrNull(i++).toString()
        }
    }
}

/** [v] with exactly [digits] decimals, rounded half away from zero like String.format. */
private fun fixed(v: Double, digits: Int): String {
    val scale = 10.0.pow(digits)
    val n = (abs(v) * scale).roundToLong()
    val whole = n / scale.toLong()
    val frac = (n % scale.toLong()).toString().padStart(digits, '0')
    val sign = if (v < 0 && n != 0L) "-" else ""
    return if (digits == 0) "$sign$whole" else "$sign$whole.$frac"
}

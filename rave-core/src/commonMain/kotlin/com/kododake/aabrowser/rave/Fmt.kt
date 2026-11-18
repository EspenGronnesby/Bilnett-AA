package com.kododake.aabrowser.rave

/**
 * `"%.2f".format(x)` for shared code. On the JVM (the app) this is exactly String.format, so the
 * app's texts stay the same; on JS a small formatter handles the patterns the core uses
 * (%d %s %b %.Nf %+.Nf %%).
 */
expect fun String.fmt(vararg args: Any?): String

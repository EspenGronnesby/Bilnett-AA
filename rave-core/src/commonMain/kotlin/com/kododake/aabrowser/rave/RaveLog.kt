package com.kododake.aabrowser.rave

/**
 * Logging for the shared core without Android: the app connects [sink] to android.util.Log
 * (RaveActivity), the website can connect it to the console. Silent by default (tests).
 */
object RaveLog {
    var sink: (tag: String, message: String) -> Unit = { _, _ -> }
    fun d(tag: String, message: String) = sink(tag, message)
}

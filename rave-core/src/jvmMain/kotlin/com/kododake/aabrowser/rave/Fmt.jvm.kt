package com.kododake.aabrowser.rave

actual fun String.fmt(vararg args: Any?): String = this.format(*args)

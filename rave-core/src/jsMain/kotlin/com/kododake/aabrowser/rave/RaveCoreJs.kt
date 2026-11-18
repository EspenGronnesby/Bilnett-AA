@file:OptIn(ExperimentalJsExport::class)

package com.kododake.aabrowser.rave

/** The website's door into the shared core: only plain numbers and arrays cross it. */
@JsExport
fun raveCoreVersion(): Int = RaveCore.VERSION

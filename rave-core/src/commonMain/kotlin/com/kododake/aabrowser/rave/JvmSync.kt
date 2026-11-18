@file:OptIn(ExperimentalMultiplatform::class)

package com.kododake.aabrowser.rave

/**
 * `@Synchronized` for shared code: on the JVM (the app, where sound and screen run on different
 * threads) it is exactly kotlin.jvm.Synchronized; on JS (one thread) it does nothing.
 */
@OptionalExpectation
@Target(AnnotationTarget.FUNCTION)
expect annotation class JvmSync()

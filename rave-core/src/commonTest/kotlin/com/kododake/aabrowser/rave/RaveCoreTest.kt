package com.kododake.aabrowser.rave

import kotlin.test.Test
import kotlin.test.assertTrue

class RaveCoreTest {
    @Test fun versionIsSet() = assertTrue(RaveCore.VERSION >= 1)
}

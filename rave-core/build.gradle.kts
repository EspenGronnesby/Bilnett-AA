import org.jetbrains.kotlin.gradle.dsl.JvmTarget

// Shared Party analysis: the same code (and the same trained thresholds) runs in the Android app
// (JVM) and on the Rave website (JS). No Android code in here.
plugins {
    alias(libs.plugins.kotlin.multiplatform)
}

kotlin {
    jvm {
        compilerOptions { jvmTarget.set(JvmTarget.JVM_21) } // same as the app
    }
    js {
        nodejs() // tests run in Node; the website imports the library build
        binaries.library()
        useEsModules()
        generateTypeScriptDefinitions()
    }
    sourceSets {
        commonTest.dependencies { implementation(kotlin("test")) }
    }
}


// Same as in the root build.gradle.kts: use the installed Node, never download one.
plugins.withType<org.jetbrains.kotlin.gradle.targets.js.nodejs.NodeJsPlugin> {
    the<org.jetbrains.kotlin.gradle.targets.js.nodejs.NodeJsEnvSpec>().download.set(false)
}

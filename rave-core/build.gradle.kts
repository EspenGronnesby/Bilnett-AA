import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import java.security.MessageDigest

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

/**
 * Copies the built JS engine to the website (web/src/core/generated), with a fingerprint of the
 * Kotlin sources it was built from. Vercel has no JDK, so the built file is committed; the website's
 * build (web/scripts/check-core.mjs) stops if the Kotlin changed without running this again.
 * Run: ./gradlew :rave-core:syncWebCore
 */
val webCoreDir = rootProject.layout.projectDirectory.dir("web/src/core/generated")
tasks.register("syncWebCore") {
    group = "rave"
    description = "Build the JS engine and copy it to web/src/core/generated"
    dependsOn("jsNodeProductionLibraryDistribution")
    doLast {
        val dist = layout.buildDirectory.dir("dist/js/productionLibrary").get().asFile
        val out = webCoreDir.asFile.apply { deleteRecursively(); mkdirs() }
        // One self-contained module (whole-program, see gradle.properties) + its TypeScript types.
        listOf("AABrowser-rave-core.mjs", "AABrowser-rave-core.d.mts").forEach { name ->
            dist.resolve(name).copyTo(out.resolve(name.replace("AABrowser-rave-core", "rave-core")))
        }
        out.resolve("SOURCE_HASH").writeText(coreSourceHash(project.projectDir) + "\n")
    }
}

/** sha256 over the sources the website uses (same recipe as web/scripts/check-core.mjs). */
fun coreSourceHash(moduleDir: File): String {
    val md = MessageDigest.getInstance("SHA-256")
    listOf("src/commonMain", "src/jsMain").map { moduleDir.resolve(it) }.flatMap { root ->
        root.walkTopDown().filter { it.isFile && it.name.endsWith(".kt") }.map { it.relativeTo(moduleDir).invariantSeparatorsPath to it }.toList()
    }.sortedBy { it.first }.forEach { (rel, f) ->
        md.update("$rel\n".toByteArray()); md.update(f.readBytes()); md.update("\n".toByteArray())
    }
    return md.digest().joinToString("") { b -> "%02x".format(b) }
}

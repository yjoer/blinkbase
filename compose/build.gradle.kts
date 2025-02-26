import org.jetbrains.compose.desktop.application.dsl.TargetFormat
import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
	alias(libs.plugins.androidApplication)
	alias(libs.plugins.composeCompiler)
	alias(libs.plugins.composeHotReload)
	alias(libs.plugins.composeMultiplatform)
	alias(libs.plugins.kotlinMultiplatform)
}

layout.buildDirectory.set(file(".build"))

kotlin {
	androidTarget { compilerOptions { jvmTarget.set(JvmTarget.JVM_11) } }

	jvm()

	sourceSets {
		androidMain {
			kotlin.srcDirs("android")

			dependencies {
				implementation(libs.androidx.activity.compose) //
			}
		}

		commonMain {
			kotlin.srcDirs("common")

			dependencies {
				implementation(compose.components.resources)
				implementation(compose.components.uiToolingPreview)
				implementation(compose.foundation)
				implementation(compose.material3)
				implementation(compose.runtime)
				implementation(compose.ui)
			}
		}

		jvmMain {
			kotlin.srcDirs("desktop")

			dependencies {
				implementation(compose.desktop.currentOs) //
			}
		}
	}
}

dependencies { debugImplementation(compose.uiTooling) }

android {
	namespace = "app.blinkbase.compose"
	compileSdk = libs.versions.android.compileSdk.get().toInt()

	defaultConfig {
		applicationId = "app.blinkbase.compose"
		minSdk = libs.versions.android.minSdk.get().toInt()
		targetSdk = libs.versions.android.targetSdk.get().toInt()
	}

	sourceSets { named("main") { manifest.srcFile("android/AndroidManifest.xml") } }
}

compose.resources {
	customDirectory(
		sourceSetName = "commonMain",
		directoryProvider = provider { layout.projectDirectory.dir("common-res") },
	)
}

compose.desktop {
	application {
		mainClass = "app.blinkbase.compose.MainKt"

		nativeDistributions {
			targetFormats(TargetFormat.Msi)
			packageName = "app.blinkbase.compose"
			packageVersion = "0.0.0"
		}
	}
}

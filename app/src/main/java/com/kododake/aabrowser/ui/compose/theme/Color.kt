/*
 * Copyright (C) 2025 AABrowser Contributors (https://github.com/kododake/AABrowser)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://gnu.org>.
 */

package com.kododake.aabrowser.ui.compose.theme

import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.ui.graphics.Color

val LightPurpleColorScheme = lightColorScheme(
    primary = Color(0xFF6750A4),
    onPrimary = Color(0xFFFFFFFF),
    primaryContainer = Color(0xFFEADDFF),
    onPrimaryContainer = Color(0xFF21005D),
    secondary = Color(0xFF635A75),
    onSecondary = Color(0xFFFFFFFF),
    secondaryContainer = Color(0xFFE8DEF8),
    onSecondaryContainer = Color(0xFF1D192B),
    tertiary = Color(0xFF7D5260),
    onTertiary = Color(0xFFFFFFFF),
    tertiaryContainer = Color(0xFFFFD8E4),
    onTertiaryContainer = Color(0xFF31111D),
    surface = Color(0xFFFEF7FF),
    surfaceBright = Color(0xFFFFFFFF),
    surfaceContainerLowest = Color(0xFFFFFFFF),
    surfaceContainerLow = Color(0xFFF7F2FA),
    surfaceContainer = Color(0xFFF3EDF7),
    surfaceContainerHigh = Color(0xFFECE6F0),
    surfaceContainerHighest = Color(0xFFE6E0E9),
    onSurface = Color(0xFF1D1B20),
    onSurfaceVariant = Color(0xFF49454F),
    outline = Color(0xFF79747E),
    outlineVariant = Color(0xFFCAC4D0),
    inverseSurface = Color(0xFF322F35),
    inverseOnSurface = Color(0xFFF5EFF7),
    inversePrimary = Color(0xFFD0BCFF),
    error = Color(0xFFB3261E),
    onError = Color(0xFFFFFFFF),
    errorContainer = Color(0xFFF9DEDC),
    onErrorContainer = Color(0xFF410E0B)
)

// Bilnett: skandinavisk mørk, nøytral palett (#0A0A0A base, ingen neon/lilla)
val DarkPurpleColorScheme = darkColorScheme(
    primary = Color(0xFFECE8E1),
    onPrimary = Color(0xFF0A0A0A),
    primaryContainer = Color(0xFF2A2927),
    onPrimaryContainer = Color(0xFFF5F2EC),
    secondary = Color(0xFFB9B4AB),
    onSecondary = Color(0xFF0A0A0A),
    secondaryContainer = Color(0xFF242322),
    onSecondaryContainer = Color(0xFFE6E2DA),
    tertiary = Color(0xFFC8B79A),
    onTertiary = Color(0xFF0A0A0A),
    tertiaryContainer = Color(0xFF332D24),
    onTertiaryContainer = Color(0xFFEFE4D0),
    background = Color(0xFF0A0A0A),
    onBackground = Color(0xFFECE8E1),
    surface = Color(0xFF0A0A0A),
    surfaceBright = Color(0xFF2C2C2C),
    surfaceContainerLowest = Color(0xFF050505),
    surfaceContainerLow = Color(0xFF111111),
    surfaceContainer = Color(0xFF161616),
    surfaceContainerHigh = Color(0xFF1E1E1E),
    surfaceContainerHighest = Color(0xFF262626),
    onSurface = Color(0xFFECE8E1),
    onSurfaceVariant = Color(0xFFA8A49C),
    outline = Color(0xFF5E5B56),
    outlineVariant = Color(0xFF2E2D2B),
    inverseSurface = Color(0xFFECE8E1),
    inverseOnSurface = Color(0xFF1A1A1A),
    inversePrimary = Color(0xFF3A3834),
    error = Color(0xFFE5A5A0),
    onError = Color(0xFF3A0E0B),
    errorContainer = Color(0xFF5C1A15),
    onErrorContainer = Color(0xFFF9DEDC)
)

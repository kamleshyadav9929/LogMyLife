import 'package:flutter/material.dart';
export 'novi_motion.dart';
import 'novi_motion.dart';

/// NOVI — Material 3 Design System Constants & Theme Engine
/// Implements Google Pixel / Material 3 principles with full Light & Dark mode support.

class NoviSpacing {
  static const double space2 = 2.0;
  static const double space4 = 4.0;
  static const double space6 = 6.0;
  static const double space8 = 8.0;
  static const double space10 = 10.0;
  static const double space12 = 12.0;
  static const double space14 = 14.0;
  static const double space16 = 16.0;
  static const double space20 = 20.0;
  static const double space24 = 24.0;
  static const double space28 = 28.0;
  static const double space32 = 32.0;
  static const double space40 = 40.0;
  static const double space48 = 48.0;
  static const double space64 = 64.0;
}

class NoviShapes {
  static const double radiusSmall = 8.0;
  static const double radiusMedium = 12.0;
  static const double radiusCard = 16.0;        // Upgraded from 12 → 16 per design.md
  static const double radiusLargeCard = 20.0;   // Upgraded from 16 → 20 per design.md
  static const double radiusDialog = 24.0;      // Upgraded from 20 → 24 per design.md
  static const double radiusSheet = 28.0;       // Upgraded from 24 → 28 per design.md
  static const double radiusPill = 100.0;

  static const RoundedRectangleBorder cardShape = RoundedRectangleBorder(
    borderRadius: BorderRadius.all(Radius.circular(radiusCard)),
  );

  static const RoundedRectangleBorder dialogShape = RoundedRectangleBorder(
    borderRadius: BorderRadius.all(Radius.circular(radiusDialog)),
  );

  static const RoundedRectangleBorder sheetShape = RoundedRectangleBorder(
    borderRadius: BorderRadius.vertical(top: Radius.circular(radiusSheet)),
  );
}

class NoviColors {
  // ── NOVI Core Brand & Emotional Identity (Charcoal + Muted Wine Red) ──
  static const Color winePrimary = Color(0xFF8C3E3C);      // Primary / Brand Accent (#8C3E3C)
  static const Color winePrimaryLight = Color(0xFFA95754); // Hover / pressed / secondary accent (#A95754)
  static const Color winePrimaryDark = Color(0xFF6F302F);  // Pressed / emphasis (#6F302F)
  static const Color wineContainerDark = Color(0xFF452423);// Subtle wine-tinted dark container (#452423)
  static const Color onWineContainerDark = Color(0xFFF2D9D8);

  // ── Charcoal Surface Scale (Multiple blacks for subtle depth) ──
  static const Color charcoalDeep = Color(0xFF242424);     // Deep Surface: sheets backdrops, deep surfaces (#242424)
  static const Color charcoalNav = Color(0xFF292929);      // Navigation Bar background (#292929)
  static const Color charcoalBg = Color(0xFF2C2C2C);       // Main app background (#2C2C2C)
  static const Color charcoalSurface = Color(0xFF333333);  // Cards & lists base surface (#333333)
  static const Color charcoalSheet = Color(0xFF363636);    // Bottom sheets background (#363636)
  static const Color charcoalElevated = Color(0xFF393939); // Elevated surfaces & chips (#393939)
  static const Color charcoalDialog = Color(0xFF3D3D3D);   // Dialog background (#3D3D3D)
  static const Color borderSubtle = Color(0xFF414141);     // Dividers, card borders, outlines (#414141)
  static const Color borderMuted = Color(0xFF525252);      // Secondary borders / low-emphasis outlines (#525252)

  // ── Strict Typography Scale (High contrast, zero eye strain) ──
  static const Color textPrimary = Color(0xFFF1F1F1);      // Primary headlines & body (#F1F1F1)
  static const Color textCardTitle = Color(0xFFDFDFDF);    // Card titles, light surface text (#DFDFDF)
  static const Color textSecondary = Color(0xFFB5B5B5);    // Secondary text on dark surfaces (#B5B5B5)
  static const Color textTertiary = Color(0xFF858585);     // Tertiary text & captions (#858585)
  static const Color textDisabled = Color(0xFF626262);     // Disabled states (#626262)
  static const Color navUnselected = Color(0xFF9D9D9D);    // Unselected nav icons & labels (#9D9D9D)

  // ── Light Theme Harmonized Tokens ──
  static const Color lightBg = Color(0xFFFAF9F6);          // Warm Alabaster Rice Paper
  static const Color lightSurface = Color(0xFFFFFFFF);     // Pure White Cards
  static const Color lightSurfaceLow = Color(0xFFF3F1EC);  // Warm Subtle Linen
  static const Color lightSurfaceContainer = Color(0xFFECEAE4); // Soft Canvas
  static const Color lightSurfaceHigh = Color(0xFFE4E1DA); // Warm Pebble
  static const Color lightSurfaceHighest = Color(0xFFDCD8D0);
  static const Color lightBorder = Color(0xFFD6D3CB);      // Subtle Hairline
  static const Color lightBorderSubtle = Color(0xFFE6E3DB);
  static const Color lightTextPrimary = Color(0xFF1C1D1C); // Deep Charcoal
  static const Color lightTextSecondary = Color(0xFF525252); // Muted text on light surfaces (#525252)
  static const Color lightTextTertiary = Color(0xFF858585);
  static const Color lightWineContainer = Color(0xFFF8EBEB);
  static const Color lightOnWineContainer = Color(0xFF5C201F);

  // Functional Colors
  static const Color error = Color(0xFFE57373);
  static const Color onError = Color(0xFFFFFFFF);
  static const Color errorContainer = Color(0xFF522828);
  static const Color onErrorContainer = Color(0xFFFFCDD2);

  // Compatibility aliases for theme references
  static const Color primaryLight = winePrimary;
  static const Color onPrimaryLight = Color(0xFFFFFFFF);
  static const Color primaryContainerLight = lightWineContainer;
  static const Color onPrimaryContainerLight = lightOnWineContainer;

  static const Color secondaryLight = winePrimaryLight;
  static const Color onSecondaryLight = Color(0xFFFFFFFF);
  static const Color secondaryContainerLight = lightSurfaceContainer;
  static const Color onSecondaryContainerLight = lightTextPrimary;

  static const Color tertiaryLight = lightTextSecondary;
  static const Color onTertiaryLight = Color(0xFFFFFFFF);
  static const Color tertiaryContainerLight = lightSurfaceHigh;
  static const Color onTertiaryContainerLight = lightTextPrimary;

  static const Color errorLight = Color(0xFFB91C1C);
  static const Color onErrorLight = Color(0xFFFFFFFF);
  static const Color errorContainerLight = Color(0xFFFEE2E2);
  static const Color onErrorContainerLight = Color(0xFF7F1D1D);

  static const Color surfaceLight = lightBg;
  static const Color surfaceContainerLowestLight = lightSurface;
  static const Color surfaceContainerLowLight = lightSurfaceLow;
  static const Color surfaceContainerLight = lightSurfaceContainer;
  static const Color surfaceContainerHighLight = lightSurfaceHigh;
  static const Color surfaceContainerHighestLight = lightSurfaceHighest;

  static const Color onSurfaceLight = lightTextPrimary;
  static const Color onSurfaceVariantLight = lightTextSecondary;
  static const Color outlineLight = lightBorder;
  static const Color outlineVariantLight = lightBorderSubtle;

  // Dark Palette (Dark Charcoal Foundation + #DFDFDF Light Surface Accent)
  static const Color primaryDark = Color(0xFFDFDFDF);     // #DFDFDF
  static const Color onPrimaryDark = Color(0xFF1C1D1C);
  static const Color primaryContainerDark = Color(0xFF383838); // Elevated dark charcoal (#383838)
  static const Color onPrimaryContainerDark = Color(0xFFDFDFDF);

  static const Color secondaryDark = Color(0xFFDFDFDF);   // #DFDFDF
  static const Color onSecondaryDark = Color(0xFF1C1D1C);
  static const Color secondaryContainerDark = charcoalSheet;
  static const Color onSecondaryContainerDark = textCardTitle;

  static const Color tertiaryDark = textSecondary;
  static const Color onTertiaryDark = charcoalDeep;
  static const Color tertiaryContainerDark = charcoalElevated;
  static const Color onTertiaryContainerDark = textPrimary;

  static const Color errorDark = error;
  static const Color onErrorDark = onError;
  static const Color errorContainerDark = errorContainer;
  static const Color onErrorContainerDark = onErrorContainer;

  static const Color surfaceDark = charcoalBg;
  static const Color surfaceContainerLowestDark = charcoalDeep;
  static const Color surfaceContainerLowDark = charcoalNav;
  static const Color surfaceContainerDark = charcoalSurface;
  static const Color surfaceContainerHighDark = charcoalElevated;
  static const Color surfaceContainerHighestDark = charcoalDialog;

  static const Color onSurfaceDark = textPrimary;
  static const Color onSurfaceVariantDark = textSecondary;
  static const Color outlineDark = borderSubtle;
  static const Color outlineVariantDark = borderMuted;

  // Legacy compatibility aliases
  static const Color surfacePageLight = surfaceLight;
  static const Color surfaceMutedLight = surfaceContainerLight;
  static const Color borderDefaultLight = outlineVariantLight;
  static const Color borderStrongLight = outlineLight;

  static const Color surfacePageDark = surfaceDark;
  static const Color surfaceMutedDark = surfaceContainerDark;
  static const Color borderDefaultDark = outlineVariantDark;
  static const Color borderStrongDark = outlineDark;

  static const Color textPrimaryLight = onSurfaceLight;
  static const Color textSecondaryLight = onSurfaceVariantLight;
  static const Color textMutedLight = onSurfaceVariantLight;
  static const Color textDisabledLight = outlineLight;

  static const Color textPrimaryDark = onSurfaceDark;
  static const Color textSecondaryDark = onSurfaceVariantDark;
  static const Color textMutedDark = onSurfaceVariantDark;

  static const Color royalBlue = primaryDark;
  static const Color royalBlueLight = primaryContainerDark;
  static const Color royalBlueBorder = primaryContainerDark;

  static const Color emerald = primaryDark;
  static const Color emeraldLight = primaryContainerDark;
  static const Color emeraldBorder = primaryContainerDark;

  static const Color flame = primaryDark;
  static const Color flameLight = primaryContainerDark;
  static const Color flameBorder = primaryContainerDark;

  static const Color violet = secondaryDark;
  static const Color violetLight = primaryContainerDark;
  static const Color violetBorder = primaryContainerDark;

  static const Color rose = errorDark;
  static const Color roseLight = errorContainerDark;
  static const Color roseBorder = errorContainerDark;
}

// Backward compatibility alias for legacy call sites during migration
typedef AppColors = NoviColors;

class AppTheme {
  static const ColorScheme lightColorScheme = ColorScheme(
    brightness: Brightness.light,
    primary: NoviColors.primaryLight,
    onPrimary: NoviColors.onPrimaryLight,
    primaryContainer: NoviColors.primaryContainerLight,
    onPrimaryContainer: NoviColors.onPrimaryContainerLight,
    secondary: NoviColors.secondaryLight,
    onSecondary: NoviColors.onSecondaryLight,
    secondaryContainer: NoviColors.secondaryContainerLight,
    onSecondaryContainer: NoviColors.onSecondaryContainerLight,
    tertiary: NoviColors.tertiaryLight,
    onTertiary: NoviColors.onTertiaryLight,
    tertiaryContainer: NoviColors.tertiaryContainerLight,
    onTertiaryContainer: NoviColors.onTertiaryContainerLight,
    error: NoviColors.errorLight,
    onError: NoviColors.onErrorLight,
    errorContainer: NoviColors.errorContainerLight,
    onErrorContainer: NoviColors.onErrorContainerLight,
    surface: NoviColors.surfaceLight,
    onSurface: NoviColors.onSurfaceLight,
    onSurfaceVariant: NoviColors.onSurfaceVariantLight,
    outline: NoviColors.outlineLight,
    outlineVariant: NoviColors.outlineVariantLight,
    surfaceContainerLowest: NoviColors.surfaceContainerLowestLight,
    surfaceContainerLow: NoviColors.surfaceContainerLowLight,
    surfaceContainer: NoviColors.surfaceContainerLight,
    surfaceContainerHigh: NoviColors.surfaceContainerHighLight,
    surfaceContainerHighest: NoviColors.surfaceContainerHighestLight,
  );

  static const ColorScheme darkColorScheme = ColorScheme(
    brightness: Brightness.dark,
    primary: NoviColors.primaryDark,
    onPrimary: NoviColors.onPrimaryDark,
    primaryContainer: NoviColors.primaryContainerDark,
    onPrimaryContainer: NoviColors.onPrimaryContainerDark,
    secondary: NoviColors.secondaryDark,
    onSecondary: NoviColors.onSecondaryDark,
    secondaryContainer: NoviColors.secondaryContainerDark,
    onSecondaryContainer: NoviColors.onSecondaryContainerDark,
    tertiary: NoviColors.tertiaryDark,
    onTertiary: NoviColors.onTertiaryDark,
    tertiaryContainer: NoviColors.tertiaryContainerDark,
    onTertiaryContainer: NoviColors.onTertiaryContainerDark,
    error: NoviColors.errorDark,
    onError: NoviColors.onErrorDark,
    errorContainer: NoviColors.errorContainerDark,
    onErrorContainer: NoviColors.onErrorContainerDark,
    surface: NoviColors.surfaceDark,
    onSurface: NoviColors.onSurfaceDark,
    onSurfaceVariant: NoviColors.onSurfaceVariantDark,
    outline: NoviColors.outlineDark,
    outlineVariant: NoviColors.outlineVariantDark,
    surfaceContainerLowest: NoviColors.surfaceContainerLowestDark,
    surfaceContainerLow: NoviColors.surfaceContainerLowDark,
    surfaceContainer: NoviColors.surfaceContainerDark,
    surfaceContainerHigh: NoviColors.surfaceContainerHighDark,
    surfaceContainerHighest: NoviColors.surfaceContainerHighestDark,
  );

  static TextTheme _buildTextTheme(Color onSurface, Color onSurfaceVariant) {
    return TextTheme(
      displayLarge: TextStyle(
        fontSize: 32,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.5,
        height: 1.25,
        color: onSurface,
      ),
      displayMedium: TextStyle(
        fontSize: 28,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.5,
        height: 1.28,
        color: onSurface,
      ),
      displaySmall: TextStyle(
        fontSize: 24,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.25,
        height: 1.33,
        color: onSurface,
      ),
      headlineLarge: TextStyle(
        fontSize: 22,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.2,
        height: 1.27,
        color: onSurface,
      ),
      headlineMedium: TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.15,
        height: 1.3,
        color: onSurface,
      ),
      headlineSmall: TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        letterSpacing: 0,
        height: 1.33,
        color: onSurface,
      ),
      titleLarge: TextStyle(
        fontSize: 17,
        fontWeight: FontWeight.w600,
        letterSpacing: 0,
        height: 1.4,
        color: onSurface,
      ),
      titleMedium: TextStyle(
        fontSize: 15,
        fontWeight: FontWeight.w500,
        letterSpacing: 0.1,
        height: 1.46,
        color: onSurface,
      ),
      titleSmall: TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w500,
        letterSpacing: 0.1,
        height: 1.38,
        color: onSurfaceVariant,
      ),
      bodyLarge: TextStyle(
        fontSize: 15,
        fontWeight: FontWeight.w400,
        letterSpacing: 0.15,
        height: 1.46,
        color: onSurface,
      ),
      bodyMedium: TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w400,
        letterSpacing: 0.25,
        height: 1.38,
        color: onSurfaceVariant,
      ),
      bodySmall: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w400,
        letterSpacing: 0.4,
        height: 1.33,
        color: onSurfaceVariant,
      ),
      labelLarge: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        letterSpacing: 0.1,
        height: 1.28,
        color: onSurface,
      ),
      labelMedium: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        letterSpacing: 0.2,
        height: 1.33,
        color: onSurfaceVariant,
      ),
      labelSmall: TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w500,
        letterSpacing: 0.3,
        height: 1.27,
        color: onSurfaceVariant,
      ),
    );
  }

  static ThemeData get lightTheme {
    final textTheme = _buildTextTheme(
      NoviColors.lightTextPrimary,
      NoviColors.lightTextSecondary,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: lightColorScheme,
      scaffoldBackgroundColor: NoviColors.lightBg,
      textTheme: textTheme,
      fontFamily: 'Roboto',
      appBarTheme: AppBarTheme(
        backgroundColor: NoviColors.lightBg,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        iconTheme: const IconThemeData(color: NoviColors.lightTextPrimary),
        titleTextStyle: textTheme.titleMedium?.copyWith(
          color: NoviColors.lightTextPrimary,
          fontWeight: FontWeight.w600,
        ),
      ),
      cardTheme: CardThemeData(
        color: NoviColors.lightSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(NoviShapes.radiusCard),
          side: BorderSide.none,
        ),
        margin: EdgeInsets.zero,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: NoviColors.lightSurfaceLow,
        indicatorColor: NoviColors.winePrimary,
        indicatorShape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(NoviShapes.radiusPill)),
        ),
        elevation: 0,
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return textTheme.labelMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: NoviColors.winePrimary,
            );
          }
          return textTheme.labelMedium?.copyWith(
            color: NoviColors.lightTextSecondary,
            fontWeight: FontWeight.w500,
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const IconThemeData(color: Colors.white, size: 24);
          }
          return const IconThemeData(color: NoviColors.lightTextSecondary, size: 24);
        }),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: NoviColors.winePrimary,
          foregroundColor: Colors.white,
          minimumSize: const Size(0, 44),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600),
          elevation: 0,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: NoviColors.winePrimary,
          foregroundColor: Colors.white,
          minimumSize: const Size(0, 44),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          elevation: 0,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: NoviColors.lightTextPrimary,
          side: const BorderSide(color: NoviColors.lightBorder, width: 1),
          minimumSize: const Size(0, 44),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: NoviColors.winePrimaryLight,
          textStyle: textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: NoviColors.lightSurfaceContainer,
        selectedColor: NoviColors.winePrimary,
        labelStyle: textTheme.labelMedium?.copyWith(color: NoviColors.lightTextSecondary),
        secondaryLabelStyle: textTheme.labelMedium?.copyWith(color: Colors.white, fontWeight: FontWeight.w600),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(NoviShapes.radiusPill)),
          side: BorderSide(color: NoviColors.lightBorderSubtle, width: 1),
        ),
        elevation: 0,
        pressElevation: 0,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: NoviColors.lightSurfaceLow,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        hintStyle: textTheme.bodyMedium?.copyWith(color: NoviColors.lightTextTertiary),
        labelStyle: textTheme.bodyMedium?.copyWith(color: NoviColors.lightTextSecondary),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(NoviShapes.radiusMedium),
          borderSide: const BorderSide(color: NoviColors.lightBorder, width: 1),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(NoviShapes.radiusMedium),
          borderSide: const BorderSide(color: NoviColors.lightBorderSubtle, width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(NoviShapes.radiusMedium),
          borderSide: const BorderSide(color: NoviColors.winePrimary, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(NoviShapes.radiusMedium),
          borderSide: const BorderSide(color: NoviColors.errorLight, width: 1),
        ),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: NoviColors.lightSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(NoviShapes.radiusSheet)),
        ),
        showDragHandle: true,
        dragHandleColor: NoviColors.lightBorder,
        dragHandleSize: Size(36, 4),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: NoviColors.lightSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(NoviShapes.radiusDialog),
          side: const BorderSide(color: NoviColors.lightBorder, width: 1),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: NoviColors.lightBorderSubtle,
        thickness: 1,
        space: 1,
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: NoviColors.winePrimary,
        foregroundColor: Colors.white,
        elevation: 2,
        focusElevation: 2,
        hoverElevation: 3,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(NoviShapes.radiusLargeCard),
        ),
      ),
      segmentedButtonTheme: SegmentedButtonThemeData(
        style: SegmentedButton.styleFrom(
          backgroundColor: NoviColors.lightSurfaceContainer,
          foregroundColor: NoviColors.lightTextSecondary,
          selectedForegroundColor: Colors.white,
          selectedBackgroundColor: NoviColors.winePrimary,
          side: const BorderSide(color: NoviColors.lightBorder, width: 1),
          textStyle: textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w600),
          minimumSize: const Size(0, 40),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(NoviShapes.radiusMedium),
          ),
        ),
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) return Colors.white;
          return NoviColors.lightTextSecondary;
        }),
        trackColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) return NoviColors.winePrimary;
          return NoviColors.lightSurfaceHigh;
        }),
      ),
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.android: NoviPageTransitionsBuilder(),
          TargetPlatform.iOS: NoviPageTransitionsBuilder(),
          TargetPlatform.windows: NoviPageTransitionsBuilder(),
          TargetPlatform.macOS: NoviPageTransitionsBuilder(),
          TargetPlatform.linux: NoviPageTransitionsBuilder(),
        },
      ),
    );
  }

  static ThemeData get darkTheme {
    final textTheme = _buildTextTheme(
      NoviColors.textPrimary,
      NoviColors.textSecondary,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: darkColorScheme,
      scaffoldBackgroundColor: NoviColors.charcoalBg,
      textTheme: textTheme,
      fontFamily: 'Roboto',
      appBarTheme: AppBarTheme(
        backgroundColor: NoviColors.charcoalBg,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        iconTheme: const IconThemeData(color: NoviColors.textSecondary),
        titleTextStyle: textTheme.titleMedium?.copyWith(
          color: NoviColors.textCardTitle,
          fontWeight: FontWeight.w600,
        ),
      ),
      cardTheme: CardThemeData(
        color: NoviColors.charcoalSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(NoviShapes.radiusCard),
          side: BorderSide.none,
        ),
        margin: EdgeInsets.zero,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: NoviColors.charcoalNav,
        indicatorColor: NoviColors.primaryDark,
        indicatorShape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(NoviShapes.radiusPill)),
        ),
        elevation: 0,
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return textTheme.labelMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: NoviColors.textPrimary,
            );
          }
          return textTheme.labelMedium?.copyWith(
            color: NoviColors.navUnselected,
            fontWeight: FontWeight.w500,
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const IconThemeData(color: Color(0xFF1C1D1C), size: 24);
          }
          return const IconThemeData(color: NoviColors.navUnselected, size: 24);
        }),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: NoviColors.primaryDark,
          foregroundColor: const Color(0xFF1C1D1C),
          minimumSize: const Size(0, 44),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600),
          elevation: 0,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: NoviColors.primaryDark,
          foregroundColor: const Color(0xFF1C1D1C),
          minimumSize: const Size(0, 44),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          elevation: 0,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          backgroundColor: Colors.transparent,
          foregroundColor: NoviColors.textCardTitle,
          side: const BorderSide(color: NoviColors.borderMuted, width: 1),
          minimumSize: const Size(0, 44),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: NoviColors.primaryDark,
          textStyle: textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: NoviColors.charcoalElevated,
        selectedColor: NoviColors.primaryDark,
        labelStyle: textTheme.labelMedium?.copyWith(color: NoviColors.textSecondary),
        secondaryLabelStyle: textTheme.labelMedium?.copyWith(color: const Color(0xFF1C1D1C), fontWeight: FontWeight.w600),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(NoviShapes.radiusPill)),
          side: BorderSide(color: NoviColors.borderSubtle, width: 1),
        ),
        elevation: 0,
        pressElevation: 0,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: NoviColors.charcoalSurface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        hintStyle: textTheme.bodyMedium?.copyWith(color: NoviColors.textTertiary),
        labelStyle: textTheme.bodyMedium?.copyWith(color: NoviColors.textSecondary),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(NoviShapes.radiusMedium),
          borderSide: const BorderSide(color: NoviColors.borderSubtle, width: 1),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(NoviShapes.radiusMedium),
          borderSide: const BorderSide(color: NoviColors.borderSubtle, width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(NoviShapes.radiusMedium),
          borderSide: const BorderSide(color: NoviColors.primaryDark, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(NoviShapes.radiusMedium),
          borderSide: const BorderSide(color: NoviColors.errorDark, width: 1),
        ),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: NoviColors.charcoalSheet,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(NoviShapes.radiusSheet)),
        ),
        showDragHandle: true,
        dragHandleColor: NoviColors.borderSubtle,
        dragHandleSize: Size(36, 4),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: NoviColors.charcoalDialog,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(NoviShapes.radiusDialog),
          side: BorderSide.none,
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: NoviColors.borderSubtle,
        thickness: 1,
        space: 1,
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: NoviColors.primaryDark,
        foregroundColor: const Color(0xFF1C1D1C),
        elevation: 2,
        focusElevation: 2,
        hoverElevation: 3,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(NoviShapes.radiusLargeCard),
        ),
      ),
      segmentedButtonTheme: SegmentedButtonThemeData(
        style: SegmentedButton.styleFrom(
          backgroundColor: NoviColors.charcoalElevated,
          foregroundColor: NoviColors.textSecondary,
          selectedForegroundColor: const Color(0xFF1C1D1C),
          selectedBackgroundColor: NoviColors.primaryDark,
          side: const BorderSide(color: NoviColors.borderSubtle, width: 1),
          textStyle: textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w600),
          minimumSize: const Size(0, 40),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(NoviShapes.radiusMedium),
          ),
        ),
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) return const Color(0xFF1C1D1C);
          return NoviColors.textSecondary;
        }),
        trackColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) return NoviColors.primaryDark;
          return NoviColors.charcoalElevated;
        }),
      ),
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.android: NoviPageTransitionsBuilder(),
          TargetPlatform.iOS: NoviPageTransitionsBuilder(),
          TargetPlatform.windows: NoviPageTransitionsBuilder(),
          TargetPlatform.macOS: NoviPageTransitionsBuilder(),
          TargetPlatform.linux: NoviPageTransitionsBuilder(),
        },
      ),
    );
  }
}

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class RgColors {
  static const ink950 = Color(0xFF07080C);
  static const ink900 = Color(0xFF0B0C10);
  static const ink800 = Color(0xFF141924);
  static const ink700 = Color(0xFF1C2230);
  static const brand = Color(0xFF173A79);
  static const brandMid = Color(0xFF2E62B8);
  static const brandLight = Color(0xFF9CBDF2);
  static const red = Color(0xFFE11D2E);
  static const green = Color(0xFF30D158);
  static const yellow = Color(0xFFFFD60A);
  static const muted = Color(0xFF8B93A7);
  static const text = Color(0xFFF4F6FB);
}

ThemeData buildRgTheme() {
  final base = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: RgColors.ink950,
    colorScheme: const ColorScheme.dark(
      primary: RgColors.brandMid,
      secondary: RgColors.brand,
      error: RgColors.red,
      surface: RgColors.ink800,
      onSurface: RgColors.text,
    ),
  );

  final text = (kIsWeb ? base.textTheme : GoogleFonts.interTextTheme(base.textTheme)).apply(
    bodyColor: RgColors.text,
    displayColor: RgColors.text,
  );

  return base.copyWith(
    textTheme: text,
    splashFactory: InkRipple.splashFactory,
    appBarTheme: AppBarTheme(
      backgroundColor: RgColors.ink900.withValues(alpha: 0.92),
      foregroundColor: Colors.white,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: text.titleLarge?.copyWith(fontWeight: FontWeight.w800, letterSpacing: -0.4),
    ),
    cardTheme: CardThemeData(
      color: RgColors.ink800,
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: BorderSide(color: Colors.white.withValues(alpha: 0.07)),
      ),
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: RgColors.ink800,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(22),
        side: BorderSide(color: Colors.white.withValues(alpha: 0.08)),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: const Color(0xCC0A0C12),
      labelStyle: const TextStyle(color: RgColors.muted),
      hintStyle: TextStyle(color: RgColors.muted.withValues(alpha: 0.8)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(13),
        borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.12)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(13),
        borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.12)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(13),
        borderSide: const BorderSide(color: RgColors.brandMid, width: 1.4),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: RgColors.brandMid,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(vertical: 15, horizontal: 18),
        textStyle: const TextStyle(fontWeight: FontWeight.w700, letterSpacing: -0.2),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(13)),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
        side: BorderSide(color: Colors.white.withValues(alpha: 0.14)),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(13)),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: const Color(0xF20B0C10),
      elevation: 0,
      height: 72,
      indicatorColor: const Color(0x552E62B8),
      indicatorShape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        final selected = states.contains(WidgetState.selected);
        return TextStyle(
          fontSize: 12,
          fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
          color: selected ? Colors.white : RgColors.muted,
        );
      }),
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: RgColors.ink700,
      contentTextStyle: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ),
    dividerTheme: DividerThemeData(color: Colors.white.withValues(alpha: 0.08), space: 24),
    listTileTheme: const ListTileThemeData(
      iconColor: RgColors.muted,
      textColor: RgColors.text,
    ),
  );
}

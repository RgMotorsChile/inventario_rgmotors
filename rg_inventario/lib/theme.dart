import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class RgColors {
  static const ink950 = Color(0xFF050608);
  static const ink900 = Color(0xFF0B0C10);
  static const ink800 = Color(0xFF161922);
  static const ink700 = Color(0xFF1E2230);
  static const brand = Color(0xFF173A79);
  static const brandMid = Color(0xFF2E62B8);
  static const brandLight = Color(0xFF9CBDF2);
  static const red = Color(0xFFE11D2E);
  static const green = Color(0xFF30D158);
  static const yellow = Color(0xFFFFD60A);
  static const muted = Color(0xFF8B93A7);
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
    ),
  );

  return base.copyWith(
    textTheme: GoogleFonts.interTextTheme(base.textTheme).apply(
      bodyColor: const Color(0xFFF4F6FB),
      displayColor: const Color(0xFFF4F6FB),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: RgColors.ink900,
      foregroundColor: Colors.white,
      elevation: 0,
    ),
    cardTheme: CardThemeData(
      color: RgColors.ink800,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(color: Colors.white.withValues(alpha: 0.08)),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: const Color(0xFF0A0C12),
      labelStyle: const TextStyle(color: RgColors.muted),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(11),
        borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.14)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(11),
        borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.14)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(11),
        borderSide: const BorderSide(color: RgColors.brandMid),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: RgColors.brand,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(11)),
      ),
    ),
    navigationBarTheme: const NavigationBarThemeData(
      backgroundColor: RgColors.ink900,
      indicatorColor: Color(0x66173A79),
    ),
  );
}

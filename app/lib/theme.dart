import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Same tokens as the website: orange accent + fixed traffic colours.
class Palette {
  static const accent = Color(0xFFFF6B1A);
  static const free = Color(0xFF22C55E);
  static const moderate = Color(0xFFEAB308);
  static const heavy = Color(0xFFF97316);
  static const severe = Color(0xFFEF4444);
  static const closed = Color(0xFF0A0A0A);
  static const teal = Color(0xFF2BB3A3);
  static const olive = Color(0xFF9AA23A);
}

/// Light/dark toggle shared by every screen
final themeMode = ValueNotifier<ThemeMode>(ThemeMode.light);

ThemeData buildTheme(Brightness b) {
  final dark = b == Brightness.dark;
  final bg = dark ? const Color(0xFF121212) : const Color(0xFFF6F5F2);
  final surface = dark ? const Color(0xFF1E1E1E) : Colors.white;
  final line = dark ? const Color(0xFF2F2F2F) : const Color(0xFFE7E3DC);
  final scheme = ColorScheme.fromSeed(seedColor: Palette.accent, brightness: b).copyWith(
    primary: Palette.accent,
    onPrimary: Colors.white,
    surface: surface,
    surfaceContainerHighest: dark ? const Color(0xFF2A2A2A) : const Color(0xFFF1EFEA),
    outlineVariant: line,
  );
  final base = ThemeData(useMaterial3: true, colorScheme: scheme, scaffoldBackgroundColor: bg, brightness: b, fontFamily: GoogleFonts.plusJakartaSans().fontFamily);
  final pill = RoundedRectangleBorder(borderRadius: BorderRadius.circular(999));
  return base.copyWith(
    cardTheme: CardThemeData(
      color: surface,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: BorderSide(color: line)),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        shape: pill,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        textStyle: const TextStyle(fontWeight: FontWeight.w700),
      ).copyWith(overlayColor: WidgetStatePropertyAll(Colors.black.withValues(alpha: .12))),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        shape: pill,
        side: BorderSide(color: line),
        foregroundColor: scheme.onSurface,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        textStyle: const TextStyle(fontWeight: FontWeight.w600),
      ).copyWith(
        // Pressed/hover highlight in orange, like the website
        overlayColor: WidgetStatePropertyAll(Palette.accent.withValues(alpha: .12)),
        side: WidgetStateProperty.resolveWith((s) => BorderSide(
            color: s.contains(WidgetState.pressed) || s.contains(WidgetState.hovered) ? Palette.accent : line)),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: scheme.surfaceContainerHighest,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: line)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: line)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Palette.accent, width: 1.5)),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: surface,
      indicatorColor: Palette.accent.withValues(alpha: .15),
      iconTheme: WidgetStateProperty.resolveWith((s) => IconThemeData(color: s.contains(WidgetState.selected) ? Palette.accent : null)),
    ),
  );
}

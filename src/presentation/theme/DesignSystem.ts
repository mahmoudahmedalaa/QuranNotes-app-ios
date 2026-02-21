import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

/**
 * Premium Design System
 * Inspired by Calm/Headspace - serene, minimal, luxurious
 *
 * Principles:
 * - Soft, calming colors (avoid harsh saturation)
 * - Layered depth with shadows
 * - Generous whitespace
 * - Subtle gradients
 */

// ═══════════════════════════════════════════════════════════════════════════
// LAYOUT CONSTANTS — shared across screens so overlays/padding stay in sync
// ═══════════════════════════════════════════════════════════════════════════

/** Height of the StickyAudioPlayer bar inside the Surah screen.
 *  Voice overlays and scroll padding reference this so we never hardcode 90. */
export const STICKY_PLAYER_HEIGHT = 80;

/** Approximate height of the FloatingTabBar pill (paddingVertical×2 + icon + safe-area).
 *  Used by components rendered OUTSIDE the tab navigator context where
 *  useBottomTabBarHeight() would throw (e.g. GlobalMiniPlayer in _layout.tsx). */
export const TAB_BAR_HEIGHT = 80;

// ═══════════════════════════════════════════════════════════════════════════
// COLORS - Serene Palette
// ═══════════════════════════════════════════════════════════════════════════

const lightColors = {
    // Backgrounds (layered depth)
    background: '#F8F5FF', // ← bg-main: very light lavender (refined from #FAF5FF)
    surface: '#FFFFFF',    // Pure white kept for MD3 paper components
    surfaceVariant: '#EEE9FA', // ← bg-surface: soft lavender panels

    // Primary accent (used sparingly — 10% rule)
    primary: '#6246EA', // ← accent-primary: spiritual violet (was blue-tinted #5B7FFF)
    primaryContainer: '#EDE5FF',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#1A0F3C',

    // Secondary (warm accent)
    secondary: '#D4A853', // Elegant gold
    secondaryContainer: '#FDF6E3',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#78350F',

    // Text hierarchy
    onBackground: '#1C1033', // ← text-primary: deep violet-black (was blue-grey #1A1D21)
    onSurface: '#2A1F4A',    // Rich violet for body text
    onSurfaceVariant: '#5E5A98', // ← text-secondary: muted violet (was blue-grey #6B7C93)

    // Semantic
    error: '#E53E3E',
    success: '#38A169',
    warning: '#D69E2E',
    info: '#3B82F6',

    // Charts & Data
    chartReading: '#79D2DE',
    chartReciting: '#177AD5',
    chartReflection: '#ED6665',
    chartEmpty: '#E5E7EB',

    // Heatmap (Purple scale)
    heatmapLow: '#B3A6FF',
    heatmapMedium: '#6246EA',
    heatmapHigh: '#4B2FD4',

    // Widgets (Stats)
    widgetOrange: '#F97316',
    widgetBlue: '#3B82F6',
    widgetPurple: '#8B5CF6',
    widgetPink: '#EC4899',

    // Misc
    outline: '#E2E0F0',
    divider: '#EDE9FA',
    outlineVariant: '#D4CFEE',
};

const darkColors = {
    background: '#110A26', // ← bg-main dark: deep violet (was generic #0F1419)
    surface: '#1A1340',   // ← bg-surface dark: slightly lighter violet
    surfaceVariant: '#231C4E',

    primary: '#8B74F0', // ← accent-primary dark: light violet (was blue-tinted #7B9EFF)
    primaryContainer: '#2D1F6E',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#D4CCFF',

    secondary: '#E5B969',
    secondaryContainer: '#3D2E10',
    onSecondary: '#110A26',
    onSecondaryContainer: '#FDE68A',

    onBackground: '#F0EEFF', // ← text-primary dark: lavender-tinted white (was grey #F1F5F9)
    onSurface: '#DDD8F5',    // Soft lavender body text
    onSurfaceVariant: '#9E9AC8', // ← text-secondary dark: violet-muted (was blue-grey #94A3B8)

    error: '#FC8181',
    success: '#68D391',
    warning: '#F6E05E',

    // Charts & Data
    chartReading: '#5AC8D8',
    chartReciting: '#3A9BEC',
    chartReflection: '#F28B8A',
    chartEmpty: '#2D2456',

    // Heatmap (Dark Mode — violet scale)
    heatmapLow: '#6246EA',
    heatmapMedium: '#8B74F0',
    heatmapHigh: '#B3A6FF',

    // Widgets (Stats)
    widgetOrange: '#FB923C',
    widgetBlue: '#60A5FA',
    widgetPurple: '#A78BFA',
    widgetPink: '#F472B6',

    outline: '#35295A',
    divider: '#1E1640',
    outlineVariant: '#2A2350',
};

// ═══════════════════════════════════════════════════════════════════════════
// THEMES
// ═══════════════════════════════════════════════════════════════════════════

export const LightTheme = {
    ...MD3LightTheme,
    dark: false,
    colors: {
        ...MD3LightTheme.colors,
        ...lightColors,
    },
};

export const DarkTheme = {
    ...MD3DarkTheme,
    dark: true,
    colors: {
        ...MD3DarkTheme.colors,
        ...darkColors,
    },
};

export const PremiumTheme = LightTheme;
export const Colors = lightColors;

// ═══════════════════════════════════════════════════════════════════════════
// SEMANTIC DESIGN TOKENS — The 5 canonical brand tokens.
// See: src/presentation/theme/color-system.md for full documentation.
//
// 60-30-10 Rule:
//   60% — BrandTokens.bgMain      (screen backgrounds)
//   30% — BrandTokens.bgSurface   (cards, panels, text boxes)
//   10% — BrandTokens.accentPrimary (CTAs, play buttons, saves)
//
// WCAG AA verified — all text/bg pairings ≮ 4.5:1
// ═══════════════════════════════════════════════════════════════════════════
export const BrandTokens = {
    light: {
        bgMain: '#F8F5FF',  // 60% — very light lavender (lum: 0.930)
        bgSurface: '#EEE9FA',  // 30% — soft lavender panels (lum: 0.850)
        textPrimary: '#1C1033',  // deep violet-black (contrast vs bgMain: 15.4:1)
        textSecondary: '#5E5A98',  // muted violet (contrast vs bgMain: 5.18:1  bgSurface: 4.75:1)
        accentPrimary: '#6246EA',  // 10% — spiritual violet (white text: 5.29:1)
    },
    dark: {
        bgMain: '#110A26',  // deep violet night
        bgSurface: '#1A1340',  // slightly lighter violet
        textPrimary: '#F0EEFF',  // lavender-tinted white
        textSecondary: '#9E9AC8',  // muted violet
        accentPrimary: '#8B74F0',  // lighter violet for dark mode
    },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// SPACING - Generous whitespace
// ═══════════════════════════════════════════════════════════════════════════

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

// ═══════════════════════════════════════════════════════════════════════════
// TYPOGRAPHY - Clean, modern
// ═══════════════════════════════════════════════════════════════════════════

export const Typography = {
    displayLarge: {
        fontSize: 32,
        fontWeight: '700' as const,
        letterSpacing: -0.5,
        lineHeight: 40,
    },
    displayMedium: {
        fontSize: 24,
        fontWeight: '600' as const,
        letterSpacing: -0.3,
        lineHeight: 32,
    },
    titleLarge: {
        fontSize: 20,
        fontWeight: '600' as const,
        lineHeight: 28,
    },
    titleMedium: {
        fontSize: 16,
        fontWeight: '600' as const,
        lineHeight: 24,
    },
    bodyLarge: {
        fontSize: 16,
        lineHeight: 24,
    },
    bodyMedium: {
        fontSize: 14,
        lineHeight: 20,
    },
    labelMedium: {
        fontSize: 12,
        fontWeight: '500' as const,
        letterSpacing: 0.5,
    },
    caption: {
        fontSize: 11,
        fontWeight: '400' as const,
        letterSpacing: 0.3,
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// SHADOWS - Soft, multi-layered (premium feel)
// ═══════════════════════════════════════════════════════════════════════════

export const Shadows = {
    none: {},
    sm: {
        shadowColor: '#1A1D21',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 2,
    },
    md: {
        shadowColor: '#1A1D21',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    lg: {
        shadowColor: '#1A1D21',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 8,
    },
    // Colored shadows (for buttons)
    primary: {
        shadowColor: '#5B7FFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// BORDER RADIUS - Generous, modern
// ═══════════════════════════════════════════════════════════════════════════

export const BorderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 28,
    full: 9999,
};

// ═══════════════════════════════════════════════════════════════════════════
// GRADIENTS - Subtle, calming
// ═══════════════════════════════════════════════════════════════════════════

export const Gradients = {
    // Background gradients
    sereneSky: ['#F3E8FF', '#FAF5FF'] as const,
    calmSunset: ['#FDF6E3', '#F8FAFB'] as const,

    // Hero gradients
    primary: ['#5B7FFF', '#7B5FFF'] as const,
    gold: ['#D4A853', '#E5C76B'] as const,

    // Dark mode
    nightSky: ['#1A1F26', '#0F1419'] as const,
    cosmic: ['#1A1B2E', '#0F101F'] as const, // Deep cosmic purple
    lavender: ['#F3E8FF', '#FAF5FF'] as const, // Soft lavender
    ocean: ['#5B7FFF', '#4B6EDD', '#3A5DBB'] as const, // Ocean blue
};

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATION - Spring presets
// ═══════════════════════════════════════════════════════════════════════════

export const Springs = {
    gentle: { damping: 20, stiffness: 100 },
    bouncy: { damping: 12, stiffness: 150 },
    stiff: { damping: 20, stiffness: 300 },
};

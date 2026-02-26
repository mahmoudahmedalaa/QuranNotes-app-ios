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
    // Backgrounds
    background: '#F8F5FF', // 1 Light Neutral Background (lavender tint)
    surface: '#FFFFFF',    // Pure white for all cards/panels to prevent muddy layering
    surfaceVariant: '#F8F5FF', // Used sparingly if needed, fallback to background

    // Primary Brand
    primary: '#6246EA', // 1 Primary Purple (Brand anchor)
    primaryContainer: '#EDE5FF',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#1C1033',

    // Secondary (removed Gold/Orange as requested, using distinct shades)
    // Kept for type safety in MD3 but mapped to neutral or primary dark
    secondary: '#4B2FD4', // 1 Dark Purple (Emphasis only)
    secondaryContainer: '#F8F5FF',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#1C1033',

    // Neutral Text Hierarchy (3 Greys)
    onBackground: '#1C1033', // Grey 1: Primary text (Violet-black)
    onSurface: '#1C1033',
    onSurfaceVariant: '#64748B', // Grey 2: Secondary text (Slate 500, clean neutral)

    // Semantic (Kept strictly functional)
    error: '#E53E3E',
    success: '#10B981', // Premium emerald green
    warning: '#F59E0B',
    info: '#3B82F6',

    // Charts & Data (Simplified to brand colors)
    chartReading: '#6246EA',
    chartReciting: '#8B74F0',
    chartReflection: '#A78BFA',
    chartEmpty: '#E2E8F0', // Grey 3: Borders/Empty states

    // Heatmap (Strict Purple scale)
    heatmapLow: '#E9E5FF',
    heatmapMedium: '#A78BFA',
    heatmapHigh: '#6246EA',

    // Widgets (Stats) - Normalized
    widgetOrange: '#6246EA',
    widgetBlue: '#4B2FD4',
    widgetPurple: '#6246EA',
    widgetPink: '#A78BFA',

    // Borders & Dividers
    outline: '#E2E8F0', // Grey 3: Borders/Dividers (Slate 200)
    divider: '#F1F5F9', // Ultra light grey
    outlineVariant: '#CBD5E1',
};

const darkColors = {
    // Elegant, Neutral Dark Foundation
    background: '#09090B', // Zinc 950
    surface: '#18181B',    // Zinc 900 (High contrast separation)
    surfaceVariant: '#09090B',

    // Primary Brand
    primary: '#A78BFA', // Soft spiritual violet
    primaryContainer: '#1E1A2E', // Muted dark purple — blends with dark surface
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#EDE9FE',

    // Secondary (Dark emphasis)
    secondary: '#8B74F0',
    secondaryContainer: '#1A1340',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#E9E5FF',

    // Neutral Text Hierarchy
    onBackground: '#FAFAFA', // Grey 1
    onSurface: '#FAFAFA',
    onSurfaceVariant: '#A1A1AA', // Grey 2 (Zinc 400)

    // Semantic
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',

    // Charts & Data
    chartReading: '#A78BFA',
    chartReciting: '#8B74F0',
    chartReflection: '#6246EA',
    chartEmpty: '#27272A', // Grey 3

    // Heatmap
    heatmapLow: '#2D1F6E',
    heatmapMedium: '#6246EA',
    heatmapHigh: '#A78BFA',

    // Widgets
    widgetOrange: '#A78BFA',
    widgetBlue: '#8B74F0',
    widgetPurple: '#6246EA',
    widgetPink: '#C4B5FD',

    // Borders & Dividers
    outline: '#27272A', // Grey 3 (Zinc 800)
    divider: '#18181B',
    outlineVariant: '#3F3F46',
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
        bgMain: '#F8F5FF',  // Light Neutral Background
        bgSurface: '#FFFFFF',  // Pure white for sharp contrast, no grey muddiness
        textPrimary: '#1C1033',  // Grey 1: Violet-black
        textSecondary: '#64748B',  // Grey 2: Slate 500
        accentPrimary: '#6246EA',  // 1 Primary Purple
        border: '#E2E8F0', // Grey 3: Slate 200 for borders
    },
    dark: {
        bgMain: '#09090B',
        bgSurface: '#18181B',
        textPrimary: '#FAFAFA',
        textSecondary: '#A1A1AA',
        accentPrimary: '#A78BFA',
        border: '#27272A',
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
    // Strip out all harsh gradients.
    // Replace with a single controlled subtle gradient system.
    cardSubtleLight: ['#FFFFFF', '#FFFFFF'] as const, // Replaced with flat white (controlled opacity)
    cardSubtleDark: ['#18181B', '#18181B'] as const,

    // The only approved primary brand gradient (for premium emphasize buttons)
    primaryBrand: ['#6246EA', '#4B2FD4'] as const,

    // Semantic Mood Palettes (Soft, premium glow gradients)
    moodCalm: ['#D1FAE5', '#A7F3D0'] as const, // Mint
    moodDreamy: ['#E9D5FF', '#FBCFE8'] as const, // Purple/Pink
    moodEnergized: ['#FFEDD5', '#FED7AA'] as const, // Soft Orange
    moodMelancholy: ['#DBEAFE', '#E0E7FF'] as const, // Cool Slate Blue
    moodFocused: ['#FEF3C7', '#FDE68A'] as const, // Soft Amber

    // --- Legacy Aliases mapped to new premium values for backward compatibility ---
    primary: ['#6246EA', '#4B2FD4'] as const,
    sereneSky: ['#F8F5FF', '#EDE5FF'] as const, // Mapped to calm light background transition
    nightSky: ['#09090B', '#18181B'] as const,   // Mapped to dark theme background
    calmSunset: ['#FEF3C7', '#FDE68A'] as const, // Mapped to moodFocused (soft amber)
    cosmic: ['#A78BFA', '#6246EA'] as const,     // Mapped to premium purple
    lavender: ['#E9D5FF', '#FBCFE8'] as const,   // Mapped to moodDreamy
};

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATION - Spring presets
// ═══════════════════════════════════════════════════════════════════════════

export const Springs = {
    gentle: { damping: 20, stiffness: 100 },
    bouncy: { damping: 12, stiffness: 150 },
    stiff: { damping: 20, stiffness: 300 },
};

/**
 * QuranFonts — centralized Quran font configuration.
 *
 * Supports six font choices:
 * 0. System — iOS native Arabic font (no custom font needed)
 * 1. KFGQPC Uthmanic Script HAFS — traditional Medina Mushaf
 * 2. Scheherazade New — modern, elegant, lighter weight
 * 3. Amiri Quran — classic calligraphic Naskh
 * 4. Noto Naskh Arabic — Google's clean, screen-optimized Naskh
 * 5. Lateef — ultra-light, airy, great readability
 *
 * Hadith, Adhkar, and UI Arabic should continue using the system font.
 */

/** Font IDs used in settings */
export type QuranFontId = 'system' | 'kfgqpc' | 'scheherazade' | 'amiri' | 'noto' | 'lateef';

/** Font family names as registered with expo-font */
export const KFGQPC_FONT_NAME = 'KFGQPCUthmanicScriptHAFS';
export const SCHEHERAZADE_FONT_NAME = 'ScheherazadeNew-Regular';
export const AMIRI_FONT_NAME = 'AmiriQuran-Regular';
export const NOTO_FONT_NAME = 'NotoNaskhArabic-Regular';
export const LATEEF_FONT_NAME = 'Lateef-Regular';

/** Font option metadata for UI pickers */
export interface QuranFontOption {
    id: QuranFontId;
    name: string;
    description: string;
    fontFamily: string;
}

export const QURAN_FONT_OPTIONS: QuranFontOption[] = [
    {
        id: 'system',
        name: 'System Arabic',
        description: 'Simple & Clean',
        fontFamily: '',
    },
    {
        id: 'kfgqpc',
        name: 'Uthmanic Script',
        description: 'Traditional Medina Mushaf',
        fontFamily: KFGQPC_FONT_NAME,
    },
    {
        id: 'amiri',
        name: 'Amiri Quran',
        description: 'Classic Calligraphic Naskh',
        fontFamily: AMIRI_FONT_NAME,
    },
    {
        id: 'scheherazade',
        name: 'Scheherazade New',
        description: 'Modern & Elegant',
        fontFamily: SCHEHERAZADE_FONT_NAME,
    },
    {
        id: 'noto',
        name: 'Noto Naskh Arabic',
        description: 'Clean & Screen-Optimized',
        fontFamily: NOTO_FONT_NAME,
    },
    {
        id: 'lateef',
        name: 'Lateef',
        description: 'Ultra-Light & Airy',
        fontFamily: LATEEF_FONT_NAME,
    },
];

/** Get fontFamily string from a font ID */
export const getQuranFontFamily = (fontId: string): string | undefined => {
    if (fontId === 'system') return undefined;
    const option = QURAN_FONT_OPTIONS.find(f => f.id === fontId);
    return option?.fontFamily ?? KFGQPC_FONT_NAME;
};

/** Get font option metadata from ID */
export const getQuranFontOption = (fontId: string): QuranFontOption => {
    return QURAN_FONT_OPTIONS.find(f => f.id === fontId) ?? QURAN_FONT_OPTIONS[0];
};

/** Font asset map — passed to `useFonts` or `Font.loadAsync` */
export const QURAN_FONTS = {
    [KFGQPC_FONT_NAME]: require('../../../assets/fonts/KFGQPCUthmanicScriptHAFS.otf'),
    [SCHEHERAZADE_FONT_NAME]: require('../../../assets/fonts/ScheherazadeNew-Regular.ttf'),
    [AMIRI_FONT_NAME]: require('../../../assets/fonts/AmiriQuran-Regular.ttf'),
    [NOTO_FONT_NAME]: require('../../../assets/fonts/NotoNaskhArabic-Regular.ttf'),
    [LATEEF_FONT_NAME]: require('../../../assets/fonts/Lateef-Regular.ttf'),
};

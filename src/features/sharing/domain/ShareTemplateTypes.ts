/**
 * ShareTemplateTypes — Type definitions for the Premium Social Sharing system.
 *
 * These types drive the template registry, card renderer, and share sheet.
 */

/** Content types that can be shared as premium cards. */
export type ShareContentType = 'verse' | 'hadith' | 'khatma' | 'mood-verse';

/** A stat displayed on khatma/achievement cards. */
export interface ShareStat {
    label: string;
    value: string | number;
}

/** Data payload passed to the card renderer. */
export interface ShareCardData {
    type: ShareContentType;

    // Verse / Hadith text
    arabicText?: string;
    englishText?: string;

    // Attribution
    reference?: string;       // e.g. "Surah Al-Baqarah 2:255"
    hadithSource?: string;    // e.g. "Sahih Bukhari"
    narrator?: string;        // e.g. "Abu Hurairah"

    // Khatma stats
    stats?: ShareStat[];
    khatmaRound?: number;

    // Mood context
    mood?: string;

    // Typography — user's selected Quran font
    quranFontFamily?: string;
}

/** Metadata describing a single share template. */
export interface ShareTemplate {
    id: string;
    name: string;
    isPremium: boolean;
    /** Which content types this template supports. */
    contentTypes: ShareContentType[];
    /** Gradient colors used for the thumbnail preview chip. */
    previewColors: [string, string];
    /** MaterialCommunityIcons icon name for the thumbnail. */
    icon: string;
}

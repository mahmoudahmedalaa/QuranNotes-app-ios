/**
 * Mood types and interfaces for Quranic Reflection feature.
 */

export type MoodType =
    | 'grateful'
    | 'anxious'
    | 'sad'
    | 'hopeful'
    | 'strong'
    | 'frustrated'
    | 'lost'
    | 'heartbroken'
    | 'confused'
    | 'peaceful'
    | 'lonely'
    | 'inspired';

export interface MoodVerse {
    surah: number;
    verse: number;
    arabicSnippet: string;
    translation: string;
    theme: string;
    /** Full Arabic text fetched at runtime from Quran API */
    arabicFull?: string;
    /** Full English translation fetched at runtime from Quran API */
    translationFull?: string;
}

export interface MoodEntry {
    mood: MoodType;
    timestamp: string; // ISO date string
    versesShown: number[]; // indices into the mood's verse array (for dedup)
}

export interface MoodConfig {
    icon: string;
    label: string;
    gradient: readonly [string, string];
    darkGradient: readonly [string, string];
}

export const MOOD_CONFIGS: Record<MoodType, MoodConfig> = {
    grateful: { icon: 'heart-outline', label: 'Grateful', gradient: ['#FEF3C7', '#FDE68A'], darkGradient: ['#2A2518', '#3B3422'] },
    anxious: { icon: 'pulse-outline', label: 'Anxious', gradient: ['#DBEAFE', '#E0E7FF'], darkGradient: ['#1A2535', '#24334A'] },
    sad: { icon: 'water-outline', label: 'Sad', gradient: ['#E0E7FF', '#C7D2FE'], darkGradient: ['#1E1D35', '#2A294A'] },
    hopeful: { icon: 'leaf-outline', label: 'Hopeful', gradient: ['#D1FAE5', '#A7F3D0'], darkGradient: ['#162520', '#1F332C'] },
    strong: { icon: 'barbell-outline', label: 'Strong', gradient: ['#FEE2E2', '#FECACA'], darkGradient: ['#3B1A1A', '#522424'] },
    frustrated: { icon: 'flash-outline', label: 'Frustrated', gradient: ['#FCE7F3', '#FBCFE8'], darkGradient: ['#3B1825', '#522234'] },
    lost: { icon: 'help-circle-outline', label: 'Lost', gradient: ['#F3E8FF', '#E9D5FF'], darkGradient: ['#221A30', '#302444'] },
    heartbroken: { icon: 'heart-half-outline', label: 'Heartbroken', gradient: ['#FFE4E6', '#FECDD3'], darkGradient: ['#2A1820', '#3B222D'] },
    confused: { icon: 'help-outline', label: 'Confused', gradient: ['#CFFAFE', '#A5F3FC'], darkGradient: ['#162228', '#1F3038'] },
    peaceful: { icon: 'moon-outline', label: 'Peaceful', gradient: ['#ECFDF5', '#D1FAE5'], darkGradient: ['#16221E', '#1F302A'] },
    lonely: { icon: 'person-outline', label: 'Lonely', gradient: ['#EDE9FE', '#DDD6FE'], darkGradient: ['#1E1A2D', '#2A243F'] },
    inspired: { icon: 'bulb-outline', label: 'Inspired', gradient: ['#FFF7ED', '#FFEDD5'], darkGradient: ['#261E18', '#382B22'] },
};

export const MOOD_LIST: MoodType[] = [
    // ── Positive / uplifting ──
    'grateful', 'hopeful', 'peaceful', 'inspired', 'strong',
    // ── Neutral / challenged ──
    'anxious', 'confused', 'lost',
    // ── Heavier emotions ──
    'sad', 'frustrated', 'heartbroken', 'lonely',
];

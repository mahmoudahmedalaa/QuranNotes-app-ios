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
    emoji: string;
    label: string;
    color: string;       // light mode background tint
    darkColor: string;   // dark mode background tint
}

export const MOOD_CONFIGS: Record<MoodType, MoodConfig> = {
    grateful: { emoji: '🤲', label: 'Grateful', color: '#FEF3C7', darkColor: '#2A2518' },
    anxious: { emoji: '😰', label: 'Anxious', color: '#DBEAFE', darkColor: '#1A2535' },
    sad: { emoji: '😢', label: 'Sad', color: '#E0E7FF', darkColor: '#1E1D35' },
    hopeful: { emoji: '🌱', label: 'Hopeful', color: '#D1FAE5', darkColor: '#162520' },
    strong: { emoji: '💪', label: 'Strong', color: '#FCE7F3', darkColor: '#2A1825' },
    frustrated: { emoji: '😤', label: 'Frustrated', color: '#FEE2E2', darkColor: '#2A1A1A' },
    lost: { emoji: '🤔', label: 'Lost', color: '#F3E8FF', darkColor: '#221A30' },
    heartbroken: { emoji: '💔', label: 'Heartbroken', color: '#FFE4E6', darkColor: '#2A1820' },
    confused: { emoji: '🤷', label: 'Confused', color: '#CFFAFE', darkColor: '#162228' },
    peaceful: { emoji: '😌', label: 'Peaceful', color: '#ECFDF5', darkColor: '#16221E' },
    lonely: { emoji: '😔', label: 'Lonely', color: '#EDE9FE', darkColor: '#1E1A2D' },
    inspired: { emoji: '🌟', label: 'Inspired', color: '#FFF7ED', darkColor: '#261E18' },
};

export const MOOD_LIST: MoodType[] = [
    // ── Positive / uplifting ──
    'grateful', 'hopeful', 'peaceful', 'inspired', 'strong',
    // ── Neutral / challenged ──
    'anxious', 'confused', 'lost',
    // ── Heavier emotions ──
    'sad', 'frustrated', 'heartbroken', 'lonely',
];

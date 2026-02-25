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
    palette: readonly [string, string, string, string];
}

export const MOOD_CONFIGS: Record<MoodType, MoodConfig> = {
    grateful: { icon: 'heart-outline', label: 'Grateful', gradient: ['#FEF3C7', '#FDE68A'], darkGradient: ['#2A2518', '#3B3422'], palette: ['#FFD700', '#FFA500', '#FFFACD', '#FFE4B5'] },
    anxious: { icon: 'pulse-outline', label: 'Anxious', gradient: ['#DBEAFE', '#E0E7FF'], darkGradient: ['#1A2535', '#24334A'], palette: ['#4682B4', '#87CEEB', '#B0E0E6', '#F0F8FF'] },
    sad: { icon: 'water-outline', label: 'Sad', gradient: ['#E0E7FF', '#C7D2FE'], darkGradient: ['#1E1D35', '#2A294A'], palette: ['#4169E1', '#6495ED', '#B0C4DE', '#C0C0C0'] },
    hopeful: { icon: 'leaf-outline', label: 'Hopeful', gradient: ['#D1FAE5', '#A7F3D0'], darkGradient: ['#162520', '#1F332C'], palette: ['#90EE90', '#3CB371', '#F0FFF0', '#98FB98'] },
    strong: { icon: 'barbell-outline', label: 'Strong', gradient: ['#FEE2E2', '#FECACA'], darkGradient: ['#3B1A1A', '#522424'], palette: ['#DC143C', '#FF6B6B', '#FFB6C1', '#CD5C5C'] },
    frustrated: { icon: 'flash-outline', label: 'Frustrated', gradient: ['#FCE7F3', '#FBCFE8'], darkGradient: ['#3B1825', '#522234'], palette: ['#FF1493', '#C71585', '#FF69B4', '#8B0000'] },
    lost: { icon: 'help-circle-outline', label: 'Lost', gradient: ['#F3E8FF', '#E9D5FF'], darkGradient: ['#221A30', '#302444'], palette: ['#6A5ACD', '#483D8B', '#9370DB', '#D8BFD8'] },
    heartbroken: { icon: 'heart-half-outline', label: 'Heartbroken', gradient: ['#FFE4E6', '#FECDD3'], darkGradient: ['#2A1820', '#3B222D'], palette: ['#CD5C5C', '#BC8F8F', '#FFB6C1', '#F5F5DC'] },
    confused: { icon: 'help-outline', label: 'Confused', gradient: ['#CFFAFE', '#A5F3FC'], darkGradient: ['#162228', '#1F3038'], palette: ['#20B2AA', '#48D1CC', '#AFEEEE', '#F0E68C'] },
    peaceful: { icon: 'moon-outline', label: 'Peaceful', gradient: ['#ECFDF5', '#D1FAE5'], darkGradient: ['#16221E', '#1F302A'], palette: ['#B0C4DE', '#E6E6FA', '#F8F8FF', '#DDA0DD'] },
    lonely: { icon: 'person-outline', label: 'Lonely', gradient: ['#EDE9FE', '#DDD6FE'], darkGradient: ['#1E1A2D', '#2A243F'], palette: ['#4B0082', '#191970', '#6A5ACD', '#E6E6FA'] },
    inspired: { icon: 'bulb-outline', label: 'Inspired', gradient: ['#FFF7ED', '#FFEDD5'], darkGradient: ['#261E18', '#382B22'], palette: ['#FF8C00', '#FFD700', '#FFF8DC', '#FF6347'] },
};

export const MOOD_LIST: MoodType[] = [
    // ── Positive / uplifting ──
    'grateful', 'hopeful', 'peaceful', 'inspired', 'strong',
    // ── Neutral / challenged ──
    'anxious', 'confused', 'lost',
    // ── Heavier emotions ──
    'sad', 'frustrated', 'heartbroken', 'lonely',
];

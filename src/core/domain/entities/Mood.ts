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
    imageSource: any;
}

export const MOOD_CONFIGS: Record<MoodType, MoodConfig> = {
    grateful: { icon: 'heart-outline', label: 'Grateful', imageSource: require('../../../../assets/moods/grateful.png') },
    anxious: { icon: 'pulse-outline', label: 'Anxious', imageSource: require('../../../../assets/moods/anxious.png') },
    sad: { icon: 'water-outline', label: 'Sad', imageSource: require('../../../../assets/moods/sad.png') },
    hopeful: { icon: 'leaf-outline', label: 'Hopeful', imageSource: require('../../../../assets/moods/hopeful.png') },
    strong: { icon: 'barbell-outline', label: 'Strong', imageSource: require('../../../../assets/moods/strong.png') },
    frustrated: { icon: 'flash-outline', label: 'Frustrated', imageSource: require('../../../../assets/moods/frustrated.png') },
    lost: { icon: 'help-circle-outline', label: 'Lost', imageSource: require('../../../../assets/moods/lost.png') },
    heartbroken: { icon: 'heart-half-outline', label: 'Heartbroken', imageSource: require('../../../../assets/moods/heartbroken.png') },
    confused: { icon: 'help-outline', label: 'Confused', imageSource: require('../../../../assets/moods/confused.png') },
    peaceful: { icon: 'moon-outline', label: 'Peaceful', imageSource: require('../../../../assets/moods/peaceful.png') },
    lonely: { icon: 'person-outline', label: 'Lonely', imageSource: require('../../../../assets/moods/lonely.png') },
    inspired: { icon: 'bulb-outline', label: 'Inspired', imageSource: require('../../../../assets/moods/inspired.png') },
};

export const MOOD_LIST: MoodType[] = [
    // ── Positive / uplifting ──
    'grateful', 'hopeful', 'peaceful', 'inspired', 'strong',
    // ── Neutral / challenged ──
    'anxious', 'confused', 'lost',
    // ── Heavier emotions ──
    'sad', 'frustrated', 'heartbroken', 'lonely',
];

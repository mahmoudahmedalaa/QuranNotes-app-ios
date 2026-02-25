/**
 * Mood types and interfaces for Quranic Reflection feature.
 */

export type MoodType =
    | 'anxious'
    | 'sad'
    | 'hopeful'
    | 'strong'
    | 'frustrated'
    | 'lost'
    | 'heartbroken'
    | 'confused'
    | 'calm'
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
    color: string;
}

export const MOOD_CONFIGS: Record<MoodType, MoodConfig> = {
    hopeful: { icon: 'leaf-outline', label: 'Hopeful', imageSource: require('../../../../assets/moods/hopeful.png'), color: '#34d399' },
    calm: { icon: 'moon-outline', label: 'Calm', imageSource: require('../../../../assets/moods/calm.png'), color: '#a78bfa' },
    inspired: { icon: 'bulb-outline', label: 'Inspired', imageSource: require('../../../../assets/moods/inspired.png'), color: '#fcd34d' },
    strong: { icon: 'barbell-outline', label: 'Strong', imageSource: require('../../../../assets/moods/strong.png'), color: '#fb923c' },
    anxious: { icon: 'pulse-outline', label: 'Anxious', imageSource: require('../../../../assets/moods/anxious.png'), color: '#f472b6' },
    confused: { icon: 'help-outline', label: 'Confused', imageSource: require('../../../../assets/moods/confused.png'), color: '#c084fc' },
    lost: { icon: 'help-circle-outline', label: 'Lost', imageSource: require('../../../../assets/moods/lost.png'), color: '#94a3b8' },
    sad: { icon: 'water-outline', label: 'Sad', imageSource: require('../../../../assets/moods/sad.png'), color: '#60a5fa' },
    frustrated: { icon: 'flash-outline', label: 'Frustrated', imageSource: require('../../../../assets/moods/frustrated.png'), color: '#f87171' },
    heartbroken: { icon: 'heart-half-outline', label: 'Heartbroken', imageSource: require('../../../../assets/moods/heartbroken.png'), color: '#fb7185' },
    lonely: { icon: 'person-outline', label: 'Lonely', imageSource: require('../../../../assets/moods/lonely.png'), color: '#818cf8' },
};

export const MOOD_LIST: MoodType[] = [
    // ── Positive / uplifting (shown first) ──
    'hopeful', 'calm', 'inspired', 'strong',
    // ── Neutral / challenged ──
    'anxious', 'confused', 'lost',
    // ── Heavier emotions ──
    'sad', 'frustrated', 'heartbroken', 'lonely',
];

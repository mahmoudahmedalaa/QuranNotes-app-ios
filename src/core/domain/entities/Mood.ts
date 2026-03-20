/**
 * Mood types and interfaces for Quranic Reflection feature.
 */

import type { IntentCategory } from '../../../features/tadabbur/domain/entities/Reflection';

/** Mapping from MoodType → Tadabbur IntentCategory + session label */
export interface MoodIntentMapping {
    category: IntentCategory;
    label: string;
}

export const MOOD_TO_INTENT: Record<MoodType, MoodIntentMapping> = {
    anxious:     { category: 'patience',    label: 'Finding peace through patience' },
    sad:         { category: 'comfort',     label: "Finding comfort in Allah's words" },
    hopeful:     { category: 'hope',        label: 'Nurturing your hope' },
    strong:      { category: 'gratitude',   label: 'Expressing gratitude for strength' },
    frustrated:  { category: 'patience',    label: 'Seeking patience during difficulty' },
    lost:        { category: 'guidance',    label: 'Seeking divine guidance' },
    heartbroken: { category: 'comfort',     label: 'Healing through divine comfort' },
    confused:    { category: 'guidance',    label: 'Finding clarity and direction' },
    calm:        { category: 'remembrance', label: 'Deepening your remembrance' },
    lonely:      { category: 'loneliness',  label: 'You are never alone with Allah' },
    inspired:    { category: 'gratitude',   label: 'Channeling your inspiration' },
};

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
    subtitles?: string[];
}

export const MOOD_CONFIGS: Record<MoodType, MoodConfig> = {
    hopeful: { icon: 'leaf-outline', label: 'Hopeful', imageSource: require('../../../../assets/moods/hopeful.png'), color: '#34d399', subtitles: ['Let hope bloom with these words', 'Your optimism has roots in the Quran', 'Seeds of hope, planted just for you'] },
    calm: { icon: 'moon-outline', label: 'Calm', imageSource: require('../../../../assets/moods/calm.png'), color: '#a78bfa', subtitles: ['Breathe deep. These verses are your stillness', 'Embrace the peace within', 'Let tranquility wash over you'] },
    inspired: { icon: 'bulb-outline', label: 'Inspired', imageSource: require('../../../../assets/moods/inspired.png'), color: '#fcd34d', subtitles: ['Fuel your fire with divine wisdom', 'Let inspiration light the way', 'Words to elevate your spirit'] },
    strong: { icon: 'barbell-outline', label: 'Strong', imageSource: require('../../../../assets/moods/strong.png'), color: '#fb923c', subtitles: ['Stand tall. Strength is from Allah', 'Your resilience echoes through these verses', 'Power flows through patience'] },
    anxious: { icon: 'pulse-outline', label: 'Anxious', imageSource: require('../../../../assets/moods/anxious.png'), color: '#f472b6', subtitles: ['Let these words ease your heart', 'Allah is closer than you think', 'Lay your worries down here'] },
    confused: { icon: 'help-outline', label: 'Confused', imageSource: require('../../../../assets/moods/confused.png'), color: '#c084fc', subtitles: ['Clarity is a verse away', 'When the path feels unclear, look here', 'Guidance for the searching soul'] },
    lost: { icon: 'help-circle-outline', label: 'Lost', imageSource: require('../../../../assets/moods/lost.png'), color: '#94a3b8', subtitles: ['You are never truly lost with Allah', 'Every wanderer finds their way home', 'A compass for the soul'] },
    sad: { icon: 'water-outline', label: 'Sad', imageSource: require('../../../../assets/moods/sad.png'), color: '#60a5fa', subtitles: ['Even rain nourishes the earth', 'Comfort for the heavy heart', 'Allah sees every silent tear'] },
    frustrated: { icon: 'flash-outline', label: 'Frustrated', imageSource: require('../../../../assets/moods/frustrated.png'), color: '#f87171', subtitles: ['Patience is a quiet superpower', 'Release tension with these words', 'Ease follows hardship — always'] },
    heartbroken: { icon: 'heart-half-outline', label: 'Heartbroken', imageSource: require('../../../../assets/moods/heartbroken.png'), color: '#fb7185', subtitles: ['Hearts heal in His care', 'Mending starts with remembrance', 'Broken hearts find refuge here'] },
    lonely: { icon: 'person-outline', label: 'Lonely', imageSource: require('../../../../assets/moods/lonely.png'), color: '#818cf8', subtitles: ['You are never alone with Allah', 'His presence fills every silence', 'Company for the solitary heart'] },
};

export const MOOD_LIST: MoodType[] = [
    // ── Positive / uplifting (shown first) ──
    'hopeful', 'calm', 'inspired', 'strong',
    // ── Neutral / challenged ──
    'anxious', 'confused', 'lost',
    // ── Heavier emotions ──
    'sad', 'frustrated', 'heartbroken', 'lonely',
];

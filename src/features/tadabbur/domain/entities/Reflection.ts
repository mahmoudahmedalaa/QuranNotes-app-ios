/**
 * Tadabbur Mode — Domain Entities
 * All core data structures for the guided Quran reflection feature.
 *
 * v2 — Intent-based architecture (replaces track-based system)
 */

// ─── Intent System (NEW — replaces Tracks) ─────────────────────────────────

export type IntentCategory =
    | 'gratitude'     // شكر
    | 'patience'      // صبر
    | 'hope'          // رجاء
    | 'repentance'    // توبة
    | 'trust'         // توكل
    | 'guidance'      // هداية
    | 'remembrance'   // ذكر
    | 'fear'          // خوف
    | 'comfort'       // سلوان
    | 'knowledge'     // علم
    | 'loneliness'    // وحدة
    | 'general'       // عام
    | 'custom';       // User-typed intent

export interface ReflectionIntent {
    id: string;
    label: string;              // "Seeking patience during hardship"
    labelArabic?: string;       // صبر على البلاء
    description?: string;       // Short description of this intent
    icon: string;               // MaterialCommunityIcons name
    category: IntentCategory;
    isAiSuggested: boolean;     // true if AI generated this intent
    isCustom: boolean;          // true if user typed freely
}

export interface VerseSelection {
    surahNumber: number;
    startVerse: number;
    endVerse: number;
    reason: string;             // AI explanation of why this verse fits
}

/** Pre-defined intents that are always available (free + pro) */
export const DEFAULT_INTENTS: Omit<ReflectionIntent, 'id'>[] = [
    {
        label: 'Seeking patience',
        labelArabic: 'الصبر',
        icon: 'shield-heart-outline',
        category: 'patience',
        isAiSuggested: false,
        isCustom: false,
    },
    {
        label: 'Feeling grateful',
        labelArabic: 'الشكر',
        icon: 'hand-heart-outline',
        category: 'gratitude',
        isAiSuggested: false,
        isCustom: false,
    },
    {
        label: 'Needing hope',
        labelArabic: 'الرجاء',
        icon: 'white-balance-sunny',
        category: 'hope',
        isAiSuggested: false,
        isCustom: false,
    },
    {
        label: 'Seeking forgiveness',
        labelArabic: 'التوبة',
        icon: 'heart-outline',
        category: 'repentance',
        isAiSuggested: false,
        isCustom: false,
    },
    {
        label: 'Feeling overwhelmed',
        labelArabic: 'التوكل',
        icon: 'hand-extended-outline',
        category: 'trust',
        isAiSuggested: false,
        isCustom: false,
    },
    {
        label: 'Seeking guidance',
        labelArabic: 'الهداية',
        icon: 'compass-outline',
        category: 'guidance',
        isAiSuggested: false,
        isCustom: false,
    },
];

// ─── Session ────────────────────────────────────────────────────────────────

export interface TadabburSession {
    id: string;
    userId: string;
    /** @deprecated Use `intent` instead. Kept for backward compat. */
    trackId?: string;
    date: string;                    // ISO date (YYYY-MM-DD)
    durationSeconds: number;
    versesReflectedOn: number;
    completedFully: boolean;
    createdAt: string;               // ISO datetime
    intent: ReflectionIntent;        // The user's chosen intent
    verseSelections: VerseSelection[];  // AI-selected verses
    mood?: string;                   // Post-session mood (peaceful/grateful/reflective)
    moodType?: string;               // Pre-session mood from dashboard mood carousel
}

// ─── Reflection ─────────────────────────────────────────────────────────────

export type ReflectionType = 'voice' | 'text';

export interface Reflection {
    id: string;
    sessionId: string;
    userId: string;
    surahNumber: number;
    verseNumber: number;
    type: ReflectionType;
    content?: string;                // Text content (if type = 'text')
    audioUri?: string;               // Local file path (if type = 'voice')
    audioDuration?: number;          // Seconds (if type = 'voice')
    promptUsed: string;
    createdAt: string;               // ISO datetime
    updatedAt: string;               // ISO datetime
    syncStatus: 'local' | 'synced' | 'error';
}

// ─── Passages (kept for session runtime) ────────────────────────────────────

export type PromptCategory = 'personal' | 'gratitude' | 'action' | 'contemplation';

export interface ReflectionPrompt {
    id: string;
    text: string;
    textArabic?: string;
    category: PromptCategory;
    aiGenerated: boolean;
}

export interface TadabburPassage {
    surahNumber: number;
    startVerse: number;
    endVerse: number;
    prompts: ReflectionPrompt[];
    /** AI explanation of why this verse was selected */
    selectionReason?: string;
    /** Populated at runtime from the Quran API */
    arabicText?: string;
    translationText?: string;
    surahName?: string;
    surahNameArabic?: string;
}

// ─── Legacy Track Types (deprecated — kept for migration) ───────────────────

/** @deprecated Use ReflectionIntent + AI selection instead */
export type TrackDifficulty = 'beginner' | 'intermediate' | 'advanced';

/** @deprecated Use ReflectionIntent + AI selection instead */
export interface TadabburTrack {
    id: string;
    name: string;
    nameArabic: string;
    description: string;
    passages: TadabburPassage[];
    difficulty: TrackDifficulty;
    estimatedMinutes: number;
    isPro: boolean;
    icon: string;
    color: string;
}

// ─── Stats ──────────────────────────────────────────────────────────────────

export interface ReflectionStats {
    userId: string;
    totalSessions: number;
    totalReflections: number;
    totalMinutes: number;
    currentStreak: number;
    longestStreak: number;
    surahsCovered: number[];
    lastSessionDate: string;         // ISO date
}

// ─── Session Engine States ──────────────────────────────────────────────────

export type SessionPhase =
    | 'IDLE'
    | 'LOADING'         // NEW — AI selecting verses
    | 'OPENING'
    | 'PLAYING'
    | 'PAUSING'
    | 'RESPONDING'
    | 'ADVANCE'
    | 'CLOSING';

export interface SessionState {
    phase: SessionPhase;
    /** @deprecated Use intent instead */
    trackId?: string;
    intent?: ReflectionIntent;
    verseSelections: VerseSelection[];
    currentVerseIndex: number;
    totalVerses: number;
    startTime: number;               // Date.now()
    closingTime: number;             // Frozen at CLOSING transition
    reflections: Reflection[];       // Collected during session
    moodType?: string;               // Pre-session mood from dashboard mood carousel
}

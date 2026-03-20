/**
 * MoodContext — State management for Quranic Reflection feature.
 * Handles mood check-ins, free-use gating, verse selection, and history.
 * Storage keys are scoped per-user to prevent cross-account data bleed.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MoodType, MoodVerse, MoodEntry } from '../../../core/domain/entities/Mood';
import { usePro } from '../../auth/infrastructure/ProContext';
import { useAuth } from '../../auth/infrastructure/AuthContext';
import { useStreaks } from '../../auth/infrastructure/StreakContext';
import { CloudSyncEvents } from '../../../core/application/services/CloudSyncEvents';
import moodVerses from '../data/moodVerses.json';

/** Build user-scoped storage keys */
function storageKeys(uid: string) {
    return {
        HISTORY: `mood_history_${uid}`,
        FREE_USES: `mood_free_uses_${uid}`,
        TODAY_MOOD: `mood_today_${uid}`,
    };
}

const MAX_FREE_USES = 5;
const VERSES_PER_SESSION = 4;

interface MoodContextType {
    /** Check in with a mood — returns shuffled verses or null if gated */
    checkIn: (mood: MoodType) => Promise<MoodVerse[] | null>;
    /** Record a mood entry from an external source (e.g. Tadabbur) without gating */
    recordMoodEntry: (mood: MoodType) => Promise<void>;
    /** Whether the user can check in (Pro or has free uses) */
    canCheckIn: boolean;
    /** Free uses remaining (0 = gated for free users) */
    freeUsesRemaining: number;
    /** Today's mood (if already checked in today) */
    todayMood: MoodType | null;
    /** Today's recommended verses */
    todayVerses: MoodVerse[];
    /** Full mood history */
    moodHistory: MoodEntry[];
    /** Reset today's mood (allow new check-in) */
    resetToday: () => void;
    /** Loading state */
    loading: boolean;
}

const MoodContext = createContext<MoodContextType>({
    checkIn: async () => null,
    recordMoodEntry: async () => {},
    canCheckIn: true,
    freeUsesRemaining: MAX_FREE_USES,
    todayMood: null,
    todayVerses: [],
    moodHistory: [],
    resetToday: () => { },
    loading: true,
});

export const useMood = () => useContext(MoodContext);

/** Fisher-Yates shuffle */
function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function todayKey(): string {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

export const MoodProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isPro } = usePro();
    const { user } = useAuth();
    const { recordActivity } = useStreaks();
    const [freeUsesRemaining, setFreeUsesRemaining] = useState(MAX_FREE_USES);
    const [todayMood, setTodayMood] = useState<MoodType | null>(null);
    const [todayVerses, setTodayVerses] = useState<MoodVerse[]>([]);
    const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const prevUidRef = useRef<string | null>(null);

    const uid = user?.id || 'anonymous';

    // Load persisted state when user changes
    useEffect(() => {
        // If user changed, reset in-memory state first
        if (prevUidRef.current !== null && prevUidRef.current !== uid) {
            setTodayMood(null);
            setTodayVerses([]);
            setMoodHistory([]);
            setFreeUsesRemaining(MAX_FREE_USES);
        }
        prevUidRef.current = uid;

        setLoading(true);
        const keys = storageKeys(uid);

        (async () => {
            try {
                const [historyJson, freeUsesJson, todayJson] = await Promise.all([
                    AsyncStorage.getItem(keys.HISTORY),
                    AsyncStorage.getItem(keys.FREE_USES),
                    AsyncStorage.getItem(keys.TODAY_MOOD),
                ]);

                if (historyJson) setMoodHistory(JSON.parse(historyJson));
                else setMoodHistory([]);

                if (freeUsesJson !== null) {
                    setFreeUsesRemaining(parseInt(freeUsesJson, 10));
                } else {
                    setFreeUsesRemaining(MAX_FREE_USES);
                }

                if (todayJson) {
                    const parsed = JSON.parse(todayJson);
                    if (parsed.date === todayKey()) {
                        setTodayMood(parsed.mood);
                        setTodayVerses(parsed.verses || []);
                    } else {
                        // New day — clear today's mood
                        setTodayMood(null);
                        setTodayVerses([]);
                        await AsyncStorage.removeItem(keys.TODAY_MOOD);
                    }
                } else {
                    setTodayMood(null);
                    setTodayVerses([]);
                }
            } catch (e) {
                if (__DEV__) console.error('[MoodContext] Error loading state:', e);
            } finally {
                setLoading(false);
            }
        })();
    }, [uid]);

    // Re-read when cloud sync pulls remote data
    useEffect(() => {
        return CloudSyncEvents.onPull(() => {
            const keys = storageKeys(uid);
            (async () => {
                try {
                    const [historyJson, freeUsesJson, todayJson] = await Promise.all([
                        AsyncStorage.getItem(keys.HISTORY),
                        AsyncStorage.getItem(keys.FREE_USES),
                        AsyncStorage.getItem(keys.TODAY_MOOD),
                    ]);
                    if (historyJson) setMoodHistory(JSON.parse(historyJson));
                    if (freeUsesJson !== null) setFreeUsesRemaining(parseInt(freeUsesJson, 10));
                    if (todayJson) {
                        const parsed = JSON.parse(todayJson);
                        if (parsed.date === todayKey()) {
                            setTodayMood(parsed.mood);
                            setTodayVerses(parsed.verses || []);
                        }
                    }
                } catch (e) {
                    if (__DEV__) console.warn('[MoodContext] Cloud sync reload error:', e);
                }
            })();
        });
    }, [uid]);

    const canCheckIn = useMemo(() => {
        return isPro || freeUsesRemaining > 0;
    }, [isPro, freeUsesRemaining]);

    const checkIn = useCallback(async (mood: MoodType): Promise<MoodVerse[] | null> => {
        if (!canCheckIn) return null;

        try {
            const keys = storageKeys(uid);

            // Get verses for this mood
            const allVerses = (moodVerses as Record<string, MoodVerse[]>)[mood] || [];
            const selected = shuffle(allVerses).slice(0, VERSES_PER_SESSION);

            // Record the check-in
            const entry: MoodEntry = {
                mood,
                timestamp: new Date().toISOString(),
                versesShown: [],
            };
            const updatedHistory = [entry, ...moodHistory].slice(0, 100); // Keep last 100

            // Decrement free uses for non-Pro
            let newFreeUses = freeUsesRemaining;
            if (!isPro) {
                newFreeUses = Math.max(0, freeUsesRemaining - 1);
                setFreeUsesRemaining(newFreeUses);
            }

            setTodayMood(mood);
            setTodayVerses(selected);
            setMoodHistory(updatedHistory);

            // Persist everything
            await Promise.all([
                AsyncStorage.setItem(keys.HISTORY, JSON.stringify(updatedHistory)),
                AsyncStorage.setItem(keys.FREE_USES, String(newFreeUses)),
                AsyncStorage.setItem(keys.TODAY_MOOD, JSON.stringify({
                    date: todayKey(),
                    mood,
                    verses: selected,
                })),
            ]);

            // Record streak activity
            await recordActivity();

            return selected;
        } catch (e) {
            if (__DEV__) console.error('[MoodContext] Error during check-in:', e);
            return null;
        }
    }, [canCheckIn, isPro, freeUsesRemaining, moodHistory, uid, recordActivity]);

    /** Record a mood entry from an external source (no gating, no verse selection) */
    const recordMoodEntry = useCallback(async (mood: MoodType): Promise<void> => {
        try {
            const keys = storageKeys(uid);
            const entry: MoodEntry = {
                mood,
                timestamp: new Date().toISOString(),
                versesShown: [],
            };
            const updatedHistory = [entry, ...moodHistory].slice(0, 100);
            setMoodHistory(updatedHistory);
            await AsyncStorage.setItem(keys.HISTORY, JSON.stringify(updatedHistory));
        } catch (e) {
            if (__DEV__) console.error('[MoodContext] Error recording mood entry:', e);
        }
    }, [moodHistory, uid]);

    const resetToday = useCallback(() => {
        setTodayMood(null);
        setTodayVerses([]);
        AsyncStorage.removeItem(storageKeys(uid).TODAY_MOOD).catch(() => { });
    }, [uid]);


    const value = useMemo(() => ({
        checkIn,
        recordMoodEntry,
        canCheckIn,
        freeUsesRemaining,
        todayMood,
        todayVerses,
        moodHistory,
        resetToday,
        loading,
    }), [checkIn, recordMoodEntry, canCheckIn, freeUsesRemaining, todayMood, todayVerses, moodHistory, resetToday, loading]);

    return (
        <MoodContext.Provider value={value}>
            {children}
        </MoodContext.Provider>
    );
};

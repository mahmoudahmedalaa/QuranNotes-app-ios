import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Types ────────────────────────────────────────────────────────────
export interface MemorizationEntry {
    /** Unique key: "surah:verse" e.g. "2:255" */
    verseKey: string;
    /** SM-2 easiness factor (≥ 1.3) */
    easeFactor: number;
    /** Current interval in days */
    interval: number;
    /** Number of consecutive correct recalls */
    repetitions: number;
    /** Last review timestamp (ISO string) */
    lastReviewed: string;
    /** Next review timestamp (ISO string) */
    nextReview: string;
    /** Mastery level: 0 = new, 1-2 = learning, 3-4 = reviewing, 5 = mastered */
    level: number;
}

export interface MemorizationStats {
    totalVerses: number;
    mastered: number;
    reviewing: number;
    learning: number;
    newToday: number;
    dueToday: number;
}

interface MemorizationContextType {
    entries: Record<string, MemorizationEntry>;
    getEntry: (verseKey: string) => MemorizationEntry | undefined;
    markReviewed: (verseKey: string, quality: number) => Promise<void>;
    getNextReviewVerses: (surahNumber?: number) => MemorizationEntry[];
    getStats: (surahNumber?: number) => MemorizationStats;
    getSurahProgress: (surahNumber: number) => { memorized: number; total: number; percentage: number };
    reset: () => Promise<void>;
    isLoading: boolean;
}

const STORAGE_KEY = 'memorization_progress';

const MemorizationContext = createContext<MemorizationContextType>({
    entries: {},
    getEntry: () => undefined,
    markReviewed: async () => { },
    getNextReviewVerses: () => [],
    getStats: () => ({ totalVerses: 0, mastered: 0, reviewing: 0, learning: 0, newToday: 0, dueToday: 0 }),
    getSurahProgress: () => ({ memorized: 0, total: 0, percentage: 0 }),
    reset: async () => { },
    isLoading: true,
});

export const useMemorization = () => useContext(MemorizationContext);

// ── SM-2 Algorithm ───────────────────────────────────────────────────
/**
 * Implementation of the SM-2 spaced repetition algorithm.
 * Quality: 0 = complete blackout, 1 = incorrect but recalled, 2 = hard,
 *          3 = correct with difficulty, 4 = correct, 5 = perfect recall
 */
function sm2(entry: MemorizationEntry, quality: number): Partial<MemorizationEntry> {
    const q = Math.max(0, Math.min(5, quality));

    let { easeFactor, interval, repetitions } = entry;

    if (q < 3) {
        // Failed recall — reset
        repetitions = 0;
        interval = 1;
    } else {
        // Successful recall
        if (repetitions === 0) {
            interval = 1;
        } else if (repetitions === 1) {
            interval = 6;
        } else {
            interval = Math.round(interval * easeFactor);
        }
        repetitions += 1;
    }

    // Update ease factor (never below 1.3)
    easeFactor = Math.max(
        1.3,
        easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
    );

    // Compute mastery level based on repetitions and ease
    let level: number;
    if (repetitions === 0) level = 1; // learning
    else if (repetitions <= 2) level = 2; // learning
    else if (repetitions <= 5) level = 3; // reviewing
    else if (easeFactor >= 2.5 && repetitions >= 8) level = 5; // mastered
    else level = 4; // reviewing

    const now = new Date();
    const nextReview = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

    return {
        easeFactor,
        interval,
        repetitions,
        level,
        lastReviewed: now.toISOString(),
        nextReview: nextReview.toISOString(),
    };
}

// ── Provider ─────────────────────────────────────────────────────────
export const MemorizationProvider = ({ children }: { children: React.ReactNode }) => {
    const [entries, setEntries] = useState<Record<string, MemorizationEntry>>({});
    const [isLoading, setIsLoading] = useState(true);

    // Load from AsyncStorage
    useEffect(() => {
        loadEntries();
    }, []);

    const loadEntries = async () => {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEY);
            if (data) {
                setEntries(JSON.parse(data));
            }
        } catch (e) {
            console.error('Failed to load memorization progress:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const saveEntries = async (updated: Record<string, MemorizationEntry>) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
            console.error('Failed to save memorization progress:', e);
        }
    };

    const getEntry = useCallback(
        (verseKey: string) => entries[verseKey],
        [entries],
    );

    const markReviewed = useCallback(
        async (verseKey: string, quality: number) => {
            const existing = entries[verseKey] || {
                verseKey,
                easeFactor: 2.5,
                interval: 0,
                repetitions: 0,
                level: 0,
                lastReviewed: new Date().toISOString(),
                nextReview: new Date().toISOString(),
            };

            const updates = sm2(existing, quality);
            const updated = { ...existing, ...updates };

            const newEntries = { ...entries, [verseKey]: updated };
            setEntries(newEntries);
            await saveEntries(newEntries);
        },
        [entries],
    );

    const getNextReviewVerses = useCallback(
        (surahNumber?: number) => {
            const now = new Date().toISOString();
            return Object.values(entries)
                .filter((e) => {
                    if (surahNumber !== undefined) {
                        const [s] = e.verseKey.split(':');
                        if (Number(s) !== surahNumber) return false;
                    }
                    return e.nextReview <= now;
                })
                .sort((a, b) => a.nextReview.localeCompare(b.nextReview));
        },
        [entries],
    );

    const getStats = useCallback(
        (surahNumber?: number): MemorizationStats => {
            const today = new Date().toISOString().split('T')[0];
            const now = new Date().toISOString();
            let all = Object.values(entries);
            if (surahNumber !== undefined) {
                all = all.filter((e) => {
                    const [s] = e.verseKey.split(':');
                    return Number(s) === surahNumber;
                });
            }

            return {
                totalVerses: all.length,
                mastered: all.filter((e) => e.level >= 5).length,
                reviewing: all.filter((e) => e.level >= 3 && e.level < 5).length,
                learning: all.filter((e) => e.level >= 1 && e.level < 3).length,
                newToday: all.filter((e) => e.lastReviewed.startsWith(today) && e.repetitions <= 1).length,
                dueToday: all.filter((e) => e.nextReview <= now).length,
            };
        },
        [entries],
    );

    const getSurahProgress = useCallback(
        (surahNumber: number) => {
            const surahEntries = Object.values(entries).filter((e) => {
                const [s] = e.verseKey.split(':');
                return Number(s) === surahNumber;
            });
            const memorized = surahEntries.filter((e) => e.level >= 4).length;
            const total = surahEntries.length;
            return {
                memorized,
                total,
                percentage: total > 0 ? Math.round((memorized / total) * 100) : 0,
            };
        },
        [entries],
    );

    const reset = useCallback(async () => {
        setEntries({});
        await AsyncStorage.removeItem(STORAGE_KEY);
    }, []);

    return (
        <MemorizationContext.Provider
            value={{
                entries,
                getEntry,
                markReviewed,
                getNextReviewVerses,
                getStats,
                getSurahProgress,
                reset,
                isLoading,
            }}
        >
            {children}
        </MemorizationContext.Provider>
    );
};

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import adhkarData from '../../data/adhkar.json';

// ── Types ────────────────────────────────────────────────────────────
export interface Dhikr {
    id: string;
    arabic: string;
    translation: string;
    source: string;
    repeatCount: number;
    category: string;
}

export type AdhkarPeriod = 'morning' | 'evening';

export interface AdhkarProgress {
    /** Date string (YYYY-MM-DD) */
    date: string;
    /** Map of dhikr ID → count completed */
    completed: Record<string, number>;
    /** Whether the session is fully completed */
    sessionDone: boolean;
}

interface DayProgress {
    morning: AdhkarProgress | null;
    evening: AdhkarProgress | null;
}

interface AdhkarContextType {
    adhkar: { morning: Dhikr[]; evening: Dhikr[] };
    todayProgress: DayProgress;
    incrementCount: (period: AdhkarPeriod, dhikrId: string) => Promise<void>;
    resetDhikr: (period: AdhkarPeriod, dhikrId: string) => Promise<void>;
    getCompletionPercentage: (period: AdhkarPeriod) => number;
    getTotalCompleted: (period: AdhkarPeriod) => number;
    getTotalRequired: (period: AdhkarPeriod) => number;
    isSessionComplete: (period: AdhkarPeriod) => boolean;
    getStreak: () => number;
    isLoading: boolean;
}

const STORAGE_KEY = 'adhkar_progress';
const STREAK_KEY = 'adhkar_streak';

const AdhkarContext = createContext<AdhkarContextType>({
    adhkar: adhkarData as any,
    todayProgress: { morning: null, evening: null },
    incrementCount: async () => { },
    resetDhikr: async () => { },
    getCompletionPercentage: () => 0,
    getTotalCompleted: () => 0,
    getTotalRequired: () => 0,
    isSessionComplete: () => false,
    getStreak: () => 0,
    isLoading: true,
});

export const useAdhkar = () => useContext(AdhkarContext);

// ── Helpers ──────────────────────────────────────────────────────────
function getToday(): string {
    return new Date().toISOString().split('T')[0];
}

function getStorageKey(date: string, period: AdhkarPeriod): string {
    return `${STORAGE_KEY}_${date}_${period}`;
}

// ── Provider ─────────────────────────────────────────────────────────
export const AdhkarProvider = ({ children }: { children: React.ReactNode }) => {
    const [todayProgress, setTodayProgress] = useState<DayProgress>({ morning: null, evening: null });
    const [streak, setStreak] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const adhkar = adhkarData as { morning: Dhikr[]; evening: Dhikr[] };

    // Load today's progress
    useEffect(() => {
        loadProgress();
        loadStreak();
    }, []);

    const loadProgress = async () => {
        try {
            const today = getToday();
            const [morningData, eveningData] = await Promise.all([
                AsyncStorage.getItem(getStorageKey(today, 'morning')),
                AsyncStorage.getItem(getStorageKey(today, 'evening')),
            ]);

            setTodayProgress({
                morning: morningData ? JSON.parse(morningData) : null,
                evening: eveningData ? JSON.parse(eveningData) : null,
            });
        } catch (e) {
            console.error('Failed to load adhkar progress:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const loadStreak = async () => {
        try {
            const data = await AsyncStorage.getItem(STREAK_KEY);
            if (data) {
                const { count, lastDate } = JSON.parse(data);
                const today = getToday();
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];

                if (lastDate === today || lastDate === yesterdayStr) {
                    setStreak(count);
                } else {
                    setStreak(0);
                    await AsyncStorage.setItem(STREAK_KEY, JSON.stringify({ count: 0, lastDate: today }));
                }
            }
        } catch (e) {
            console.error('Failed to load adhkar streak:', e);
        }
    };

    const saveProgress = async (period: AdhkarPeriod, progress: AdhkarProgress) => {
        try {
            const today = getToday();
            await AsyncStorage.setItem(getStorageKey(today, period), JSON.stringify(progress));
        } catch (e) {
            console.error('Failed to save adhkar progress:', e);
        }
    };

    const updateStreak = async () => {
        try {
            const today = getToday();
            const data = await AsyncStorage.getItem(STREAK_KEY);
            let count = 0;
            let lastDate = '';

            if (data) {
                const parsed = JSON.parse(data);
                count = parsed.count;
                lastDate = parsed.lastDate;
            }

            if (lastDate !== today) {
                count += 1;
                await AsyncStorage.setItem(STREAK_KEY, JSON.stringify({ count, lastDate: today }));
                setStreak(count);
            }
        } catch (e) {
            console.error('Failed to update adhkar streak:', e);
        }
    };

    const incrementCount = useCallback(
        async (period: AdhkarPeriod, dhikrId: string) => {
            const today = getToday();
            const current = todayProgress[period] || {
                date: today,
                completed: {},
                sessionDone: false,
            };

            const dhikrList = adhkar[period];
            const dhikr = dhikrList.find((d) => d.id === dhikrId);
            if (!dhikr) return;

            const currentCount = current.completed[dhikrId] || 0;
            if (currentCount >= dhikr.repeatCount) return; // Already complete

            const newCount = currentCount + 1;
            const updated: AdhkarProgress = {
                ...current,
                completed: { ...current.completed, [dhikrId]: newCount },
            };

            // Check if all dhikr in this period are complete
            const allComplete = dhikrList.every((d) => {
                const c = updated.completed[d.id] || 0;
                return c >= d.repeatCount;
            });
            updated.sessionDone = allComplete;

            setTodayProgress((prev) => ({ ...prev, [period]: updated }));
            await saveProgress(period, updated);

            if (allComplete) {
                await updateStreak();
            }
        },
        [todayProgress, adhkar],
    );

    const resetDhikr = useCallback(
        async (period: AdhkarPeriod, dhikrId: string) => {
            const today = getToday();
            const current = todayProgress[period] || {
                date: today,
                completed: {},
                sessionDone: false,
            };

            const updated: AdhkarProgress = {
                ...current,
                completed: { ...current.completed, [dhikrId]: 0 },
                sessionDone: false,
            };

            setTodayProgress((prev) => ({ ...prev, [period]: updated }));
            await saveProgress(period, updated);
        },
        [todayProgress],
    );

    const getCompletionPercentage = useCallback(
        (period: AdhkarPeriod): number => {
            const dhikrList = adhkar[period];
            const progress = todayProgress[period];
            if (!progress) return 0;

            const totalRequired = dhikrList.reduce((sum, d) => sum + d.repeatCount, 0);
            const totalDone = dhikrList.reduce((sum, d) => {
                const count = progress.completed[d.id] || 0;
                return sum + Math.min(count, d.repeatCount);
            }, 0);

            return totalRequired > 0 ? Math.round((totalDone / totalRequired) * 100) : 0;
        },
        [todayProgress, adhkar],
    );

    const getTotalCompleted = useCallback(
        (period: AdhkarPeriod): number => {
            const progress = todayProgress[period];
            if (!progress) return 0;
            return Object.values(progress.completed).reduce((sum, c) => sum + c, 0);
        },
        [todayProgress],
    );

    const getTotalRequired = useCallback(
        (period: AdhkarPeriod): number => {
            return adhkar[period].reduce((sum, d) => sum + d.repeatCount, 0);
        },
        [adhkar],
    );

    const isSessionComplete = useCallback(
        (period: AdhkarPeriod): boolean => {
            return todayProgress[period]?.sessionDone ?? false;
        },
        [todayProgress],
    );

    const getStreak = useCallback(() => streak, [streak]);

    return (
        <AdhkarContext.Provider
            value={{
                adhkar,
                todayProgress,
                incrementCount,
                resetDhikr,
                getCompletionPercentage,
                getTotalCompleted,
                getTotalRequired,
                isSessionComplete,
                getStreak,
                isLoading,
            }}
        >
            {children}
        </AdhkarContext.Provider>
    );
};

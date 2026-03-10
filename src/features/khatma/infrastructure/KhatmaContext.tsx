/**
 * Khatma Context — Thin React glue layer.
 * All pure business logic lives in KhatmaService.ts.
 * All surah data lives in surahData.ts.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getSurahMeta, SurahMeta } from '../data/surahData';
import {
    KhatmaState,
    FREE_JUZ_LIMIT,
    initialState,
    loadProgress,
    saveProgress,
    deriveCompletedJuz,
    deriveCurrentJuz,
    deriveNextSurahNumber,
    deriveTotalPagesRead,
    deriveStreakDays,
    computeNewStreak,
    todayDateString,
} from '../domain/KhatmaService';

import { useAuth } from '../../auth/infrastructure/AuthContext';
import { usePro } from '../../auth/infrastructure/ProContext';
import { ReadingActivityLog, ReadingLog } from '../../../core/infrastructure/ReadingActivityLog';
import { WidgetBridge } from '../../../../modules/widget-bridge/src';

// Re-export types so existing consumers don't break
export type { SurahMeta } from '../data/surahData';
export { getSurahMeta } from '../data/surahData';

// ─── Context type ────────────────────────────────────────────────────────────

interface KhatmaContextType {
    completedSurahs: number[];
    nextSurah: SurahMeta;
    markSurahComplete: (surahNumber: number) => Promise<void>;
    unmarkSurah: (surahNumber: number) => Promise<void>;
    completedJuz: number[];
    currentJuz: number;
    isComplete: boolean;
    totalPagesRead: number;
    loading: boolean;
    resetKhatma: () => Promise<void>;
    startNextRound: () => Promise<void>;
    streakDays: number;
    currentRound: number;
    completedRounds: number[];
    isGated: boolean;
    readingLog: ReadingLog;
}

const KhatmaContext = createContext<KhatmaContextType | undefined>(undefined);

export const useKhatma = (): KhatmaContextType => {
    const context = useContext(KhatmaContext);
    if (!context) throw new Error('useKhatma must be used within a KhatmaProvider');
    return context;
};

// ─── Provider ────────────────────────────────────────────────────────────────

export const KhatmaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const currentYear = new Date().getFullYear();
    const { user } = useAuth();
    const prevUidRef = useRef<string | null | undefined>(undefined);

    const [state, setState] = useState<KhatmaState>(initialState(currentYear));
    const [loading, setLoading] = useState(true);
    const [readingLog, setReadingLog] = useState<ReadingLog>({});

    // ─── Load on mount ───────────────────────────────────────────────────

    const load = useCallback(async () => {
        const loaded = await loadProgress(currentYear);
        setState(loaded);
        setLoading(false);
    }, [currentYear]);

    useEffect(() => {
        load();
        ReadingActivityLog.load().then(setReadingLog);
    }, [load]);

    // One-time reseed fix
    useEffect(() => {
        if (loading || state.completedSurahs.length === 0) return;
        (async () => {
            const flag = await AsyncStorage.getItem('reading_log_v3_seeded');
            if (flag === 'true') return;
            const seeded = await ReadingActivityLog.reseed(state.completedSurahs);
            await AsyncStorage.setItem('reading_log_v3_seeded', 'true');
            if (Object.keys(seeded).length > 0) setReadingLog(seeded);
        })();
    }, [loading, state.completedSurahs]);

    // Reset on auth change
    useEffect(() => {
        const currentUid = user?.id ?? null;
        if (prevUidRef.current === undefined) {
            prevUidRef.current = currentUid;
            return;
        }
        if (currentUid !== prevUidRef.current) {
            prevUidRef.current = currentUid;
            load();
        }
    }, [user?.id, load]);

    // ─── Actions ─────────────────────────────────────────────────────────

    const markSurahComplete = useCallback(async (surahNumber: number) => {
        if (surahNumber < 1 || surahNumber > 114) return;

        await ReadingActivityLog.logSurahCompletion(surahNumber);
        const updatedLog = await ReadingActivityLog.load();
        setReadingLog(updatedLog);

        setState(prev => {
            if (prev.completedSurahs.includes(surahNumber)) return prev;
            const updated = [...prev.completedSurahs, surahNumber].sort((a, b) => a - b);
            const newStreak = computeNewStreak(prev.lastProgressDate, prev.streakCount);
            const newState: KhatmaState = {
                ...prev,
                completedSurahs: updated,
                lastProgressDate: todayDateString(),
                streakCount: newStreak,
            };
            saveProgress(newState);
            return newState;
        });
    }, []);

    const unmarkSurah = useCallback(async (surahNumber: number) => {
        if (surahNumber < 1 || surahNumber > 114) return;
        setState(prev => {
            if (!prev.completedSurahs.includes(surahNumber)) return prev;
            const updated = prev.completedSurahs.filter(n => n !== surahNumber);
            const newState: KhatmaState = { ...prev, completedSurahs: updated };
            saveProgress(newState);
            return newState;
        });
    }, []);

    const resetKhatma = useCallback(async () => {
        const newState = initialState(currentYear);
        setState(newState);
        await saveProgress(newState);
    }, [currentYear]);

    const startNextRound = useCallback(async () => {
        setState(prev => {
            const newState: KhatmaState = {
                completedSurahs: [],
                year: currentYear,
                currentRound: prev.currentRound + 1,
                completedRounds: [...prev.completedRounds, Date.now()],
                streakCount: prev.streakCount,
                lastProgressDate: prev.lastProgressDate,
            };
            saveProgress(newState);
            return newState;
        });
    }, [currentYear]);

    // ─── Derived values ──────────────────────────────────────────────────

    const completedJuz = useMemo(() => deriveCompletedJuz(state.completedSurahs), [state.completedSurahs]);
    const nextSurahNumber = useMemo(() => deriveNextSurahNumber(state.completedSurahs), [state.completedSurahs]);
    const nextSurah = useMemo(() => getSurahMeta(nextSurahNumber), [nextSurahNumber]);
    const currentJuz = useMemo(() => deriveCurrentJuz(nextSurahNumber), [nextSurahNumber]);
    const isComplete = useMemo(() => state.completedSurahs.length >= 114, [state.completedSurahs]);
    const totalPagesRead = useMemo(() => deriveTotalPagesRead(completedJuz), [completedJuz]);
    const streakDays = useMemo(() => deriveStreakDays(state.lastProgressDate, state.streakCount), [state.lastProgressDate, state.streakCount]);

    // Widget sync
    useEffect(() => {
        WidgetBridge.setKhatma({
            completedJuz: completedJuz.length,
            totalJuz: 30,
            completedSurahs: state.completedSurahs.length,
        });
    }, [completedJuz.length, state.completedSurahs.length]);

    // Premium gate
    const { isPro, loading: proLoading } = usePro();
    const isGated = useMemo(() => {
        if (proLoading || isPro) return false;
        return completedJuz.length >= FREE_JUZ_LIMIT;
    }, [isPro, proLoading, completedJuz]);

    const value: KhatmaContextType = {
        completedSurahs: state.completedSurahs,
        nextSurah,
        markSurahComplete,
        unmarkSurah,
        completedJuz,
        currentJuz,
        isComplete,
        totalPagesRead,
        loading,
        resetKhatma,
        startNextRound,
        streakDays,
        currentRound: state.currentRound,
        completedRounds: state.completedRounds,
        isGated,
        readingLog,
    };

    return (
        <KhatmaContext.Provider value={value}>
            {children}
        </KhatmaContext.Provider>
    );
};

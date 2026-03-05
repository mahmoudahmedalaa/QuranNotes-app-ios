/**
 * HadithContext — Provides curated daily hadith with local data.
 * Mirrors DailyVerseCard's approach: local curated data, history tracking,
 * day-based picking with refresh support.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CuratedHadith } from '../domain/HadithTypes';
import { getAllCuratedHadiths } from '../domain/CuratedHadiths';
import { WidgetBridge } from '../../../../modules/widget-bridge/src';

const STORAGE_KEY = 'daily_hadith_data';
const HISTORY_KEY = 'daily_hadith_history';

interface HadithContextType {
    hadith: CuratedHadith | null;
    loading: boolean;
    refresh: () => Promise<void>;
}

const HadithContext = createContext<HadithContextType>({
    hadith: null,
    loading: true,
    refresh: async () => { },
});

export const useHadith = () => useContext(HadithContext);

/** Sync hadith data to iOS widget */
function syncHadithToWidget(h: CuratedHadith) {
    try {
        WidgetBridge.setDailyHadith({
            arabicText: h.arabicText,
            englishText: h.englishText,
            narrator: h.narrator,
            collection: h.collection,
            reference: h.reference,
        });
    } catch (err) {
        if (__DEV__) console.warn('[HadithContext] Widget sync failed:', err);
    }
}

/** Pick a random hadith avoiding recent history */
async function pickNextHadith(): Promise<CuratedHadith> {
    const allHadiths = getAllCuratedHadiths();
    let history: string[] = [];

    try {
        const storedHistory = await AsyncStorage.getItem(HISTORY_KEY);
        if (storedHistory) history = JSON.parse(storedHistory);
    } catch (_e) {
        if (__DEV__) console.warn('[HadithContext] Failed to parse history:', _e);
    }

    // Filter out recently shown hadiths
    let available = allHadiths.filter(h => !history.includes(h.id));
    if (available.length === 0) {
        // Reset history when all hadiths have been shown
        history = [];
        available = allHadiths;
    }

    const picked = available[Math.floor(Math.random() * available.length)];
    history.push(picked.id);

    try {
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (_e) {
        if (__DEV__) console.warn('[HadithContext] Failed to save history:', _e);
    }

    return picked;
}

/** Get today's date key */
function todayKey(): string {
    return new Date().toISOString().split('T')[0];
}

export const HadithProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [hadith, setHadith] = useState<CuratedHadith | null>(null);
    const [loading, setLoading] = useState(true);

    const loadDailyHadith = useCallback(async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.date === todayKey()) {
                    setHadith(parsed.hadith);
                    syncHadithToWidget(parsed.hadith);
                    setLoading(false);
                    return;
                }
            }

            // New day — pick a fresh hadith
            const nextHadith = await pickNextHadith();
            setHadith(nextHadith);
            syncHadithToWidget(nextHadith);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
                date: todayKey(),
                hadith: nextHadith,
            }));
        } catch (err) {
            if (__DEV__) console.warn('[HadithContext] Load failed:', err);
            // Fallback to first hadith
            const fallback = getAllCuratedHadiths()[0];
            setHadith(fallback);
            syncHadithToWidget(fallback);
        } finally {
            setLoading(false);
        }
    }, []);

    /** Refresh — pick a new hadith (user-triggered) */
    const refresh = useCallback(async () => {
        try {
            const nextHadith = await pickNextHadith();
            setHadith(nextHadith);
            syncHadithToWidget(nextHadith);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
                date: todayKey(),
                hadith: nextHadith,
            }));
        } catch (err) {
            if (__DEV__) console.warn('[HadithContext] Refresh failed:', err);
        }
    }, []);

    useEffect(() => {
        loadDailyHadith();
    }, [loadDailyHadith]);

    // Reload when app returns to foreground
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                loadDailyHadith();
            }
        });
        return () => subscription.remove();
    }, [loadDailyHadith]);

    return (
        <HadithContext.Provider value={{ hadith, loading, refresh }}>
            {children}
        </HadithContext.Provider>
    );
};

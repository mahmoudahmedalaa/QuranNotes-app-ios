/**
 * HadithContext — Provides curated daily hadith with local data.
 * Includes: refresh limits (3/day free), bookmark system, and history tracking.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CuratedHadith } from '../domain/HadithTypes';
import { getAllCuratedHadiths } from '../domain/CuratedHadiths';
import { HadithBookmarkService } from './HadithBookmarkService';
import { WidgetBridge } from '../../../../modules/widget-bridge/src';

const STORAGE_KEY = 'daily_hadith_data';
const HISTORY_KEY = 'daily_hadith_history';
const REFRESH_COUNT_KEY = 'daily_hadith_refresh_count';
const FREE_REFRESH_LIMIT = 3;

interface HadithContextType {
    hadith: CuratedHadith | null;
    loading: boolean;
    refresh: () => Promise<void>;
    /** How many refreshes used today */
    refreshCount: number;
    /** Whether the user can still refresh (based on free limit) */
    canRefresh: boolean;
    /** Bookmark state */
    bookmarkedIds: string[];
    toggleBookmark: (hadithId: string) => Promise<boolean>;
    isBookmarked: (hadithId: string) => boolean;
    /** Set a specific hadith as today's (from library) */
    setHadith: (h: CuratedHadith) => Promise<void>;
}

const HadithContext = createContext<HadithContextType>({
    hadith: null,
    loading: true,
    refresh: async () => { },
    refreshCount: 0,
    canRefresh: true,
    bookmarkedIds: [],
    toggleBookmark: async () => false,
    isBookmarked: () => false,
    setHadith: async () => { },
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

/** Load today's refresh count from AsyncStorage */
async function loadRefreshCount(): Promise<number> {
    try {
        const stored = await AsyncStorage.getItem(REFRESH_COUNT_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.date === todayKey()) return parsed.count;
        }
    } catch (_e) { /* ignore */ }
    return 0;
}

/** Save today's refresh count */
async function saveRefreshCount(count: number): Promise<void> {
    await AsyncStorage.setItem(REFRESH_COUNT_KEY, JSON.stringify({
        date: todayKey(),
        count,
    }));
}

export const HadithProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [hadith, setHadithState] = useState<CuratedHadith | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshCount, setRefreshCount] = useState(0);
    const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

    const canRefresh = refreshCount < FREE_REFRESH_LIMIT;

    // Load bookmarks on mount
    useEffect(() => {
        HadithBookmarkService.getBookmarks().then(setBookmarkedIds);
    }, []);

    const loadDailyHadith = useCallback(async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.date === todayKey()) {
                    setHadithState(parsed.hadith);
                    syncHadithToWidget(parsed.hadith);
                    setLoading(false);
                    // Load today's refresh count
                    const count = await loadRefreshCount();
                    setRefreshCount(count);
                    return;
                }
            }

            // New day — pick a fresh hadith, reset refresh count
            const nextHadith = await pickNextHadith();
            setHadithState(nextHadith);
            syncHadithToWidget(nextHadith);
            setRefreshCount(0);
            await saveRefreshCount(0);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
                date: todayKey(),
                hadith: nextHadith,
            }));
        } catch (err) {
            if (__DEV__) console.warn('[HadithContext] Load failed:', err);
            const fallback = getAllCuratedHadiths()[0];
            setHadithState(fallback);
            syncHadithToWidget(fallback);
        } finally {
            setLoading(false);
        }
    }, []);

    /** Refresh — pick a new hadith (user-triggered). Increments refresh count. */
    const refresh = useCallback(async () => {
        try {
            const nextHadith = await pickNextHadith();
            setHadithState(nextHadith);
            syncHadithToWidget(nextHadith);
            const newCount = refreshCount + 1;
            setRefreshCount(newCount);
            await saveRefreshCount(newCount);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
                date: todayKey(),
                hadith: nextHadith,
            }));
        } catch (err) {
            if (__DEV__) console.warn('[HadithContext] Refresh failed:', err);
        }
    }, [refreshCount]);

    /** Set a specific hadith from the library */
    const setHadith = useCallback(async (h: CuratedHadith) => {
        setHadithState(h);
        syncHadithToWidget(h);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
            date: todayKey(),
            hadith: h,
        }));
    }, []);

    /** Toggle bookmark — returns true if added, false if removed */
    const toggleBookmark = useCallback(async (hadithId: string): Promise<boolean> => {
        const isCurrentlyBookmarked = bookmarkedIds.includes(hadithId);
        if (isCurrentlyBookmarked) {
            await HadithBookmarkService.removeBookmark(hadithId);
            setBookmarkedIds(prev => prev.filter(id => id !== hadithId));
            return false;
        } else {
            await HadithBookmarkService.addBookmark(hadithId);
            setBookmarkedIds(prev => [...prev, hadithId]);
            return true;
        }
    }, [bookmarkedIds]);

    const isBookmarked = useCallback((hadithId: string): boolean => {
        return bookmarkedIds.includes(hadithId);
    }, [bookmarkedIds]);

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
        <HadithContext.Provider value={{
            hadith,
            loading,
            refresh,
            refreshCount,
            canRefresh,
            bookmarkedIds,
            toggleBookmark,
            isBookmarked,
            setHadith,
        }}>
            {children}
        </HadithContext.Provider>
    );
};

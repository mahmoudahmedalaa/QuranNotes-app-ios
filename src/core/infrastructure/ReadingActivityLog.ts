/**
 * ReadingActivityLog — Persistent, append-only log of reading sessions.
 *
 * Stored SEPARATELY from KhatmaState so it survives khatma resets and
 * new rounds. Maps date strings (YYYY-MM-DD) to arrays of surah numbers
 * completed that day, plus page counts for accurate time estimation.
 *
 * Used by useInsightsData to provide proper timeframe-based filtering.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { JUZ_DATA } from '../../features/khatma/data/khatmaData';

const STORAGE_KEY = 'reading_activity_log';

export interface DailyReadingEntry {
    surahs: number[];   // surah numbers completed that day
    pages: number;      // total pages read that day
}

export type ReadingLog = Record<string, DailyReadingEntry>; // "2026-02-25" → entry

function todayStr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Estimate pages for a single surah based on its Juz data */
function estimateSurahPages(surahNumber: number): number {
    // Find which Juz this surah belongs to
    for (const juz of JUZ_DATA) {
        if (surahNumber >= juz.startSurahNumber && surahNumber <= juz.endSurahNumber) {
            // Approximate: divide juz pages evenly across its surahs
            const surahCount = juz.endSurahNumber - juz.startSurahNumber + 1;
            return Math.round(juz.totalPages / surahCount);
        }
    }
    return 5; // fallback
}

export const ReadingActivityLog = {
    async load(): Promise<ReadingLog> {
        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    },

    async logSurahCompletion(surahNumber: number): Promise<void> {
        try {
            const log = await this.load();
            const today = todayStr();
            const existing = log[today] || { surahs: [], pages: 0 };

            if (!existing.surahs.includes(surahNumber)) {
                existing.surahs.push(surahNumber);
                existing.pages += estimateSurahPages(surahNumber);
            }

            log[today] = existing;
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(log));
        } catch (e) {
            if (__DEV__) console.warn('[ReadingActivityLog] logSurahCompletion failed', e);
        }
    },

    /** Get pages read within a date range */
    getPagesInRange(log: ReadingLog, cutoff: Date | null): number {
        if (!cutoff) {
            // All time — sum everything
            return Object.values(log).reduce((sum, entry) => sum + entry.pages, 0);
        }
        let total = 0;
        for (const [dateStr, entry] of Object.entries(log)) {
            if (new Date(dateStr) >= cutoff) {
                total += entry.pages;
            }
        }
        return total;
    },

    /** Get surah count in a date range */
    getSurahsInRange(log: ReadingLog, cutoff: Date | null): number {
        if (!cutoff) {
            return Object.values(log).reduce((sum, entry) => sum + entry.surahs.length, 0);
        }
        let total = 0;
        for (const [dateStr, entry] of Object.entries(log)) {
            if (new Date(dateStr) >= cutoff) {
                total += entry.surahs.length;
            }
        }
        return total;
    },

    /** Clear all data (for logout) */
    async clearAll(): Promise<void> {
        await AsyncStorage.removeItem(STORAGE_KEY);
    },
};

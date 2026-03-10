/**
 * WidgetDataService — Writes app data to shared UserDefaults for native iOS widgets.
 * Uses react-native-shared-group-preferences when available, falls back to no-op.
 */

const APP_GROUP = 'group.com.mahmoudahmedalaa.qurannotes';

export interface DailyVerseWidgetData {
    arabicText: string;
    translation: string;
    surahName: string;
    verseNumber: number;
    date: string;
}

export interface PrayerTimesWidgetData {
    fajr: string;
    sunrise: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
    nextPrayer: string;
    hijriDate: string;
    location: string;
}

export interface StreakWidgetData {
    currentStreak: number;
    todayCompleted: boolean;
    lastReadDate: string;
}

/**
 * Try to load SharedGroupPreferences dynamically.
 * Returns null if not available (e.g., during development without native module).
 */
async function getSharedPrefs(): Promise<{
    setItem: (key: string, value: string, group: string) => Promise<void>;
} | null> {
    try {
        // eslint-disable-next-line import/no-unresolved
        const mod = await import('react-native-shared-group-preferences');
        return mod.default || mod;
    } catch {
        return null;
    }
}

export class WidgetDataService {
    static async updateDailyVerse(data: DailyVerseWidgetData): Promise<void> {
        try {
            const prefs = await getSharedPrefs();
            if (prefs) {
                await prefs.setItem('dailyVerse', JSON.stringify(data), APP_GROUP);
            }
        } catch (e) {
            if (__DEV__) console.warn('[WidgetData] Daily verse write failed:', e);
        }
    }

    static async updatePrayerTimes(data: PrayerTimesWidgetData): Promise<void> {
        try {
            const prefs = await getSharedPrefs();
            if (prefs) {
                await prefs.setItem('prayerTimes', JSON.stringify(data), APP_GROUP);
            }
        } catch (e) {
            if (__DEV__) console.warn('[WidgetData] Prayer times write failed:', e);
        }
    }

    static async updateStreak(data: StreakWidgetData): Promise<void> {
        try {
            const prefs = await getSharedPrefs();
            if (prefs) {
                await prefs.setItem('streakData', JSON.stringify(data), APP_GROUP);
            }
        } catch (e) {
            if (__DEV__) console.warn('[WidgetData] Streak write failed:', e);
        }
    }
}

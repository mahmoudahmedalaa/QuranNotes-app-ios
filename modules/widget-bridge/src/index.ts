import { Platform } from 'react-native';

// ═══════════════════════════════════════════════════════════════════
// Widget Data Bridge
// Sends data from React Native → shared UserDefaults → iOS widgets
// ═══════════════════════════════════════════════════════════════════

let WidgetBridgeNative: {
    setWidgetData: (key: string, jsonString: string) => boolean;
    reloadAllWidgets: () => void;
    reloadWidget: (kind: string) => void;
} | null = null;

// Lazy-load the native module (only available on iOS after prebuild)
function getNativeModule() {
    if (WidgetBridgeNative) return WidgetBridgeNative;
    if (Platform.OS !== 'ios') return null;
    try {
        const mod = require('expo-modules-core');
        WidgetBridgeNative = mod.requireNativeModule('WidgetBridge');
        return WidgetBridgeNative;
    } catch {
        // Native module not available (e.g. Expo Go or not yet prebuilt)
        console.log('[WidgetBridge] Native module not available');
        return null;
    }
}

// ── Public API ────────────────────────────────────────────────────

export interface DailyVerseWidgetData {
    arabicText: string;
    translation: string;
    surahName: string;
    surahNameArabic: string;
    verseNumber: number;
    surahNumber: number;
}

export interface NextPrayerWidgetData {
    name: string;
    time: string;
    timestamp: number; // Unix epoch seconds
}

export interface KhatmaWidgetData {
    completedJuz: number;
    totalJuz: number;
    completedSurahs: number;
}

export interface StreakWidgetData {
    count: number;
}

/**
 * Set widget data and optionally reload widgets
 */
function setWidgetData(key: string, data: object): boolean {
    const native = getNativeModule();
    if (!native) return false;
    try {
        const json = JSON.stringify(data);
        const result = native.setWidgetData(key, json);
        // Also reload widgets so they pick up the new data
        native.reloadAllWidgets();
        return result;
    } catch (e) {
        console.warn('[WidgetBridge] Failed to set data:', e);
        return false;
    }
}

export const WidgetBridge = {
    /** Update the Daily Verse widget data */
    setDailyVerse(data: DailyVerseWidgetData): boolean {
        return setWidgetData('dailyVerse', data);
    },

    /** Update the Next Prayer widget data */
    setNextPrayer(data: NextPrayerWidgetData): boolean {
        return setWidgetData('nextPrayer', data);
    },

    /** Update the widget with a full schedule of upcoming prayers */
    setNextPrayers(data: NextPrayerWidgetData[]): boolean {
        return setWidgetData('nextPrayers', data);
    },

    /** Update the Khatma progress widget data */
    setKhatma(data: KhatmaWidgetData): boolean {
        return setWidgetData('khatma', data);
    },

    /** Update the streak widget data */
    setStreak(data: StreakWidgetData): boolean {
        return setWidgetData('streak', data);
    },

    /** Force refresh all widgets */
    reloadAll(): void {
        const native = getNativeModule();
        native?.reloadAllWidgets();
    },

    /** Check if widget bridge is available */
    isAvailable(): boolean {
        return Platform.OS === 'ios' && getNativeModule() !== null;
    },
};

/**
 * AladhanAPI — Fetches prayer times from the Aladhan API.
 * Caches responses in AsyncStorage for 24 hours.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrayerTimesData, PrayerTime, PRAYER_ICONS } from '../domain/entities/PrayerTimes';

const BASE_URL = 'https://api.aladhan.com/v1/timings';
const CACHE_KEY_PREFIX = 'prayer_times_cache_';

/**
 * Parse "HH:mm" into minutes-since-midnight for easy comparison.
 */
function timeToMinutes(t: string): number {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

/**
 * Determine which prayer is next based on current time.
 */
function markNextPrayer(prayers: PrayerTime[]): PrayerTime[] {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    let foundNext = false;

    return prayers.map(p => {
        const prayerMinutes = timeToMinutes(p.time);
        const isPast = prayerMinutes <= nowMinutes;
        const isNext = !foundNext && prayerMinutes > nowMinutes;
        if (isNext) foundNext = true;
        return { ...p, isPast, isNext };
    });
}

export class AladhanAPI {

    /**
     * Fetch prayer times by coordinates and calculation method.
     * Caches the result for the current date.
     */
    static async fetchByCoordinates(
        latitude: number,
        longitude: number,
        method: number = 4,
    ): Promise<PrayerTimesData | null> {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const cacheKey = `${CACHE_KEY_PREFIX}${today}_${method}`;

        // Check cache first
        try {
            const cached = await AsyncStorage.getItem(cacheKey);
            if (cached) {
                const parsed: PrayerTimesData = JSON.parse(cached);
                parsed.prayers = markNextPrayer(parsed.prayers);
                return parsed;
            }
        } catch {
            // Cache miss or corrupt — continue to fetch
        }

        // Fetch from API
        try {
            const dateParam = today.replace(/-/g, '-'); // DD-MM-YYYY
            const dateParts = today.split('-');
            const apiDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

            const url = `${BASE_URL}/${apiDate}?latitude=${latitude}&longitude=${longitude}&method=${method}`;
            const response = await fetch(url);
            if (!response.ok) {
                console.warn('[AladhanAPI] HTTP error:', response.status);
                return null;
            }

            const json = await response.json();
            if (json.code !== 200 || !json.data) {
                console.warn('[AladhanAPI] Unexpected response:', json.code);
                return null;
            }

            const timings = json.data.timings;
            const hijri = json.data.date?.hijri;

            const prayerNames = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

            const prayers: PrayerTime[] = prayerNames.map(name => ({
                name,
                time: (timings[name] || '').split(' ')[0], // strip timezone suffix if present
                icon: PRAYER_ICONS[name] || 'clock-outline',
                isNext: false,
                isPast: false,
            }));

            const hijriDate = hijri
                ? `${hijri.day} ${hijri.month?.en || ''} ${hijri.year}`
                : '';

            const data: PrayerTimesData = {
                date: today,
                hijriDate,
                prayers: markNextPrayer(prayers),
                location: '',
                method,
            };

            // Cache for the day
            try {
                await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
            } catch {
                // Non-critical — ignore cache write failure
            }

            return data;
        } catch (err) {
            console.warn('[AladhanAPI] Fetch failed:', err);
            return null;
        }
    }

    /**
     * Compute seconds until the next prayer.
     */
    static getSecondsToNextPrayer(prayers: PrayerTime[]): number {
        const next = prayers.find(p => p.isNext);
        if (!next) return 0;

        const now = new Date();
        const [h, m] = next.time.split(':').map(Number);
        const prayerMs = new Date(
            now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0
        ).getTime();

        return Math.max(0, Math.floor((prayerMs - now.getTime()) / 1000));
    }
}

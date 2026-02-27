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
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

/**
 * Determine which prayer is next based on current time.
 * When all prayers have passed (late night after Isha), Fajr is marked as next.
 */
function markNextPrayer(prayers: PrayerTime[]): PrayerTime[] {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    let foundNext = false;

    const result = prayers.map(p => {
        const prayerMinutes = timeToMinutes(p.time);
        const isPast = prayerMinutes <= nowMinutes;
        const isNext = !foundNext && prayerMinutes > nowMinutes;
        if (isNext) foundNext = true;
        return { ...p, isPast, isNext };
    });

    // If no prayer is upcoming today (all passed), mark Fajr as next (tomorrow)
    if (!foundNext && result.length > 0) {
        result[0] = { ...result[0], isNext: true };
    }

    return result;
}

/**
 * Maps a country name (or ISO 3166-1 code) to the most accurate Aladhan
 * calculation method for that region.
 *
 * Methods:
 *  1 — University of Islamic Sciences, Karachi  (Pakistan, Afghanistan, Bangladesh, India)
 *  2 — ISNA  (North America)
 *  3 — Muslim World League  (Europe, global fallback)
 *  4 — Umm Al-Qura University, Makkah  (Saudi Arabia)
 *  5 — Egyptian General Authority of Survey  (Egypt, Africa)
 *  7 — Institute of Geophysics, University of Tehran  (Iran)
 *  8 — Gulf Region  (Oman, Yemen)
 *  9 — Kuwait
 * 10 — Qatar
 * 11 — Majlis Ugama Islam Singapura  (Singapore, Malaysia, Indonesia)
 * 12 — Union Organization Islamic de France  (France)
 * 13 — Diyanet İşleri Başkanlığı  (Turkey, Central Asia)
 * 14 — Spiritual Administration of Muslims of Russia  (Russia, CIS)
 * 15 — Moonsighting Committee Worldwide  (alternative global)
 * 16 — Dubai / IACAD  (UAE)
 */
export function getMethodForCountry(country: string | undefined): number {
    if (!country) return 3; // MWL — safest global default

    const c = country.trim().toLowerCase();

    // Exact-match lookup table (country name → method)
    const map: Record<string, number> = {
        // Gulf & Middle East
        'saudi arabia': 4, 'sa': 4,
        'united arab emirates': 16, 'uae': 16, 'ae': 16,
        'kuwait': 9, 'kw': 9,
        'qatar': 10, 'qa': 10,
        'bahrain': 16, 'bh': 16,   // follows UAE/Dubai conventions
        'oman': 8, 'om': 8,
        'yemen': 8, 'ye': 8,
        'iraq': 3, 'iq': 3,
        'jordan': 3, 'jo': 3,
        'lebanon': 3, 'lb': 3,
        'syria': 3, 'sy': 3,
        'palestine': 3, 'ps': 3,

        // North Africa & Egypt
        'egypt': 5, 'eg': 5,
        'libya': 5, 'ly': 5,
        'sudan': 5, 'sd': 5,
        'tunisia': 5, 'tn': 5,
        'algeria': 5, 'dz': 5,
        'morocco': 5, 'ma': 5,

        // South Asia
        'pakistan': 1, 'pk': 1,
        'india': 1, 'in': 1,
        'bangladesh': 1, 'bd': 1,
        'afghanistan': 1, 'af': 1,
        'sri lanka': 1, 'lk': 1,
        'nepal': 1, 'np': 1,

        // Southeast Asia
        'malaysia': 11, 'my': 11,
        'singapore': 11, 'sg': 11,
        'indonesia': 11, 'id': 11,
        'brunei': 11, 'bn': 11,
        'thailand': 11, 'th': 11,
        'philippines': 11, 'ph': 11,

        // Turkey & Central Asia
        'turkey': 13, 'tr': 13, 'türkiye': 13,
        'azerbaijan': 13, 'az': 13,
        'turkmenistan': 13, 'tm': 13,
        'uzbekistan': 13, 'uz': 13,
        'kazakhstan': 13, 'kz': 13,
        'kyrgyzstan': 13, 'kg': 13,
        'tajikistan': 13, 'tj': 13,

        // Iran
        'iran': 7, 'ir': 7,

        // Russia & CIS
        'russia': 14, 'ru': 14,

        // North America
        'united states': 2, 'us': 2, 'usa': 2,
        'canada': 2, 'ca': 2,
        'mexico': 2, 'mx': 2,

        // France
        'france': 12, 'fr': 12,

        // Sub-Saharan Africa (Egyptian authority widely used)
        'nigeria': 5, 'ng': 5,
        'somalia': 5, 'so': 5,
        'ethiopia': 5, 'et': 5,
        'kenya': 5, 'ke': 5,
        'tanzania': 5, 'tz': 5,
        'south africa': 5, 'za': 5,
    };

    if (map[c] !== undefined) return map[c];

    // Fallback: Muslim World League — most universally accepted
    return 3;
}

export class AladhanAPI {

    /**
     * Fetch prayer times by coordinates and calculation method.
     * Caches the result for the current date.
     */
    static async fetchByCoordinates(
        latitude: number,
        longitude: number,
        method: number = 3,
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
     * Handles next-day wrap (e.g. Fajr tomorrow when all prayers have passed).
     */
    static getSecondsToNextPrayer(prayers: PrayerTime[]): number {
        const next = prayers.find(p => p.isNext);
        if (!next?.time) return 0;

        const now = new Date();
        const [h, m] = next.time.split(':').map(Number);
        let prayerMs = new Date(
            now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0
        ).getTime();

        // If the prayer time is in the past, it means next prayer is tomorrow
        if (prayerMs <= now.getTime()) {
            prayerMs += 24 * 60 * 60 * 1000; // Add 24 hours
        }

        return Math.max(0, Math.floor((prayerMs - now.getTime()) / 1000));
    }
}

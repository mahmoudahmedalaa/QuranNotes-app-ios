/**
 * PrayerTimes — Domain entity for daily prayer schedule.
 */

export interface PrayerTime {
    name: string;          // Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha
    time: string;          // "05:23"
    icon: string;          // Feather name
    isNext: boolean;       // Is this the next upcoming prayer?
    isPast: boolean;       // Has this prayer time passed?
}

export interface PrayerTimesData {
    date: string;          // "2026-02-20"
    hijriDate: string;     // "21 Sha'ban 1447"
    prayers: PrayerTime[];
    location: string;      // "Dubai, UAE"
    method: number;        // Calculation method
}

/** Feather icons for each prayer */
export const PRAYER_ICONS: Record<string, string> = {
    Fajr: 'sunrise',
    Sunrise: 'sun',
    Dhuhr: 'sun',
    Asr: 'clock', // Feather is minimal, clock represents afternoon well
    Maghrib: 'sunset',
    Isha: 'moon',
};

/** Calculation method labels */
export const CALCULATION_METHODS: { id: number; label: string }[] = [
    { id: 1, label: 'University of Islamic Sciences, Karachi' },
    { id: 2, label: 'Islamic Society of North America (ISNA)' },
    { id: 3, label: 'Muslim World League' },
    { id: 4, label: 'Umm Al-Qura University, Makkah' },
    { id: 5, label: 'Egyptian General Authority of Survey' },
];

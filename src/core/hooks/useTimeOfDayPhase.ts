import { usePrayer } from '../../features/prayer/infrastructure/PrayerContext';

type TimePhase = 'morning' | 'evening' | 'night';

export const useTimeOfDayPhase = (): TimePhase => {
    const { nextPrayer } = usePrayer();

    // If simulating Ramadan, we might want to test night more often, but let's stick to strict time logic first
    if (!nextPrayer) {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 18) return 'morning';
        if (hour >= 18 && hour < 20) return 'evening';
        return 'night';
    }

    // Morning phase: Next prayer is Dhuhr, Asr, or Maghrib
    if (['Dhuhr', 'Asr', 'Maghrib'].includes(nextPrayer.name)) {
        return 'morning';
    }

    // Evening phase: Next prayer is Isha (typically right after Maghrib)
    if (nextPrayer.name === 'Isha') {
        return 'evening';
    }

    // Night phase: Next prayer is Fajr (after Isha until dawn)
    // or past midnight until 5am
    return 'night';
};

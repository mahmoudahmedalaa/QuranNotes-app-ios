/**
 * PrayerContext — React Context providing prayer times, location, and countdown.
 * Uses expo-location for user coordinates and AladhanAPI for prayer data.
 * Auto-refreshes at midnight.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as Location from 'expo-location';
import { PrayerTimesData, PrayerTime } from '../../domain/entities/PrayerTimes';
import { AladhanAPI } from '../api/AladhanAPI';
import { useSettings } from '../settings/SettingsContext';

interface PrayerContextType {
    /** Current prayer times data */
    prayerTimes: PrayerTimesData | null;
    /** The next upcoming prayer */
    nextPrayer: PrayerTime | null;
    /** Seconds until the next prayer */
    secondsToNext: number;
    /** Formatted time until next prayer (e.g., "2h 15m") */
    timeToNextPrayer: string;
    /** Whether we're loading prayer times */
    loading: boolean;
    /** Location error message */
    locationError: string | null;
    /** Force-refresh prayer times */
    refresh: () => Promise<void>;
}

const PrayerContext = createContext<PrayerContextType>({
    prayerTimes: null,
    nextPrayer: null,
    secondsToNext: 0,
    timeToNextPrayer: '',
    loading: true,
    locationError: null,
    refresh: async () => { },
});

export const usePrayer = () => useContext(PrayerContext);

/**
 * Format seconds into a human-readable countdown: "2h 15m" or "45m" or "< 1m"
 */
function formatCountdown(seconds: number): string {
    if (seconds <= 0) return '';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m`;
    return '< 1m';
}

export const PrayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { settings } = useSettings();
    const [prayerTimes, setPrayerTimes] = useState<PrayerTimesData | null>(null);
    const [loading, setLoading] = useState(true);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [secondsToNext, setSecondsToNext] = useState(0);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const midnightRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const prayerMethod = settings.prayerMethod ?? 4;

    const fetchPrayerTimes = useCallback(async () => {
        try {
            setLoading(true);
            setLocationError(null);

            // Guard: check if Location native module is actually available
            if (!Location || !Location.requestForegroundPermissionsAsync) {
                setLocationError('Location services not available');
                setLoading(false);
                return;
            }

            // Request location permissions
            let status: Location.PermissionStatus;
            try {
                const result = await Location.requestForegroundPermissionsAsync();
                status = result.status;
            } catch (permErr) {
                // Native module not linked or unavailable
                console.warn('[PrayerContext] Location module unavailable:', permErr);
                setLocationError('Location not available');
                setLoading(false);
                return;
            }

            if (status !== 'granted') {
                setLocationError('Location permission not granted');
                setLoading(false);
                return;
            }

            // Get current location
            let latitude: number;
            let longitude: number;
            try {
                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
                latitude = location.coords.latitude;
                longitude = location.coords.longitude;
            } catch (locErr) {
                console.warn('[PrayerContext] Failed to get position:', locErr);
                setLocationError('Unable to determine location');
                setLoading(false);
                return;
            }

            // Reverse geocode for city name
            let locationName = '';
            try {
                const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
                if (geocode.length > 0) {
                    const g = geocode[0];
                    locationName = [g.city, g.country].filter(Boolean).join(', ');
                }
            } catch {
                // Non-critical — continue without location name
            }

            // Fetch from API
            const data = await AladhanAPI.fetchByCoordinates(latitude, longitude, prayerMethod);
            if (data) {
                data.location = locationName;
                setPrayerTimes(data);

                // Start countdown
                const secs = AladhanAPI.getSecondsToNextPrayer(data.prayers);
                setSecondsToNext(secs);
            }
        } catch (err) {
            console.warn('[PrayerContext] Error:', err);
            setLocationError('Unable to fetch prayer times');
        } finally {
            setLoading(false);
        }
    }, [prayerMethod]);

    // Defer fetch to avoid blocking app startup
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPrayerTimes();
        }, 2000); // 2s delay to let the app render first
        return () => clearTimeout(timer);
    }, [fetchPrayerTimes]);

    // Countdown timer — ticks every 30 seconds for efficiency
    useEffect(() => {
        if (countdownRef.current) clearInterval(countdownRef.current);

        countdownRef.current = setInterval(() => {
            setSecondsToNext(prev => {
                if (prev <= 0) {
                    // Prayer time reached — re-fetch to update "next" status
                    fetchPrayerTimes();
                    return 0;
                }
                return prev - 30;
            });
        }, 30000);

        return () => {
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, [fetchPrayerTimes]);

    // Auto-refresh at midnight
    useEffect(() => {
        const now = new Date();
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 10);
        const msUntilMidnight = tomorrow.getTime() - now.getTime();

        midnightRef.current = setTimeout(() => {
            fetchPrayerTimes();
        }, msUntilMidnight);

        return () => {
            if (midnightRef.current) clearTimeout(midnightRef.current);
        };
    }, [fetchPrayerTimes]);

    const nextPrayer = useMemo(
        () => prayerTimes?.prayers.find(p => p.isNext) || null,
        [prayerTimes],
    );

    const timeToNextPrayer = useMemo(
        () => formatCountdown(secondsToNext),
        [secondsToNext],
    );

    const value = useMemo(() => ({
        prayerTimes,
        nextPrayer,
        secondsToNext,
        timeToNextPrayer,
        loading,
        locationError,
        refresh: fetchPrayerTimes,
    }), [prayerTimes, nextPrayer, secondsToNext, timeToNextPrayer, loading, locationError, fetchPrayerTimes]);

    return (
        <PrayerContext.Provider value={value}>
            {children}
        </PrayerContext.Provider>
    );
};

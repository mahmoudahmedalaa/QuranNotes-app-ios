/**
 * PrayerContext — React Context providing prayer times, location, and countdown.
 * Uses expo-location for user coordinates and AladhanAPI for prayer data.
 * Auto-refreshes at midnight.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as Location from 'expo-location';
import { PrayerTimesData, PrayerTime } from '../../../core/domain/entities/PrayerTimes';
import { AladhanAPI, getMethodForCountry } from '../../../core/api/AladhanAPI';
import { useSettings } from '../../settings/infrastructure/SettingsContext';
import { WidgetBridge, NextPrayerWidgetData } from '../../../../modules/widget-bridge/src';

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
    /** User's current location (null if unavailable) */
    userLocation: { latitude: number; longitude: number } | null;
}

const PrayerContext = createContext<PrayerContextType>({
    prayerTimes: null,
    nextPrayer: null,
    secondsToNext: 0,
    timeToNextPrayer: '',
    loading: true,
    locationError: null,
    refresh: async () => { },
    userLocation: null,
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
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const midnightRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const userMethod = settings.prayerMethod; // undefined = auto-detect from location

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
                if (__DEV__) console.warn('[PrayerContext] Location module unavailable:', permErr);
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
                setUserLocation({ latitude, longitude });
            } catch (locErr) {
                if (__DEV__) console.warn('[PrayerContext] Failed to get position:', locErr);
                setLocationError('Unable to determine location');
                setLoading(false);
                return;
            }

            // Reverse geocode for city name and country (for method auto-detection)
            let locationName = '';
            let detectedCountry: string | undefined;
            try {
                const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
                if (geocode.length > 0) {
                    const g = geocode[0];
                    locationName = [g.city, g.country].filter(Boolean).join(', ');
                    detectedCountry = g.country ?? undefined;
                }
            } catch {
                // Non-critical — continue without location name
            }

            // Determine calculation method:
            // If the user has explicitly set a method in settings, use that.
            // Otherwise, auto-detect from the reverse-geocoded country.
            const prayerMethod = userMethod ?? getMethodForCountry(detectedCountry);

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
            if (__DEV__) console.warn('[PrayerContext] Error:', err);
            setLocationError('Unable to fetch prayer times');
        } finally {
            setLoading(false);
        }
    }, [userMethod]);

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

    // Sync prayer schedule to iOS widget
    useEffect(() => {
        if (!prayerTimes) return;

        const widgetPrayers: NextPrayerWidgetData[] = [];

        // Add remaining prayers for today
        prayerTimes.prayers.forEach(p => {
            if (!p.isPast || p.isNext) {
                const [h, m] = (p.time || '00:00').split(':').map(Number);
                const pTime = new Date();
                pTime.setHours(h, m, 0, 0);

                widgetPrayers.push({
                    name: p.name,
                    time: p.time,
                    timestamp: pTime.getTime() / 1000,
                });
            }
        });

        // Always append a 3-day projected schedule to ensure the widget never runs dry.
        // Prayer times shift by ~1-2 mins per day, making this an extremely reliable fallback
        // so the widget doesn't show "Fajr" incorrectly if the user hasn't opened the app.
        [1, 2, 3].forEach(daysAhead => {
            prayerTimes.prayers.forEach(p => {
                const [h, m] = (p.time || '00:00').split(':').map(Number);
                const projectedDate = new Date();
                projectedDate.setDate(projectedDate.getDate() + daysAhead);
                projectedDate.setHours(h, m, 0, 0);

                widgetPrayers.push({
                    name: p.name,
                    time: p.time, // using today's time strings visually
                    timestamp: projectedDate.getTime() / 1000,
                });
            });
        });

        if (widgetPrayers.length > 0) {
            // New autonomous schedule for updated widgets
            WidgetBridge.setNextPrayers(widgetPrayers);
            // Fallback for currently compiled native widgets
            WidgetBridge.setNextPrayer(widgetPrayers[0]);
        }
    }, [prayerTimes]);

    const value = useMemo(() => ({
        prayerTimes,
        nextPrayer,
        secondsToNext,
        timeToNextPrayer,
        loading,
        locationError,
        refresh: fetchPrayerTimes,
        userLocation,
    }), [prayerTimes, nextPrayer, secondsToNext, timeToNextPrayer, loading, locationError, fetchPrayerTimes, userLocation]);

    return (
        <PrayerContext.Provider value={value}>
            {children}
        </PrayerContext.Provider>
    );
};

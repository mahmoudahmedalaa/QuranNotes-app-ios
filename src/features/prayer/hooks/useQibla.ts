/**
 * useQibla — Shared hook for Qibla compass logic.
 * Subscribes to the device magnetometer, calculates Qibla direction,
 * and returns animated rotation values for smooth compass rendering.
 *
 * Consumed by both QiblaCompass (in-card) and QiblaHeaderIndicator (header).
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSharedValue, withSpring } from 'react-native-reanimated';
import { Magnetometer, type MagnetometerMeasurement } from 'expo-sensors';
import type { Subscription } from 'expo-sensors/build/DeviceSensor';
import { usePrayer } from '../infrastructure/PrayerContext';
import { calculateQiblaDirection, getCardinalDirection, isNearKaaba } from '../domain/qibla';
import { Springs } from '../../../core/theme/DesignSystem';

interface UseQiblaOptions {
    /** Whether the magnetometer should be active. Default: true */
    enabled?: boolean;
}

interface UseQiblaReturn {
    /** Qibla bearing from true north (degrees, 0-360) */
    qiblaBearing: number;
    /** Current device heading from magnetometer (degrees, 0-360) */
    deviceHeading: number;
    /** Animated rotation value (degrees) for the compass needle — use in useAnimatedStyle */
    qiblaRotation: ReturnType<typeof useSharedValue<number>>;
    /** Whether the magnetometer is available on this device */
    isAvailable: boolean;
    /** Whether the compass needs calibration (high jitter detected) */
    needsCalibration: boolean;
    /** Whether the user is near the Kaaba (< 1 km) */
    isAtKaaba: boolean;
    /** Cardinal direction string (e.g., "NE", "SW") */
    cardinalDirection: string;
    /** Formatted bearing string (e.g., "136°") */
    formattedBearing: string;
}

/** Rolling average size for smoothing magnetometer readings */
const SMOOTHING_WINDOW = 5;

/** Magnetometer update interval in milliseconds */
const UPDATE_INTERVAL_MS = 100;

/**
 * Calculate compass heading from magnetometer x, y components.
 * Returns degrees 0-360, where 0 = magnetic north (clockwise).
 *
 * expo-sensors Magnetometer axes (phone flat, face up):
 *   x → towards right edge of device
 *   y → towards top edge of device
 *
 * The magnetic field vector points TOWARD magnetic north.
 * Compass heading = how far the device top is rotated clockwise from north.
 * Formula: heading = -atan2(x, y), measuring clockwise from +y axis.
 */
function calculateHeading(x: number, y: number): number {
    // -atan2(x, y): clockwise angle from device top (+y) to mag north
    let heading = -Math.atan2(x, y) * (180 / Math.PI);
    // Normalize to 0-360
    heading = (heading + 360) % 360;
    return heading;
}

export function useQibla(options: UseQiblaOptions = {}): UseQiblaReturn {
    const { enabled = true } = options;
    const { userLocation } = usePrayer();

    // State
    const [isAvailable, setIsAvailable] = useState(false);
    const [needsCalibration, setNeedsCalibration] = useState(false);
    const [deviceHeading, setDeviceHeading] = useState(0);

    // Smoothing buffer
    const headingSamplesRef = useRef<number[]>([]);

    // Subscription reference
    const subscriptionRef = useRef<Subscription | null>(null);

    // Animated rotation value (consumed by Reanimated's useAnimatedStyle)
    const qiblaRotation = useSharedValue(0);

    // Calculate static Qibla bearing from user location
    const qiblaBearing = userLocation
        ? calculateQiblaDirection(userLocation.latitude, userLocation.longitude)
        : 0;

    const isAtKaaba = userLocation
        ? isNearKaaba(userLocation.latitude, userLocation.longitude)
        : false;

    const cardinalDirection = getCardinalDirection(qiblaBearing);
    const formattedBearing = `${Math.round(qiblaBearing)}°`;

    // Check magnetometer availability
    useEffect(() => {
        let mounted = true;
        Magnetometer.isAvailableAsync().then((available: boolean) => {
            if (mounted) setIsAvailable(available);
        });
        return () => { mounted = false; };
    }, []);

    // Smoothing function — circular average for headings
    const addSample = useCallback((heading: number) => {
        const samples = headingSamplesRef.current;
        samples.push(heading);
        if (samples.length > SMOOTHING_WINDOW) {
            samples.shift();
        }

        // Circular average: convert to unit vectors, average, convert back
        let sinSum = 0;
        let cosSum = 0;
        for (const s of samples) {
            sinSum += Math.sin((s * Math.PI) / 180);
            cosSum += Math.cos((s * Math.PI) / 180);
        }
        const avgHeading = ((Math.atan2(sinSum / samples.length, cosSum / samples.length) * 180) / Math.PI + 360) % 360;

        // Detect high variance → needs calibration
        if (samples.length >= SMOOTHING_WINDOW) {
            let varianceSum = 0;
            for (const s of samples) {
                let diff = s - avgHeading;
                // Handle wraparound
                if (diff > 180) diff -= 360;
                if (diff < -180) diff += 360;
                varianceSum += diff * diff;
            }
            const variance = varianceSum / samples.length;
            setNeedsCalibration(variance > 500); // Threshold: ~22° standard deviation
        }

        return avgHeading;
    }, []);

    // Subscribe to magnetometer when enabled
    useEffect(() => {
        if (!enabled || !isAvailable) {
            // Unsubscribe if disabled
            if (subscriptionRef.current) {
                subscriptionRef.current.remove();
                subscriptionRef.current = null;
            }
            return;
        }

        Magnetometer.setUpdateInterval(UPDATE_INTERVAL_MS);

        subscriptionRef.current = Magnetometer.addListener(({ x, y }: MagnetometerMeasurement) => {
            const rawHeading = calculateHeading(x, y);
            const smoothedHeading = addSample(rawHeading);

            setDeviceHeading(smoothedHeading);

            // Needle rotation = Qibla bearing relative to device heading
            // This tells "how many degrees to rotate the needle from device top"
            const rotation = (qiblaBearing - smoothedHeading + 360) % 360;

            qiblaRotation.value = withSpring(rotation, {
                damping: Springs.gentle.damping,
                stiffness: Springs.gentle.stiffness,
                mass: 1,
                overshootClamping: false,
            });
        });

        return () => {
            if (subscriptionRef.current) {
                subscriptionRef.current.remove();
                subscriptionRef.current = null;
            }
            headingSamplesRef.current = [];
        };
    }, [enabled, isAvailable, qiblaBearing, addSample, qiblaRotation]);

    return {
        qiblaBearing,
        deviceHeading,
        qiblaRotation,
        isAvailable,
        needsCalibration,
        isAtKaaba,
        cardinalDirection,
        formattedBearing,
    };
}

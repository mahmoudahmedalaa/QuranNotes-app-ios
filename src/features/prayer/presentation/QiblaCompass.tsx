/**
 * QiblaCompass — Compact 80pt compass component for inside the PrayerTimesCard.
 * Shows an SVG ring with an animated needle pointing to the Qibla direction,
 * plus bearing and cardinal direction text.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import Svg, { Circle, Line } from 'react-native-svg';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { MotiView } from 'moti';
import { Feather } from '@expo/vector-icons';

import { useQibla } from '../hooks/useQibla';
import { usePrayer } from '../infrastructure/PrayerContext';
import { Spacing, VioletPalette, BrandTokens } from '../../../core/theme/DesignSystem';

const RING_SIZE = 60;
const RING_STROKE = 2;
const NEEDLE_LENGTH = 22;
const COMPONENT_HEIGHT = 80;

interface QiblaCompassProps {
    /** Whether the compass should be actively tracking (tied to card expanded state) */
    enabled?: boolean;
}

export const QiblaCompass: React.FC<QiblaCompassProps> = ({ enabled = true }) => {
    const theme = useTheme();
    const { userLocation, locationError } = usePrayer();
    const {
        qiblaRotation,
        isAvailable,
        needsCalibration,
        isAtKaaba,
        cardinalDirection,
        formattedBearing,
    } = useQibla({ enabled });

    const isDark = theme.dark;
    const ringColor = isDark ? VioletPalette.deepViolet : VioletPalette.wisteria;
    const needleColor = isDark ? BrandTokens.dark.accentPrimary : BrandTokens.light.accentPrimary;
    const bearingTextColor = isDark ? BrandTokens.dark.textPrimary : BrandTokens.light.textPrimary;
    const secondaryTextColor = isDark ? BrandTokens.dark.textSecondary : BrandTokens.light.textSecondary;

    // ALL hooks must be called before any conditional returns (React rules of hooks)
    const animatedRingStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${qiblaRotation.value}deg` }],
    }));

    // Don't render if no location
    if (!userLocation || locationError) return null;

    if (isAtKaaba) {
        return (
            <View style={[styles.container, { height: COMPONENT_HEIGHT }]}>
                <Feather name="navigation" size={24} color={needleColor} />
                <Text style={[styles.atKaabaText, { color: bearingTextColor }]}>
                    You are at the Kaaba ☪️
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { height: COMPONENT_HEIGHT }]}>
            {/* Animated compass ring */}
            <Animated.View style={[styles.ringContainer, animatedRingStyle]}>
                <Svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
                    {/* Background ring */}
                    <Circle
                        cx={RING_SIZE / 2}
                        cy={RING_SIZE / 2}
                        r={(RING_SIZE - RING_STROKE) / 2}
                        stroke={ringColor}
                        strokeWidth={RING_STROKE}
                        fill="none"
                    />
                    {/* Qibla needle — points up (to 12 o'clock) in the rotating container */}
                    <Line
                        x1={RING_SIZE / 2}
                        y1={RING_SIZE / 2}
                        x2={RING_SIZE / 2}
                        y2={RING_SIZE / 2 - NEEDLE_LENGTH}
                        stroke={needleColor}
                        strokeWidth={2.5}
                        strokeLinecap="round"
                    />
                    {/* Needle dot at center */}
                    <Circle
                        cx={RING_SIZE / 2}
                        cy={RING_SIZE / 2}
                        r={3}
                        fill={needleColor}
                    />
                </Svg>
            </Animated.View>

            {/* Bearing info */}
            <View style={styles.infoContainer}>
                <View style={styles.bearingRow}>
                    <Text style={[styles.bearingText, { color: needleColor }]}>
                        {formattedBearing}
                    </Text>
                    <Text style={[styles.cardinalText, { color: secondaryTextColor }]}>
                        {cardinalDirection}
                    </Text>
                </View>
                <Text style={[styles.labelText, { color: secondaryTextColor }]}>
                    Qibla
                </Text>
                {needsCalibration && (
                    <Text style={[styles.calibrationText, { color: '#FFB300' }]}>
                        Move phone in figure-8
                    </Text>
                )}
                {!isAvailable && (
                    <Text style={[styles.calibrationText, { color: secondaryTextColor }]}>
                        Compass unavailable
                    </Text>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingHorizontal: Spacing.sm,
    },
    ringContainer: {
        width: RING_SIZE,
        height: RING_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    bearingRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: Spacing.xs,
    },
    bearingText: {
        fontSize: 22,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    cardinalText: {
        fontSize: 14,
        fontWeight: '600',
    },
    labelText: {
        fontSize: 11,
        fontWeight: '500',
        letterSpacing: 0.3,
        marginTop: 2,
    },
    calibrationText: {
        fontSize: 10,
        fontWeight: '500',
        marginTop: 2,
    },
    atKaabaText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

/**
 * QiblaFullScreen — Full-screen overlay with a large compass.
 * Shows bearing, cardinal direction, calibration status, and a close button.
 */
import React, { useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Platform,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import Animated, { useAnimatedStyle, FadeIn, FadeOut } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';

import { useQibla } from '../hooks/useQibla';
import { usePrayer } from '../infrastructure/PrayerContext';
import {
    Spacing,
    VioletPalette,
    BrandTokens,
    Typography,
} from '../../../core/theme/DesignSystem';

const RING_SIZE = 220;
const RING_STROKE = 3;
const NEEDLE_LENGTH = 80;

interface QiblaFullScreenProps {
    visible: boolean;
    onClose: () => void;
}

export const QiblaFullScreen: React.FC<QiblaFullScreenProps> = ({ visible, onClose }) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const { userLocation } = usePrayer();
    const {
        qiblaRotation,
        qiblaBearing,
        isAvailable,
        needsCalibration,
        isAtKaaba,
        cardinalDirection,
        formattedBearing,
    } = useQibla({ enabled: visible });

    const isDark = theme.dark;
    const bgColor = isDark ? '#0D0D1A' : '#F8F6FF';
    const ringColor = isDark ? VioletPalette.deepViolet : VioletPalette.softLavender;
    const needleColor = isDark ? BrandTokens.dark.accentPrimary : BrandTokens.light.accentPrimary;
    const textPrimary = isDark ? BrandTokens.dark.textPrimary : BrandTokens.light.textPrimary;
    const textSecondary = isDark ? BrandTokens.dark.textSecondary : BrandTokens.light.textSecondary;
    const tickColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
    const cardinalColor = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)';

    // Animated rotation for the whole ring
    const animatedRingStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${qiblaRotation.value}deg` }],
    }));

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={[styles.fullScreen, { backgroundColor: bgColor }]}>
                {/* Close button */}
                <TouchableOpacity
                    onPress={onClose}
                    style={[styles.closeButton, { top: insets.top + Spacing.sm }]}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                    <Feather name="x" size={24} color={textPrimary} />
                </TouchableOpacity>

                {/* Title */}
                <Animated.View
                    entering={FadeIn.delay(200).duration(400)}
                    style={[styles.titleContainer, { marginTop: insets.top + 60 }]}
                >
                    <Text style={[styles.title, { color: textPrimary }]}>Qibla Direction</Text>
                    <Text style={[styles.subtitle, { color: textSecondary }]}>
                        Point your device toward the Kaaba
                    </Text>
                </Animated.View>

                {/* Large compass */}
                <View style={styles.compassContainer}>
                    {isAtKaaba ? (
                        <Animated.View entering={FadeIn.duration(600)} style={styles.atKaabaContainer}>
                            <Feather name="navigation" size={64} color={needleColor} />
                            <Text style={[styles.atKaabaText, { color: textPrimary }]}>
                                You are at the Kaaba
                            </Text>
                            <Text style={[styles.atKaabaSubtext, { color: textSecondary }]}>
                                ☪️ Ma sha Allah
                            </Text>
                        </Animated.View>
                    ) : (
                        <Animated.View style={[styles.ringWrapper, animatedRingStyle]}>
                            <Svg
                                width={RING_SIZE}
                                height={RING_SIZE}
                                viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
                            >
                                {/* Outer ring */}
                                <Circle
                                    cx={RING_SIZE / 2}
                                    cy={RING_SIZE / 2}
                                    r={(RING_SIZE - RING_STROKE) / 2}
                                    stroke={ringColor}
                                    strokeWidth={RING_STROKE}
                                    fill="none"
                                />

                                {/* Tick marks (8 cardinal/intercardinal) */}
                                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
                                    const isMajor = angle % 90 === 0;
                                    const outerR = (RING_SIZE - RING_STROKE) / 2;
                                    const innerR = outerR - (isMajor ? 12 : 7);
                                    const rad = (angle * Math.PI) / 180;
                                    const cx = RING_SIZE / 2;
                                    const cy = RING_SIZE / 2;
                                    return (
                                        <Line
                                            key={angle}
                                            x1={cx + outerR * Math.sin(rad)}
                                            y1={cy - outerR * Math.cos(rad)}
                                            x2={cx + innerR * Math.sin(rad)}
                                            y2={cy - innerR * Math.cos(rad)}
                                            stroke={tickColor}
                                            strokeWidth={isMajor ? 2 : 1}
                                        />
                                    );
                                })}

                                {/* Cardinal labels */}
                                {[
                                    { label: 'N', angle: 0 },
                                    { label: 'E', angle: 90 },
                                    { label: 'S', angle: 180 },
                                    { label: 'W', angle: 270 },
                                ].map(({ label, angle }) => {
                                    const r = (RING_SIZE - RING_STROKE) / 2 - 22;
                                    const rad = (angle * Math.PI) / 180;
                                    const cx = RING_SIZE / 2;
                                    const cy = RING_SIZE / 2;
                                    return (
                                        <SvgText
                                            key={label}
                                            x={cx + r * Math.sin(rad)}
                                            y={cy - r * Math.cos(rad) + 4}
                                            textAnchor="middle"
                                            fontSize={12}
                                            fontWeight="600"
                                            fill={cardinalColor}
                                        >
                                            {label}
                                        </SvgText>
                                    );
                                })}

                                {/* Qibla needle */}
                                <Line
                                    x1={RING_SIZE / 2}
                                    y1={RING_SIZE / 2}
                                    x2={RING_SIZE / 2}
                                    y2={RING_SIZE / 2 - NEEDLE_LENGTH}
                                    stroke={needleColor}
                                    strokeWidth={3}
                                    strokeLinecap="round"
                                />

                                {/* Needle tip (triangle effect via short tail) */}
                                <Line
                                    x1={RING_SIZE / 2}
                                    y1={RING_SIZE / 2}
                                    x2={RING_SIZE / 2}
                                    y2={RING_SIZE / 2 + 16}
                                    stroke={ringColor}
                                    strokeWidth={1.5}
                                    strokeLinecap="round"
                                />

                                {/* Center dot */}
                                <Circle
                                    cx={RING_SIZE / 2}
                                    cy={RING_SIZE / 2}
                                    r={5}
                                    fill={needleColor}
                                />
                            </Svg>
                        </Animated.View>
                    )}
                </View>

                {/* Bearing info */}
                {!isAtKaaba && (
                    <Animated.View
                        entering={FadeIn.delay(400).duration(400)}
                        style={styles.infoContainer}
                    >
                        <View style={styles.bearingRow}>
                            <Text style={[styles.bearingDegrees, { color: needleColor }]}>
                                {formattedBearing}
                            </Text>
                            <Text style={[styles.bearingCardinal, { color: textSecondary }]}>
                                {cardinalDirection}
                            </Text>
                        </View>

                        {needsCalibration && (
                            <View style={[styles.calibrationBanner, { backgroundColor: isDark ? 'rgba(255,179,0,0.12)' : 'rgba(255,179,0,0.08)' }]}>
                                <Feather name="alert-circle" size={14} color="#FFB300" />
                                <Text style={styles.calibrationBannerText}>
                                    Calibrate by waving your phone in a figure-8 pattern
                                </Text>
                            </View>
                        )}

                        {!isAvailable && (
                            <View style={[styles.calibrationBanner, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                                <Feather name="compass" size={14} color={textSecondary} />
                                <Text style={[styles.calibrationBannerText, { color: textSecondary }]}>
                                    Magnetometer not available on this device
                                </Text>
                            </View>
                        )}
                    </Animated.View>
                )}

                {/* Kaaba icon at bottom */}
                <View style={[styles.kaabaIndicator, { marginBottom: insets.bottom + Spacing.xl }]}>
                    <Text style={[styles.kaabaLabel, { color: textSecondary }]}>🕋 Makkah</Text>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    fullScreen: {
        flex: 1,
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        right: Spacing.lg,
        zIndex: 10,
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleContainer: {
        alignItems: 'center',
        gap: Spacing.xs,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '500',
    },
    compassContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ringWrapper: {
        width: RING_SIZE,
        height: RING_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    atKaabaContainer: {
        alignItems: 'center',
        gap: Spacing.md,
    },
    atKaabaText: {
        fontSize: 24,
        fontWeight: '700',
    },
    atKaabaSubtext: {
        fontSize: 16,
        fontWeight: '500',
    },
    infoContainer: {
        alignItems: 'center',
        gap: Spacing.md,
        paddingBottom: Spacing.xl,
    },
    bearingRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: Spacing.sm,
    },
    bearingDegrees: {
        fontSize: 44,
        fontWeight: '700',
        letterSpacing: -1,
    },
    bearingCardinal: {
        fontSize: 20,
        fontWeight: '600',
    },
    calibrationBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: 12,
    },
    calibrationBannerText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#FFB300',
    },
    kaabaIndicator: {
        alignItems: 'center',
    },
    kaabaLabel: {
        fontSize: 13,
        fontWeight: '500',
    },
});

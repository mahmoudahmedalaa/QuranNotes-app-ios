/**
 * KhatmaProgressRing — Circular SVG progress ring showing Khatma completion.
 * Gold gradient fill on the progress arc. Center shows X/30 Juz.
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from 'react-native-paper';
import { MotiView } from 'moti';
import Svg, { Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useKhatma } from '../../../../features/khatma/infrastructure/KhatmaContext';
import { Spacing, BorderRadius, Shadows } from '../../../theme/DesignSystem';
import * as Haptics from 'expo-haptics';

const GOLD = '#D4A853';
const RING_SIZE = 64;
const STROKE_WIDTH = 5;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const KhatmaProgressRing: React.FC = () => {
    const theme = useTheme();
    const router = useRouter();
    const { completedJuz } = useKhatma();

    const completedCount = completedJuz?.length || 0;
    const progress = completedCount / 30;
    const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push('/(tabs)/khatma' as any);
    };

    return (
        <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, delay: 140 }}
            style={{ paddingHorizontal: Spacing.md, marginBottom: Spacing.sm }}
        >
            <Pressable
                onPress={handlePress}
                style={({ pressed }) => [
                    styles.card,
                    { backgroundColor: theme.colors.surface },
                    Shadows.md,
                    pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                ]}
            >
                {/* Progress Ring */}
                <View style={styles.ringContainer}>
                    <Svg width={RING_SIZE} height={RING_SIZE} style={styles.svg}>
                        {/* Background circle */}
                        <Circle
                            cx={RING_SIZE / 2}
                            cy={RING_SIZE / 2}
                            r={RADIUS}
                            stroke={theme.dark ? '#2D3A4F' : '#E2E8F0'}
                            strokeWidth={STROKE_WIDTH}
                            fill="none"
                        />
                        {/* Progress arc */}
                        <Circle
                            cx={RING_SIZE / 2}
                            cy={RING_SIZE / 2}
                            r={RADIUS}
                            stroke={GOLD}
                            strokeWidth={STROKE_WIDTH}
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray={CIRCUMFERENCE}
                            strokeDashoffset={strokeDashoffset}
                            rotation="-90"
                            origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
                        />
                    </Svg>
                    {/* Center text */}
                    <View style={styles.centerText}>
                        <Text style={[styles.completedCount, { color: GOLD }]}>
                            {completedCount}
                        </Text>
                        <Text style={[styles.totalLabel, { color: theme.colors.onSurfaceVariant }]}>
                            /30
                        </Text>
                    </View>
                </View>

                {/* Info */}
                <View style={styles.infoGroup}>
                    <Text style={[styles.title, { color: theme.colors.onSurface }]}>
                        Khatma Progress
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                        {completedCount === 30
                            ? 'Completed! Mashallah'
                            : completedCount === 0
                                ? 'Start your Khatma journey'
                                : `${30 - completedCount} Juz remaining`}
                    </Text>
                </View>

                <Text style={[styles.chevron, { color: theme.colors.onSurfaceVariant }]}>›</Text>
            </Pressable>
        </MotiView>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.sm,
        borderRadius: BorderRadius.lg,
        gap: Spacing.sm,
    },
    ringContainer: {
        width: RING_SIZE,
        height: RING_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    svg: {
        position: 'absolute',
    },
    centerText: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    completedCount: {
        fontSize: 18,
        fontWeight: '800',
    },
    totalLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    infoGroup: {
        flex: 1,
    },
    title: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 13,
    },
    chevron: {
        fontSize: 24,
        fontWeight: '300',
    },
});

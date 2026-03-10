import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from 'react-native-paper';
import Svg, { Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

import { Spacing, BorderRadius, Shadows } from '../../../core/theme/DesignSystem';
import { useKhatma } from '../infrastructure/KhatmaContext';

// Ring constants
const RING_SIZE = 52;
const STROKE_WIDTH = 4;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Khatma progress tile displayed on the Dashboard grid.
 * Self-contained: reads context internally, handles its own navigation.
 */
export function KhatmaTile() {
    const router = useRouter();
    const theme = useTheme();
    const { completedJuz } = useKhatma();

    const completedCount = completedJuz?.length || 0;
    const progress = completedCount / 30;
    const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

    return (
        <Pressable
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/(tabs)/khatma' as any);
            }}
            style={({ pressed }) => [
                styles.gridTile,
                Shadows.sm,
                pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
            ]}
        >
            {/* Full indigo-violet gradient background */}
            <LinearGradient
                colors={
                    theme.dark
                        ? ['#1e1b4b', '#312e81', '#3730a3'] as const
                        : ['#e0e7ff', '#c7d2fe', '#a5b4fc'] as const
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFillObject, { borderRadius: BorderRadius.lg }]}
            />
            {/* Secondary shimmer glow from bottom-right */}
            <LinearGradient
                colors={[
                    theme.dark ? 'rgba(139,92,246,0.35)' : 'rgba(129,140,248,0.30)',
                    'transparent',
                ]}
                start={{ x: 1, y: 1 }}
                end={{ x: 0, y: 0 }}
                style={[StyleSheet.absoluteFillObject, { borderRadius: BorderRadius.lg }]}
            />
            {/* Ring */}
            <View style={styles.tileRingWrap}>
                <Svg width={RING_SIZE} height={RING_SIZE}>
                    <Circle
                        cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS}
                        stroke={theme.dark ? '#a5b4fc' : theme.colors.primary} strokeOpacity={0.2}
                        strokeWidth={STROKE_WIDTH} fill="none"
                    />
                    <Circle
                        cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS}
                        stroke={theme.dark ? '#a5b4fc' : theme.colors.primary} strokeWidth={STROKE_WIDTH} fill="none"
                        strokeLinecap="round"
                        strokeDasharray={CIRCUMFERENCE}
                        strokeDashoffset={strokeDashoffset}
                        rotation="-90"
                        origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
                    />
                </Svg>
                <View style={styles.tileRingCenter}>
                    <Text style={[styles.tileRingNum, { color: theme.dark ? '#e0e7ff' : theme.colors.primary }]}>{completedCount}</Text>
                    <Text style={[styles.tileRingDenom, { color: theme.dark ? '#c7d2fe' : theme.colors.primary }]}>/30</Text>
                </View>
            </View>
            <Text style={[styles.tileLabel, { color: theme.dark ? '#e0e7ff' : theme.colors.primary }]}>Khatma</Text>
            <Text style={[styles.tileSub, { color: theme.dark ? '#c7d2fe' : theme.colors.primary, opacity: 0.9 }]}>
                {completedCount === 0 ? 'Start journey' : `${30 - completedCount} remaining`}
            </Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    gridTile: {
        flex: 1,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 110,
        overflow: 'hidden',
    },
    tileRingWrap: {
        width: RING_SIZE, height: RING_SIZE,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 8,
    },
    tileRingCenter: {
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    tileRingNum: { fontSize: 16, fontWeight: '800' },
    tileRingDenom: { fontSize: 10, fontWeight: '500' },
    tileLabel: { fontSize: 17, fontWeight: '700', marginBottom: 2 },
    tileSub: { fontSize: 13, textAlign: 'center' },
});

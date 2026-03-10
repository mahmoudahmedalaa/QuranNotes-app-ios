import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

import { Spacing, BorderRadius, Shadows } from '../../../core/theme/DesignSystem';
import { usePrayer } from '../../prayer/infrastructure/PrayerContext';
import { useAdhkar } from '../infrastructure/AdhkarContext';

type AdhkarPeriod = 'morning' | 'evening' | 'night';

interface AdhkarTileProps {
    onPress: (period: AdhkarPeriod) => void;
}

/**
 * Adhkar time-of-day tile displayed on the Dashboard grid.
 * Determines the current adhkar period from prayer context and
 * displays atmospheric gradients and icons accordingly.
 */
export function AdhkarTile({ onPress }: AdhkarTileProps) {
    const theme = useTheme();
    const { nextPrayer } = usePrayer();
    const { getCompletionPercentage } = useAdhkar();

    // Smart Adhkar timing:
    // Morning = Fajr until Asr begins
    // Evening = Asr until Isha begins
    // Night = Isha until Fajr begins
    const getAdhkarPeriod = (): AdhkarPeriod => {
        if (nextPrayer) {
            const nightPrayers = ['Midnight', 'Fajr'];
            if (nightPrayers.includes(nextPrayer.name)) return 'night';
            const eveningPrayers = ['Maghrib', 'Isha'];
            if (eveningPrayers.includes(nextPrayer.name)) return 'evening';
            return 'morning';
        }
        // Fallback heuristic
        const h = new Date().getHours();
        if (h >= 20 || h < 5) return 'night';
        if (h >= 15) return 'evening';
        return 'morning';
    };

    const adhkarPeriod = getAdhkarPeriod();
    const adhkarPct = getCompletionPercentage(adhkarPeriod as any);

    // Adhkar tile gradient & text — atmospheric, time-of-day tones
    const adhkarGradient: readonly [string, string, ...string[]] = adhkarPeriod === 'morning'
        ? ['#F0F9FF', '#E0F2FE', '#BAE6FD']
        : adhkarPeriod === 'evening'
            ? ['#0F172A', '#1E293B', '#334155']
            : ['#020617', '#0F172A', '#1E293B'];
    const adhkarTextColor = adhkarPeriod === 'morning' ? '#0C4A6E' : '#CBD5E1';

    return (
        <Pressable
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onPress(adhkarPeriod);
            }}
            style={({ pressed }) => [
                styles.gridTile,
                Shadows.sm,
                pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
            ]}
        >
            {/* Base atmospheric gradient */}
            <LinearGradient
                colors={adhkarGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFillObject, { borderRadius: BorderRadius.lg }]}
            />
            {/* Bold shimmer wash — top-left glow for depth */}
            <LinearGradient
                colors={[
                    adhkarPeriod === 'morning'
                        ? 'rgba(186,230,253,0.70)'
                        : 'rgba(148,163,184,0.28)',
                    'transparent',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFillObject, { borderRadius: BorderRadius.lg }]}
            />
            {/* Secondary warmth from bottom-right */}
            <LinearGradient
                colors={[
                    adhkarPeriod === 'morning'
                        ? 'rgba(125,211,252,0.30)'
                        : 'rgba(100,116,139,0.18)',
                    'transparent',
                ]}
                start={{ x: 1, y: 1 }}
                end={{ x: 0, y: 0 }}
                style={[StyleSheet.absoluteFillObject, { borderRadius: BorderRadius.lg }]}
            />
            {/* Faint stars for night mode */}
            {adhkarPeriod === 'night' && (
                <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                    {[{ top: 12, left: 18, size: 3, opacity: 0.6 },
                    { top: 8, right: 24, size: 2, opacity: 0.4 },
                    { top: 28, right: 14, size: 2.5, opacity: 0.5 },
                    { top: 22, left: 38, size: 1.5, opacity: 0.3 },
                    { bottom: 30, left: 28, size: 2, opacity: 0.35 },
                    { bottom: 16, right: 32, size: 1.5, opacity: 0.25 },
                    { top: 40, left: 58, size: 2, opacity: 0.45 },
                    ].map((star, i) => (
                        <View
                            key={i}
                            style={{
                                position: 'absolute',
                                ...star,
                                width: star.size,
                                height: star.size,
                                borderRadius: star.size / 2,
                                backgroundColor: '#FFFFFF',
                                opacity: star.opacity,
                            }}
                        />
                    ))}
                </View>
            )}
            <View style={styles.tileEmojiWrap}>
                {adhkarPeriod === 'morning' ? (
                    <Feather name="sun" size={28} color={adhkarTextColor} />
                ) : adhkarPeriod === 'evening' ? (
                    <Feather name="sunset" size={28} color={adhkarTextColor} />
                ) : (
                    <Feather name="moon" size={28} color={adhkarTextColor} />
                )}
            </View>
            <Text style={[styles.tileLabel, { color: adhkarTextColor }]}>
                {adhkarPeriod === 'morning' ? 'Morning' : adhkarPeriod === 'evening' ? 'Evening' : 'Night'}
            </Text>
            <Text style={[styles.tileSub, { color: adhkarTextColor, fontWeight: '600' }]}>
                Adhkar
            </Text>
            <Text style={[styles.tileSub2, { color: adhkarTextColor, opacity: 0.8 }]}>
                {adhkarPct > 0 ? `${adhkarPct}% done` : 'Tap to begin'}
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
    tileEmojiWrap: {
        width: 48, height: 48, borderRadius: 24,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 8,
    },
    tileLabel: { fontSize: 17, fontWeight: '700', marginBottom: 2 },
    tileSub: { fontSize: 13, textAlign: 'center' },
    tileSub2: { fontSize: 12, textAlign: 'center', marginTop: 2 },
});

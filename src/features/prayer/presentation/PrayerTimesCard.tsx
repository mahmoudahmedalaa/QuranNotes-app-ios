/**
 * PrayerTimesCard — Premium glassmorphic card showing prayer times on home screen.
 * Compact mode: next prayer + countdown + Hijri date.
 * Expanded mode: full 6-prayer timeline.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { usePrayer } from '../infrastructure/PrayerContext';
import { QiblaCompass } from './QiblaCompass';
import { Spacing, BorderRadius, Shadows } from '../../../core/theme/DesignSystem';
import * as Haptics from 'expo-haptics';

export const PrayerTimesCard: React.FC = () => {
    const theme = useTheme();
    const { prayerTimes, nextPrayer, timeToNextPrayer, loading, locationError } = usePrayer();
    const [expanded, setExpanded] = useState(false);

    if (loading) {
        return (
            <MotiView
                from={{ opacity: 0, translateY: 15 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'spring', damping: 18, delay: 100 }}
                style={{ paddingHorizontal: Spacing.md }}
            >
                <View style={[styles.card, Shadows.md]}>
                    <View style={styles.loadingRow}>
                        <Feather
                            name="clock"
                            size={20}
                            color={theme.colors.onSurfaceVariant}
                        />
                        <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
                            Loading prayer times...
                        </Text>
                    </View>
                </View>
            </MotiView>
        );
    }

    if (locationError || !prayerTimes) {
        return null; // Don't show card if no data
    }

    const toggleExpand = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setExpanded(!expanded);
    };

    const getFeatherIcon = (name: string): keyof typeof Feather.glyphMap => {
        switch (name) {
            case 'Fajr': return 'sunrise';
            case 'Sunrise': return 'sun';
            case 'Dhuhr': return 'cloud';
            case 'Asr': return 'sun';
            case 'Maghrib': return 'sunset';
            case 'Isha': return 'moon';
            default: return 'clock';
        }
    };

    return (
        <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, delay: 100 }}
            style={{ paddingHorizontal: Spacing.md }}
        >
            <Pressable
                onPress={toggleExpand}
                style={({ pressed }) => [
                    pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] },
                ]}
            >
                <View style={[styles.card, { backgroundColor: theme.colors.surface }, Shadows.md]}>
                    {/* Hijri Date row — always shows chevron as collapse affordance */}
                    <View style={styles.hijriRow}>
                        {prayerTimes.hijriDate ? (
                            <Text style={[styles.hijriDate, { color: theme.colors.primary }]}>
                                {prayerTimes.hijriDate}
                            </Text>
                        ) : null}
                        <View style={{ flex: 1 }} />
                        {prayerTimes.location ? (
                            <Text style={[styles.locationText, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
                                {prayerTimes.location}
                            </Text>
                        ) : null}
                        <Feather
                            name={expanded ? 'chevron-up' : 'chevron-down'}
                            size={20}
                            color={theme.colors.onSurfaceVariant}
                            style={{ marginLeft: 6 }}
                        />
                    </View>

                    {/* Next Prayer — always visible at top */}
                    {nextPrayer && (
                        <View style={styles.nextPrayerRow}>
                            <View style={[styles.nextPrayerIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                                <Feather
                                    name={getFeatherIcon(nextPrayer.name)}
                                    size={24}
                                    color={theme.colors.primary}
                                />
                            </View>
                            <View style={styles.nextPrayerInfo}>
                                <Text style={[styles.nextPrayerLabel, { color: theme.colors.onSurfaceVariant }]}>
                                    Next Prayer
                                </Text>
                                <Text style={[styles.nextPrayerName, { color: theme.colors.onSurface }]}>
                                    {nextPrayer.name}
                                </Text>
                            </View>
                            <View style={styles.nextPrayerTime}>
                                <Text style={[styles.nextPrayerTimeText, { color: theme.colors.primary }]}>
                                    {nextPrayer.time}
                                </Text>
                                {timeToNextPrayer ? (
                                    <Text style={[styles.countdownText, { color: theme.colors.onSurfaceVariant }]}>
                                        in {timeToNextPrayer}
                                    </Text>
                                ) : null}
                            </View>
                        </View>
                    )}

                    {/* Expanded: All Prayers */}
                    {expanded && (
                        <View>
                            <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
                            {prayerTimes.prayers.map((prayer, index) => (
                                <MotiView
                                    key={prayer.name}
                                    from={{ opacity: 0, translateX: -10 }}
                                    animate={{ opacity: 1, translateX: 0 }}
                                    transition={{ type: 'timing', duration: 250, delay: index * 50 }}
                                >
                                    <View style={[
                                        styles.prayerRow,
                                        prayer.isNext && styles.prayerRowHighlighted,
                                        prayer.isNext && { backgroundColor: theme.colors.primaryContainer },
                                    ]}>
                                        <Feather
                                            name={getFeatherIcon(prayer.name)}
                                            size={18}
                                            color={prayer.isNext ? theme.colors.primary : prayer.isPast ? theme.colors.onSurfaceVariant : theme.colors.onSurface}
                                        />
                                        <Text style={[
                                            styles.prayerName,
                                            { color: prayer.isNext ? theme.colors.primary : prayer.isPast ? theme.colors.onSurfaceVariant : theme.colors.onSurface },
                                            prayer.isNext && { fontWeight: '700' },
                                        ]}>
                                            {prayer.name}
                                        </Text>
                                        <Text style={[
                                            styles.prayerTime,
                                            { color: prayer.isNext ? theme.colors.primary : prayer.isPast ? theme.colors.onSurfaceVariant : theme.colors.onSurface },
                                            prayer.isNext && { fontWeight: '700' },
                                        ]}>
                                            {prayer.time}
                                        </Text>
                                        {prayer.isPast && (
                                            <Feather
                                                name="check-circle"
                                                size={14}
                                                color={theme.colors.onSurfaceVariant}
                                                style={{ marginLeft: 4 }}
                                            />
                                        )}
                                    </View>
                                </MotiView>
                            ))}

                            {/* Qibla Compass */}
                            <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
                            <MotiView
                                from={{ opacity: 0, translateY: 8 }}
                                animate={{ opacity: 1, translateY: 0 }}
                                transition={{ type: 'timing', duration: 300, delay: 300 }}
                            >
                                <QiblaCompass enabled={expanded} />
                            </MotiView>
                        </View>
                    )}
                </View>
            </Pressable>
        </MotiView>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.xs,
    },
    loadingText: {
        fontSize: 14,
        fontWeight: '500',
    },
    hijriRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    hijriDate: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    locationText: {
        fontSize: 11,
        fontWeight: '500',
        maxWidth: '50%' as unknown as number,
    },
    nextPrayerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    nextPrayerIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextPrayerInfo: {
        flex: 1,
    },
    nextPrayerLabel: {
        fontSize: 11,
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    nextPrayerName: {
        fontSize: 18,
        fontWeight: '700',
        marginTop: 1,
    },
    nextPrayerTime: {
        alignItems: 'flex-end',
    },
    nextPrayerTimeText: {
        fontSize: 18,
        fontWeight: '700',
    },
    countdownText: {
        fontSize: 11,
        fontWeight: '500',
        marginTop: 1,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        marginVertical: Spacing.sm,
    },
    prayerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.sm,
        borderRadius: BorderRadius.md,
        gap: Spacing.sm,
    },
    prayerRowHighlighted: {
        borderRadius: BorderRadius.md,
    },
    prayerName: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
    },
    prayerTime: {
        fontSize: 15,
        fontWeight: '500',
    },
});

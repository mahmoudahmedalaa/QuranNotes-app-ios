/**
 * MoodInsightWidget — Insights tab widget showing mood check-in history.
 * Donut chart for mood frequency + horizontal scrolling dot strip with text labels.
 */
import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MotiView } from 'moti';
import Svg, { Path, Circle as SvgCircle } from 'react-native-svg';
import { MoodType, MOOD_CONFIGS } from '../../../core/domain/entities/Mood';
import { useMood } from '../infrastructure/MoodContext';
import { Spacing, BorderRadius, Shadows, Typography } from '../../../core/theme/DesignSystem';
import { TimeframeSelector, TimeframePeriod } from '../../../shared/components/TimeframeSelector';

const MAX_TIMELINE_DAYS = 7;

/** Group mood entries by date and pick the last mood of each day */
function groupByDay(history: { mood: MoodType; timestamp: string }[]) {
    const map = new Map<string, { mood: MoodType; date: Date }>();
    history.forEach((e) => {
        const d = new Date(e.timestamp);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        map.set(key, { mood: e.mood, date: d });
    });
    return Array.from(map.values())
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, MAX_TIMELINE_DAYS);
}

function formatDayShort(date: Date): string {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return 'Today';
    if (isYesterday) return 'Yest.';
    return date.toLocaleDateString('en-US', { weekday: 'short' });
}

// ── SVG donut arc helpers ────────────────────────────────────────────
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

export default function MoodInsightWidget() {
    const theme = useTheme();
    const { moodHistory } = useMood();
    const [moodTimeframe, setMoodTimeframe] = useState<TimeframePeriod>('30d');

    const dailyMoods = useMemo(() => groupByDay(moodHistory), [moodHistory]);

    // Filter based on selected timeframe
    const filteredHistory = useMemo(() => {
        if (moodTimeframe === 'all') return moodHistory;
        const days = moodTimeframe === '7d' ? 7 : 30;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return moodHistory.filter(e => new Date(e.timestamp) >= cutoff);
    }, [moodHistory, moodTimeframe]);

    const totalCheckins = filteredHistory.length;

    // Frequency map sorted by count descending, top 5 (scoped to 30 days)
    const moodFrequency = useMemo(() => {
        const freq: Partial<Record<MoodType, number>> = {};
        filteredHistory.forEach((entry) => {
            freq[entry.mood] = (freq[entry.mood] || 0) + 1;
        });
        return Object.entries(freq)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5) as [MoodType, number][];
    }, [filteredHistory]);

    // Donut chart data
    const donutSize = 120;
    const strokeWidth = 14;
    const radius = (donutSize - strokeWidth) / 2;
    const cx = donutSize / 2;
    const cy = donutSize / 2;

    const arcs = useMemo(() => {
        if (totalCheckins === 0 || moodFrequency.length === 0) return [];
        let currentAngle = 0;
        const gapDeg = moodFrequency.length > 1 ? 3 : 0; // small gap between arcs
        const totalGap = gapDeg * moodFrequency.length;
        const availableDeg = 360 - totalGap;

        return moodFrequency.map(([mood, count]) => {
            const sweep = (count / totalCheckins) * availableDeg;
            const start = currentAngle;
            const end = currentAngle + sweep;
            currentAngle = end + gapDeg;
            return { mood, count, start, end, color: MOOD_CONFIGS[mood].color };
        });
    }, [moodFrequency, totalCheckins]);

    // Find the top mood for center label
    const topMood = moodFrequency.length > 0 ? moodFrequency[0] : null;

    return (
        <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, delay: 200 }}
        >
            <View style={[styles.card, { backgroundColor: theme.colors.surface }, Shadows.sm]}>
                {/* Header */}
                <View style={styles.headerRow}>
                    <Text style={[styles.title, { color: theme.colors.primary }]}>
                        Mood Journey
                    </Text>
                    <TimeframeSelector
                        selected={moodTimeframe}
                        onSelect={setMoodTimeframe}
                    />
                </View>
                {totalCheckins > 0 && (
                    <Text style={[styles.countText, { color: theme.colors.onSurfaceVariant, marginBottom: Spacing.sm }]}>
                        {totalCheckins} {totalCheckins === 1 ? 'check-in' : 'check-ins'}
                    </Text>
                )}

                {dailyMoods.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                            Check in with your mood to see your journey here
                        </Text>
                    </View>
                ) : (
                    <>
                        {/* ── Donut Chart + Legend ────────────────────── */}
                        <View style={styles.donutRow}>
                            <View style={styles.donutContainer}>
                                <Svg width={donutSize} height={donutSize}>
                                    {/* Background circle */}
                                    <SvgCircle
                                        cx={cx}
                                        cy={cy}
                                        r={radius}
                                        stroke={`${theme.colors.outline}15`}
                                        strokeWidth={strokeWidth}
                                        fill="none"
                                    />
                                    {/* Arcs */}
                                    {arcs.map((arc, idx) => (
                                        <Path
                                            key={idx}
                                            d={describeArc(cx, cy, radius, arc.start, arc.end)}
                                            stroke={arc.color}
                                            strokeWidth={strokeWidth}
                                            strokeLinecap="round"
                                            fill="none"
                                        />
                                    ))}
                                </Svg>
                                {/* Center label — total check-ins (the aggregate the slices represent) */}
                                {totalCheckins > 0 && (
                                    <View style={styles.donutCenter}>
                                        <Text style={[styles.donutPct, { color: theme.colors.primary }]}>
                                            {totalCheckins}
                                        </Text>
                                        <Text style={[styles.donutLabel, { color: theme.colors.onSurfaceVariant }]}>
                                            {totalCheckins === 1 ? 'Check-in' : 'Check-ins'}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Legend */}
                            <View style={styles.legend}>
                                {moodFrequency.map(([mood, count]) => {
                                    const config = MOOD_CONFIGS[mood];
                                    const pct = Math.round((count / totalCheckins) * 100);
                                    return (
                                        <View key={mood} style={styles.legendItem}>
                                            <View style={[styles.legendDot, { backgroundColor: config.color }]} />
                                            <Text style={[styles.legendLabel, { color: theme.colors.onSurface }]}>
                                                {config.label}
                                            </Text>
                                            <Text style={[styles.legendPct, { color: theme.colors.onSurfaceVariant }]}>
                                                {pct}%
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>

                        {/* ── Horizontal dot strip (last 7 days) ─────── */}
                        <View style={styles.stripSection}>
                            <Text style={[styles.stripTitle, { color: theme.colors.onSurfaceVariant }]}>
                                Last {dailyMoods.length} days
                            </Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.stripScroll}
                            >
                                {[...dailyMoods].reverse().map((entry, idx) => {
                                    const config = MOOD_CONFIGS[entry.mood];
                                    return (
                                        <View key={idx} style={styles.stripItem}>
                                            <View style={[styles.stripDot, { backgroundColor: config.color }]} />
                                            <Text style={[styles.stripMood, { color: theme.colors.onSurface }]}>
                                                {config.label}
                                            </Text>
                                            <Text style={[styles.stripDate, { color: theme.colors.onSurfaceVariant }]}>
                                                {formatDayShort(entry.date)}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    </>
                )}
            </View>
        </MotiView>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        marginHorizontal: Spacing.md,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    title: {
        ...Typography.titleMedium,
        fontWeight: '700',
    },
    countText: {
        ...Typography.caption,
        fontWeight: '500',
    },
    timeframeText: {
        fontSize: 11,
        fontWeight: '500',
        marginTop: 2,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
    },
    emptyText: {
        ...Typography.bodyMedium,
        textAlign: 'center',
    },

    // ── Donut ────────────────────────────────────────────
    donutRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    donutContainer: {
        position: 'relative',
        width: 120,
        height: 120,
    },
    donutCenter: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    donutPct: {
        fontSize: 18,
        fontWeight: '800',
    },
    donutLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 1,
    },
    legend: {
        flex: 1,
        gap: 6,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendLabel: {
        fontSize: 13,
        fontWeight: '600',
        flex: 1,
    },
    legendPct: {
        fontSize: 12,
        fontWeight: '500',
    },

    // ── Dot strip ────────────────────────────────────────
    stripSection: {
        marginTop: Spacing.md,
        paddingTop: Spacing.sm,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(128,128,128,0.12)',
    },
    stripTitle: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: Spacing.sm,
    },
    stripScroll: {
        gap: 16,
        paddingHorizontal: 2,
    },
    stripItem: {
        alignItems: 'center',
        gap: 4,
        minWidth: 52,
    },
    stripDot: {
        width: 18,
        height: 18,
        borderRadius: 9,
    },
    stripMood: {
        fontSize: 11,
        fontWeight: '600',
    },
    stripDate: {
        fontSize: 10,
        fontWeight: '500',
    },
});

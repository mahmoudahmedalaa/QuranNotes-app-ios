/**
 * ConsistencyCalendar — Monthly calendar view showing daily activity.
 * Replaces the ugly heatmap grid with a clean, readable calendar.
 * Green dots = active days, empty = inactive.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Spacing, BorderRadius, Shadows } from '../../../core/theme/DesignSystem';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];


const ACCENT = {
    green: '#10B981',
    greenLight: '#D1FAE5',
};

interface ConsistencyHeatmapProps {
    data: { date: string; count: number }[];
}

export const ConsistencyHeatmap: React.FC<ConsistencyHeatmapProps> = ({ data }) => {
    const theme = useTheme();
    const today = new Date();

    // Support navigating months
    const [monthOffset, setMonthOffset] = useState(0);
    const viewDate = useMemo(() => {
        const d = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
        return d;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [monthOffset]);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const monthName = viewDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun

    // Build activity map for quick lookup
    const activityMap = useMemo(() => {
        const map = new Map<string, number>();
        for (const entry of data) {
            map.set(entry.date, entry.count);
        }
        return map;
    }, [data]);

    const isToday = (day: number) => {
        return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    };

    const isActive = (day: number): boolean => {
        const dateStr = new Date(year, month, day).toISOString().split('T')[0];
        return (activityMap.get(dateStr) || 0) > 0;
    };

    // Build calendar grid
    const weeks: (number | null)[][] = [];
    let currentWeek: (number | null)[] = [];

    // Fill leading empty cells
    for (let i = 0; i < firstDayOfWeek; i++) {
        currentWeek.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        currentWeek.push(day);
        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    }

    // Fill trailing empty cells
    if (currentWeek.length > 0) {
        while (currentWeek.length < 7) {
            currentWeek.push(null);
        }
        weeks.push(currentWeek);
    }

    // Count active days this month
    const activeDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)
        .filter(d => isActive(d)).length;

    const canGoForward = monthOffset < 0;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.surface }, Shadows.sm]}>
            {/* Header with month nav */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={[styles.title, { color: theme.colors.primary }]}>Consistency</Text>
                    <Text style={[styles.activeDays, { color: theme.colors.onSurfaceVariant }]}>
                        {activeDays} active day{activeDays !== 1 ? 's' : ''}
                    </Text>
                </View>
                <View style={styles.monthNav}>
                    <Pressable
                        onPress={() => setMonthOffset(prev => prev - 1)}
                        style={styles.navButton}
                    >
                        <MaterialCommunityIcons name="chevron-left" size={20} color={theme.colors.onSurfaceVariant} />
                    </Pressable>
                    <Text style={[styles.monthText, { color: theme.colors.onSurface }]}>
                        {monthName}
                    </Text>
                    <Pressable
                        onPress={() => canGoForward && setMonthOffset(prev => prev + 1)}
                        style={[styles.navButton, !canGoForward && { opacity: 0.3 }]}
                        disabled={!canGoForward}
                    >
                        <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.onSurfaceVariant} />
                    </Pressable>
                </View>
            </View>

            {/* Weekday labels */}
            <View style={styles.weekdayRow}>
                {WEEKDAYS.map((day, i) => (
                    <View key={i} style={styles.weekdayCell}>
                        <Text style={[styles.weekdayText, { color: theme.colors.onSurfaceVariant }]}>
                            {day}
                        </Text>
                    </View>
                ))}
            </View>

            {/* Calendar grid */}
            <View style={styles.calendarGrid}>
                {weeks.map((week, weekIndex) => (
                    <View key={weekIndex} style={styles.weekRow}>
                        {week.map((day, dayIndex) => {
                            if (day === null) {
                                return <View key={dayIndex} style={styles.dayCell} />;
                            }

                            const active = isActive(day);
                            const isTodayCell = isToday(day);
                            const isFuture = month === today.getMonth() && year === today.getFullYear() && day > today.getDate();

                            return (
                                <View key={dayIndex} style={styles.dayCell}>
                                    <View style={[
                                        styles.dayCircle,
                                        active && !isTodayCell && { backgroundColor: ACCENT.greenLight },
                                        isTodayCell && { borderWidth: 2, borderColor: theme.colors.primary },
                                        isFuture && { opacity: 0.3 },
                                    ]}>
                                        <Text style={[
                                            styles.dayText,
                                            { color: isTodayCell ? theme.colors.primary : theme.colors.onSurface },
                                            active && !isTodayCell && { color: ACCENT.green, fontWeight: '700' },
                                            isFuture && { color: theme.colors.onSurfaceVariant },
                                        ]}>
                                            {day}
                                        </Text>
                                    </View>
                                    {active && (
                                        <View style={[styles.activityDot, { backgroundColor: ACCENT.green }]} />
                                    )}
                                </View>
                            );
                        })}
                    </View>
                ))}
            </View>

            {/* Legend */}
            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: ACCENT.green }]} />
                    <Text style={[styles.legendText, { color: theme.colors.onSurfaceVariant }]}>Read that day</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.colors.primary }]} />
                    <Text style={[styles.legendText, { color: theme.colors.onSurfaceVariant }]}>Today</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.md,
    },
    headerLeft: {
        gap: 2,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
    },
    activeDays: {
        fontSize: 12,
    },
    monthNav: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    navButton: {
        padding: 4,
    },
    monthText: {
        fontSize: 13,
        fontWeight: '600',
        minWidth: 100,
        textAlign: 'center',
    },
    weekdayRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    weekdayCell: {
        flex: 1,
        alignItems: 'center',
    },
    weekdayText: {
        fontSize: 11,
        fontWeight: '600',
    },
    calendarGrid: {
        gap: 2,
    },
    weekRow: {
        flexDirection: 'row',
    },
    dayCell: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 3,
    },
    dayCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayText: {
        fontSize: 13,
        fontWeight: '500',
    },
    activityDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        marginTop: 2,
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        marginTop: Spacing.sm,
        paddingTop: Spacing.xs,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontSize: 11,
        fontWeight: '500',
    },
});

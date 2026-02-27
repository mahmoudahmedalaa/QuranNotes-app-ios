import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { PieChart } from 'react-native-gifted-charts';
import { Spacing, BorderRadius, Shadows } from '../../../core/theme/DesignSystem';
import { TimeframeSelector, TimeframePeriod } from '../../../shared/components/TimeframeSelector';

function formatMins(m: number): string {
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const r = m % 60;
    return r > 0 ? `${h}h ${r}m` : `${h}h`;
}

interface BreakdownItem {
    value: number;
    color: string;
    text: string;
    label?: string;
    minutes?: number;
    focused?: boolean;
}

interface TopicBreakdownProps {
    data: BreakdownItem[];
    totalTime: string;
    timeframe: TimeframePeriod;
    onTimeframeChange: (period: TimeframePeriod) => void;
}

export const TopicBreakdown: React.FC<TopicBreakdownProps> = ({
    data = [],
    totalTime,
    timeframe,
    onTimeframeChange,
}) => {
    const theme = useTheme();
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const centerSubtitle = timeframe === 'all' ? 'Total' : 'Activity';

    // Only visible (non-zero) slices go into the chart
    const visibleData = data.filter(item => item.value > 0);

    // Build chart data with onPress handlers
    const chartData = visibleData.map((item, i) => ({
        ...item,
        onPress: () => setSelectedIndex(prev => prev === i ? null : i),
        focused: selectedIndex === i,
        // Ensure even tiny slivers have a visible size for tapping
        shiftX: selectedIndex === i ? 4 : 0,
        shiftY: selectedIndex === i ? -2 : 0,
    }));

    const selectedItem = selectedIndex !== null && selectedIndex < visibleData.length
        ? visibleData[selectedIndex]
        : null;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.surface }, Shadows.sm]}>
            <View style={styles.titleRow}>
                <Text style={[styles.title, { color: theme.colors.primary }]}>Content Breakdown</Text>
                <TimeframeSelector
                    selected={timeframe}
                    onSelect={(p) => { onTimeframeChange(p); setSelectedIndex(null); }}
                />
            </View>

            <View style={styles.chartContainer}>
                <PieChart
                    data={chartData.length > 0 ? chartData : [{ value: 1, color: theme.colors.surfaceVariant, text: '' }]}
                    donut
                    focusOnPress
                    toggleFocusOnPress
                    sectionAutoFocus
                    extraRadius={20}
                    radius={100}
                    innerRadius={60}
                    innerCircleColor={theme.colors.surface}
                    centerLabelComponent={() => (
                        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                            {selectedItem ? (
                                <>
                                    <Text style={{ fontSize: 20, color: selectedItem.color, fontWeight: 'bold' }}>
                                        {formatMins(selectedItem.minutes || 0)}
                                    </Text>
                                    <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant }}>
                                        {selectedItem.label}
                                    </Text>
                                </>
                            ) : (
                                <>
                                    <Text style={{ fontSize: 22, color: theme.colors.primary, fontWeight: 'bold' }}>
                                        {totalTime}
                                    </Text>
                                    <Text style={{ fontSize: 14, color: theme.colors.onSurfaceVariant }}>
                                        {centerSubtitle}
                                    </Text>
                                </>
                            )}
                        </View>
                    )}
                />
            </View>

            {/* Tappable legend — large touch targets for accessibility */}
            <View style={styles.legendRow}>
                {data.map((item, index) => {
                    const visibleIdx = visibleData.findIndex(d => d.label === item.label);
                    const isSelected = visibleIdx >= 0 && selectedIndex === visibleIdx;
                    return (
                        <Pressable
                            key={index}
                            onPress={() => {
                                if (visibleIdx >= 0) {
                                    setSelectedIndex(prev => prev === visibleIdx ? null : visibleIdx);
                                }
                            }}
                            style={({ pressed }) => [
                                styles.legendItem,
                                pressed && { opacity: 0.7 },
                                isSelected && {
                                    backgroundColor: `${item.color}15`,
                                    borderRadius: 10,
                                    borderWidth: 1,
                                    borderColor: `${item.color}30`,
                                },
                            ]}
                        >
                            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                            <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12, fontWeight: isSelected ? '600' : '400' }}>
                                {item.label || 'Item'}
                            </Text>
                            {item.minutes !== undefined && item.minutes > 0 && (
                                <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 10, marginLeft: 3, opacity: 0.7 }}>
                                    ({formatMins(item.minutes)})
                                </Text>
                            )}
                        </Pressable>
                    );
                })}
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
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: Spacing.lg,
    },
    chartContainer: {
        marginVertical: Spacing.md,
    },
    legendRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
        flexWrap: 'wrap',
        gap: 8,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 8,
        minHeight: 36,
    },
    legendDot: {
        height: 10,
        width: 10,
        borderRadius: 5,
        marginRight: 6,
    },
});

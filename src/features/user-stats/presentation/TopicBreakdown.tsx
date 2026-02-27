import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { PieChart } from 'react-native-gifted-charts';
import { Spacing, BorderRadius, Shadows } from '../../../core/theme/DesignSystem';
import { TimeframeSelector, TimeframePeriod } from '../../../shared/components/TimeframeSelector';

interface TopicBreakdownProps {
    data: { value: number; color: string; text: string; label?: string; focused?: boolean }[];
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

    const renderDot = (color: string) => (
        <View
            style={{
                height: 10,
                width: 10,
                borderRadius: 5,
                backgroundColor: color,
                marginRight: 10,
            }}
        />
    );

    const LegendComponent = () => (
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20, flexWrap: 'wrap', gap: 16 }}>
            {data.map((item, index) => (
                <View key={index} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {renderDot(item.color)}
                    <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
                        {item.label || 'Item'}
                    </Text>
                </View>
            ))}
        </View>
    );

    // PieChart can't render 0-value slices correctly, filter those out
    const chartData = data.filter(item => item.value > 0);
    // But the legend should always show all categories
    const legendData = data;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.surface }, Shadows.sm]}>
            <View style={styles.titleRow}>
                <Text style={[styles.title, { color: theme.colors.primary }]}>Content Breakdown</Text>
                <TimeframeSelector
                    selected={timeframe}
                    onSelect={onTimeframeChange}
                />
            </View>

            <View style={styles.chartContainer}>
                <PieChart
                    data={chartData.length > 0 ? chartData : [{ value: 1, color: theme.colors.surfaceVariant, text: '' }]}
                    donut
                    showGradient
                    sectionAutoFocus
                    radius={90}
                    innerRadius={60}
                    innerCircleColor={theme.colors.surface}
                    centerLabelComponent={() => (
                        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                            <Text
                                style={{
                                    fontSize: 22,
                                    color: theme.colors.primary,
                                    fontWeight: 'bold',
                                }}>
                                {totalTime}
                            </Text>
                            <Text
                                style={{ fontSize: 14, color: theme.colors.onSurfaceVariant }}>
                                Total
                            </Text>
                        </View>
                    )}
                />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20, flexWrap: 'wrap', gap: 16 }}>
                {legendData.map((item, index) => (
                    <View key={index} style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {renderDot(item.color)}
                        <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
                            {item.label || 'Item'}
                        </Text>
                    </View>
                ))}
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
});

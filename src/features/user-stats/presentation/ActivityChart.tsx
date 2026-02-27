import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { LineChart } from 'react-native-gifted-charts';
import { Spacing, BorderRadius, Shadows } from '../../../core/theme/DesignSystem';

const { width } = Dimensions.get('window');

interface ActivityChartProps {
    data: { value: number; label: string }[];
}

export const ActivityChart: React.FC<ActivityChartProps> = ({ data }) => {
    const theme = useTheme();

    const maxVal = Math.max(...data.map(d => d.value), 1);
    // Nice max with headroom so peaks never clip
    const niceMax = Math.ceil(maxVal / 10) * 10 + 10;

    const chartData = data.map((d) => ({
        value: d.value,
        label: d.label,
        dataPointColor: theme.colors.primary,
    }));

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.surface }, Shadows.sm]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.colors.primary }]}>
                    Weekly Activity
                </Text>
                <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                    Daily activity (est. minutes)
                </Text>
            </View>

            <View style={styles.chartContainer}>
                <LineChart
                    areaChart
                    data={chartData}
                    height={170}
                    width={width - Spacing.lg * 4}
                    spacing={38}
                    initialSpacing={15}
                    endSpacing={15}
                    color1={theme.colors.primary}
                    startFillColor1={theme.colors.primary}
                    endFillColor1={theme.colors.primary}
                    startOpacity={0.2}
                    endOpacity={0.02}
                    maxValue={niceMax}
                    noOfSections={4}
                    yAxisThickness={0}
                    xAxisThickness={1}
                    xAxisColor={theme.colors.onSurfaceVariant + '20'}
                    yAxisTextStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 10 }}
                    xAxisLabelTextStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 11 }}
                    hideRules
                    hideDataPoints={false}
                    dataPointsColor={theme.colors.primary}
                    dataPointsRadius={5}
                    thickness={2.5}
                    isAnimated
                    animationDuration={800}
                    pointerConfig={{
                        pointerStripHeight: 170,
                        pointerStripWidth: 1,
                        pointerStripColor: theme.colors.primary + '18',
                        pointerStripUptoDataPoint: true,
                        pointerColor: theme.colors.primary,
                        radius: 5,
                        pointerLabelWidth: 80,
                        pointerLabelHeight: 40,
                        activatePointersOnLongPress: false,
                        autoAdjustPointerLabelPosition: true,
                        pointerLabelComponent: (items: { value: number }[]) => {
                            return (
                                <View style={[styles.tooltip, {
                                    backgroundColor: theme.colors.surface,
                                    borderColor: theme.colors.primary + '30',
                                }]}>
                                    <Text style={[styles.tooltipValue, { color: theme.colors.primary }]}>
                                        {items[0]?.value || 0} min
                                    </Text>
                                </View>
                            );
                        },
                    }}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: Spacing.lg,
        paddingBottom: Spacing.lg,
        borderRadius: BorderRadius.xl,
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.md,
    },
    header: {
        marginBottom: Spacing.md,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 12,
    },
    chartContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: -10,
    },
    tooltip: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    tooltipValue: {
        fontSize: 13,
        fontWeight: '700',
    },
});

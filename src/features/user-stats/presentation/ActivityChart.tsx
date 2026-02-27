import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { LineChart } from 'react-native-gifted-charts';
import { Spacing, BorderRadius, Shadows } from '../../../core/theme/DesignSystem';

const { width } = Dimensions.get('window');

interface ActivityChartProps {
    data: { value: number; label: string }[];
}

export const ActivityChart: React.FC<ActivityChartProps> = ({ data }) => {
    const theme = useTheme();
    const [selectedPoint, setSelectedPoint] = useState<{ value: number; label: string } | null>(null);

    const maxVal = Math.max(...data.map(d => d.value), 1);
    // Round up to a nice number for sections
    const niceMax = Math.ceil(maxVal / 10) * 10 + 10;

    // Prepare data with onPress for each point
    const chartData = data.map((d) => ({
        value: d.value,
        label: d.label,
        dataPointColor: theme.colors.primary,
        onPress: () => setSelectedPoint(d),
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

            {/* Selected point detail */}
            {selectedPoint && (
                <Pressable onPress={() => setSelectedPoint(null)}>
                    <View style={[styles.detailPill, { backgroundColor: theme.colors.primaryContainer || theme.colors.surfaceVariant }]}>
                        <Text style={[styles.detailDay, { color: theme.colors.primary }]}>
                            {selectedPoint.label}
                        </Text>
                        <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
                            {selectedPoint.value} min
                        </Text>
                    </View>
                </Pressable>
            )}

            <View style={styles.chartContainer}>
                <LineChart
                    areaChart
                    curved
                    data={chartData}
                    height={200}
                    width={width - Spacing.lg * 4}
                    spacing={40}
                    initialSpacing={20}
                    endSpacing={20}
                    color1={theme.colors.primary}
                    startFillColor1={theme.colors.primary}
                    endFillColor1={theme.colors.primary}
                    startOpacity={0.3}
                    endOpacity={0.05}
                    maxValue={niceMax}
                    noOfSections={4}
                    yAxisThickness={0}
                    xAxisThickness={0}
                    yAxisTextStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 10 }}
                    xAxisLabelTextStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 10 }}
                    hideRules
                    hideDataPoints={false}
                    dataPointsColor={theme.colors.primary}
                    dataPointsRadius={6}
                    focusedDataPointRadius={8}
                    thickness={3}
                    isAnimated
                    animationDuration={1200}
                    focusEnabled
                    showDataPointOnFocus
                    showStripOnFocus
                    stripColor={theme.colors.onSurfaceVariant + '30'}
                    stripWidth={2}
                    onFocus={(_item: { value: number; label: string }, index: number) => {
                        setSelectedPoint(data[index]);
                    }}
                />
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
        marginBottom: Spacing.sm,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 12,
    },
    detailPill: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: Spacing.sm,
        alignSelf: 'center',
    },
    detailDay: {
        fontSize: 14,
        fontWeight: '700',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '500',
    },
    chartContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: -10,
    },
});

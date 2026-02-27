import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Spacing, Gradients, BorderRadius } from '../../src/core/theme/DesignSystem';
import { TimeframePeriod } from '../../src/shared/components/TimeframeSelector';
import { ConsistencyHeatmap } from '../../src/features/user-stats/presentation/ConsistencyHeatmap';
import { ActivityChart } from '../../src/features/user-stats/presentation/ActivityChart';
import { TopicBreakdown } from '../../src/features/user-stats/presentation/TopicBreakdown';
import { StatsWidgetGrid } from '../../src/features/user-stats/presentation/StatsWidgetGrid';
import MoodInsightWidget from '../../src/features/mood/presentation/MoodInsightWidget';
import { useInsightsData } from '../../src/core/hooks/useInsightsData';
import { usePro } from '../../src/features/auth/infrastructure/ProContext';

export default function InsightsScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { isPro } = usePro();
    const { dailyActivity, heatmapData, topicBreakdown, stats } = useInsightsData();
    const [breakdownTimeframe, setBreakdownTimeframe] = useState<TimeframePeriod>('all');

    if (!isPro) {
        return (
            <LinearGradient
                colors={theme.dark ? (['#0F1419', '#1A1F26'] as const) : Gradients.sereneSky}
                style={styles.container}>
                <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center', padding: Spacing.xl }]}>
                    <View style={styles.header}>
                        <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>
                            Insights
                        </Text>
                    </View>
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: theme.colors.primary, textAlign: 'center', marginBottom: Spacing.md }}>
                            Unlock Advanced Insights
                        </Text>
                        <Text variant="bodyLarge" style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant, marginBottom: Spacing.xl }}>
                            Get detailed analytics, consistency heatmaps, and AI-powered reflections with Premium.
                        </Text>
                        <Button
                            mode="contained"
                            onPress={() => router.push('/paywall')}
                            style={{ borderRadius: BorderRadius.lg, width: '100%' }}
                            contentStyle={{ height: 50 }}
                        >
                            Unlock Premium
                        </Button>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient
            colors={theme.dark ? (['#0F1419', '#1A1F26'] as const) : Gradients.sereneSky}
            style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>
                        Insights
                    </Text>
                </View>

                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}>
                    <StatsWidgetGrid
                        currentStreak={stats.currentStreak}
                        longestStreak={stats.longestStreak}
                        totalTime={stats.totalTimeFormatted}
                        pagesRead={stats.pagesRead}
                        notesCount={stats.notesCount}
                        recordingsCount={stats.recordingsCount}
                        totalRecordingMinutes={stats.totalRecordingMinutes}
                    />

                    <ActivityChart data={dailyActivity} />

                    <ConsistencyHeatmap data={heatmapData} />

                    <TopicBreakdown
                        data={topicBreakdown}
                        totalTime={stats.totalTimeFormatted}
                        timeframe={breakdownTimeframe}
                        onTimeframeChange={setBreakdownTimeframe}
                    />

                    <MoodInsightWidget />

                    <View style={{ height: Spacing.xl }} />
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: '800',
        letterSpacing: -1,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
});

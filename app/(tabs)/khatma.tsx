/**
 * Khatma Tab Screen — Surah-based sequential reading
 * "Read the Quran one surah at a time. Juz progress fills in automatically."
 */
import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useKhatma } from '../../src/features/khatma/infrastructure/KhatmaContext';
import { ProgressRing } from '../../src/features/khatma/presentation/ProgressRing';
import { JuzGrid } from '../../src/features/khatma/presentation/JuzGrid';
import { JuzSurahList } from '../../src/features/khatma/presentation/TodayReadingCard';
import { CatchUpBanner } from '../../src/features/khatma/presentation/CatchUpBanner';
import {
    Spacing,
    Gradients,
    Shadows,
    BorderRadius,
} from '../../src/core/theme/DesignSystem';

const KhatmaCelebrationModal = React.lazy(() =>
    import('../../src/features/khatma/presentation/KhatmaCelebrationModal').then(m => ({
        default: m.KhatmaCelebrationModal,
    }))
);

const ACCENT = {
    gold: '#F5A623',
    green: '#10B981',
};

const CELEBRATION_SHOWN_KEY = 'khatma_celebration_shown_round';
const ONBOARDING_DISMISSED_KEY = 'khatma_onboarding_dismissed';

// ─── Active Khatma Tracker View ───────────────────────────────────────────

function ActiveTrackerView() {
    const theme = useTheme();
    const {
        completedSurahs,
        completedJuz,
        currentJuz,
        nextSurah,
        markSurahComplete,
        unmarkSurah,
        isComplete,
        totalPagesRead,
        streakDays,
        currentRound,
        completedRounds,
        startNextRound,
        isGated,
        loading,
    } = useKhatma();

    const [showCelebration, setShowCelebration] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [selectedJuz, setSelectedJuz] = useState<number | null>(null);

    // Check if onboarding banner should be shown
    useEffect(() => {
        AsyncStorage.getItem(ONBOARDING_DISMISSED_KEY).then(val => {
            if (!val) setShowOnboarding(true);
        }).catch(() => { /* silent — onboarding state is non-critical */ });
    }, []);

    const dismissOnboarding = () => {
        setShowOnboarding(false);
        AsyncStorage.setItem(ONBOARDING_DISMISSED_KEY, 'true').catch(() => { });
    };

    // ── Celebration trigger ──
    const triggerCelebrationIfNeeded = useCallback(async () => {
        if (!isComplete || loading) return;
        try {
            const shownForRound = await AsyncStorage.getItem(CELEBRATION_SHOWN_KEY);
            if (shownForRound !== String(currentRound)) {
                setShowCelebration(true);
            }
        } catch {
            setShowCelebration(true);
        }
    }, [isComplete, currentRound, loading]);

    // Detect in-session completion (all 114 surahs)
    const prevCompletedCountRef = useRef<number | null>(null);
    useEffect(() => {
        if (loading) return;
        const prev = prevCompletedCountRef.current;
        prevCompletedCountRef.current = completedSurahs.length;
        if (prev === null) return;
        if (completedSurahs.length >= 114 && prev < 114) {
            setShowCelebration(true);
        }
    }, [completedSurahs.length, loading]);

    // Fallback: check on tab focus
    useFocusEffect(
        useCallback(() => {
            triggerCelebrationIfNeeded();
        }, [triggerCelebrationIfNeeded]),
    );


    return (
        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.activeContent}
            showsVerticalScrollIndicator={false}
        >
            {/* ── Header ── */}
            <MotiView
                from={{ opacity: 0, translateY: -10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'spring', damping: 18 }}
            >
                <View style={styles.header}>
                    <View style={styles.headerTopRow}>
                        <View style={styles.headerLeftGroup}>
                            <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>
                                Khatma
                            </Text>
                        </View>
                        <View style={[styles.progressBadge, { backgroundColor: theme.dark ? theme.colors.surface : '#FFFFFF' }]}>
                            <MaterialCommunityIcons name="book-open-variant" size={14} color={theme.colors.primary} />
                            <Text style={[styles.progressBadgeText, { color: theme.colors.primary }]}>
                                {completedSurahs.length} of 114 Surahs
                            </Text>
                        </View>
                    </View>
                </View>
            </MotiView>

            {/* ── Onboarding Banner (dismissible, shown once) ── */}
            {showOnboarding && (
                <MotiView
                    from={{ opacity: 0, translateY: -8 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'spring', damping: 18, delay: 50 }}
                >
                    <View style={[styles.onboardingBanner, { backgroundColor: theme.dark ? theme.colors.surface : '#FFFFFF' }]}>
                        <View style={styles.onboardingContent}>
                            <MaterialCommunityIcons name="information-outline" size={18} color={theme.colors.primary} />
                            <Text style={[styles.onboardingText, { color: theme.colors.primary }]}>
                                Read one surah at a time. Your Juz progress fills in automatically as you go.
                            </Text>
                        </View>
                        <Pressable onPress={dismissOnboarding} hitSlop={12}>
                            <MaterialCommunityIcons name="close" size={18} color={theme.colors.primary} />
                        </Pressable>
                    </View>
                </MotiView>
            )}

            {/* ── Swipeable Surah Cards (top) ── */}
            <JuzSurahList
                currentJuz={currentJuz}
                displayJuz={selectedJuz}
                completedSurahs={completedSurahs}
                nextSurahNumber={nextSurah.number}
                onMarkComplete={(n) => markSurahComplete(n)}
                onUnmark={(n) => {
                    // Pin the view to the currently active juz BEFORE unmark
                    // so that currentJuz recalculation doesn't cause a jump
                    const activeJuz = selectedJuz ?? currentJuz;
                    setSelectedJuz(activeJuz);
                    unmarkSurah(n);
                }}
                isGated={isGated}
                onAdvanceJuz={() => {
                    const nextJuz = (selectedJuz ?? currentJuz) + 1;
                    if (nextJuz <= 30) {
                        setSelectedJuz(nextJuz);
                    }
                }}
            />

            {/* ── Progress Ring + Status ── */}
            <MotiView
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 18, delay: 100 }}
            >
                <View style={[styles.progressSection, { backgroundColor: theme.colors.surface }, Shadows.sm]}>
                    {/* Trophy badge */}
                    {(isComplete || completedRounds.length > 0) && (
                        <MotiView
                            from={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', damping: 12, delay: 400 }}
                            style={styles.trophyBadgeCorner}
                        >
                            <Pressable
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    setShowCelebration(true);
                                }}
                                style={({ pressed }) => [
                                    styles.trophyBadge,
                                    {
                                        backgroundColor: ACCENT.gold,
                                        ...Shadows.md,
                                    },
                                    pressed && { transform: [{ scale: 0.9 }] },
                                ]}
                            >
                                <MaterialCommunityIcons name="trophy" size={16} color="#FFF" />
                                <Text style={styles.trophyText}>
                                    {completedRounds.length + (isComplete ? 1 : 0)}×
                                </Text>
                            </Pressable>
                        </MotiView>
                    )}
                    <View style={styles.ringWrapper}>
                        <ProgressRing completed={completedJuz.length} totalPagesRead={totalPagesRead} />
                    </View>
                    <CatchUpBanner
                        isComplete={isComplete}
                        completedCount={completedJuz.length}
                        totalPagesRead={totalPagesRead}
                    />
                </View>
            </MotiView>

            {/* ── Juz Grid (collapsible, auto-derived) ── */}
            <JuzGrid
                completedJuz={completedJuz}
                currentJuz={currentJuz}
                selectedJuz={selectedJuz}
                onJuzPress={(juz) => setSelectedJuz(prev => prev === juz ? null : juz)}
            />

            {/* ── Celebration Modal ── */}
            {showCelebration && (
                <Suspense fallback={null}>
                    <KhatmaCelebrationModal
                        visible={showCelebration}
                        onDismiss={() => {
                            setShowCelebration(false);
                            AsyncStorage.setItem(CELEBRATION_SHOWN_KEY, String(currentRound)).catch(() => { });
                        }}
                        onStartNextRound={() => {
                            const nextRound = currentRound + 1;
                            startNextRound();
                            setShowCelebration(false);
                            AsyncStorage.setItem(CELEBRATION_SHOWN_KEY, String(nextRound)).catch(() => { });
                        }}
                        currentRound={currentRound}
                        totalPagesRead={totalPagesRead}
                        completedJuzCount={completedJuz.length}
                        streakDays={streakDays}
                    />
                </Suspense>
            )}
        </ScrollView>
    );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function KhatmaScreen() {
    const theme = useTheme();
    const isDark = theme.dark;
    const gradientColors: [string, string] = isDark
        ? [Gradients.nightSky[0], Gradients.nightSky[1]]
        : [Gradients.sereneSky[0], Gradients.sereneSky[1]];

    return (
        <LinearGradient colors={gradientColors} style={styles.gradient}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <ActiveTrackerView />
            </SafeAreaView>
        </LinearGradient>
    );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    gradient: { flex: 1 },
    safeArea: { flex: 1 },
    scrollView: { flex: 1 },
    activeContent: {
        padding: Spacing.md,
        paddingBottom: 120,
        gap: Spacing.md,
    },
    header: {
        paddingHorizontal: Spacing.xs,
    },
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeftGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
    },
    progressBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: BorderRadius.full,
    },
    progressBadgeText: {
        fontSize: 13,
        fontWeight: '600',
    },
    onboardingBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.lg,
        marginHorizontal: Spacing.xs,
    },
    onboardingContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
        marginRight: 8,
    },
    onboardingText: {
        fontSize: 13,
        fontWeight: '500',
        flex: 1,
        lineHeight: 18,
    },
    progressSection: {
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
        marginHorizontal: Spacing.xs,
        position: 'relative' as const,
    },
    ringWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    trophyBadgeCorner: {
        position: 'absolute' as const,
        top: Spacing.sm,
        right: Spacing.sm,
        zIndex: 10,
    },
    trophyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: BorderRadius.full,
    },
    trophyText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '800',
    },
});

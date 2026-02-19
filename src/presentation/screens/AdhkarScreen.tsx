import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Dimensions,
} from 'react-native';
import { useTheme, ProgressBar } from 'react-native-paper';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAdhkar, AdhkarPeriod, Dhikr } from '../../infrastructure/adhkar/AdhkarContext';
import { Spacing, BorderRadius, Shadows } from '../theme/DesignSystem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Category colors ──────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
    protection: { bg: '#3B82F620', text: '#3B82F6', icon: 'shield-checkmark' },
    praise: { bg: '#F59E0B20', text: '#F59E0B', icon: 'sunny' },
    forgiveness: { bg: '#8B5CF620', text: '#8B5CF6', icon: 'heart' },
    general: { bg: '#10B98120', text: '#10B981', icon: 'leaf' },
};

type SessionPhase = 'intro' | 'active' | 'complete';

interface AdhkarScreenProps {
    onClose: () => void;
}

export const AdhkarScreen = ({ onClose }: AdhkarScreenProps) => {
    const theme = useTheme();
    const {
        adhkar,
        todayProgress,
        incrementCount,
        resetDhikr,
        isSessionComplete,
        getStreak,
    } = useAdhkar();

    const currentHour = new Date().getHours();
    const defaultPeriod: AdhkarPeriod = currentHour < 15 ? 'morning' : 'evening';
    const [period, setPeriod] = useState<AdhkarPeriod>(defaultPeriod);
    const [phase, setPhase] = useState<SessionPhase>('intro');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const dhikrList = adhkar[period];
    const totalDhikr = dhikrList.length;
    const currentDhikr = dhikrList[currentIndex];
    const streak = getStreak();
    const sessionAlreadyDone = isSessionComplete(period);

    // Colors based on period
    const isMorning = period === 'morning';
    const gradientColors = isMorning
        ? ['#FEF3C7', '#FDE68A', '#F59E0B'] as const
        : ['#1E1B4B', '#312E81', '#4338CA'] as const;
    const textColor = isMorning ? '#78350F' : '#FFFFFF';
    const subtextColor = isMorning ? '#92400E' : '#C7D2FE';
    const accentColor = isMorning ? '#78350F' : '#A5B4FC';

    // Get remaining count for current dhikr
    const getRemainingForDhikr = useCallback((dhikr: Dhikr): number => {
        const progress = todayProgress[period];
        const done = progress?.completed[dhikr.id] || 0;
        return Math.max(0, dhikr.repeatCount - done);
    }, [todayProgress, period]);

    // Count how many dhikr are fully completed
    const completedDhikrCount = dhikrList.filter(d => getRemainingForDhikr(d) === 0).length;

    // Estimate session time (~15 seconds per dhikr item)
    const estimatedMinutes = Math.max(1, Math.ceil(totalDhikr * 0.25));

    // Handle tap on current dhikr
    const handleTap = useCallback(async () => {
        if (!currentDhikr || isTransitioning) return;

        const remaining = getRemainingForDhikr(currentDhikr);
        if (remaining <= 0) return;

        // Haptic feedback
        if (remaining === 1) {
            // Last tap — heavy feedback
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        await incrementCount(period, currentDhikr.id);

        // Check if this dhikr is now complete (remaining was 1, now 0)
        if (remaining === 1) {
            // Auto-advance after a brief pause
            setIsTransitioning(true);
            autoAdvanceTimer.current = setTimeout(() => {
                if (currentIndex < totalDhikr - 1) {
                    setCurrentIndex(prev => prev + 1);
                } else {
                    // All dhikr done — go to completion
                    setPhase('complete');
                }
                setIsTransitioning(false);
            }, 600);
        }
    }, [currentDhikr, currentIndex, totalDhikr, getRemainingForDhikr, incrementCount, period, isTransitioning]);

    // Cleanup timer
    useEffect(() => {
        return () => {
            if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
        };
    }, []);

    // Skip forward/backward
    const goNext = useCallback(() => {
        if (currentIndex < totalDhikr - 1) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setCurrentIndex(prev => prev + 1);
        } else {
            setPhase('complete');
        }
    }, [currentIndex, totalDhikr]);

    const goPrev = useCallback(() => {
        if (currentIndex > 0) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setCurrentIndex(prev => prev - 1);
        }
    }, [currentIndex]);

    // ═══════════════════════════════════════════════════════════════════
    // INTRO PHASE
    // ═══════════════════════════════════════════════════════════════════
    if (phase === 'intro') {
        return (
            <LinearGradient colors={gradientColors} style={styles.container}>
                <Pressable onPress={onClose} style={styles.closeButton} hitSlop={12}>
                    <Ionicons name="close" size={24} color={textColor} />
                </Pressable>

                <View style={styles.introContent}>
                    <MotiView
                        from={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', damping: 15 }}
                    >
                        <Text style={styles.introEmoji}>
                            {isMorning ? '☀️' : '🌙'}
                        </Text>
                    </MotiView>

                    <MotiView
                        from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'spring', damping: 18, delay: 100 }}
                    >
                        <Text style={[styles.introTitle, { color: textColor }]}>
                            {isMorning ? 'Morning Adhkar' : 'Evening Adhkar'}
                        </Text>
                    </MotiView>

                    <MotiView
                        from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'spring', damping: 18, delay: 200 }}
                    >
                        <Text style={[styles.introDescription, { color: subtextColor }]}>
                            The Prophet ﷺ recommended these daily supplications for protection, peace, and blessings. Recite them each {isMorning ? 'morning' : 'evening'} to strengthen your connection with Allah.
                        </Text>
                    </MotiView>

                    <MotiView
                        from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'spring', damping: 18, delay: 300 }}
                        style={styles.introStats}
                    >
                        <View style={[styles.statPill, { backgroundColor: `${textColor}15` }]}>
                            <Ionicons name="list" size={16} color={textColor} />
                            <Text style={[styles.statText, { color: textColor }]}>
                                {totalDhikr} adhkar
                            </Text>
                        </View>
                        <View style={[styles.statPill, { backgroundColor: `${textColor}15` }]}>
                            <Ionicons name="time-outline" size={16} color={textColor} />
                            <Text style={[styles.statText, { color: textColor }]}>
                                ~{estimatedMinutes} min
                            </Text>
                        </View>
                        {streak > 0 && (
                            <View style={[styles.statPill, { backgroundColor: `${textColor}15` }]}>
                                <Text style={[styles.statText, { color: textColor }]}>
                                    🔥 {streak} day streak
                                </Text>
                            </View>
                        )}
                    </MotiView>

                    {/* Period toggle */}
                    <MotiView
                        from={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 350 }}
                        style={styles.periodToggle}
                    >
                        <Pressable
                            onPress={() => setPeriod('morning')}
                            style={[
                                styles.periodButton,
                                isMorning && [styles.periodButtonActive, { backgroundColor: `${textColor}20` }],
                            ]}
                        >
                            <Text style={[styles.periodButtonText, { color: isMorning ? textColor : `${textColor}60` }]}>
                                ☀️ Morning
                            </Text>
                        </Pressable>
                        <Pressable
                            onPress={() => setPeriod('evening')}
                            style={[
                                styles.periodButton,
                                !isMorning && [styles.periodButtonActive, { backgroundColor: `${textColor}20` }],
                            ]}
                        >
                            <Text style={[styles.periodButtonText, { color: !isMorning ? textColor : `${textColor}60` }]}>
                                🌙 Evening
                            </Text>
                        </Pressable>
                    </MotiView>

                    {sessionAlreadyDone && (
                        <MotiView
                            from={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 400 }}
                            style={styles.alreadyDoneBadge}
                        >
                            <Text style={styles.alreadyDoneText}>
                                ✅ You already completed this session today
                            </Text>
                        </MotiView>
                    )}
                </View>

                <MotiView
                    from={{ opacity: 0, translateY: 30 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'spring', damping: 18, delay: 400 }}
                    style={styles.introBottom}
                >
                    <Pressable
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            // Find first incomplete dhikr
                            const firstIncomplete = dhikrList.findIndex(d => getRemainingForDhikr(d) > 0);
                            setCurrentIndex(firstIncomplete >= 0 ? firstIncomplete : 0);
                            setPhase('active');
                        }}
                        style={({ pressed }) => [
                            styles.beginButton,
                            { backgroundColor: textColor },
                            pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
                        ]}
                    >
                        <Text style={[styles.beginButtonText, { color: isMorning ? '#FEF3C7' : '#312E81' }]}>
                            {sessionAlreadyDone ? 'Review Session' : 'Begin Session'}
                        </Text>
                        <Ionicons name="arrow-forward" size={20} color={isMorning ? '#FEF3C7' : '#312E81'} />
                    </Pressable>
                </MotiView>
            </LinearGradient>
        );
    }

    // ═══════════════════════════════════════════════════════════════════
    // COMPLETION PHASE
    // ═══════════════════════════════════════════════════════════════════
    if (phase === 'complete') {
        return (
            <LinearGradient colors={gradientColors} style={styles.container}>
                <View style={styles.completeContent}>
                    <MotiView
                        from={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', damping: 12 }}
                    >
                        <Text style={styles.completeEmoji}>✅</Text>
                    </MotiView>

                    <MotiView
                        from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'spring', damping: 18, delay: 200 }}
                    >
                        <Text style={[styles.completeTitle, { color: textColor }]}>
                            Session Complete
                        </Text>
                        <Text style={[styles.completeSubtitle, { color: subtextColor }]}>
                            May Allah accept your dhikr and grant you His protection and blessings.
                        </Text>
                    </MotiView>

                    {streak > 0 && (
                        <MotiView
                            from={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', damping: 15, delay: 400 }}
                            style={[styles.streakCard, { backgroundColor: `${textColor}15` }]}
                        >
                            <Text style={styles.streakEmoji}>🔥</Text>
                            <Text style={[styles.streakText, { color: textColor }]}>
                                {streak} day streak
                            </Text>
                        </MotiView>
                    )}

                    <MotiView
                        from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'spring', damping: 18, delay: 500 }}
                    >
                        <Pressable
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                onClose();
                            }}
                            style={({ pressed }) => [
                                styles.beginButton,
                                { backgroundColor: textColor, marginTop: Spacing.xl },
                                pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
                            ]}
                        >
                            <Text style={[styles.beginButtonText, { color: isMorning ? '#FEF3C7' : '#312E81' }]}>
                                Done
                            </Text>
                        </Pressable>
                    </MotiView>
                </View>
            </LinearGradient>
        );
    }

    // ═══════════════════════════════════════════════════════════════════
    // ACTIVE SESSION PHASE — One dhikr at a time
    // ═══════════════════════════════════════════════════════════════════
    const remaining = getRemainingForDhikr(currentDhikr);
    const isDhikrComplete = remaining === 0;
    const catColor = CATEGORY_COLORS[currentDhikr.category] || CATEGORY_COLORS.general;

    return (
        <LinearGradient colors={gradientColors} style={styles.container}>
            {/* Header: close + progress */}
            <View style={styles.activeHeader}>
                <Pressable onPress={onClose} hitSlop={12}>
                    <Ionicons name="close" size={24} color={textColor} />
                </Pressable>

                <View style={styles.progressInfo}>
                    <Text style={[styles.progressText, { color: subtextColor }]}>
                        {currentIndex + 1} of {totalDhikr}
                    </Text>
                </View>

                <Pressable
                    onPress={goNext}
                    hitSlop={12}
                >
                    <Ionicons
                        name="chevron-forward"
                        size={24}
                        color={currentIndex < totalDhikr - 1 ? textColor : 'transparent'}
                    />
                </Pressable>
            </View>

            {/* Progress bar */}
            <ProgressBar
                progress={(currentIndex + 1) / totalDhikr}
                color={accentColor}
                style={[styles.sessionProgressBar, { backgroundColor: `${textColor}15` }]}
            />

            {/* Main dhikr card — TAP ANYWHERE */}
            <AnimatePresence exitBeforeEnter>
                <MotiView
                    key={`dhikr-${currentDhikr.id}-${currentIndex}`}
                    from={{ opacity: 0, translateX: 50 }}
                    animate={{ opacity: 1, translateX: 0 }}
                    exit={{ opacity: 0, translateX: -50 }}
                    transition={{ type: 'spring', damping: 20 }}
                    style={styles.activeCardWrapper}
                >
                    <Pressable
                        onPress={handleTap}
                        style={({ pressed }) => [
                            styles.activeCard,
                            { backgroundColor: theme.colors.surface },
                            Shadows.lg,
                            pressed && !isDhikrComplete && { opacity: 0.95, transform: [{ scale: 0.98 }] },
                        ]}
                    >
                        {/* Category + source badge */}
                        <View style={styles.cardTopRow}>
                            <View style={[styles.categoryBadge, { backgroundColor: catColor.bg }]}>
                                <Ionicons name={catColor.icon as any} size={12} color={catColor.text} />
                                <Text style={[styles.categoryText, { color: catColor.text }]}>
                                    {currentDhikr.category}
                                </Text>
                            </View>
                            <Text style={[styles.sourceText, { color: theme.colors.onSurfaceVariant }]}>
                                {currentDhikr.source}
                            </Text>
                        </View>

                        {/* Arabic text */}
                        <Text style={[styles.arabicText, {
                            color: theme.colors.onSurface,
                            opacity: isDhikrComplete ? 0.4 : 1,
                        }]}>
                            {currentDhikr.arabic}
                        </Text>

                        {/* Translation */}
                        <Text style={[styles.translationText, { color: theme.colors.onSurfaceVariant }]}>
                            {currentDhikr.translation}
                        </Text>

                        {/* Counter */}
                        <View style={styles.counterSection}>
                            {isDhikrComplete ? (
                                <View style={styles.completeBadge}>
                                    <Ionicons name="checkmark-circle" size={32} color="#10B981" />
                                    <Text style={styles.completeLabel}>Done</Text>
                                </View>
                            ) : (
                                <View style={styles.countdownContainer}>
                                    <Text style={[styles.countdownNumber, { color: theme.colors.primary }]}>
                                        {remaining}
                                    </Text>
                                    <Text style={[styles.countdownLabel, { color: theme.colors.onSurfaceVariant }]}>
                                        {remaining === 1 ? 'tap remaining' : 'taps remaining'}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Tap hint */}
                        {!isDhikrComplete && (
                            <Text style={[styles.tapHint, { color: theme.colors.onSurfaceVariant }]}>
                                Tap anywhere to count
                            </Text>
                        )}
                    </Pressable>
                </MotiView>
            </AnimatePresence>

            {/* Navigation arrows at bottom */}
            <View style={styles.navRow}>
                <Pressable
                    onPress={goPrev}
                    style={({ pressed }) => [
                        styles.navButton,
                        { backgroundColor: `${textColor}15` },
                        pressed && { opacity: 0.7 },
                        currentIndex === 0 && { opacity: 0.3 },
                    ]}
                    disabled={currentIndex === 0}
                >
                    <Ionicons name="chevron-back" size={20} color={textColor} />
                    <Text style={[styles.navButtonText, { color: textColor }]}>Prev</Text>
                </Pressable>

                {/* Dots indicator */}
                <View style={styles.dotsContainer}>
                    {dhikrList.map((_: Dhikr, i: number) => (
                        <View
                            key={i}
                            style={[
                                styles.dot,
                                {
                                    backgroundColor: i === currentIndex
                                        ? textColor
                                        : getRemainingForDhikr(dhikrList[i]) === 0
                                            ? '#10B981'
                                            : `${textColor}30`,
                                },
                                i === currentIndex && styles.dotActive,
                            ]}
                        />
                    ))}
                </View>

                <Pressable
                    onPress={isDhikrComplete ? goNext : undefined}
                    style={({ pressed }) => [
                        styles.navButton,
                        { backgroundColor: isDhikrComplete ? `${textColor}25` : `${textColor}10` },
                        pressed && { opacity: 0.7 },
                    ]}
                >
                    <Text style={[styles.navButtonText, {
                        color: textColor,
                        opacity: isDhikrComplete ? 1 : 0.4,
                    }]}>
                        {currentIndex === totalDhikr - 1 ? 'Finish' : 'Next'}
                    </Text>
                    <Ionicons
                        name={currentIndex === totalDhikr - 1 ? 'checkmark' : 'chevron-forward'}
                        size={20}
                        color={textColor}
                        style={{ opacity: isDhikrComplete ? 1 : 0.4 }}
                    />
                </Pressable>
            </View>
        </LinearGradient>
    );
};

// ═══════════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    // ── Close button ──
    closeButton: {
        position: 'absolute',
        top: 60,
        left: Spacing.lg,
        zIndex: 10,
    },

    // ── Intro phase ──
    introContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
    },
    introEmoji: {
        fontSize: 64,
        textAlign: 'center',
        marginBottom: Spacing.lg,
    },
    introTitle: {
        fontSize: 32,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: Spacing.md,
    },
    introDescription: {
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
        marginBottom: Spacing.lg,
    },
    introStats: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    statPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: BorderRadius.full,
    },
    statText: {
        fontSize: 14,
        fontWeight: '600',
    },
    periodToggle: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    periodButton: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
    },
    periodButtonActive: {
        // backgroundColor set inline
    },
    periodButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    alreadyDoneBadge: {
        marginTop: Spacing.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        backgroundColor: 'rgba(16,185,129,0.15)',
    },
    alreadyDoneText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#10B981',
    },
    introBottom: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: 50,
    },
    beginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: 16,
        borderRadius: BorderRadius.lg,
    },
    beginButtonText: {
        fontSize: 18,
        fontWeight: '700',
    },

    // ── Active phase ──
    activeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.sm,
    },
    progressInfo: {
        alignItems: 'center',
    },
    progressText: {
        fontSize: 14,
        fontWeight: '600',
    },
    sessionProgressBar: {
        height: 4,
        borderRadius: 2,
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
    },
    activeCardWrapper: {
        flex: 1,
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
    },
    activeCard: {
        flex: 1,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        justifyContent: 'center',
    },
    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        borderRadius: BorderRadius.full,
        gap: 4,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    sourceText: {
        fontSize: 11,
    },
    arabicText: {
        fontSize: 26,
        textAlign: 'right',
        lineHeight: 46,
        marginBottom: Spacing.lg,
    },
    translationText: {
        fontSize: 14,
        lineHeight: 22,
        fontStyle: 'italic',
        marginBottom: Spacing.lg,
    },
    counterSection: {
        alignItems: 'center',
        marginTop: 'auto',
        paddingTop: Spacing.md,
    },
    countdownContainer: {
        alignItems: 'center',
    },
    countdownNumber: {
        fontSize: 48,
        fontWeight: '800',
    },
    countdownLabel: {
        fontSize: 13,
        fontWeight: '500',
        marginTop: 2,
    },
    completeBadge: {
        alignItems: 'center',
        gap: 4,
    },
    completeLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#10B981',
    },
    tapHint: {
        textAlign: 'center',
        fontSize: 12,
        marginTop: Spacing.sm,
        opacity: 0.6,
    },

    // ── Nav row ──
    navRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingBottom: 40,
    },
    navButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: BorderRadius.full,
    },
    navButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    dotsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    dotActive: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },

    // ── Complete phase ──
    completeContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
    },
    completeEmoji: {
        fontSize: 72,
        textAlign: 'center',
        marginBottom: Spacing.lg,
    },
    completeTitle: {
        fontSize: 28,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: Spacing.md,
    },
    completeSubtitle: {
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
    },
    streakCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.full,
        marginTop: Spacing.xl,
    },
    streakEmoji: {
        fontSize: 24,
    },
    streakText: {
        fontSize: 18,
        fontWeight: '700',
    },
});

/**
 * JuzSurahList — Shows all surahs in the current Juz as individual cards.
 * Each card has 3 states: Up Next (primary), In Progress (gold), Completed (green).
 * Replaces the old single SurahReadingCard.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ReadingPositionService, ReadingPosition } from '../../../infrastructure/reading/ReadingPositionService';
import { SurahMeta, getSurahMeta } from '../../../infrastructure/khatma/KhatmaContext';
import { getSurahsInJuz, getJuzForSurah } from '../../../data/khatmaData';
import { Spacing, BorderRadius, Shadows, Typography } from '../../theme/DesignSystem';

// ─── Colors ─────────────────────────────────────────────────────────────────

const ACCENT = {
    gold: '#F5A623',
    green: '#10B981',
    greenBg: '#ECFDF5',
    greenBgDark: '#064E3B',
    blue: '#5B7FFF',
    blueBg: '#EEF2FF',
    blueBgDark: '#312E81',
    goldBg: '#FFFBEB',
    goldBgDark: '#451A03',
};

// ─── Types ──────────────────────────────────────────────────────────────────

interface JuzSurahListProps {
    currentJuz: number;
    displayJuz?: number | null;  // override which Juz to display (from grid tap)
    completedSurahs: number[];
    nextSurahNumber: number;
    onMarkComplete: (surahNumber: number) => void;
    onUnmark: (surahNumber: number) => void;
    isGated: boolean;
}

// ─── Individual Surah Card ──────────────────────────────────────────────────

interface SurahCardProps {
    surah: SurahMeta;
    status: 'next' | 'in-progress' | 'completed';
    savedVerse: number | null;
    onStartReading: () => void;
    onContinueReading: () => void;
    onMarkComplete: () => void;
    onStartOver: () => void;
    index: number;
    isDark: boolean;
}

const SurahCard: React.FC<SurahCardProps> = ({
    surah,
    status,
    savedVerse,
    onStartReading,
    onContinueReading,
    onMarkComplete,
    onStartOver,
    index,
    isDark,
}) => {
    const theme = useTheme();

    // ── Completed state — compact row ──
    if (status === 'completed') {
        return (
            <MotiView
                from={{ opacity: 0, translateX: -8 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'spring', damping: 20, delay: index * 40 }}
            >
                <View style={[
                    styles.completedCard,
                    { backgroundColor: isDark ? ACCENT.greenBgDark : ACCENT.greenBg },
                ]}>
                    <View style={[styles.completedIcon, { backgroundColor: `${ACCENT.green}20` }]}>
                        <MaterialCommunityIcons name="check-circle" size={20} color={ACCENT.green} />
                    </View>
                    <View style={styles.completedInfo}>
                        <Text style={[styles.completedArabic, { color: theme.colors.onSurface }]}>
                            {surah.arabic}
                        </Text>
                        <Text style={[styles.completedEnglish, { color: theme.colors.onSurfaceVariant }]}>
                            {surah.english} · {surah.verses} verses
                        </Text>
                    </View>
                    <Pressable
                        onPress={onStartOver}
                        style={({ pressed }) => [
                            styles.startOverButton,
                            { borderColor: theme.colors.onSurfaceVariant + '40' },
                            pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
                        ]}
                    >
                        <MaterialCommunityIcons name="refresh" size={14} color={theme.colors.onSurfaceVariant} />
                        <Text style={[styles.startOverText, { color: theme.colors.onSurfaceVariant }]}>
                            Restart
                        </Text>
                    </Pressable>
                </View>
            </MotiView>
        );
    }

    // ── Up Next / In Progress — full card ──
    const isNext = status === 'next';
    const accentColor = isNext ? ACCENT.blue : ACCENT.gold;
    const bgTint = isNext
        ? (isDark ? ACCENT.blueBgDark : ACCENT.blueBg)
        : (isDark ? ACCENT.goldBgDark : ACCENT.goldBg);

    return (
        <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, delay: index * 60 }}
        >
            <View style={[
                styles.activeCard,
                { backgroundColor: theme.colors.surface, borderColor: accentColor + '30' },
                Shadows.sm,
            ]}>
                {/* Status badge + Juz tag */}
                <View style={styles.cardHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: bgTint }]}>
                        <View style={[styles.statusDot, { backgroundColor: accentColor }]} />
                        <Text style={[styles.statusText, { color: accentColor }]}>
                            {isNext ? 'Up Next' : 'In Progress'}
                        </Text>
                    </View>
                </View>

                {/* Surah info */}
                <View style={styles.surahInfoRow}>
                    <View style={styles.surahTextGroup}>
                        <Text style={[styles.surahEnglish, { color: theme.colors.onSurface }]}>
                            {surah.english}
                        </Text>
                        <Text style={[styles.surahMeta, { color: theme.colors.onSurfaceVariant }]}>
                            {surah.verses} verses
                        </Text>
                    </View>
                    <Text style={[styles.surahArabic, { color: theme.colors.onSurface }]}>
                        {surah.arabic}
                    </Text>
                </View>

                {/* Progress bar (in-progress only) */}
                {!isNext && savedVerse !== null && (
                    <View style={styles.progressSection}>
                        <View style={[styles.progressTrack, { backgroundColor: theme.colors.surfaceVariant }]}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        backgroundColor: accentColor,
                                        width: `${Math.min((savedVerse / surah.verses) * 100, 100)}%`,
                                    },
                                ]}
                            />
                        </View>
                        <Text style={[styles.progressLabel, { color: theme.colors.onSurfaceVariant }]}>
                            Verse {savedVerse} of {surah.verses}
                        </Text>
                    </View>
                )}

                {/* Action buttons */}
                <View style={styles.actionsRow}>
                    {!isNext && savedVerse !== null ? (
                        <Pressable
                            onPress={onContinueReading}
                            style={({ pressed }) => [
                                styles.primaryAction,
                                { backgroundColor: accentColor },
                                pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                            ]}
                        >
                            <Ionicons name="play" size={15} color="#FFF" />
                            <Text style={styles.primaryActionText}>Continue</Text>
                        </Pressable>
                    ) : (
                        <Pressable
                            onPress={onStartReading}
                            style={({ pressed }) => [
                                styles.primaryAction,
                                { backgroundColor: accentColor },
                                pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                            ]}
                        >
                            <Ionicons name="book-outline" size={15} color="#FFF" />
                            <Text style={styles.primaryActionText}>Start Reading</Text>
                        </Pressable>
                    )}

                    <Pressable
                        onPress={onMarkComplete}
                        style={({ pressed }) => [
                            styles.secondaryAction,
                            { borderColor: ACCENT.green },
                            pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
                        ]}
                    >
                        <MaterialCommunityIcons name="check" size={15} color={ACCENT.green} />
                        <Text style={[styles.secondaryActionText, { color: ACCENT.green }]}>
                            Complete
                        </Text>
                    </Pressable>
                </View>
            </View>
        </MotiView>
    );
};

// ─── Juz Surah List (wrapper) ───────────────────────────────────────────────

const COLLAPSED_COUNT = 3; // show first 3 surahs when collapsed

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const JuzSurahList: React.FC<JuzSurahListProps> = ({
    currentJuz,
    displayJuz,
    completedSurahs,
    nextSurahNumber,
    onMarkComplete,
    onUnmark,
    isGated,
}) => {
    const theme = useTheme();
    const router = useRouter();
    const isDark = theme.dark;

    // Which Juz to show — user-selected overrides current
    const activeJuz = displayJuz ?? currentJuz;
    const isViewingDifferentJuz = displayJuz != null && displayJuz !== currentJuz;

    // Collapse state — reset when Juz changes
    const [expanded, setExpanded] = useState(false);
    useEffect(() => {
        setExpanded(false);
    }, [activeJuz]);

    const toggleExpanded = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(prev => !prev);
    };

    // Get all surahs in the active Juz
    const surahNumbers = useMemo(() => getSurahsInJuz(activeJuz), [activeJuz]);
    const surahs = useMemo(() => surahNumbers.map(n => getSurahMeta(n)), [surahNumbers]);
    const completedInJuz = useMemo(
        () => surahNumbers.filter(n => completedSurahs.includes(n)).length,
        [surahNumbers, completedSurahs],
    );

    // Decide which surahs to show
    const needsCollapse = surahNumbers.length > COLLAPSED_COUNT + 1; // don't collapse if only 1 extra
    const visibleSurahs = needsCollapse && !expanded
        ? surahs.slice(0, COLLAPSED_COUNT)
        : surahs;
    const hiddenCount = surahNumbers.length - COLLAPSED_COUNT;

    // Fetch saved reading positions for all surahs in this Juz
    const [positions, setPositions] = useState<Record<number, ReadingPosition | null>>({});

    const loadPositions = useCallback(async () => {
        const result: Record<number, ReadingPosition | null> = {};
        for (const num of surahNumbers) {
            const pos = await ReadingPositionService.get(num);
            result[num] = pos;
        }
        setPositions(result);
    }, [surahNumbers]);

    useFocusEffect(useCallback(() => { loadPositions(); }, [loadPositions]));
    useEffect(() => { loadPositions(); }, [loadPositions]);

    // Determine card status
    const getStatus = (surahNum: number): 'next' | 'in-progress' | 'completed' => {
        if (completedSurahs.includes(surahNum)) return 'completed';
        if (surahNum === nextSurahNumber) {
            const pos = positions[surahNum];
            return pos && pos.verse > 1 ? 'in-progress' : 'next';
        }
        // Surah is after the next one — check if it has a position (user may have read ahead)
        const pos = positions[surahNum];
        return pos && pos.verse > 1 ? 'in-progress' : 'next';
    };

    const handleNav = (surahNum: number, verse?: number) => {
        if (isGated) {
            router.push('/paywall');
            return;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (verse && verse > 1) {
            router.push(`/surah/${surahNum}?verse=${verse}&autoplay=true`);
        } else {
            router.push(`/surah/${surahNum}?autoplay=true`);
        }
    };

    const handleStartOver = (surahNum: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onUnmark(surahNum);
        handleNav(surahNum);
    };

    const handleMarkComplete = (surahNum: number) => {
        if (isGated) {
            router.push('/paywall');
            return;
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onMarkComplete(surahNum);
    };

    return (
        <View>
            {/* Section header */}
            <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ type: 'timing', duration: 300 }}
            >
                <View style={styles.sectionHeader}>
                    <View style={styles.sectionLeft}>
                        <MaterialCommunityIcons name="book-open-variant" size={18} color={theme.colors.primary} />
                        <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                            Juz {activeJuz} · Surahs
                        </Text>
                        {isViewingDifferentJuz && (
                            <View style={[styles.browsingBadge, { backgroundColor: `${ACCENT.blue}15` }]}>
                                <Text style={[styles.browsingText, { color: ACCENT.blue }]}>Browsing</Text>
                            </View>
                        )}
                    </View>
                    <View style={[styles.countBadge, { backgroundColor: theme.colors.primaryContainer }]}>
                        <Text style={[styles.countText, { color: theme.colors.primary }]}>
                            {completedInJuz} of {surahNumbers.length}
                        </Text>
                    </View>
                </View>
            </MotiView>

            {/* Juz completion celebration */}
            {completedInJuz === surahNumbers.length && surahNumbers.length > 0 && (
                <MotiView
                    from={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', damping: 18, delay: 100 }}
                >
                    <View style={[
                        styles.juzCompleteCard,
                        { backgroundColor: isDark ? ACCENT.greenBgDark : ACCENT.greenBg },
                    ]}>
                        <Text style={styles.juzCompleteTrophy}>🏆</Text>
                        <Text style={[styles.juzCompleteTitle, { color: theme.colors.onSurface }]}>
                            Juz {activeJuz} Complete!
                        </Text>
                        <Text style={[styles.juzCompleteSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                            All {surahNumbers.length} surahs finished. ما شاء الله
                        </Text>
                    </View>
                </MotiView>
            )}

            {/* Surah cards */}
            <View style={styles.cardList}>
                {visibleSurahs.map((surah, i) => {
                    const status = getStatus(surah.number);
                    const pos = positions[surah.number];
                    const savedVerse = pos && pos.verse > 1 ? pos.verse : null;

                    return (
                        <SurahCard
                            key={surah.number}
                            surah={surah}
                            status={status}
                            savedVerse={savedVerse}
                            index={i}
                            isDark={isDark}
                            onStartReading={() => handleNav(surah.number)}
                            onContinueReading={() => handleNav(surah.number, pos?.verse)}
                            onMarkComplete={() => handleMarkComplete(surah.number)}
                            onStartOver={() => handleStartOver(surah.number)}
                        />
                    );
                })}
            </View>

            {/* Expand/Collapse toggle */}
            {needsCollapse && (
                <Pressable
                    onPress={toggleExpanded}
                    style={({ pressed }) => [
                        styles.expandButton,
                        { backgroundColor: theme.colors.surfaceVariant },
                        pressed && { opacity: 0.7 },
                    ]}
                >
                    <MaterialCommunityIcons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={theme.colors.onSurfaceVariant}
                    />
                    <Text style={[styles.expandText, { color: theme.colors.onSurfaceVariant }]}>
                        {expanded ? 'Show less' : `Show all ${surahNumbers.length} surahs`}
                    </Text>
                </Pressable>
            )}
        </View>
    );
};

// Keep backward compat — single card export (used nowhere now, but safe)
export const SurahReadingCard = JuzSurahList;

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    // ── Section header ──
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
        paddingHorizontal: Spacing.xs,
    },
    sectionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionTitle: {
        ...Typography.titleMedium,
        fontWeight: '700',
    },
    countBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
    },
    countText: {
        ...Typography.labelMedium,
        fontWeight: '700',
    },

    // ── Card list ──
    cardList: {
        gap: Spacing.sm,
    },

    // ── Active card (Up Next / In Progress) ──
    activeCard: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: BorderRadius.full,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        ...Typography.labelMedium,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    surahInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    surahTextGroup: {
        flex: 1,
    },
    surahEnglish: {
        ...Typography.titleLarge,
        fontWeight: '700',
    },
    surahMeta: {
        ...Typography.bodyMedium,
        marginTop: 2,
    },
    surahArabic: {
        fontSize: 28,
        fontWeight: '700',
        marginLeft: Spacing.md,
    },

    // ── Progress ──
    progressSection: {
        marginBottom: Spacing.sm,
    },
    progressTrack: {
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 4,
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    progressLabel: {
        ...Typography.caption,
    },

    // ── Actions ──
    actionsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    primaryAction: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: BorderRadius.full,
        gap: 8,
    },
    primaryActionText: {
        color: '#FFF',
        ...Typography.bodyMedium,
        fontWeight: '700',
    },
    secondaryAction: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: BorderRadius.full,
        borderWidth: 1.5,
        gap: 6,
    },
    secondaryActionText: {
        ...Typography.bodyMedium,
        fontWeight: '700',
    },

    // ── Completed card ──
    completedCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.sm + 4,
        borderRadius: BorderRadius.md,
        gap: 12,
    },
    completedIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    completedInfo: {
        flex: 1,
    },
    completedArabic: {
        ...Typography.titleMedium,
        fontWeight: '700',
    },
    completedEnglish: {
        ...Typography.caption,
        marginTop: 2,
    },
    startOverButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
    },
    startOverText: {
        ...Typography.caption,
        fontWeight: '600',
    },

    // ── Expand/collapse toggle ──
    expandButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: BorderRadius.md,
        marginTop: Spacing.xs,
    },
    expandText: {
        ...Typography.bodyMedium,
        fontWeight: '600',
    },

    // ── Browsing badge ──
    browsingBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: BorderRadius.full,
        marginLeft: 4,
    },
    browsingText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },

    // ── Juz completion ──
    juzCompleteCard: {
        alignItems: 'center',
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.sm,
    },
    juzCompleteTrophy: {
        fontSize: 40,
        marginBottom: Spacing.xs,
    },
    juzCompleteTitle: {
        ...Typography.titleLarge,
        fontWeight: '700',
        marginBottom: 4,
    },
    juzCompleteSubtitle: {
        ...Typography.bodyMedium,
        textAlign: 'center',
    },
});

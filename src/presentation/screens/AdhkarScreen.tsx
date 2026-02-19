import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Dimensions,
} from 'react-native';
import { useTheme, SegmentedButtons, ProgressBar } from 'react-native-paper';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAdhkar, AdhkarPeriod, Dhikr } from '../../infrastructure/adhkar/AdhkarContext';
import { Spacing, BorderRadius, Shadows, Gradients } from '../theme/DesignSystem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Colors for categories ────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
    protection: { bg: '#3B82F620', text: '#3B82F6', icon: 'shield-checkmark' },
    praise: { bg: '#F59E0B20', text: '#F59E0B', icon: 'sunny' },
    forgiveness: { bg: '#8B5CF620', text: '#8B5CF6', icon: 'heart' },
    general: { bg: '#10B98120', text: '#10B981', icon: 'leaf' },
};

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
        getCompletionPercentage,
        getTotalCompleted,
        getTotalRequired,
        isSessionComplete,
        getStreak,
    } = useAdhkar();

    const currentHour = new Date().getHours();
    const defaultPeriod: AdhkarPeriod = currentHour < 15 ? 'morning' : 'evening';
    const [period, setPeriod] = useState<AdhkarPeriod>(defaultPeriod);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const dhikrList = adhkar[period];
    const completionPct = getCompletionPercentage(period);
    const totalDone = getTotalCompleted(period);
    const totalRequired = getTotalRequired(period);
    const sessionDone = isSessionComplete(period);
    const streak = getStreak();

    const handleTap = useCallback(
        async (dhikr: Dhikr) => {
            const progress = todayProgress[period];
            const currentCount = progress?.completed[dhikr.id] || 0;

            if (currentCount >= dhikr.repeatCount) return;

            Haptics.impactAsync(
                currentCount + 1 === dhikr.repeatCount
                    ? Haptics.ImpactFeedbackStyle.Heavy
                    : Haptics.ImpactFeedbackStyle.Light,
            );

            await incrementCount(period, dhikr.id);
        },
        [period, todayProgress, incrementCount],
    );

    const handleReset = useCallback(
        async (dhikrId: string) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await resetDhikr(period, dhikrId);
        },
        [period, resetDhikr],
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <LinearGradient
                colors={
                    period === 'morning'
                        ? ['#FEF3C7', '#FDE68A', '#F59E0B']
                        : ['#1E1B4B', '#312E81', '#4338CA']
                }
                style={styles.header}
            >
                <View style={styles.headerRow}>
                    <Pressable onPress={onClose} hitSlop={12}>
                        <Ionicons name="close" size={24} color={period === 'morning' ? '#78350F' : '#FFF'} />
                    </Pressable>
                    <View style={styles.headerCenter}>
                        <Text style={[styles.headerEmoji]}>
                            {period === 'morning' ? '☀️' : '🌙'}
                        </Text>
                        <Text
                            style={[
                                styles.headerTitle,
                                { color: period === 'morning' ? '#78350F' : '#FFF' },
                            ]}
                        >
                            {period === 'morning' ? 'Morning Adhkar' : 'Evening Adhkar'}
                        </Text>
                    </View>
                    {streak > 0 && (
                        <View style={styles.streakBadge}>
                            <Text style={styles.streakNumber}>🔥 {streak}</Text>
                        </View>
                    )}
                </View>

                {/* Progress */}
                <View style={styles.progressSection}>
                    <ProgressBar
                        progress={completionPct / 100}
                        color={period === 'morning' ? '#78350F' : '#A5B4FC'}
                        style={[
                            styles.progressBar,
                            { backgroundColor: period === 'morning' ? '#FEF3C740' : '#FFFFFF20' },
                        ]}
                    />
                    <Text
                        style={[
                            styles.progressText,
                            { color: period === 'morning' ? '#92400E' : '#C7D2FE' },
                        ]}
                    >
                        {completionPct}% · {totalDone}/{totalRequired}
                    </Text>
                </View>

                {/* Period Toggle */}
                <View style={styles.toggleContainer}>
                    <SegmentedButtons
                        value={period}
                        onValueChange={(v) => setPeriod(v as AdhkarPeriod)}
                        density="small"
                        style={styles.segmentedButtons}
                        buttons={[
                            {
                                value: 'morning',
                                label: '☀️ Morning',
                                style: {
                                    backgroundColor:
                                        period === 'morning' ? '#78350F' : 'transparent',
                                },
                                labelStyle: {
                                    color: period === 'morning' ? '#FFF' : '#FFFFFF80',
                                },
                            },
                            {
                                value: 'evening',
                                label: '🌙 Evening',
                                style: {
                                    backgroundColor:
                                        period === 'evening' ? '#4338CA' : 'transparent',
                                },
                                labelStyle: {
                                    color: period === 'evening' ? '#FFF' : '#78350F80',
                                },
                            },
                        ]}
                    />
                </View>
            </LinearGradient>

            {/* Session Complete Banner */}
            <AnimatePresence>
                {sessionDone && (
                    <MotiView
                        from={{ opacity: 0, scaleY: 0 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        exit={{ opacity: 0, scaleY: 0 }}
                        style={[styles.completeBanner, { backgroundColor: '#10B98118' }]}
                    >
                        <Text style={styles.completeEmoji}>✅</Text>
                        <Text style={[styles.completeText, { color: '#10B981' }]}>
                            Session complete! May Allah accept your dhikr.
                        </Text>
                    </MotiView>
                )}
            </AnimatePresence>

            {/* Dhikr List */}
            <ScrollView
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
            >
                {dhikrList.map((dhikr: Dhikr, index: number) => {
                    const progress = todayProgress[period];
                    const currentCount = progress?.completed[dhikr.id] || 0;
                    const isComplete = currentCount >= dhikr.repeatCount;
                    const isExpanded = expandedId === dhikr.id;
                    const catColor = CATEGORY_COLORS[dhikr.category] || CATEGORY_COLORS.general;

                    return (
                        <MotiView
                            key={dhikr.id}
                            from={{ opacity: 0, translateY: 20 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ delay: Math.min(index * 80, 400) }}
                        >
                            <Pressable
                                onPress={() => handleTap(dhikr)}
                                onLongPress={() =>
                                    setExpandedId(isExpanded ? null : dhikr.id)
                                }
                                style={({ pressed }) => [
                                    styles.dhikrCard,
                                    {
                                        backgroundColor: theme.colors.surface,
                                        borderLeftColor: isComplete ? '#10B981' : catColor.text,
                                        opacity: pressed ? 0.9 : 1,
                                    },
                                    isComplete && styles.dhikrCardComplete,
                                    Shadows.sm,
                                ]}
                            >
                                {/* Category badge */}
                                <View style={styles.cardHeader}>
                                    <View
                                        style={[
                                            styles.categoryBadge,
                                            { backgroundColor: catColor.bg },
                                        ]}
                                    >
                                        <Ionicons
                                            name={catColor.icon as any}
                                            size={12}
                                            color={catColor.text}
                                        />
                                        <Text
                                            style={[styles.categoryText, { color: catColor.text }]}
                                        >
                                            {dhikr.category}
                                        </Text>
                                    </View>
                                    <Text style={[styles.sourceText, { color: theme.colors.onSurfaceVariant }]}>
                                        {dhikr.source}
                                    </Text>
                                </View>

                                {/* Arabic text */}
                                <Text
                                    style={[
                                        styles.arabicText,
                                        { color: theme.colors.onSurface },
                                        isComplete && { opacity: 0.5 },
                                    ]}
                                >
                                    {dhikr.arabic}
                                </Text>

                                {/* Translation (shown when expanded) */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <MotiView
                                            from={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' as any }}
                                            exit={{ opacity: 0, height: 0 }}
                                        >
                                            <Text
                                                style={[
                                                    styles.translationText,
                                                    { color: theme.colors.onSurfaceVariant },
                                                ]}
                                            >
                                                {dhikr.translation}
                                            </Text>
                                        </MotiView>
                                    )}
                                </AnimatePresence>

                                {/* Counter */}
                                <View style={styles.counterRow}>
                                    <View style={styles.counterLeft}>
                                        <Pressable
                                            onPress={() => handleReset(dhikr.id)}
                                            hitSlop={8}
                                        >
                                            <Ionicons
                                                name="refresh-outline"
                                                size={18}
                                                color={theme.colors.onSurfaceVariant}
                                            />
                                        </Pressable>
                                    </View>

                                    <View style={styles.counterCenter}>
                                        <Text
                                            style={[
                                                styles.counterText,
                                                {
                                                    color: isComplete
                                                        ? '#10B981'
                                                        : theme.colors.primary,
                                                },
                                            ]}
                                        >
                                            {currentCount}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.counterSlash,
                                                { color: theme.colors.onSurfaceVariant },
                                            ]}
                                        >
                                            /{dhikr.repeatCount}
                                        </Text>
                                    </View>

                                    {isComplete && (
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={20}
                                            color="#10B981"
                                        />
                                    )}
                                </View>

                                {/* Progress bar for multi-repeat dhikr */}
                                {dhikr.repeatCount > 1 && (
                                    <ProgressBar
                                        progress={currentCount / dhikr.repeatCount}
                                        color={isComplete ? '#10B981' : catColor.text}
                                        style={[
                                            styles.dhikrProgressBar,
                                            { backgroundColor: theme.colors.surfaceVariant },
                                        ]}
                                    />
                                )}
                            </Pressable>
                        </MotiView>
                    );
                })}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

// ═══════════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingBottom: Spacing.lg,
        paddingHorizontal: Spacing.lg,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerCenter: {
        alignItems: 'center',
        flex: 1,
    },
    headerEmoji: {
        fontSize: 36,
        marginBottom: Spacing.xs,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
    },
    streakBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    streakNumber: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFF',
    },
    progressSection: {
        marginTop: Spacing.md,
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
    },
    progressText: {
        fontSize: 12,
        textAlign: 'right',
        marginTop: 4,
    },
    toggleContainer: {
        marginTop: Spacing.md,
    },
    segmentedButtons: {
        borderRadius: BorderRadius.lg,
    },
    completeBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
    },
    completeEmoji: {
        fontSize: 20,
        marginRight: Spacing.sm,
    },
    completeText: {
        fontSize: 14,
        fontWeight: '600',
    },
    list: {
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.md,
    },
    dhikrCard: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        borderLeftWidth: 4,
    },
    dhikrCardComplete: {
        opacity: 0.75,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '600',
        marginLeft: 4,
        textTransform: 'capitalize',
    },
    sourceText: {
        fontSize: 11,
    },
    arabicText: {
        fontSize: 24,
        textAlign: 'right',
        lineHeight: 42,
        marginBottom: Spacing.md,
    },
    translationText: {
        fontSize: 14,
        lineHeight: 22,
        fontStyle: 'italic',
        marginBottom: Spacing.md,
    },
    counterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    counterLeft: {
        position: 'absolute',
        left: 0,
    },
    counterCenter: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    counterText: {
        fontSize: 28,
        fontWeight: '800',
    },
    counterSlash: {
        fontSize: 16,
        fontWeight: '500',
    },
    dhikrProgressBar: {
        height: 3,
        borderRadius: 1.5,
        marginTop: Spacing.sm,
    },
});

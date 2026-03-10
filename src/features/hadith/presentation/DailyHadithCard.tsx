/**
 * DailyHadithCard — Compact, elegant card for the daily curated hadith.
 * Premium features: refresh limits (3/day free), bookmark, explore topics link.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, AppState, AppStateStatus } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, IconButton } from 'react-native-paper';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Spacing, BorderRadius, Shadows, Typography } from '../../../core/theme/DesignSystem';
import * as Haptics from 'expo-haptics';
import { useHadith } from '../infrastructure/HadithContext';
import { usePro } from '../../auth/infrastructure/ProContext';
import { useRouter } from 'expo-router';
import { PremiumShareSheet } from '../../sharing/presentation/PremiumShareSheet';
import { ShareCardData } from '../../sharing/domain/ShareTemplateTypes';

const FREE_REFRESH_LIMIT = 3;

/** Warm rose-coral accent — warm, inviting, complementary to verse teal */
const HADITH_ACCENT = '#E07856';

export const DailyHadithCard: React.FC = () => {
    const theme = useTheme();
    const router = useRouter();
    const { isPro } = usePro();
    const {
        hadith, loading, refresh,
        refreshCount, canRefresh,
        toggleBookmark, isBookmarked, bookmarkedIds,
    } = useHadith();
    const [expanded, setExpanded] = useState(false);
    const [showShareSheet, setShowShareSheet] = useState(false);

    const handleRefresh = useCallback(async () => {
        if (!isPro && !canRefresh) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.push('/paywall?reason=hadith-refresh' as any);
            return;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await refresh();
    }, [refresh, isPro, canRefresh, router]);

    const handleBookmark = useCallback(async () => {
        if (!hadith) return;

        // Check free bookmark limit
        if (!isPro && !isBookmarked(hadith.id) && bookmarkedIds.length >= 3) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.push('/paywall?reason=hadith-bookmarks' as any);
            return;
        }

        const wasAdded = await toggleBookmark(hadith.id);
        Haptics.impactAsync(wasAdded
            ? Haptics.ImpactFeedbackStyle.Medium
            : Haptics.ImpactFeedbackStyle.Light
        );
    }, [hadith, isPro, isBookmarked, bookmarkedIds, toggleBookmark, router]);

    const handleShare = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setShowShareSheet(true);
    }, []);

    // Build share card data for the hadith
    const shareData: ShareCardData | null = hadith ? {
        type: 'hadith',
        arabicText: hadith.arabicText,
        englishText: hadith.englishText,
        hadithSource: `${hadith.collection}, #${hadith.reference}`,
        narrator: hadith.narrator,
    } : null;

    const handleExploreTopics = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/hadith-library' as any);
    }, [router]);

    if (loading || !hadith) return null;

    const bookmarked = isBookmarked(hadith.id);
    const showRefreshBadge = !isPro && refreshCount > 0;
    const refreshExhausted = !isPro && !canRefresh;

    // Surface-based card: theme-aware text colors
    const TEXT_PRIMARY = theme.colors.onSurface;
    const TEXT_SECONDARY = theme.dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)';
    const TEXT_TERTIARY = theme.dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)';

    return (
        <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, delay: 180 }}
            style={{ paddingHorizontal: Spacing.md }}
        >
            <Pressable
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setExpanded(!expanded);
                }}
                style={({ pressed }) => [
                    pressed && { opacity: 0.95, transform: [{ scale: 0.98 }] },
                ]}
            >
                <View style={[styles.card, Shadows.md, { backgroundColor: theme.colors.surface }]}>
                    {/* Rose-coral gradient — bold & warm */}
                    <LinearGradient
                        colors={
                            theme.dark
                                ? ['rgba(224,120,86,0.50)', 'rgba(224,120,86,0.22)', 'rgba(224,120,86,0.07)']
                                : ['rgba(224,120,86,0.38)', 'rgba(224,120,86,0.16)', 'rgba(224,120,86,0.05)']
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[StyleSheet.absoluteFillObject, { borderRadius: BorderRadius.lg }]}
                    />
                    {/* Secondary warm amber glow from bottom-right for depth */}
                    <LinearGradient
                        colors={
                            theme.dark
                                ? ['rgba(245,158,11,0.18)', 'rgba(245,158,11,0.05)', 'transparent']
                                : ['rgba(245,158,11,0.12)', 'rgba(245,158,11,0.03)', 'transparent']
                        }
                        start={{ x: 1, y: 1 }}
                        end={{ x: 0, y: 0 }}
                        style={[StyleSheet.absoluteFillObject, { borderRadius: BorderRadius.lg }]}
                    />

                    <View style={styles.cardContent}>

                        {/* Header */}
                        <View style={styles.cardHeader}>
                            <View style={styles.labelRow}>
                                <Text style={[styles.label, { color: HADITH_ACCENT }]}>
                                    ✦ Hadith of the Day
                                </Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                                {/* Refresh button with limit indicator */}
                                <View style={styles.refreshContainer}>
                                    <IconButton
                                        icon={refreshExhausted ? 'lock' : 'refresh'}
                                        size={18}
                                        onPress={handleRefresh}
                                        iconColor={refreshExhausted ? TEXT_TERTIARY : TEXT_SECONDARY}
                                        style={styles.actionButton}
                                    />
                                    {showRefreshBadge && (
                                        <View style={styles.refreshBadge}>
                                            <Text style={styles.refreshBadgeText}>
                                                {FREE_REFRESH_LIMIT - refreshCount}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* Bookmark */}
                                <IconButton
                                    icon={bookmarked ? 'heart' : 'heart-outline'}
                                    size={18}
                                    onPress={handleBookmark}
                                    iconColor={bookmarked ? HADITH_ACCENT : TEXT_SECONDARY}
                                    style={styles.actionButton}
                                />

                                {/* Share */}
                                <IconButton
                                    icon="share-variant"
                                    size={18}
                                    onPress={handleShare}
                                    iconColor={TEXT_SECONDARY}
                                    style={styles.actionButton}
                                />

                                {/* Expand chevron */}
                                <Feather
                                    name={expanded ? 'chevron-up' : 'chevron-down'}
                                    size={20}
                                    color={TEXT_SECONDARY}
                                />
                            </View>
                        </View>

                        {/* Compact: one-line preview */}
                        {!expanded && (
                            <View style={styles.compactRow}>
                                <Feather name="chevron-right" size={16} color={TEXT_TERTIARY} />
                                <Text style={[styles.compactNarrator, { color: TEXT_SECONDARY }]} numberOfLines={1}>
                                    {hadith.narrator}
                                </Text>
                                <Text style={[styles.compactPreview, { color: TEXT_PRIMARY }]} numberOfLines={1}>
                                    {hadith.englishText}
                                </Text>
                            </View>
                        )}

                        {/* Expanded: full content */}
                        {expanded && (
                            <>
                                <Text style={[styles.arabicText, { color: TEXT_PRIMARY }]}>
                                    {hadith.arabicText}
                                </Text>

                                <Text style={[styles.translationText, { color: TEXT_SECONDARY }]}>
                                    {hadith.englishText}
                                </Text>

                                <View style={[styles.reflectionBox, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                                    <Text style={[styles.reflectionText, { color: TEXT_SECONDARY }]}>
                                        {hadith.reflection}
                                    </Text>
                                </View>

                                <View style={styles.sourceRow}>
                                    <Feather name="book-open" size={14} color={TEXT_TERTIARY} />
                                    <Text style={[styles.sourceText, { color: TEXT_SECONDARY }]}>
                                        {hadith.narrator} · {hadith.collection}, #{hadith.reference}
                                    </Text>
                                </View>

                                {/* Explore Topics link */}
                                <Pressable onPress={handleExploreTopics} style={[styles.exploreRow, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}>
                                    <MaterialCommunityIcons name="book-open-variant" size={18} color={HADITH_ACCENT} />
                                    <Text style={[styles.exploreText, { color: TEXT_PRIMARY }]}>Explore Hadith Library</Text>
                                    <Feather name="chevron-right" size={16} color={TEXT_SECONDARY} />
                                </Pressable>
                            </>
                        )}
                    </View>
                </View>
            </Pressable>

            {/* Premium Share Sheet */}
            {shareData && (
                <PremiumShareSheet
                    visible={showShareSheet}
                    onDismiss={() => setShowShareSheet(false)}
                    data={shareData}
                />
            )}
        </MotiView>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
    },
    cardContent: {
        flex: 1,
        padding: Spacing.lg,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    actionButton: {
        margin: 0,
    },
    refreshContainer: {
        position: 'relative',
    },
    refreshBadge: {
        position: 'absolute',
        top: 2,
        right: 2,
        backgroundColor: HADITH_ACCENT,
        borderRadius: 6,
        width: 14,
        height: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    refreshBadgeText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#000000',
    },

    compactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    compactNarrator: {
        fontSize: 12,
        fontWeight: '500',
    },
    compactPreview: {
        flex: 1,
        fontSize: 14,
        fontStyle: 'italic',
    },

    arabicText: {
        fontSize: 22,
        lineHeight: 44,
        textAlign: 'right',
        fontWeight: '400',
        marginBottom: Spacing.md,
    },
    translationText: {
        fontSize: 14,
        lineHeight: 22,
        fontStyle: 'italic',
        marginBottom: Spacing.sm,
    },
    reflectionBox: {
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    reflectionText: {
        fontSize: 13,
        lineHeight: 20,
        fontWeight: '500',
    },
    sourceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    sourceText: {
        fontSize: 12,
        fontWeight: '500',
    },
    exploreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: Spacing.md,
        paddingVertical: 10,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    exploreText: {
        fontSize: 15,
        fontWeight: '700',
        flex: 1,
    },
});

/**
 * DailyHadithCard — Compact, elegant card for the daily curated hadith.
 * Premium features: refresh limits (3/day free), bookmark, explore topics link.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, AppState, AppStateStatus } from 'react-native';
import { useTheme, IconButton } from 'react-native-paper';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { Spacing, BorderRadius, Shadows, Typography } from '../../../core/theme/DesignSystem';
import * as Haptics from 'expo-haptics';
import { useHadith } from '../infrastructure/HadithContext';
import { usePro } from '../../auth/infrastructure/ProContext';
import { useRouter } from 'expo-router';
import { PremiumShareSheet } from '../../sharing/presentation/PremiumShareSheet';
import { ShareCardData } from '../../sharing/domain/ShareTemplateTypes';

const FREE_REFRESH_LIMIT = 3;

/** Warm complementary gradients that pair with the sky-themed DailyVerseCard */
function getHadithGradient(hour: number): readonly [string, string, string] {
    if (hour >= 4 && hour < 6) return ['#4A1942', '#6B2D5B', '#893168'] as const;   // Fajr: Deep rose plum
    if (hour >= 6 && hour < 12) return ['#0D5C63', '#14919B', '#45B5AA'] as const;  // Morning: Rich teal/emerald
    if (hour >= 12 && hour < 16) return ['#7B4B2A', '#B8860B', '#DAA520'] as const; // Dhuhr: Warm gold
    if (hour >= 16 && hour < 18) return ['#8B4513', '#CD6600', '#E8820C'] as const; // Asr: Deep amber/orange
    if (hour >= 18 && hour < 20) return ['#4A1259', '#6B2C91', '#8B45A6'] as const; // Maghrib: Rich purple
    return ['#1A1A3E', '#252566', '#2D2D7B'] as const;                              // Isha: Deep indigo
}

const TEXT_PRIMARY = '#FFFFFF';
const TEXT_SECONDARY = 'rgba(255,255,255,0.85)';
const TEXT_TERTIARY = 'rgba(255,255,255,0.6)';

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
    const [currentHour, setCurrentHour] = useState(new Date().getHours());
    const [showShareSheet, setShowShareSheet] = useState(false);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') setCurrentHour(new Date().getHours());
        });
        return () => subscription.remove();
    }, []);

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

    const gradientColors = getHadithGradient(currentHour);
    const bookmarked = isBookmarked(hadith.id);
    const showRefreshBadge = !isPro && refreshCount > 0;
    const refreshExhausted = !isPro && !canRefresh;

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
                <View style={[styles.card, Shadows.md]}>
                    <LinearGradient
                        colors={gradientColors}
                        style={[styles.gradientOverlay, { borderRadius: BorderRadius.lg }]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />

                    {/* Header */}
                    <View style={styles.cardHeader}>
                        <View style={styles.labelRow}>
                            <Text style={[styles.label, { color: 'rgba(255,255,255,0.95)' }]}>
                                Hadith of the Day
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
                                iconColor={bookmarked ? TEXT_PRIMARY : TEXT_SECONDARY}
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

                            <View style={styles.reflectionBox}>
                                <Text style={styles.reflectionText}>
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
                            <Pressable onPress={handleExploreTopics} style={styles.exploreRow}>
                                <MaterialCommunityIcons name="book-open-variant" size={18} color={TEXT_PRIMARY} />
                                <Text style={styles.exploreText}>Explore Hadith Library</Text>
                                <Feather name="chevron-right" size={16} color={TEXT_SECONDARY} />
                            </Pressable>
                        </>
                    )}
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
        padding: Spacing.lg,
        overflow: 'hidden',
    },
    gradientOverlay: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: BorderRadius.lg,
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
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 6,
        width: 14,
        height: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    refreshBadgeText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#FFFFFF',
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
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    reflectionText: {
        fontSize: 13,
        lineHeight: 20,
        color: 'rgba(255,255,255,0.9)',
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
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: BorderRadius.md,
    },
    exploreText: {
        fontSize: 15,
        fontWeight: '700',
        color: TEXT_PRIMARY,
        flex: 1,
    },
    watermarkContainer: {
        marginTop: Spacing.lg,
        alignItems: 'center',
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.15)',
    },
    watermarkText: {
        ...Typography.labelMedium,
        color: 'rgba(255,255,255,0.7)',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
});

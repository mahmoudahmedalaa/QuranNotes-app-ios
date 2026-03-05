/**
 * HadithLibraryScreen — Browse all hadith topics and their hadiths.
 * Free users see topic list but can't view details → paywall.
 * Pro users browse freely, bookmark, and set any hadith as today's.
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Pressable, FlatList, Dimensions,
} from 'react-native';
import { useTheme, IconButton } from 'react-native-paper';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
    Spacing, BorderRadius, Shadows, Typography, BrandTokens,
} from '../../../core/theme/DesignSystem';
import { HADITH_TOPICS, getAllCuratedHadiths } from '../domain/CuratedHadiths';
import { CuratedHadith, HadithTopic } from '../domain/HadithTypes';
import { useHadith } from '../infrastructure/HadithContext';
import { usePro } from '../../auth/infrastructure/ProContext';

const FREE_BOOKMARK_LIMIT = 3;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = Spacing.md * 2; // left + right
const GRID_GAP = Spacing.sm;
const CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING - GRID_GAP) / 2;

/** Topic card accent colors — brand-aligned palette */
const TOPIC_COLORS: Record<string, string> = {
    kindness: '#6246EA',   // Primary purple
    character: '#4B2FD4',  // Dark purple
    patience: '#A78BFA',   // Soft violet
    prayer: '#10B981',     // Emerald
    knowledge: '#3B82F6',  // Blue
    gratitude: '#10B981',  // Emerald
    actions: '#6246EA',    // Primary purple
    family: '#F59E0B',     // Amber
    tongue: '#EF4444',     // Coral red
    remembrance: '#3B82F6', // Blue
    brotherhood: '#4B2FD4', // Dark purple
    forgiveness: '#A78BFA', // Soft violet
};

/** Topic card icons */
const TOPIC_ICONS: Record<string, string> = {
    kindness: 'hand-heart',
    character: 'account-star',
    patience: 'shield-check',
    prayer: 'hands-pray',
    knowledge: 'book-open-page-variant',
    gratitude: 'star-circle',
    actions: 'checkbox-marked-circle',
    family: 'home-heart',
    tongue: 'comment-alert',
    remembrance: 'meditation',
    brotherhood: 'account-group',
    forgiveness: 'heart-plus',
};

type ScreenMode = 'topics' | 'detail' | 'favorites';

export default function HadithLibraryScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { isPro } = usePro();
    const {
        bookmarkedIds, toggleBookmark, isBookmarked, setHadith,
    } = useHadith();

    const [mode, setMode] = useState<ScreenMode>('topics');
    const [selectedTopic, setSelectedTopic] = useState<HadithTopic | null>(null);
    const [favTopicFilter, setFavTopicFilter] = useState<string>('all');

    const isDark = theme.dark;

    const allHadiths = useMemo(() => getAllCuratedHadiths(), []);
    const favoriteHadiths = useMemo(
        () => allHadiths.filter(h => bookmarkedIds.includes(h.id)),
        [allHadiths, bookmarkedIds],
    );

    // Unique topics from favorites for filter chips
    const favoriteTopics = useMemo(() => {
        const topics = new Set(favoriteHadiths.map(h => h.topic));
        return Array.from(topics).sort();
    }, [favoriteHadiths]);

    const filteredFavorites = useMemo(
        () => favTopicFilter === 'all'
            ? favoriteHadiths
            : favoriteHadiths.filter(h => h.topic === favTopicFilter),
        [favoriteHadiths, favTopicFilter],
    );

    const handleTopicPress = useCallback((topic: HadithTopic) => {
        if (!isPro) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.push('/paywall?reason=hadith-library' as any);
            return;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedTopic(topic);
        setMode('detail');
    }, [isPro, router]);

    const handleBookmark = useCallback(async (hadithId: string) => {
        if (!isPro && !isBookmarked(hadithId) && bookmarkedIds.length >= FREE_BOOKMARK_LIMIT) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.push('/paywall?reason=hadith-bookmarks' as any);
            return;
        }
        const wasAdded = await toggleBookmark(hadithId);
        Haptics.impactAsync(wasAdded
            ? Haptics.ImpactFeedbackStyle.Medium
            : Haptics.ImpactFeedbackStyle.Light
        );
    }, [isPro, isBookmarked, bookmarkedIds, toggleBookmark, router]);

    const handleSetAsToday = useCallback(async (hadith: CuratedHadith) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await setHadith(hadith);
        router.back();
    }, [setHadith, router]);



    const renderHadithRow = useCallback(({ item: hadith }: { item: CuratedHadith }) => {
        const bookmarked = isBookmarked(hadith.id);
        return (
            <MotiView
                from={{ opacity: 0, translateX: -10 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'timing', duration: 250 }}
            >
                <View style={[
                    styles.hadithRow,
                    {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.outline,
                        borderWidth: StyleSheet.hairlineWidth,
                    },
                    Shadows.sm,
                ]}>
                    <View style={styles.hadithContent}>
                        <Text style={[styles.hadithArabic, { color: theme.colors.onSurface }]} numberOfLines={2}>
                            {hadith.arabicText}
                        </Text>
                        <Text style={[styles.hadithEnglish, { color: theme.colors.onSurfaceVariant }]} numberOfLines={3}>
                            {hadith.englishText}
                        </Text>
                        <View style={[
                            styles.hadithReflection,
                            { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(98,70,234,0.06)' },
                        ]}>
                            <Text style={[styles.hadithReflectionText, { color: theme.colors.primary }]} numberOfLines={2}>
                                {hadith.reflection}
                            </Text>
                        </View>
                        <Text style={[styles.hadithSource, { color: theme.colors.onSurfaceVariant }]}>
                            {hadith.narrator} · {hadith.collection}, #{hadith.reference}
                        </Text>
                    </View>
                    <View style={styles.hadithActions}>
                        <IconButton
                            icon={bookmarked ? 'heart' : 'heart-outline'}
                            size={20}
                            onPress={() => handleBookmark(hadith.id)}
                            iconColor={bookmarked ? '#F59E0B' : theme.colors.onSurfaceVariant}
                            style={styles.actionBtn}
                        />
                        <Pressable
                            onPress={() => handleSetAsToday(hadith)}
                            style={[styles.setTodayBtn, { borderColor: theme.colors.primary }]}
                        >
                            <Text style={[styles.setTodayText, { color: theme.colors.primary }]}>Set as Today</Text>
                        </Pressable>
                    </View>
                </View>
            </MotiView>
        );
    }, [isBookmarked, handleBookmark, handleSetAsToday, theme, isDark]);

    // ── TOPIC DETAIL VIEW ──
    if (mode === 'detail' && selectedTopic) {
        const accentColor = TOPIC_COLORS[selectedTopic.id] || theme.colors.primary;
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <View style={styles.detailHeader}>
                    <Pressable onPress={() => { setMode('topics'); setSelectedTopic(null); }} style={styles.backBtn}>
                        <Feather name="arrow-left" size={22} color={theme.colors.onSurface} />
                    </Pressable>
                    <View style={styles.detailHeaderContent}>
                        <Text style={[styles.detailTitle, { color: theme.colors.onSurface }]}>
                            {selectedTopic.name}
                        </Text>
                        <Text style={[styles.detailSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                            {selectedTopic.hadiths.length} hadiths
                        </Text>
                    </View>
                    <View style={[styles.detailAccent, { backgroundColor: accentColor }]} />
                </View>
                <FlatList
                    data={selectedTopic.hadiths}
                    keyExtractor={h => h.id}
                    renderItem={renderHadithRow}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            </SafeAreaView>
        );
    }

    // ── FAVORITES VIEW ──
    if (mode === 'favorites') {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <View style={styles.detailHeader}>
                    <Pressable onPress={() => { setMode('topics'); setFavTopicFilter('all'); }} style={styles.backBtn}>
                        <Feather name="arrow-left" size={22} color={theme.colors.onSurface} />
                    </Pressable>
                    <View style={styles.detailHeaderContent}>
                        <Text style={[styles.detailTitle, { color: theme.colors.onSurface }]}>
                            Favorites
                        </Text>
                        <Text style={[styles.detailSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                            {filteredFavorites.length} of {favoriteHadiths.length} saved
                        </Text>
                    </View>
                </View>

                {/* Topic filter chips */}
                {favoriteHadiths.length > 0 && favoriteTopics.length > 1 && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterChips}
                    >
                        <Pressable
                            onPress={() => setFavTopicFilter('all')}
                            style={[
                                styles.filterChip,
                                favTopicFilter === 'all'
                                    ? { backgroundColor: theme.colors.primary }
                                    : { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline, borderWidth: StyleSheet.hairlineWidth },
                            ]}
                        >
                            <Text style={[
                                styles.filterChipText,
                                { color: favTopicFilter === 'all' ? '#FFFFFF' : theme.colors.onSurfaceVariant },
                            ]}>All</Text>
                        </Pressable>
                        {favoriteTopics.map(topic => (
                            <Pressable
                                key={topic}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setFavTopicFilter(prev => prev === topic ? 'all' : topic);
                                }}
                                style={[
                                    styles.filterChip,
                                    favTopicFilter === topic
                                        ? { backgroundColor: theme.colors.primary }
                                        : { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline, borderWidth: StyleSheet.hairlineWidth },
                                ]}
                            >
                                <Text style={[
                                    styles.filterChipText,
                                    { color: favTopicFilter === topic ? '#FFFFFF' : theme.colors.onSurfaceVariant },
                                ]}>{topic.charAt(0).toUpperCase() + topic.slice(1)}</Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                )}

                {favoriteHadiths.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="heart-outline" size={48} color={theme.colors.onSurfaceVariant} />
                        <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                            No favorites yet. Bookmark hadiths to see them here.
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredFavorites}
                        keyExtractor={h => h.id}
                        renderItem={renderHadithRow}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </SafeAreaView>
        );
    }

    // ── TOPICS GRID ──
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={styles.topHeader}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <Feather name="arrow-left" size={22} color={theme.colors.onSurface} />
                </Pressable>
                <Text style={[styles.screenTitle, { color: theme.colors.onSurface }]}>
                    Hadith Library
                </Text>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Favorites row */}
                <Pressable
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setMode('favorites');
                    }}
                    style={({ pressed }) => [
                        styles.favoritesRow,
                        {
                            backgroundColor: theme.colors.surface,
                            borderColor: theme.colors.outline,
                            borderWidth: StyleSheet.hairlineWidth,
                        },
                        Shadows.sm,
                        pressed && { opacity: 0.9 },
                    ]}
                >
                    <MaterialCommunityIcons name="heart" size={20} color="#F59E0B" />
                    <Text style={[styles.favoritesText, { color: theme.colors.onSurface }]}>
                        Favorites
                    </Text>
                    <Text style={[styles.favoritesCount, { color: theme.colors.onSurfaceVariant }]}>
                        {favoriteHadiths.length}
                    </Text>
                    <Feather name="chevron-right" size={18} color={theme.colors.onSurfaceVariant} />
                </Pressable>

                {/* Pro badge for free users */}
                {!isPro && (
                    <Pressable
                        onPress={() => router.push('/paywall?reason=hadith-library' as any)}
                        style={({ pressed }) => [
                            styles.proBanner,
                            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                        ]}
                    >
                        <LinearGradient
                            colors={['#6246EA', '#4B2FD4']}
                            style={styles.proBannerGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <MaterialCommunityIcons name="lock" size={16} color="#F59E0B" />
                            <Text style={styles.proBannerText}>
                                Unlock all topics with Pro
                            </Text>
                            <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.8)" />
                        </LinearGradient>
                    </Pressable>
                )}

                {/* Topic grid */}
                <View style={styles.topicsGrid}>
                    {HADITH_TOPICS.map((topic, index) => {
                        const accent = TOPIC_COLORS[topic.id] || theme.colors.primary;
                        const iconName = TOPIC_ICONS[topic.id] || 'book-open-variant';
                        return (
                            <MotiView
                                key={topic.id}
                                from={{ opacity: 0, translateY: 12 }}
                                animate={{ opacity: 1, translateY: 0 }}
                                transition={{ type: 'spring', damping: 18, delay: index * 40 }}
                                style={{ width: CARD_WIDTH }}
                            >
                                <Pressable
                                    onPress={() => handleTopicPress(topic)}
                                    style={({ pressed }) => [
                                        styles.topicCard,
                                        {
                                            backgroundColor: theme.colors.surface,
                                            borderColor: theme.colors.outline,
                                            borderWidth: StyleSheet.hairlineWidth,
                                        },
                                        Shadows.sm,
                                        pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
                                    ]}
                                >
                                    {/* Colored accent strip at top */}
                                    <View style={[styles.topicAccentStrip, { backgroundColor: accent }]} />

                                    <View style={[styles.topicIconContainer, { backgroundColor: accent + '15' }]}>
                                        <MaterialCommunityIcons
                                            name={iconName as any}
                                            size={24}
                                            color={accent}
                                        />
                                    </View>
                                    <Text style={[styles.topicName, { color: theme.colors.onSurface }]} numberOfLines={2}>
                                        {topic.name}
                                    </Text>
                                    <Text style={[styles.topicCount, { color: theme.colors.onSurfaceVariant }]}>
                                        {topic.hadiths.length} hadiths
                                    </Text>
                                    {!isPro && (
                                        <View style={[styles.lockBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}>
                                            <Feather name="lock" size={10} color={theme.colors.onSurfaceVariant} />
                                        </View>
                                    )}
                                </Pressable>
                            </MotiView>
                        );
                    })}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    screenTitle: {
        flex: 1,
        ...Typography.titleLarge,
        marginLeft: Spacing.sm,
    },
    backBtn: {
        padding: Spacing.xs,
    },
    actionBtn: {
        margin: 0,
    },
    scrollContent: {
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.xxl,
    },

    // Favorites row
    favoritesRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: 14,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.md,
    },
    favoritesText: {
        flex: 1,
        ...Typography.titleMedium,
    },
    favoritesCount: {
        ...Typography.bodyMedium,
        fontWeight: '500',
    },

    // Pro banner
    proBanner: {
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
        marginBottom: Spacing.lg,
    },
    proBannerGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: 12,
    },
    proBannerText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },

    // Topic grid — exact 2-column layout
    topicsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: GRID_GAP,
    },
    topicCard: {
        padding: Spacing.md,
        paddingTop: Spacing.lg,
        borderRadius: BorderRadius.lg,
        position: 'relative',
        overflow: 'hidden',
        height: 140,
    },
    topicAccentStrip: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        borderTopLeftRadius: BorderRadius.lg,
        borderTopRightRadius: BorderRadius.lg,
    },
    topicIconContainer: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    topicName: {
        ...Typography.titleMedium,
        fontSize: 14,
        marginBottom: 4,
    },
    topicCount: {
        ...Typography.caption,
    },
    lockBadge: {
        position: 'absolute',
        top: Spacing.sm + 3, // below accent strip
        right: Spacing.sm,
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Detail header
    detailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    detailHeaderContent: {
        flex: 1,
        marginLeft: Spacing.sm,
    },
    detailTitle: {
        ...Typography.titleLarge,
    },
    detailSubtitle: {
        ...Typography.caption,
        marginTop: 2,
    },
    detailAccent: {
        width: 4,
        height: 36,
        borderRadius: 2,
    },

    // Hadith row
    listContent: {
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.xxl,
        gap: Spacing.sm,
    },
    hadithRow: {
        flexDirection: 'row',
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
    },
    hadithContent: {
        flex: 1,
    },
    hadithArabic: {
        fontSize: 18,
        lineHeight: 36,
        textAlign: 'right',
        fontWeight: '400',
        marginBottom: Spacing.xs,
    },
    hadithEnglish: {
        ...Typography.bodyMedium,
        fontStyle: 'italic',
        marginBottom: Spacing.xs,
    },
    hadithReflection: {
        borderRadius: BorderRadius.sm,
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        marginBottom: Spacing.xs,
    },
    hadithReflectionText: {
        ...Typography.labelMedium,
        lineHeight: 18,
    },
    hadithSource: {
        ...Typography.caption,
    },
    hadithActions: {
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
        marginLeft: Spacing.xs,
    },
    setTodayBtn: {
        borderWidth: 1,
        borderRadius: BorderRadius.sm,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
    },
    setTodayText: {
        ...Typography.caption,
        fontWeight: '600',
    },

    // Filter chips
    filterChips: {
        flexDirection: 'row',
        gap: Spacing.xs,
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
    },
    filterChip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: 6,
        borderRadius: BorderRadius.full,
    },
    filterChipText: {
        ...Typography.labelMedium,
        fontWeight: '600',
    },

    // Empty state
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: Spacing.xxl * 2,
        gap: Spacing.md,
    },
    emptyText: {
        ...Typography.bodyMedium,
        textAlign: 'center',
        paddingHorizontal: Spacing.xl,
    },
});

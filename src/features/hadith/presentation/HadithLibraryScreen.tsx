/**
 * HadithLibraryScreen — Browse all hadith topics and their hadiths.
 * Free users see topic list but can't view details → paywall.
 * Pro users browse freely, bookmark, and set any hadith as today's.
 */
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Pressable, FlatList, Dimensions, Modal, Share,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import {
    Spacing, BorderRadius, Shadows, Typography, BrandTokens,
} from '../../../core/theme/DesignSystem';
import { WaveBackground } from '../../../core/components/animated/WaveBackground';
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
/** Semantic color mapping — each topic gets a unique, meaningful color */
const TOPIC_COLORS: Record<string, string> = {
    kindness: '#6246EA',   // Purple — acts of kindness (brand anchor)
    character: '#92400E',  // Chocolate brown — noble character
    patience: '#059669',   // Emerald — endurance & strength
    prayer: '#1D4ED8',     // Deep blue — spiritual connection
    knowledge: '#0891B2',  // Teal — wisdom & learning
    gratitude: '#B7791F',  // Warm gold — thankfulness
    actions: '#DC2626',    // Ruby red — deeds & accountability
    family: '#EA580C',     // Burnt orange — warmth of home
    tongue: '#BE185D',     // Rose-magenta — speech & expression
    remembrance: '#475569', // Steel blue — spiritual reflection
    brotherhood: '#0284C7', // Sky blue — community bonds
    forgiveness: '#16A34A', // Green — mercy & renewal
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
    const navigation = useNavigation();
    const { isPro } = usePro();
    const {
        bookmarkedIds, toggleBookmark, isBookmarked, setHadith,
    } = useHadith();

    const [mode, setMode] = useState<ScreenMode>('topics');
    const [selectedTopic, setSelectedTopic] = useState<HadithTopic | null>(null);
    const [favTopicFilter, setFavTopicFilter] = useState<string>('all');
    const [filterSheetVisible, setFilterSheetVisible] = useState(false);

    // ── Intercept back-swipe in detail/favorites mode ──
    // Redirect to topics grid instead of popping the entire route
    useEffect(() => {
        if (mode === 'topics') return; // No interception needed on topics screen

        const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
            e.preventDefault();
            if (mode === 'favorites') {
                setMode('topics');
                setFavTopicFilter('all');
            } else if (mode === 'detail') {
                setMode('topics');
                setSelectedTopic(null);
            }
        });

        return unsubscribe;
    }, [mode, navigation]);

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

    const handleShareHadith = useCallback(async (hadith: CuratedHadith) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            await Share.share({
                message: `"${hadith.englishText}"\n\n${hadith.arabicText}\n\n— ${hadith.narrator} · ${hadith.collection}, #${hadith.reference}\n\nShared via QuranNotes`,
            });
        } catch { }
    }, []);

    /** Get the display label for a topic ID */
    const getTopicLabel = useCallback((topicId: string): string => {
        const topic = HADITH_TOPICS.find(t => t.id === topicId);
        return topic ? topic.name : topicId.charAt(0).toUpperCase() + topicId.slice(1);
    }, []);

    const renderHadithCard = useCallback(({ item: hadith }: { item: CuratedHadith }) => {
        const bookmarked = isBookmarked(hadith.id);
        const showTopicPill = mode === 'favorites';
        const topicColor = TOPIC_COLORS[hadith.topic] || theme.colors.primary;

        return (
            <MotiView
                from={{ opacity: 0, translateY: 8 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'spring', damping: 18, stiffness: 120 }}
            >
                <View style={[
                    styles.hadithCard,
                    {
                        backgroundColor: isDark ? theme.colors.surface : '#FDFBFF',
                    },
                    Shadows.md,
                ]}>

                    {/* Arabic text */}
                    <Text style={[styles.hadithArabic, { color: theme.colors.onSurface }]}>
                        {hadith.arabicText}
                    </Text>

                    {/* English translation */}
                    <Text style={[styles.hadithEnglish, { color: theme.colors.onSurfaceVariant }]}>
                        {hadith.englishText}
                    </Text>

                    {/* Reflection box */}
                    <View style={[
                        styles.hadithReflection,
                        { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(98,70,234,0.05)' },
                    ]}>
                        <Text style={[styles.hadithReflectionText, { color: theme.colors.primary }]}>
                            {hadith.reflection}
                        </Text>
                    </View>

                    {/* Source */}
                    <Text style={[styles.hadithSource, { color: theme.colors.onSurfaceVariant }]}>
                        {hadith.narrator} · {hadith.collection}, #{hadith.reference}
                    </Text>

                    {/* Bottom action bar */}
                    <View style={[styles.actionBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
                        <Pressable
                            onPress={() => handleBookmark(hadith.id)}
                            hitSlop={8}
                            style={({ pressed }) => [
                                styles.actionButton,
                                pressed && { opacity: 0.7 },
                            ]}
                        >
                            <MaterialCommunityIcons
                                name={bookmarked ? 'heart' : 'heart-outline'}
                                size={18}
                                color={bookmarked ? theme.colors.primary : theme.colors.onSurfaceVariant}
                            />
                            <Text style={[
                                styles.actionLabel,
                                { color: bookmarked ? theme.colors.primary : theme.colors.onSurfaceVariant },
                            ]}>
                                {bookmarked ? 'Saved' : 'Save'}
                            </Text>
                        </Pressable>

                        <Pressable
                            onPress={() => handleSetAsToday(hadith)}
                            hitSlop={8}
                            style={({ pressed }) => [
                                styles.actionButton,
                                pressed && { opacity: 0.7 },
                            ]}
                        >
                            <MaterialCommunityIcons name="calendar-check" size={18} color={theme.colors.primary} />
                            <Text style={[styles.actionLabel, { color: theme.colors.primary }]}>
                                Use for Today
                            </Text>
                        </Pressable>

                        <Pressable
                            onPress={() => handleShareHadith(hadith)}
                            hitSlop={8}
                            style={({ pressed }) => [
                                styles.actionButton,
                                pressed && { opacity: 0.7 },
                            ]}
                        >
                            <Feather name="share" size={16} color={theme.colors.onSurfaceVariant} />
                            <Text style={[styles.actionLabel, { color: theme.colors.onSurfaceVariant }]}>
                                Share
                            </Text>
                        </Pressable>
                    </View>
                </View >
            </MotiView >
        );
    }, [isBookmarked, handleBookmark, handleSetAsToday, handleShareHadith, theme, isDark, mode, getTopicLabel]);

    // ── TOPIC DETAIL VIEW ──
    if (mode === 'detail' && selectedTopic) {
        const accentColor = TOPIC_COLORS[selectedTopic.id] || theme.colors.primary;
        return (
            <WaveBackground variant="serene" intensity="subtle">
                <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
                    <View style={styles.detailHeader}>
                        <Pressable onPress={() => { setMode('topics'); setSelectedTopic(null); }} style={styles.backBtn}>
                            <Feather name="arrow-left" size={22} color={theme.colors.onSurface} />
                        </Pressable>
                        <View style={styles.detailHeaderContent}>
                            <Text style={[styles.detailTitle, { color: theme.colors.onSurface }]} numberOfLines={1}>
                                {selectedTopic.name}
                            </Text>
                            <Text style={[styles.detailSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                                {selectedTopic.hadiths.length} hadiths
                            </Text>
                        </View>
                    </View>
                    <FlatList
                        data={selectedTopic.hadiths}
                        keyExtractor={h => h.id}
                        renderItem={renderHadithCard}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={true}
                    />
                </SafeAreaView>
            </WaveBackground>
        );
    }

    // ── FAVORITES VIEW ──
    if (mode === 'favorites') {
        const activeFilterLabel = favTopicFilter === 'all'
            ? 'All Topics'
            : getTopicLabel(favTopicFilter);

        return (
            <WaveBackground variant="serene" intensity="subtle">
                <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
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

                        {/* Filter dropdown button */}
                        {favoriteHadiths.length > 0 && favoriteTopics.length > 1 && (
                            <Pressable
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setFilterSheetVisible(true);
                                }}
                                style={({ pressed }) => [
                                    styles.filterButton,
                                    {
                                        backgroundColor: favTopicFilter === 'all'
                                            ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)')
                                            : theme.colors.primary + '14',
                                    },
                                    pressed && { opacity: 0.7 },
                                ]}
                            >
                                <Feather
                                    name="filter"
                                    size={14}
                                    color={favTopicFilter === 'all' ? theme.colors.onSurfaceVariant : theme.colors.primary}
                                />
                                <Text style={[
                                    styles.filterButtonText,
                                    { color: favTopicFilter === 'all' ? theme.colors.onSurfaceVariant : theme.colors.primary },
                                ]} numberOfLines={1}>
                                    {activeFilterLabel}
                                </Text>
                                <Feather
                                    name="chevron-down"
                                    size={14}
                                    color={favTopicFilter === 'all' ? theme.colors.onSurfaceVariant : theme.colors.primary}
                                />
                            </Pressable>
                        )}
                    </View>

                    {/* Filter bottom sheet modal */}
                    <Modal
                        visible={filterSheetVisible}
                        transparent
                        animationType="slide"
                        onRequestClose={() => setFilterSheetVisible(false)}
                    >
                        <Pressable
                            style={styles.modalOverlay}
                            onPress={() => setFilterSheetVisible(false)}
                        >
                            <Pressable
                                style={[styles.modalSheet, { backgroundColor: theme.colors.surface }]}
                                onPress={(e) => e.stopPropagation()}
                            >
                                {/* Handle bar */}
                                <View style={styles.modalHandle}>
                                    <View style={[styles.modalHandleBar, { backgroundColor: theme.colors.outline }]} />
                                </View>

                                <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                                    Filter by Topic
                                </Text>

                                {/* All option */}
                                <Pressable
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setFavTopicFilter('all');
                                        setFilterSheetVisible(false);
                                    }}
                                    style={({ pressed }) => [
                                        styles.modalOption,
                                        { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
                                        pressed && { opacity: 0.7 },
                                    ]}
                                >
                                    <Text style={[styles.modalOptionText, { color: theme.colors.onSurface }]}>
                                        All Topics
                                    </Text>
                                    <Text style={[styles.modalOptionCount, { color: theme.colors.onSurfaceVariant }]}>
                                        {favoriteHadiths.length}
                                    </Text>
                                    {favTopicFilter === 'all' && (
                                        <MaterialCommunityIcons name="check" size={20} color={theme.colors.primary} />
                                    )}
                                </Pressable>

                                {/* Topic options */}
                                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
                                    {favoriteTopics.map(topic => {
                                        const topicColor = TOPIC_COLORS[topic] || theme.colors.primary;
                                        const count = favoriteHadiths.filter(h => h.topic === topic).length;
                                        return (
                                            <Pressable
                                                key={topic}
                                                onPress={() => {
                                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                    setFavTopicFilter(topic);
                                                    setFilterSheetVisible(false);
                                                }}
                                                style={({ pressed }) => [
                                                    styles.modalOption,
                                                    { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
                                                    pressed && { opacity: 0.7 },
                                                ]}
                                            >
                                                <View style={[styles.modalOptionIcon, { backgroundColor: topicColor + '14' }]}>
                                                    <MaterialCommunityIcons
                                                        name={(TOPIC_ICONS[topic] || 'book-open-variant') as any}
                                                        size={16}
                                                        color={topicColor}
                                                    />
                                                </View>
                                                <Text style={[styles.modalOptionText, { color: theme.colors.onSurface, flex: 1 }]}>
                                                    {getTopicLabel(topic)}
                                                </Text>
                                                <Text style={[styles.modalOptionCount, { color: theme.colors.onSurfaceVariant }]}>
                                                    {count}
                                                </Text>
                                                {favTopicFilter === topic && (
                                                    <MaterialCommunityIcons name="check" size={20} color={theme.colors.primary} />
                                                )}
                                            </Pressable>
                                        );
                                    })}
                                </ScrollView>
                            </Pressable>
                        </Pressable>
                    </Modal>

                    {favoriteHadiths.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MotiView
                                from={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'timing', duration: 400 }}
                            >
                                <MaterialCommunityIcons name="heart-outline" size={48} color={theme.colors.onSurfaceVariant} />
                            </MotiView>
                            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                                No favorites yet. Bookmark hadiths to see them here.
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={filteredFavorites}
                            keyExtractor={h => h.id}
                            renderItem={renderHadithCard}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={true}
                        />
                    )}
                </SafeAreaView>
            </WaveBackground>
        );
    }

    // ── TOPICS GRID ──
    return (
        <WaveBackground variant="serene" intensity="medium">
            <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
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
                                backgroundColor: isDark ? theme.colors.surface : '#FDFBFF',
                                borderColor: isDark ? theme.colors.outline : 'rgba(98,70,234,0.08)',
                                borderWidth: StyleSheet.hairlineWidth,
                            },
                            Shadows.sm,
                            pressed && { opacity: 0.9 },
                        ]}
                    >
                        <MaterialCommunityIcons name="heart" size={20} color={theme.colors.primary} />
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
                                                backgroundColor: isDark ? theme.colors.surface : '#FDFBFF',
                                                borderColor: isDark ? theme.colors.outline : 'rgba(98,70,234,0.08)',
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
                                        <Text style={[styles.topicName, { color: theme.colors.onSurface }]} numberOfLines={1}>
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
        </WaveBackground>
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
        height: 150,
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
        fontSize: 16,
        marginBottom: 4,
    },
    topicCount: {
        ...Typography.caption,
        fontSize: 13,
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
    // Hadith card (vertical full-width layout)
    listContent: {
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.xxl,
        gap: Spacing.md,
    },
    hadithCard: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        paddingBottom: 0,
        overflow: 'hidden',
    },
    topicPill: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 4,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        borderRadius: BorderRadius.full,
        marginBottom: Spacing.sm,
    },
    topicPillText: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    hadithArabic: {
        fontSize: 20,
        lineHeight: 38,
        textAlign: 'right',
        fontWeight: '400',
        marginBottom: Spacing.sm,
    },
    hadithEnglish: {
        ...Typography.bodyMedium,
        fontStyle: 'italic',
        lineHeight: 22,
        marginBottom: Spacing.sm,
    },
    hadithReflection: {
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    hadithReflectionText: {
        ...Typography.labelMedium,
        lineHeight: 18,
    },
    hadithSource: {
        ...Typography.caption,
        marginBottom: Spacing.md,
    },

    // Bottom action bar
    actionBar: {
        flexDirection: 'row',
        marginTop: Spacing.xs,
        paddingVertical: Spacing.sm + 2,
        borderRadius: BorderRadius.sm,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
        justifyContent: 'center',
    },
    actionLabel: {
        fontSize: 13,
        fontWeight: '500',
    },

    // Filter dropdown button (in header)
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: Spacing.sm + 2,
        paddingVertical: 6,
        borderRadius: BorderRadius.full,
        maxWidth: 160,
    },
    filterButtonText: {
        fontSize: 12,
        fontWeight: '600',
    },

    // Filter bottom sheet modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        paddingBottom: Spacing.xxl,
    },
    modalHandle: {
        alignItems: 'center',
        paddingVertical: Spacing.sm + 2,
    },
    modalHandleBar: {
        width: 36,
        height: 4,
        borderRadius: 2,
    },
    modalTitle: {
        ...Typography.titleMedium,
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    modalOptionIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOptionText: {
        ...Typography.bodyLarge,
        flex: 1,
    },
    modalOptionCount: {
        ...Typography.caption,
        marginRight: Spacing.xs,
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

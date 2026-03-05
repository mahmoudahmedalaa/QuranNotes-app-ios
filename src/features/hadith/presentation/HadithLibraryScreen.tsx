/**
 * HadithLibraryScreen — Browse all hadith topics and their hadiths.
 * Free users see topic list but can't view details → paywall.
 * Pro users browse freely, bookmark, and set any hadith as today's.
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Pressable, FlatList,
} from 'react-native';
import { useTheme, IconButton } from 'react-native-paper';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
    Spacing, BorderRadius, Shadows, Typography,
} from '../../../core/theme/DesignSystem';
import { HADITH_TOPICS, getAllCuratedHadiths } from '../domain/CuratedHadiths';
import { CuratedHadith, HadithTopic } from '../domain/HadithTypes';
import { useHadith } from '../infrastructure/HadithContext';
import { usePro } from '../../auth/infrastructure/ProContext';
import { useSettings } from '../../settings/infrastructure/SettingsContext';

const FREE_BOOKMARK_LIMIT = 3;

/** Topic card accent colors */
const TOPIC_COLORS: Record<string, string> = {
    kindness: '#E8795A',
    character: '#5B8CB5',
    patience: '#7E6DA5',
    prayer: '#4A9574',
    knowledge: '#C5903A',
    gratitude: '#6BA375',
    actions: '#B56B5A',
    family: '#D18A5A',
    tongue: '#8B6E5A',
    remembrance: '#5A7EB5',
    brotherhood: '#6B8F7A',
    forgiveness: '#7A8EB5',
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
    const { settings, updateSettings } = useSettings();
    const {
        bookmarkedIds, toggleBookmark, isBookmarked, setHadith,
    } = useHadith();

    const [mode, setMode] = useState<ScreenMode>('topics');
    const [selectedTopic, setSelectedTopic] = useState<HadithTopic | null>(null);

    const allHadiths = useMemo(() => getAllCuratedHadiths(), []);
    const favoriteHadiths = useMemo(
        () => allHadiths.filter(h => bookmarkedIds.includes(h.id)),
        [allHadiths, bookmarkedIds],
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

    const handleNotificationToggle = useCallback(() => {
        if (!isPro) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.push('/paywall?reason=hadith-notifications' as any);
            return;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        updateSettings({
            hadithNotificationsEnabled: !settings.hadithNotificationsEnabled,
        });
    }, [isPro, settings, updateSettings, router]);

    const renderHadithRow = useCallback(({ item: hadith }: { item: CuratedHadith }) => {
        const bookmarked = isBookmarked(hadith.id);
        return (
            <MotiView
                from={{ opacity: 0, translateX: -10 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'timing', duration: 250 }}
            >
                <View style={[styles.hadithRow, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <View style={styles.hadithContent}>
                        <Text style={[styles.hadithArabic, { color: theme.colors.onSurface }]} numberOfLines={2}>
                            {hadith.arabicText}
                        </Text>
                        <Text style={[styles.hadithEnglish, { color: theme.colors.onSurfaceVariant }]} numberOfLines={3}>
                            {hadith.englishText}
                        </Text>
                        <View style={styles.hadithReflection}>
                            <Text style={[styles.hadithReflectionText, { color: theme.colors.primary }]} numberOfLines={2}>
                                {hadith.reflection}
                            </Text>
                        </View>
                        <Text style={[styles.hadithSource, { color: theme.colors.outline }]}>
                            {hadith.narrator} · {hadith.collection}, #{hadith.reference}
                        </Text>
                    </View>
                    <View style={styles.hadithActions}>
                        <IconButton
                            icon={bookmarked ? 'heart' : 'heart-outline'}
                            size={20}
                            onPress={() => handleBookmark(hadith.id)}
                            iconColor={bookmarked ? '#F59E0B' : theme.colors.outline}
                            style={styles.actionBtn}
                        />
                        <IconButton
                            icon="calendar-today"
                            size={20}
                            onPress={() => handleSetAsToday(hadith)}
                            iconColor={theme.colors.primary}
                            style={styles.actionBtn}
                        />
                    </View>
                </View>
            </MotiView>
        );
    }, [isBookmarked, handleBookmark, handleSetAsToday, theme]);

    // ── TOPIC DETAIL VIEW ──
    if (mode === 'detail' && selectedTopic) {
        const accentColor = TOPIC_COLORS[selectedTopic.id] || '#5B8CB5';
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
                        <Text style={[styles.detailSubtitle, { color: theme.colors.outline }]}>
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
                    <Pressable onPress={() => setMode('topics')} style={styles.backBtn}>
                        <Feather name="arrow-left" size={22} color={theme.colors.onSurface} />
                    </Pressable>
                    <View style={styles.detailHeaderContent}>
                        <Text style={[styles.detailTitle, { color: theme.colors.onSurface }]}>
                            Favorites
                        </Text>
                        <Text style={[styles.detailSubtitle, { color: theme.colors.outline }]}>
                            {favoriteHadiths.length} saved
                        </Text>
                    </View>
                </View>
                {favoriteHadiths.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="heart-outline" size={48} color={theme.colors.outline} />
                        <Text style={[styles.emptyText, { color: theme.colors.outline }]}>
                            No favorites yet. Bookmark hadiths to see them here.
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={favoriteHadiths}
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
    const notifEnabled = settings.hadithNotificationsEnabled || false;

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
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {/* Notification bell */}
                    <IconButton
                        icon={notifEnabled ? 'bell-ring' : 'bell-outline'}
                        size={22}
                        onPress={handleNotificationToggle}
                        iconColor={notifEnabled ? '#F59E0B' : theme.colors.outline}
                        style={styles.actionBtn}
                    />
                </View>
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
                        { backgroundColor: theme.colors.surfaceVariant },
                        pressed && { opacity: 0.9 },
                    ]}
                >
                    <MaterialCommunityIcons name="heart" size={20} color="#F59E0B" />
                    <Text style={[styles.favoritesText, { color: theme.colors.onSurface }]}>
                        Favorites
                    </Text>
                    <Text style={[styles.favoritesCount, { color: theme.colors.outline }]}>
                        {favoriteHadiths.length}
                    </Text>
                    <Feather name="chevron-right" size={18} color={theme.colors.outline} />
                </Pressable>

                {/* Pro badge for free users */}
                {!isPro && (
                    <View style={styles.proBanner}>
                        <LinearGradient
                            colors={['#1A1340', '#312E81']}
                            style={styles.proBannerGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <MaterialCommunityIcons name="lock" size={18} color="#F59E0B" />
                            <Text style={styles.proBannerText}>
                                Unlock all topics with Pro
                            </Text>
                            <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.7)" />
                        </LinearGradient>
                    </View>
                )}

                {/* Topic grid */}
                <View style={styles.topicsGrid}>
                    {HADITH_TOPICS.map((topic, index) => {
                        const accent = TOPIC_COLORS[topic.id] || '#5B8CB5';
                        const iconName = TOPIC_ICONS[topic.id] || 'book-open-variant';
                        return (
                            <MotiView
                                key={topic.id}
                                from={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', damping: 16, delay: index * 50 }}
                            >
                                <Pressable
                                    onPress={() => handleTopicPress(topic)}
                                    style={({ pressed }) => [
                                        styles.topicCard,
                                        { backgroundColor: theme.colors.surfaceVariant },
                                        pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
                                    ]}
                                >
                                    <View style={[styles.topicIconContainer, { backgroundColor: accent + '20' }]}>
                                        <MaterialCommunityIcons
                                            name={iconName as any}
                                            size={22}
                                            color={accent}
                                        />
                                    </View>
                                    <Text style={[styles.topicName, { color: theme.colors.onSurface }]} numberOfLines={2}>
                                        {topic.name}
                                    </Text>
                                    <Text style={[styles.topicCount, { color: theme.colors.outline }]}>
                                        {topic.hadiths.length} hadiths
                                    </Text>
                                    {!isPro && (
                                        <View style={styles.lockBadge}>
                                            <Feather name="lock" size={10} color="#F59E0B" />
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
        fontSize: 22,
        fontWeight: '700',
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
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.md,
    },
    favoritesText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
    },
    favoritesCount: {
        fontSize: 14,
        fontWeight: '500',
    },

    // Pro banner
    proBanner: {
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
        marginBottom: Spacing.md,
    },
    proBannerGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    proBannerText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.9)',
    },

    // Topic grid
    topicsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    topicCard: {
        width: '47%' as any,
        minWidth: 150,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        position: 'relative',
    },
    topicIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    topicName: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    topicCount: {
        fontSize: 12,
        fontWeight: '500',
    },
    lockBadge: {
        position: 'absolute',
        top: Spacing.sm,
        right: Spacing.sm,
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
        fontSize: 20,
        fontWeight: '700',
    },
    detailSubtitle: {
        fontSize: 13,
        fontWeight: '500',
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
        fontSize: 13,
        lineHeight: 20,
        fontStyle: 'italic',
        marginBottom: Spacing.xs,
    },
    hadithReflection: {
        backgroundColor: 'rgba(0,0,0,0.04)',
        borderRadius: BorderRadius.sm,
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        marginBottom: Spacing.xs,
    },
    hadithReflectionText: {
        fontSize: 12,
        lineHeight: 18,
        fontWeight: '500',
    },
    hadithSource: {
        fontSize: 11,
        fontWeight: '500',
    },
    hadithActions: {
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
        marginLeft: Spacing.xs,
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
        fontSize: 14,
        textAlign: 'center',
        paddingHorizontal: Spacing.xl,
    },
});

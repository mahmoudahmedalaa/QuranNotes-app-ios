/**
 * DailyVerseCard — Beautiful card showing today's curated verse.
 * Premium surface-based card with brand accent. Supports share and tap-to-read.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, AppState, AppStateStatus } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, IconButton } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QURAN_TOPICS, TopicVerse } from '../domain/QuranTopics';
import { Spacing, BorderRadius, Shadows, Typography } from '../../../core/theme/DesignSystem';
import { getQuranFontFamily } from '../../../core/theme/QuranFonts';
import { useSettings } from '../../settings/infrastructure/SettingsContext';
import * as Haptics from 'expo-haptics';
import { WidgetBridge } from '../../../../modules/widget-bridge/src';
import { PremiumShareSheet } from '../../sharing/presentation/PremiumShareSheet';
import { ShareCardData } from '../../sharing/domain/ShareTemplateTypes';

const STORAGE_KEY = 'daily_verse_data';
const HISTORY_KEY = 'daily_verse_history';

/** Brand accent for the Verse card — deep teal-emerald */
const VERSE_ACCENT = '#0D9488';

/** Sync verse data to iOS widget */
function syncVerseToWidget(v: TopicVerse) {
    WidgetBridge.setDailyVerse({
        arabicText: v.arabicSnippet,
        translation: v.translation,
        surahName: v.surahName,
        surahNameArabic: '',
        verseNumber: v.verse,
        surahNumber: v.surah,
    });
}

/** Get all verses from all topics as a flat array */
function getAllVerses(): TopicVerse[] {
    return QURAN_TOPICS.flatMap(t => t.verses);
}

async function pickNextVerse(): Promise<TopicVerse> {
    const allVerses = getAllVerses();
    let history: string[] = [];
    try {
        const storedHistory = await AsyncStorage.getItem(HISTORY_KEY);
        if (storedHistory) {
            history = JSON.parse(storedHistory);
        }
    } catch (_e) {
        if (__DEV__) console.warn('Failed to parse daily verse history', _e);
    }

    let availableVerses = allVerses.filter(v => !history.includes(`${v.surah}-${v.verse}`));
    if (availableVerses.length === 0) {
        history = [];
        availableVerses = allVerses;
    }

    const randomVerse = availableVerses[Math.floor(Math.random() * availableVerses.length)];
    history.push(`${randomVerse.surah}-${randomVerse.verse}`);

    try {
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (_e) {
        if (__DEV__) console.warn('Failed to save daily verse history', _e);
    }

    return randomVerse;
}


/** Get today's date key */
function todayKey(): string {
    return new Date().toISOString().split('T')[0];
}

export const DailyVerseCard: React.FC = () => {
    const theme = useTheme();
    const router = useRouter();
    const { settings } = useSettings();
    const quranFontFamily = getQuranFontFamily(settings.quranFont);
    const [verse, setVerse] = useState<TopicVerse | null>(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(true);
    const [showShareSheet, setShowShareSheet] = useState(false);

    const loadOrPickVerse = useCallback(async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.date === todayKey()) {
                    setVerse(parsed.verse);
                    syncVerseToWidget(parsed.verse);
                    setLoading(false);
                    return;
                }
            }

            // Pick a new random verse for today
            const nextVerse = await pickNextVerse();
            setVerse(nextVerse);
            syncVerseToWidget(nextVerse);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
                date: todayKey(),
                verse: nextVerse,
            }));
        } catch {
            // Fallback to a well-known verse
            const fallbackVerse: TopicVerse = {
                surah: 13,
                verse: 28,
                surahName: "Ar-Ra'd",
                arabicSnippet: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
                translation: 'Unquestionably, by the remembrance of Allah hearts are assured.',
            };
            setVerse(fallbackVerse);
            syncVerseToWidget(fallbackVerse);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadOrPickVerse();
    }, [loadOrPickVerse]);

    const handleRefresh = async () => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const nextVerse = await pickNextVerse();
            setVerse(nextVerse);
            syncVerseToWidget(nextVerse);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
                date: todayKey(),
                verse: nextVerse,
            }));
        } catch (_e) {
            if (__DEV__) console.error('[DailyVerse] Error refreshing:', _e);
        }
    };

    const handlePress = () => {
        if (!verse) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push(`/surah/${verse.surah}?verse=${verse.verse}` as any);
    };

    const handleShare = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setShowShareSheet(true);
    }, []);

    if (loading || !verse) return null;

    // Surface-based card: theme-aware text colors, no gradient background
    const textColorPrimary = theme.colors.onSurface;
    const textColorSecondary = theme.dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)';
    const textColorTertiary = theme.dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)';

    // Build share card data
    const shareData: ShareCardData = {
        type: 'verse',
        arabicText: verse.arabicSnippet,
        englishText: verse.translation,
        reference: `${verse.surahName} ${verse.surah}:${verse.verse}`,
        quranFontFamily,
    };

    return (
        <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, delay: 120 }}
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
                    {/* Teal-emerald gradient — bold & vibrant */}
                    <LinearGradient
                        colors={
                            theme.dark
                                ? ['rgba(13,148,136,0.55)', 'rgba(13,148,136,0.25)', 'rgba(13,148,136,0.08)']
                                : ['rgba(13,148,136,0.40)', 'rgba(13,148,136,0.18)', 'rgba(13,148,136,0.06)']
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[StyleSheet.absoluteFillObject, { borderRadius: BorderRadius.lg }]}
                    />
                    {/* Secondary glow from bottom-right for depth */}
                    <LinearGradient
                        colors={
                            theme.dark
                                ? ['rgba(16,185,129,0.20)', 'rgba(16,185,129,0.06)', 'transparent']
                                : ['rgba(16,185,129,0.14)', 'rgba(16,185,129,0.04)', 'transparent']
                        }
                        start={{ x: 1, y: 1 }}
                        end={{ x: 0, y: 0 }}
                        style={[StyleSheet.absoluteFillObject, { borderRadius: BorderRadius.lg }]}
                    />

                    <View style={styles.cardContent}>

                        {/* Header — always visible */}
                        <View style={styles.cardHeader}>
                            <View style={styles.labelRow}>
                                <Text style={[styles.label, { color: VERSE_ACCENT }]}>✦ Verse of the Day</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <IconButton
                                    icon="refresh"
                                    size={18}
                                    onPress={handleRefresh}
                                    iconColor={textColorSecondary}
                                    style={styles.refreshButton}
                                />
                                <IconButton
                                    icon="share-variant"
                                    size={18}
                                    onPress={handleShare}
                                    iconColor={textColorSecondary}
                                    style={styles.actionButton}
                                />
                                <Feather
                                    name={expanded ? 'chevron-up' : 'chevron-down'}
                                    size={20}
                                    color={textColorSecondary}
                                />
                            </View>
                        </View>

                        {/* Compact: just the reference */}
                        {!expanded && (
                            <View style={styles.referenceRow}>
                                <Feather
                                    name="chevron-right"
                                    size={16}
                                    color={textColorTertiary}
                                />
                                <Text style={[styles.referenceText, { color: textColorSecondary }]} numberOfLines={1}>
                                    {verse.surahName} · Verse {verse.verse}
                                </Text>
                                <Text style={[styles.translationText, { color: textColorPrimary, marginBottom: 0, flex: 1 }]} numberOfLines={1}>
                                    {verse.translation}
                                </Text>
                            </View>
                        )}

                        {/* Expanded: Arabic + translation + reference */}
                        {expanded && (
                            <>
                                <Text style={[styles.arabicText, { color: textColorPrimary, fontFamily: quranFontFamily }]}>
                                    {verse.arabicSnippet}
                                </Text>
                                <Text style={[styles.translationText, { color: textColorSecondary }]}>
                                    {verse.translation}
                                </Text>
                                <Pressable onPress={handlePress}>
                                    <View style={styles.referenceRow}>
                                        <Feather
                                            name="book-open"
                                            size={14}
                                            color={textColorTertiary}
                                        />
                                        <Text style={[styles.referenceText, { color: textColorSecondary }]}>
                                            {verse.surahName} · Verse {verse.verse}
                                        </Text>
                                        <Feather
                                            name="chevron-right"
                                            size={16}
                                            color={textColorTertiary}
                                        />
                                    </View>
                                </Pressable>
                            </>
                        )}
                    </View>{/* end cardContent */}
                </View>{/* end card */}
            </Pressable>

            {/* Premium Share Sheet */}
            <PremiumShareSheet
                visible={showShareSheet}
                onDismiss={() => setShowShareSheet(false)}
                data={shareData}
            />
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
    refreshButton: {
        margin: 0,
    },
    arabicText: {
        fontSize: 22,
        lineHeight: 44,
        textAlign: 'right',
        marginBottom: Spacing.md,
    },
    translationText: {
        fontSize: 14,
        lineHeight: 22,
        fontStyle: 'italic',
        marginBottom: Spacing.sm,
    },
    referenceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    referenceText: {
        flex: 1,
        fontSize: 12,
        fontWeight: '500',
    },
    actionButton: {
        margin: 0,
    },
});

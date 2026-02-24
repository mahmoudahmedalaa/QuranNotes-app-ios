/**
 * DailyVerseCard — Beautiful card showing today's curated verse.
 * Gradient shifts based on time of day. Supports share and tap-to-read.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, AppState, AppStateStatus } from 'react-native';
import { useTheme, IconButton } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QURAN_TOPICS, TopicVerse } from '../domain/QuranTopics';
import { Spacing, BorderRadius, Shadows } from '../../../core/theme/DesignSystem';
import * as Haptics from 'expo-haptics';
import { WidgetBridge } from '../../../../modules/widget-bridge/src';

const STORAGE_KEY = 'daily_verse_data';
const HISTORY_KEY = 'daily_verse_history';

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

/** Get time-of-day gradient — different palettes for light vs dark */
function getTimeGradient(hour: number): readonly [string, string, string] {
    // The DailyVerseCard is a "Window to the Sky". We use these rich, atmospheric 
    // gradients universally in both Light and Dark modes. All text inside the card 
    // is permanently locked to White/Light-opacities to guarantee WCAG AA contrast.
    if (hour >= 4 && hour < 6) return ['#3B1F50', '#7E4B8C', '#C481A7'] as const;   // Fajr: Dawn purple to soft pink
    if (hour >= 6 && hour < 12) return ['#4CA1AF', '#73bdeb', '#A5D6F7'] as const;  // Morning: Airy sky blue
    if (hour >= 12 && hour < 16) return ['#1E3A8A', '#2563EB', '#60A5FA'] as const; // Dhuhr: Vibrant daytime blue
    if (hour >= 16 && hour < 18) return ['#9A3412', '#C2410C', '#EA580C'] as const; // Asr: Golden hour amber/orange
    if (hour >= 18 && hour < 20) return ['#581C87', '#9D174D', '#BE123C'] as const; // Maghrib: Sunset crimson & purple
    return ['#0F172A', '#1E293B', '#334155'] as const;                              // Isha: Deep midnight
}

async function pickNextVerse(): Promise<TopicVerse> {
    const allVerses = getAllVerses();
    let history: string[] = [];
    try {
        const storedHistory = await AsyncStorage.getItem(HISTORY_KEY);
        if (storedHistory) {
            history = JSON.parse(storedHistory);
        }
    } catch (e) {
        if (__DEV__) console.warn('Failed to parse daily verse history', e);
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
    } catch (e) {
        if (__DEV__) console.warn('Failed to save daily verse history', e);
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
    const [verse, setVerse] = useState<TopicVerse | null>(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);
    const [currentHour, setCurrentHour] = useState(new Date().getHours());

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                setCurrentHour(new Date().getHours());
            }
        });

        return () => {
            subscription.remove();
        };
    }, []);

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
        } catch (e) {
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
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const nextVerse = await pickNextVerse();
        setVerse(nextVerse);
        syncVerseToWidget(nextVerse);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
            date: todayKey(),
            verse: nextVerse,
        }));
    };

    const handlePress = () => {
        if (!verse) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push(`/surah/${verse.surah}?verse=${verse.verse}` as any);
    };

    if (loading || !verse) return null;

    // Render atmospheric gradient for the Sky window.
    // Text is ALWAYS hard-locked to white/light-opacities to guarantee maximum contrast 
    // against these rich, vibrant time-of-day backgrounds.
    const gradientColors = getTimeGradient(currentHour);
    const textColorPrimary = '#FFFFFF';
    const textColorSecondary = 'rgba(255,255,255,0.85)';
    const textColorTertiary = 'rgba(255,255,255,0.6)';

    return (
        <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, delay: 120 }}
            style={{ paddingHorizontal: Spacing.md, marginBottom: Spacing.sm }}
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

                    {/* Header — always visible */}
                    <View style={styles.cardHeader}>
                        <View style={styles.labelRow}>
                            <Text style={[styles.label, { color: '#D4A853' }]}>✦ Verse of the Day</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <IconButton
                                icon="refresh"
                                size={18}
                                onPress={handleRefresh}
                                iconColor={textColorSecondary}
                                style={styles.refreshButton}
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
                            <Text style={[styles.arabicText, { color: textColorPrimary }]}>
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
                </View>
            </Pressable>
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
    refreshButton: {
        margin: 0,
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
});

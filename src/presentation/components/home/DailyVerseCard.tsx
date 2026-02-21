/**
 * DailyVerseCard — Beautiful card showing today's curated verse.
 * Gradient shifts based on time of day. Supports share and tap-to-read.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QURAN_TOPICS, TopicVerse } from '../../../domain/entities/QuranTopics';
import { Spacing, BorderRadius, Shadows } from '../../theme/DesignSystem';
import * as Haptics from 'expo-haptics';
import { WidgetBridge } from '../../../../modules/widget-bridge/src';

const STORAGE_KEY = 'daily_verse_data';

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
function getTimeGradient(isDark: boolean): readonly [string, string, string] {
    const hour = new Date().getHours();

    if (isDark) {
        // Dark mode — rich, moody brand colors (unchanged, user happy with these)
        if (hour >= 4 && hour < 6) return ['#1A1B3A', '#2D1B69', '#5B3A8C'] as const;   // Fajr
        if (hour >= 6 && hour < 12) return ['#1E3A8A', '#1D4ED8', '#5B7FFF'] as const;   // Morning
        if (hour >= 12 && hour < 16) return ['#1E3A5F', '#155E75', '#0E7490'] as const;   // Afternoon
        if (hour >= 16 && hour < 18) return ['#7C2D12', '#9A3412', '#D4853C'] as const;   // Asr
        if (hour >= 18 && hour < 20) return ['#3B0764', '#6B21A8', '#9333EA'] as const;   // Maghrib
        return ['#0F172A', '#1E293B', '#2D3A5F'] as const;                                // Isha
    }

    // Light mode — consistent brand faint-purple (app identity colour)
    return ['#C4B5FD', '#8B5CF6', '#5B7FFF'] as const;
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
            const allVerses = getAllVerses();
            const randomVerse = allVerses[Math.floor(Math.random() * allVerses.length)];
            setVerse(randomVerse);
            syncVerseToWidget(randomVerse);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
                date: todayKey(),
                verse: randomVerse,
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
        const allVerses = getAllVerses();
        const randomVerse = allVerses[Math.floor(Math.random() * allVerses.length)];
        setVerse(randomVerse);
        syncVerseToWidget(randomVerse);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
            date: todayKey(),
            verse: randomVerse,
        }));
    };

    const handlePress = () => {
        if (!verse) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push(`/surah/${verse.surah}?verse=${verse.verse}` as any);
    };

    if (loading || !verse) return null;

    const gradientColors = getTimeGradient(theme.dark);

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
                                iconColor="rgba(255,255,255,0.6)"
                                style={styles.refreshButton}
                            />
                            <MaterialCommunityIcons
                                name={expanded ? 'chevron-up' : 'chevron-down'}
                                size={20}
                                color="rgba(255,255,255,0.6)"
                            />
                        </View>
                    </View>

                    {/* Compact: just the reference */}
                    {!expanded && (
                        <View style={styles.referenceRow}>
                            <MaterialCommunityIcons
                                name="book-open-variant"
                                size={14}
                                color="rgba(255,255,255,0.5)"
                            />
                            <Text style={[styles.referenceText, { color: 'rgba(255,255,255,0.6)' }]} numberOfLines={1}>
                                {verse.surahName} · Verse {verse.verse}
                            </Text>
                            <Text style={[styles.translationText, { color: 'rgba(255,255,255,0.75)', marginBottom: 0, flex: 1 }]} numberOfLines={1}>
                                {verse.translation}
                            </Text>
                        </View>
                    )}

                    {/* Expanded: Arabic + translation + reference */}
                    {expanded && (
                        <>
                            <Text style={[styles.arabicText, { color: '#FFFFFF' }]}>
                                {verse.arabicSnippet}
                            </Text>
                            <Text style={[styles.translationText, { color: 'rgba(255,255,255,0.8)' }]}>
                                {verse.translation}
                            </Text>
                            <Pressable onPress={handlePress}>
                                <View style={styles.referenceRow}>
                                    <MaterialCommunityIcons
                                        name="book-open-variant"
                                        size={14}
                                        color="rgba(255,255,255,0.5)"
                                    />
                                    <Text style={[styles.referenceText, { color: 'rgba(255,255,255,0.6)' }]}>
                                        {verse.surahName} · Verse {verse.verse}
                                    </Text>
                                    <MaterialCommunityIcons
                                        name="chevron-right"
                                        size={16}
                                        color="rgba(255,255,255,0.5)"
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

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

const STORAGE_KEY = 'daily_verse_data';

/** Get all verses from all topics as a flat array */
function getAllVerses(): TopicVerse[] {
    return QURAN_TOPICS.flatMap(t => t.verses);
}

/** Get time-of-day gradient */
function getTimeGradient(): readonly [string, string] {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return ['#F59E0B20', '#FCD34D10'] as const; // Morning - golden
    if (hour >= 12 && hour < 17) return ['#F9731620', '#FBBF2410'] as const; // Afternoon - amber
    if (hour >= 17 && hour < 21) return ['#8B5CF620', '#A855F710'] as const; // Evening - purple
    return ['#1E3A5F30', '#0F1B2D20'] as const; // Night - navy
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
                    setLoading(false);
                    return;
                }
            }

            // Pick a new random verse for today
            const allVerses = getAllVerses();
            const randomVerse = allVerses[Math.floor(Math.random() * allVerses.length)];
            setVerse(randomVerse);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
                date: todayKey(),
                verse: randomVerse,
            }));
        } catch (e) {
            // Fallback to a well-known verse
            setVerse({
                surah: 13,
                verse: 28,
                surahName: "Ar-Ra'd",
                arabicSnippet: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
                translation: 'Unquestionably, by the remembrance of Allah hearts are assured.',
            });
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

    const gradientColors = getTimeGradient();

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
                <View style={[styles.card, { backgroundColor: theme.colors.surface }, Shadows.md]}>
                    <LinearGradient
                        colors={gradientColors}
                        style={styles.gradientOverlay}
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
                                iconColor={theme.colors.onSurfaceVariant}
                                style={styles.refreshButton}
                            />
                            <MaterialCommunityIcons
                                name={expanded ? 'chevron-up' : 'chevron-down'}
                                size={20}
                                color={theme.colors.onSurfaceVariant}
                            />
                        </View>
                    </View>

                    {/* Compact: just the reference */}
                    {!expanded && (
                        <View style={styles.referenceRow}>
                            <MaterialCommunityIcons
                                name="book-open-variant"
                                size={14}
                                color={theme.colors.onSurfaceVariant}
                            />
                            <Text style={[styles.referenceText, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
                                {verse.surahName} · Verse {verse.verse}
                            </Text>
                            <Text style={[styles.translationText, { color: theme.colors.onSurfaceVariant, marginBottom: 0, flex: 1 }]} numberOfLines={1}>
                                {verse.translation}
                            </Text>
                        </View>
                    )}

                    {/* Expanded: Arabic + translation + reference */}
                    {expanded && (
                        <>
                            <Text style={[styles.arabicText, { color: theme.colors.onSurface }]}>
                                {verse.arabicSnippet}
                            </Text>
                            <Text style={[styles.translationText, { color: theme.colors.onSurfaceVariant }]}>
                                {verse.translation}
                            </Text>
                            <Pressable onPress={handlePress}>
                                <View style={styles.referenceRow}>
                                    <MaterialCommunityIcons
                                        name="book-open-variant"
                                        size={14}
                                        color={theme.colors.onSurfaceVariant}
                                    />
                                    <Text style={[styles.referenceText, { color: theme.colors.onSurfaceVariant }]}>
                                        {verse.surahName} · Verse {verse.verse}
                                    </Text>
                                    <MaterialCommunityIcons
                                        name="chevron-right"
                                        size={16}
                                        color={theme.colors.onSurfaceVariant}
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

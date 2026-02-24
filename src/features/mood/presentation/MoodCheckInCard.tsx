/**
 * MoodCheckInCard — Home screen mood selection card.
 * Headspace/Calm-inspired: soft rounded bubbles with custom illustrations + label.
 * Shows as a collapsible card below StreakCounter.
 */
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Dimensions, Image } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { MoodType, MOOD_CONFIGS, MOOD_LIST } from '../../../core/domain/entities/Mood';
import { useMood } from '../infrastructure/MoodContext';
import { usePro } from '../../auth/infrastructure/ProContext';
import { Spacing, BorderRadius, Shadows, Typography } from '../../../core/theme/DesignSystem';
import VerseRecommendationSheet from './VerseRecommendationSheet';
import { MoodVerse } from '../../../core/domain/entities/Mood';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function MoodCheckInCard() {
    const theme = useTheme();
    const router = useRouter();
    const { isPro } = usePro();
    const { checkIn, canCheckIn, freeUsesRemaining, todayMood, todayVerses, resetToday } = useMood();
    const [selectedVerses, setSelectedVerses] = useState<MoodVerse[]>([]);
    const [sheetVisible, setSheetVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isEditingMood, setIsEditingMood] = useState(false);

    // If user already checked in today, show their result
    const handleMoodSelect = useCallback(async (mood: MoodType) => {
        if (!canCheckIn) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.push('/paywall?reason=mood');
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setLoading(true);

        const verses = await checkIn(mood);
        setLoading(false);

        if (verses) {
            setSelectedVerses(verses);
            setIsEditingMood(false);
            setSheetVisible(true);
        }
    }, [canCheckIn, checkIn, router]);

    const handleViewTodayVerses = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedVerses(todayVerses);
        setSheetVisible(true);
    }, [todayVerses]);

    return (
        <>
            <MotiView
                from={{ opacity: 0, translateY: 15 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'spring', damping: 18, delay: 120 }}
                style={{ paddingHorizontal: Spacing.md, marginBottom: Spacing.sm }}
            >
                <View style={[
                    styles.card,
                    { backgroundColor: 'transparent' }, // Let gradient show through
                    Shadows.sm,
                ]}>
                    {/* Calming Twilight Gradient */}
                    <LinearGradient
                        colors={theme.dark
                            ? ['#1A1340', '#2D1F6E'] // Deep space violet (calm)
                            : ['#F8F5FF', '#EDE5FF'] // Suble dawn violet (calm)
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
                            {todayMood ? 'Today\'s Reflection' : 'How are you feeling?'}
                        </Text>
                        {!isPro && !todayMood && freeUsesRemaining === 0 && (
                            <Pressable onPress={() => router.push('/paywall?reason=mood')}>
                                <Text style={[styles.upgradeLink, {
                                    color: theme.colors.primary,
                                }]}>
                                    Upgrade to Pro
                                </Text>
                            </Pressable>
                        )}
                    </View>

                    {todayMood && !isEditingMood ? (
                        /* Already checked in — show summary */
                        <View style={{ gap: Spacing.sm }}>
                            <Pressable
                                onPress={handleViewTodayVerses}
                                style={({ pressed }) => [
                                    styles.todaySummary,
                                    pressed && { opacity: 0.8 },
                                ]}
                            >
                                <LinearGradient
                                    colors={(theme.dark
                                        ? MOOD_CONFIGS[todayMood].darkGradient
                                        : MOOD_CONFIGS[todayMood].gradient) as [string, string]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={[StyleSheet.absoluteFill, { borderRadius: BorderRadius.lg }]}
                                />
                                <View style={styles.todayEmojiContainer}>
                                    <Ionicons name={MOOD_CONFIGS[todayMood].icon as any} size={32} color="#FFF" />
                                </View>
                                <View style={styles.todayTextGroup}>
                                    <Text style={[styles.todayLabel, { color: theme.colors.onSurface }]}>
                                        {MOOD_CONFIGS[todayMood].label}
                                    </Text>
                                    <Text style={[styles.todayHint, { color: theme.colors.onSurfaceVariant }]}>
                                        Tap to view your verses
                                    </Text>
                                </View>
                            </Pressable>
                            <Pressable
                                onPress={() => setIsEditingMood(true)}
                                style={({ pressed }) => [
                                    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xs, gap: 6 },
                                    pressed && { opacity: 0.7 }
                                ]}
                            >
                                <Feather name="edit-2" size={14} color={theme.colors.onSurfaceVariant} />
                                <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 13, fontWeight: '500' }}>Change Mood</Text>
                            </Pressable>
                        </View>
                    ) : (
                        /* Mood grid */
                        <View>
                            {isEditingMood && (
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs, paddingHorizontal: 4 }}>
                                    <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 13 }}>Select a new mood</Text>
                                    <Pressable onPress={() => setIsEditingMood(false)} hitSlop={10}>
                                        <Text style={{ color: theme.colors.primary, fontSize: 13, fontWeight: '600' }}>Cancel</Text>
                                    </Pressable>
                                </View>
                            )}
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.moodGrid}
                            >
                                {MOOD_LIST.map((mood, idx) => {
                                    const config = MOOD_CONFIGS[mood];
                                    return (
                                        <MotiView
                                            key={mood}
                                            from={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{
                                                type: 'spring',
                                                damping: 14,
                                                delay: 80 + idx * 40,
                                            }}
                                        >
                                            <Pressable
                                                onPress={() => handleMoodSelect(mood)}
                                                disabled={loading}
                                                style={({ pressed }) => [
                                                    styles.moodBubble,
                                                    pressed && {
                                                        transform: [{ scale: 0.9 }],
                                                        opacity: 0.8,
                                                    },
                                                ]}
                                            >
                                                <LinearGradient
                                                    colors={(theme.dark ? config.darkGradient : config.gradient) as [string, string]}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 1 }}
                                                    style={[StyleSheet.absoluteFill, { borderRadius: BorderRadius.lg }]}
                                                />
                                                <Ionicons name={config.icon as any} size={28} color={theme.colors.onSurface} style={{ marginBottom: 4 }} />
                                                <Text
                                                    style={[
                                                        styles.moodLabel,
                                                        { color: theme.colors.onSurface },
                                                    ]}
                                                    numberOfLines={1}
                                                >
                                                    {config.label}
                                                </Text>
                                            </Pressable>
                                        </MotiView>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    )}
                </View>
            </MotiView>

            <VerseRecommendationSheet
                visible={sheetVisible}
                verses={selectedVerses}
                mood={todayMood}
                onDismiss={() => setSheetVisible(false)}
            />
        </>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.md,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    title: {
        ...Typography.titleMedium,
    },
    upgradeLink: {
        ...Typography.caption,
        fontWeight: '600',
    },
    moodGrid: {
        flexDirection: 'row',
        gap: Spacing.sm,
        paddingVertical: Spacing.xs,
        paddingRight: Spacing.md,
    },
    moodBubble: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 80,
        height: 96,
        borderRadius: BorderRadius.lg,
        gap: 4,
        paddingTop: 6,
    },
    moodLabel: {
        fontSize: 13,
        fontWeight: '500',
        textAlign: 'center',
    },
    todaySummary: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        gap: Spacing.md,
    },
    todayEmojiContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    todayTextGroup: {
        flex: 1,
    },
    todayLabel: {
        ...Typography.titleMedium,
    },
    todayHint: {
        ...Typography.caption,
        marginTop: 2,
    },
});

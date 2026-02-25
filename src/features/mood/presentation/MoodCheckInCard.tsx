/**
 * MoodCheckInCard — Home screen mood selection card.
 * Headspace/Calm-inspired: soft rounded bubbles with custom illustrations + label.
 * Shows as a collapsible card below StreakCounter.
 */
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Carousel from 'react-native-reanimated-carousel';
import { interpolate, Extrapolation } from 'react-native-reanimated';
import { MoodType, MOOD_CONFIGS, MOOD_LIST } from '../../../core/domain/entities/Mood';
import { useMood } from '../infrastructure/MoodContext';
import { usePro } from '../../auth/infrastructure/ProContext';
import { Spacing, BorderRadius, Shadows, Typography } from '../../../core/theme/DesignSystem';
import VerseRecommendationSheet from './VerseRecommendationSheet';
import { MoodVerse } from '../../../core/domain/entities/Mood';


// Constants for Carousel
const SCREEN_WIDTH = Dimensions.get('window').width;
const CAROUSEL_WIDTH = SCREEN_WIDTH;
const ITEM_WIDTH = 80;
const ITEM_HEIGHT = 100;

export default function MoodCheckInCard() {
    const theme = useTheme();
    const router = useRouter();
    const { isPro } = usePro();
    const { checkIn, canCheckIn, freeUsesRemaining, todayMood, todayVerses } = useMood();
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

    const animationStyle = useCallback((value: number) => {
        'worklet';
        // The value represents the offset from the center item (0).
        // -1 is the item to the left, 1 is the item to the right.
        const translateX = interpolate(
            value,
            [-2, -1, 0, 1, 2],
            [-ITEM_WIDTH * 1.8, -ITEM_WIDTH * 1.1, 0, ITEM_WIDTH * 1.1, ITEM_WIDTH * 1.8],
            Extrapolation.CLAMP
        );
        const scale = interpolate(
            value,
            [-2, -1, 0, 1, 2],
            [0.7, 0.85, 1.1, 0.85, 0.7],
            Extrapolation.CLAMP
        );
        const translateY = interpolate(
            value,
            [-2, -1, 0, 1, 2],
            [20, 10, -5, 10, 20],
            Extrapolation.CLAMP
        );
        const opacity = interpolate(
            value,
            [-2, -1, 0, 1, 2],
            [0.3, 0.6, 1, 0.6, 0.3],
            Extrapolation.CLAMP
        );
        const rotateY = interpolate(
            value,
            [-2, -1, 0, 1, 2],
            [30, 15, 0, -15, -30],
            Extrapolation.CLAMP
        );

        return {
            transform: [
                { translateX },
                { translateY },
                { scale },
                { perspective: 500 },
                { rotateY: `${rotateY}deg` },
            ],
            opacity,
            zIndex: interpolate(value, [-1, 0, 1], [0, 10, 0]),
        };
    }, []);

    return (
        <>
            <MotiView
                from={{ opacity: 0, translateY: 15 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'spring', damping: 18, delay: 120 }}
                style={{ marginBottom: Spacing.sm }}
            >
                <View style={{ backgroundColor: 'transparent' }}>
                    {/* Header */}
                    <View style={[styles.header, { paddingHorizontal: Spacing.md }]}>
                        <View>
                            <Text style={[styles.title, { color: theme.colors.onSurface }]}>
                                How are you feeling today?
                            </Text>
                            {(!todayMood || isEditingMood) && (
                                <Text style={{ fontSize: 13, color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                                    Choose a mood
                                </Text>
                            )}
                        </View>
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
                        <View style={{ gap: Spacing.sm, paddingHorizontal: Spacing.md }}>
                            <Pressable
                                onPress={handleViewTodayVerses}
                                style={({ pressed }) => [
                                    styles.todaySummary,
                                    pressed && { opacity: 0.8 },
                                ]}
                            >
                                <Image
                                    source={MOOD_CONFIGS[todayMood].imageSource}
                                    style={[StyleSheet.absoluteFill, { borderRadius: BorderRadius.lg, width: SCREEN_WIDTH - Spacing.md * 2, height: 80, opacity: 0.3 }]}
                                    contentFit="cover"
                                    transition={200}
                                />
                                <View style={styles.todayTextGroup}>
                                    <Text style={[styles.todayLabel, { color: '#000' }]}>
                                        {MOOD_CONFIGS[todayMood].label}
                                    </Text>
                                    <Text style={[styles.todayHint, { color: 'rgba(0,0,0,0.7)' }]}>
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
                        /* Mood Carousel */
                        <View style={{ height: ITEM_HEIGHT + 40, alignItems: 'center', justifyContent: 'center' }}>
                            {isEditingMood && (
                                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: Spacing.xs, paddingHorizontal: Spacing.md, width: '100%' }}>
                                    <Pressable onPress={() => setIsEditingMood(false)} hitSlop={10}>
                                        <Text style={{ color: theme.colors.primary, fontSize: 13, fontWeight: '600' }}>Cancel</Text>
                                    </Pressable>
                                </View>
                            )}
                            <Carousel
                                width={ITEM_WIDTH}
                                height={ITEM_HEIGHT}
                                style={{
                                    width: CAROUSEL_WIDTH,
                                    height: ITEM_HEIGHT + 40,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                                loop={true}
                                autoPlay={false}
                                data={MOOD_LIST}
                                customAnimation={animationStyle}
                                renderItem={({ item, index }) => {
                                    const config = MOOD_CONFIGS[item];
                                    return (
                                        <Pressable
                                            onPress={() => handleMoodSelect(item)}
                                            disabled={loading}
                                            style={styles.moodBubble}
                                        >
                                            <Image
                                                source={config.imageSource}
                                                style={{ width: ITEM_WIDTH, height: ITEM_WIDTH, borderRadius: ITEM_WIDTH / 2 }}
                                                contentFit="contain"
                                                transition={200}
                                            />
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
                                    );
                                }}
                            />
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
    moodBubble: {
        alignItems: 'center',
        justifyContent: 'center',
        width: ITEM_WIDTH,
        height: ITEM_HEIGHT,
        gap: 8,
    },
    moodLabel: {
        fontSize: 13,
        fontWeight: '500',
        textAlign: 'center',
        marginTop: 4,
    },
    todaySummary: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        height: 80, // Fixed height for the banner
        borderRadius: BorderRadius.lg,
        gap: Spacing.md,
        overflow: 'hidden',
    },
    todayTextGroup: {
        flex: 1,
        paddingHorizontal: Spacing.sm,
    },
    todayLabel: {
        ...Typography.titleMedium,
        fontWeight: '700',
    },
    todayHint: {
        ...Typography.caption,
        fontWeight: '500',
        marginTop: 2,
    },
});

/**
 * MoodCheckInCard — Home screen mood selection card.
 * Headspace/Calm-inspired: soft rounded bubbles with custom illustrations + label.
 * Shows as a collapsible card below StreakCounter.
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable, Dimensions, Animated as RNAnimated, Easing as RNEasing } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Carousel from 'react-native-reanimated-carousel';
import {
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';
import { MoodType, MOOD_CONFIGS, MOOD_LIST, MoodVerse } from '../../../core/domain/entities/Mood';
import { useMood } from '../infrastructure/MoodContext';
import { usePro } from '../../auth/infrastructure/ProContext';
import { Spacing, BorderRadius, Typography } from '../../../core/theme/DesignSystem';
import VerseRecommendationSheet from './VerseRecommendationSheet';



// ── Layout constants ────────────────────────────────────────────────────
const SCREEN_WIDTH = Dimensions.get('window').width;
const CAROUSEL_WIDTH = SCREEN_WIDTH;
const ITEM_WIDTH = 110;
const ITEM_HEIGHT = 170;
const MOOD_ICON_SIZE = 80;

/**
 * AnimatedMoodPill — Headspace-inspired breathing icon.
 * Uses RN core Animated.loop + Animated.sequence (guaranteed to work).
 * Icon breathes: scale 1.2 → 2.2 → 1.2 over 3s. Halo is tight (1.3×) and faint.
 */
function AnimatedMoodPill({
    mood,
    onPress,
    onChangeMood,
}: {
    mood: MoodType;
    onPress: () => void;
    onChangeMood: () => void;
}) {
    const theme = useTheme();
    const config = MOOD_CONFIGS[mood];

    // Core RN Animated — guaranteed loop
    const scaleAnim = useRef(new RNAnimated.Value(1.2)).current;

    useEffect(() => {
        const breatheLoop = RNAnimated.loop(
            RNAnimated.sequence([
                RNAnimated.timing(scaleAnim, {
                    toValue: 2.2,
                    duration: 3000,
                    easing: RNEasing.inOut(RNEasing.ease),
                    useNativeDriver: true,
                }),
                RNAnimated.timing(scaleAnim, {
                    toValue: 1.2,
                    duration: 3000,
                    easing: RNEasing.inOut(RNEasing.ease),
                    useNativeDriver: true,
                }),
            ])
        );
        breatheLoop.start();
        return () => breatheLoop.stop();
    }, [scaleAnim]);

    return (
        <View style={{ gap: Spacing.xs, paddingHorizontal: Spacing.md }}>
            <Pressable
                onPress={onPress}
                style={({ pressed }) => [
                    styles.todayPill,
                    { backgroundColor: 'transparent' },
                    pressed && { opacity: 0.85 },
                ]}
            >
                {/* Breathing icon */}
                <View style={styles.iconContainer}>
                    <RNAnimated.View style={{ transform: [{ scale: scaleAnim }] }}>
                        <Image
                            source={config.imageSource}
                            style={styles.todayIcon}
                            contentFit="contain"
                            transition={300}
                        />
                    </RNAnimated.View>
                </View>

                {/* Text */}
                <View style={styles.todayPillText}>
                    <Text style={[styles.todayLabel, { color: theme.colors.onSurface }]}>
                        {config.label}
                    </Text>
                    <Text style={[styles.todayHint, { color: theme.colors.onSurfaceVariant }]}>
                        Tap to view your verses
                    </Text>
                </View>
                {/* Chevron */}
                <Feather name="chevron-right" size={20} color={theme.colors.onSurfaceVariant} style={{ opacity: 0.6 }} />
            </Pressable>

            <Pressable
                onPress={onChangeMood}
                style={({ pressed }) => [
                    styles.changeMoodBtn,
                    pressed && { opacity: 0.7 }
                ]}
            >
                <Feather name="edit-2" size={13} color={theme.colors.onSurfaceVariant} />
                <Text style={[styles.changeMoodText, { color: theme.colors.onSurfaceVariant }]}>Change Mood</Text>
            </Pressable>
        </View>
    );
}

export default function MoodCheckInCard() {
    const theme = useTheme();
    const router = useRouter();
    const { isPro } = usePro();
    const { checkIn, canCheckIn, freeUsesRemaining, todayMood, todayVerses } = useMood();
    const [selectedVerses, setSelectedVerses] = useState<MoodVerse[]>([]);
    const [sheetVisible, setSheetVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isEditingMood, setIsEditingMood] = useState(false);

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
        // value: 0 = center, -1 = left, 1 = right
        const scale = interpolate(
            value,
            [-2, -1, 0, 1, 2],
            [0.55, 0.75, 1.0, 0.75, 0.55],
            Extrapolation.CLAMP
        );
        const translateX = interpolate(
            value,
            [-2, -1, 0, 1, 2],
            [-ITEM_WIDTH * 1.6, -ITEM_WIDTH * 0.85, 0, ITEM_WIDTH * 0.85, ITEM_WIDTH * 1.6],
            Extrapolation.CLAMP
        );
        const translateY = interpolate(
            value,
            [-2, -1, 0, 1, 2],
            [0, 0, 0, 0, 0],
            Extrapolation.CLAMP
        );
        const opacity = interpolate(
            value,
            [-2.5, -1.5, -0.5, 0, 0.5, 1.5, 2.5],
            [0, 0.4, 0.9, 1, 0.9, 0.4, 0],
            Extrapolation.CLAMP
        );

        return {
            transform: [
                { translateX },
                { translateY },
                { scale },
            ],
            opacity,
            zIndex: Math.round(interpolate(value, [-1, 0, 1], [0, 10, 0], Extrapolation.CLAMP)),
        };
    }, []);

    return (
        <>
            <MotiView
                from={{ opacity: 0, translateY: 15 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'spring', damping: 18, delay: 120 }}
            >
                <View style={{ backgroundColor: 'transparent' }}>
                    {/* Header */}
                    <View style={[styles.header, { paddingHorizontal: Spacing.md }]}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.title, { color: theme.colors.onSurface }]}>
                                How are you feeling today?
                            </Text>
                            {(!todayMood || isEditingMood) && (
                                <Text style={{ fontSize: 13, color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                                    Swipe to explore • tap to select
                                </Text>
                            )}
                        </View>
                        {isEditingMood ? (
                            <Pressable onPress={() => setIsEditingMood(false)} hitSlop={10} style={{ paddingLeft: Spacing.sm }}>
                                <Text style={{ color: theme.colors.primary, fontSize: 14, fontWeight: '600' }}>Cancel</Text>
                            </Pressable>
                        ) : (!isPro && !todayMood && freeUsesRemaining === 0) ? (
                            <Pressable onPress={() => router.push('/paywall?reason=mood')} style={{ paddingLeft: Spacing.sm }}>
                                <Text style={[styles.upgradeLink, {
                                    color: theme.colors.primary,
                                }]}>
                                    Upgrade to Pro
                                </Text>
                            </Pressable>
                        ) : null}
                    </View>

                    {todayMood && !isEditingMood ? (
                        /* ── Already checked in — animated mood pill ── */
                        <AnimatedMoodPill
                            mood={todayMood}
                            onPress={handleViewTodayVerses}
                            onChangeMood={() => setIsEditingMood(true)}
                        />
                    ) : (
                        /* ── Mood Carousel ── */
                        <View style={{ height: ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center', marginTop: -20 }}>
                            <Carousel
                                width={ITEM_WIDTH}
                                height={ITEM_HEIGHT}
                                style={{
                                    width: CAROUSEL_WIDTH,
                                    height: ITEM_HEIGHT,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                                loop={true}
                                autoPlay={false}
                                data={MOOD_LIST}
                                customAnimation={animationStyle}
                                renderItem={({ item }) => {
                                    const config = MOOD_CONFIGS[item];
                                    return (
                                        <Pressable
                                            onPress={() => handleMoodSelect(item)}
                                            disabled={loading}
                                            style={styles.moodBubble}
                                        >
                                            <Image
                                                source={config.imageSource}
                                                style={styles.moodImage}
                                                contentFit="contain"
                                                transition={200}
                                            />
                                            <Text
                                                style={[styles.moodLabel, { color: theme.colors.onSurface }]}
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
        justifyContent: 'flex-start',
        width: ITEM_WIDTH,
        height: ITEM_HEIGHT,
    },
    moodImage: {
        width: ITEM_WIDTH + 45,
        height: ITEM_WIDTH + 45,
    },
    moodLabel: {
        fontSize: 15,
        fontWeight: '600',
        textAlign: 'center',
        letterSpacing: 0.2,
        marginTop: -25, // Stronger offset for the bottom padding in the PNG to prevent cutoff
    },
    // ── Selected mood pill ──
    todayPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.sm,
        borderRadius: BorderRadius.xl,
        gap: Spacing.sm,
    },
    iconContainer: {
        width: MOOD_ICON_SIZE,
        height: MOOD_ICON_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'visible',
    },

    todayIcon: {
        width: MOOD_ICON_SIZE,
        height: MOOD_ICON_SIZE,
    },
    todayPillText: {
        flex: 1,
        gap: Spacing.xs / 2,
    },
    todayLabel: {
        ...Typography.titleMedium,
        fontSize: 20,
        fontWeight: '700',
    },
    todayHint: {
        ...Typography.labelMedium,
    },
    changeMoodBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.xs,
        gap: Spacing.xs,
    },
    changeMoodText: {
        ...Typography.labelMedium,
    },
});

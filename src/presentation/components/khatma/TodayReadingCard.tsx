/**
 * SurahReadingCard — Shows the next surah to read with Start/Continue/Mark Complete.
 * Always navigates to the surah from verse 1 (Start) or saved position (Continue).
 * No Juz-offset navigation, no khatmaJuz params, no mid-surah starts.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ReadingPositionService, ReadingPosition } from '../../../infrastructure/reading/ReadingPositionService';
import { SurahMeta } from '../../../infrastructure/khatma/KhatmaContext';
import { getJuzForSurah } from '../../../data/khatmaData';
import { Spacing, BorderRadius, Shadows } from '../../theme/DesignSystem';

const ACCENT = {
    gold: '#F5A623',
    green: '#10B981',
    blue: '#6C8EEF',
};

interface SurahReadingCardProps {
    surah: SurahMeta;
    isCompleted: boolean;
    onMarkComplete: () => void;
    isTrialExpired: boolean;
}

export const SurahReadingCard: React.FC<SurahReadingCardProps> = ({
    surah,
    isCompleted,
    onMarkComplete,
    isTrialExpired,
}) => {
    const theme = useTheme();
    const router = useRouter();
    const [savedPosition, setSavedPosition] = useState<ReadingPosition | null>(null);

    // Check for saved reading position on focus
    const checkPosition = useCallback(async () => {
        const pos = await ReadingPositionService.get(surah.number);
        setSavedPosition(pos);
    }, [surah.number]);

    useFocusEffect(
        useCallback(() => {
            checkPosition();
        }, [checkPosition]),
    );

    useEffect(() => {
        checkPosition();
    }, [checkPosition]);

    const hasStartedReading = savedPosition !== null && savedPosition.verse > 1;

    const handleStartReading = () => {
        if (isTrialExpired) {
            router.push('/paywall');
            return;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // Always starts from verse 1 — clean and simple
        router.push(`/surah/${surah.number}?autoplay=true`);
    };

    const handleContinueReading = () => {
        if (isTrialExpired) {
            router.push('/paywall');
            return;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // Navigate to saved position
        router.push(`/surah/${savedPosition!.surah}?verse=${savedPosition!.verse}&autoplay=true`);
    };

    const handleMarkComplete = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onMarkComplete();
    };

    // Which Juz does this surah belong to?
    const juzNumbers = getJuzForSurah(surah.number);
    const juzLabel = juzNumbers.length === 1
        ? `Juz ${juzNumbers[0]}`
        : `Juz ${juzNumbers[0]}–${juzNumbers[juzNumbers.length - 1]}`;

    if (isCompleted) {
        return (
            <MotiView
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'spring', damping: 18, delay: 200 }}
            >
                <View style={[styles.card, { backgroundColor: theme.colors.surface }, Shadows.sm]}>
                    <View style={styles.completedRow}>
                        <MaterialCommunityIcons name="check-circle" size={24} color={ACCENT.green} />
                        <View style={styles.completedTextGroup}>
                            <Text style={[styles.completedTitle, { color: ACCENT.green }]}>
                                {surah.arabic} · {surah.english}
                            </Text>
                            <Text style={[styles.completedSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                                Completed ✓
                            </Text>
                        </View>
                    </View>
                </View>
            </MotiView>
        );
    }

    return (
        <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, delay: 200 }}
        >
            <View style={[styles.card, { backgroundColor: theme.colors.surface }, Shadows.sm]}>
                {/* Surah info */}
                <View style={styles.surahHeader}>
                    <Text style={[styles.upNextLabel, { color: theme.colors.onSurfaceVariant }]}>
                        Up Next
                    </Text>
                    <View style={[styles.juzBadge, { backgroundColor: theme.colors.primaryContainer }]}>
                        <Text style={[styles.juzBadgeText, { color: theme.colors.primary }]}>
                            {juzLabel}
                        </Text>
                    </View>
                </View>

                <Text style={[styles.surahName, { color: theme.colors.onSurface }]}>
                    {surah.arabic}
                </Text>
                <Text style={[styles.surahEnglish, { color: theme.colors.onSurfaceVariant }]}>
                    {surah.english} · {surah.verses} verses
                </Text>

                {/* Progress indicator if mid-surah */}
                {hasStartedReading && (
                    <View style={styles.progressRow}>
                        <View style={[styles.progressBar, { backgroundColor: theme.colors.surfaceVariant }]}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        backgroundColor: ACCENT.gold,
                                        width: `${Math.min((savedPosition!.verse / surah.verses) * 100, 100)}%`,
                                    },
                                ]}
                            />
                        </View>
                        <Text style={[styles.progressLabel, { color: theme.colors.onSurfaceVariant }]}>
                            Verse {savedPosition!.verse} of {surah.verses}
                        </Text>
                    </View>
                )}

                {/* Action buttons */}
                <View style={styles.buttonsRow}>
                    {hasStartedReading ? (
                        <Pressable
                            onPress={handleContinueReading}
                            style={({ pressed }) => [
                                styles.primaryButton,
                                { backgroundColor: ACCENT.gold },
                                pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                            ]}
                        >
                            <Ionicons name="play" size={16} color="#FFF" />
                            <Text style={styles.primaryButtonText}>Continue Reading</Text>
                        </Pressable>
                    ) : (
                        <Pressable
                            onPress={handleStartReading}
                            style={({ pressed }) => [
                                styles.primaryButton,
                                { backgroundColor: ACCENT.blue },
                                pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                            ]}
                        >
                            <Ionicons name="book-outline" size={16} color="#FFF" />
                            <Text style={styles.primaryButtonText}>Start Reading</Text>
                        </Pressable>
                    )}

                    <Pressable
                        onPress={handleMarkComplete}
                        style={({ pressed }) => [
                            styles.markCompleteButton,
                            { borderColor: ACCENT.green },
                            pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
                        ]}
                    >
                        <MaterialCommunityIcons name="check" size={16} color={ACCENT.green} />
                        <Text style={[styles.markCompleteText, { color: ACCENT.green }]}>
                            Mark Complete
                        </Text>
                    </Pressable>
                </View>
            </View>
        </MotiView>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        marginHorizontal: Spacing.xs,
    },
    surahHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    upNextLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    juzBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
    },
    juzBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    surahName: {
        fontSize: 32,
        fontWeight: '800',
        textAlign: 'right',
        marginVertical: 4,
    },
    surahEnglish: {
        fontSize: 15,
        fontWeight: '500',
        marginBottom: Spacing.sm,
    },
    progressRow: {
        marginBottom: Spacing.sm,
    },
    progressBar: {
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 4,
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    progressLabel: {
        fontSize: 11,
        fontWeight: '500',
    },
    buttonsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    primaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: BorderRadius.full,
        gap: 8,
    },
    primaryButtonText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '700',
    },
    markCompleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: BorderRadius.full,
        borderWidth: 1.5,
        gap: 6,
    },
    markCompleteText: {
        fontSize: 13,
        fontWeight: '700',
    },
    completedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 4,
    },
    completedTextGroup: {
        flex: 1,
    },
    completedTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    completedSubtitle: {
        fontSize: 13,
        fontWeight: '500',
        marginTop: 2,
    },
});

/**
 * DailyHadithCard — Compact, elegant card for the daily curated hadith.
 * Matches DailyVerseCard's design pattern: collapsed by default, expandable,
 * with refresh, share, and time-of-day gradients.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, AppState, AppStateStatus } from 'react-native';
import { useTheme, IconButton } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { Spacing, BorderRadius, Shadows, Typography } from '../../../core/theme/DesignSystem';
import * as Haptics from 'expo-haptics';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useHadith } from '../infrastructure/HadithContext';

/** Warm earth-tone gradients that complement the sky-themed DailyVerseCard */
function getHadithGradient(hour: number): readonly [string, string, string] {
    if (hour >= 4 && hour < 6) return ['#1A1A2E', '#16213E', '#0F3460'] as const;      // Fajr: Deep indigo
    if (hour >= 6 && hour < 12) return ['#2D3436', '#636E72', '#B2BEC3'] as const;     // Morning: Warm stone
    if (hour >= 12 && hour < 16) return ['#1B4332', '#2D6A4F', '#40916C'] as const;    // Dhuhr: Forest green
    if (hour >= 16 && hour < 18) return ['#5C2D0E', '#8B4513', '#A0522D'] as const;    // Asr: Rich mahogany
    if (hour >= 18 && hour < 20) return ['#3D0C11', '#6B1E2D', '#8B2252'] as const;    // Maghrib: Deep burgundy
    return ['#1A1A2E', '#0D1B2A', '#1B263B'] as const;                                  // Isha: Midnight navy
}

// Fixed text colors for contrast against all gradients
const TEXT_PRIMARY = '#FFFFFF';
const TEXT_SECONDARY = 'rgba(255,255,255,0.85)';
const TEXT_TERTIARY = 'rgba(255,255,255,0.6)';

export const DailyHadithCard: React.FC = () => {
    const theme = useTheme();
    const { hadith, loading, refresh } = useHadith();
    const [expanded, setExpanded] = useState(false); // Collapsed by default
    const [currentHour, setCurrentHour] = useState(new Date().getHours());

    // For sharing
    const viewShotRef = React.useRef<ViewShot>(null);
    const [isCapturing, setIsCapturing] = useState(false);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                setCurrentHour(new Date().getHours());
            }
        });
        return () => subscription.remove();
    }, []);

    const handleRefresh = useCallback(async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await refresh();
    }, [refresh]);

    const handleShare = useCallback(async () => {
        if (!viewShotRef.current) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const wasExpanded = expanded;
        setExpanded(true);
        setIsCapturing(true);

        setTimeout(async () => {
            try {
                const capture = (viewShotRef.current as any)?.capture;
                if (capture) {
                    const uri = await capture();
                    if (uri && (await Sharing.isAvailableAsync())) {
                        await Sharing.shareAsync(uri, {
                            mimeType: 'image/png',
                            dialogTitle: 'Share Hadith of the Day',
                        });
                    }
                }
            } catch (err) {
                if (__DEV__) console.warn('[DailyHadithCard] Share failed:', err);
            } finally {
                setExpanded(wasExpanded);
                setIsCapturing(false);
            }
        }, 150);
    }, [expanded]);

    if (loading || !hadith) return null;

    const gradientColors = getHadithGradient(currentHour);

    return (
        <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, delay: 180 }}
            style={{ paddingHorizontal: Spacing.md }}
        >
            <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }} style={isCapturing ? { backgroundColor: theme.colors.background } : {}}>
                <Pressable
                    onPress={() => {
                        if (isCapturing) return;
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
                                <Text style={[styles.label, { color: 'rgba(255,255,255,0.95)' }]}>✦ Hadith of the Day</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <IconButton
                                    icon="refresh"
                                    size={18}
                                    onPress={handleRefresh}
                                    iconColor={TEXT_SECONDARY}
                                    style={styles.actionButton}
                                />
                                <IconButton
                                    icon="share-variant"
                                    size={18}
                                    onPress={handleShare}
                                    iconColor={TEXT_SECONDARY}
                                    style={styles.actionButton}
                                />
                                {!isCapturing && (
                                    <Feather
                                        name={expanded ? 'chevron-up' : 'chevron-down'}
                                        size={20}
                                        color={TEXT_SECONDARY}
                                    />
                                )}
                            </View>
                        </View>

                        {/* Compact: one-line preview */}
                        {!expanded && (
                            <View style={styles.compactRow}>
                                <Feather name="chevron-right" size={16} color={TEXT_TERTIARY} />
                                <Text style={[styles.compactNarrator, { color: TEXT_SECONDARY }]} numberOfLines={1}>
                                    {hadith.narrator}
                                </Text>
                                <Text style={[styles.compactPreview, { color: TEXT_PRIMARY }]} numberOfLines={1}>
                                    {hadith.englishText}
                                </Text>
                            </View>
                        )}

                        {/* Expanded: full content */}
                        {expanded && (
                            <>
                                {/* Arabic text */}
                                <Text style={[styles.arabicText, { color: TEXT_PRIMARY }]}>
                                    {hadith.arabicText}
                                </Text>

                                {/* English translation */}
                                <Text style={[styles.translationText, { color: TEXT_SECONDARY }]}>
                                    {hadith.englishText}
                                </Text>

                                {/* Reflection — the practical takeaway */}
                                <View style={styles.reflectionBox}>
                                    <Text style={styles.reflectionText}>
                                        💡 {hadith.reflection}
                                    </Text>
                                </View>

                                {/* Source reference */}
                                <View style={styles.sourceRow}>
                                    <Feather name="book-open" size={14} color={TEXT_TERTIARY} />
                                    <Text style={[styles.sourceText, { color: TEXT_SECONDARY }]}>
                                        {hadith.narrator} · {hadith.collection}, #{hadith.reference}
                                    </Text>
                                </View>
                            </>
                        )}

                        {/* Watermark for sharing */}
                        {isCapturing && (
                            <View style={styles.watermarkContainer}>
                                <Text style={styles.watermarkText}>QuranNotes App</Text>
                            </View>
                        )}
                    </View>
                </Pressable>
            </ViewShot>
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
    actionButton: {
        margin: 0,
    },

    // Compact (collapsed) state
    compactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    compactNarrator: {
        fontSize: 12,
        fontWeight: '500',
    },
    compactPreview: {
        flex: 1,
        fontSize: 14,
        fontStyle: 'italic',
    },

    // Expanded state
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
    reflectionBox: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    reflectionText: {
        fontSize: 13,
        lineHeight: 20,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
    },
    sourceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    sourceText: {
        fontSize: 12,
        fontWeight: '500',
    },
    watermarkContainer: {
        marginTop: Spacing.lg,
        alignItems: 'center',
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.15)',
    },
    watermarkText: {
        ...Typography.labelMedium,
        color: 'rgba(255,255,255,0.7)',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
});

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions } from 'react-native';
import { useTheme, Button, IconButton, ProgressBar } from 'react-native-paper';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Verse } from '../../../domain/entities/Quran';
import { useMemorization } from '../../../infrastructure/memorization/MemorizationContext';
import { Spacing, BorderRadius, Shadows, Gradients } from '../../theme/DesignSystem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Quality Ratings ──────────────────────────────────────────────────
const QUALITY_BUTTONS = [
    { quality: 0, label: 'Again', emoji: '🔄', color: '#E53E3E', desc: "Couldn't recall" },
    { quality: 2, label: 'Hard', emoji: '😓', color: '#ED8936', desc: 'Difficult to recall' },
    { quality: 4, label: 'Good', emoji: '😊', color: '#48BB78', desc: 'Recalled correctly' },
    { quality: 5, label: 'Easy', emoji: '✨', color: '#6C5CE7', desc: 'Effortless recall' },
] as const;

// ── Mastery Level Info ───────────────────────────────────────────────
const LEVEL_INFO: Record<number, { label: string; color: string; icon: string }> = {
    0: { label: 'New', color: '#A0AEC0', icon: 'add-circle-outline' },
    1: { label: 'Learning', color: '#ED8936', icon: 'flame-outline' },
    2: { label: 'Learning', color: '#ED8936', icon: 'flame-outline' },
    3: { label: 'Reviewing', color: '#48BB78', icon: 'refresh-outline' },
    4: { label: 'Reviewing', color: '#48BB78', icon: 'refresh-outline' },
    5: { label: 'Mastered', color: '#6C5CE7', icon: 'star' },
};

// ── Props ────────────────────────────────────────────────────────────
interface MemorizationModeProps {
    verses: Verse[];
    surahNumber: number;
    surahName: string;
    surahNameArabic: string;
    onClose: () => void;
}

export const MemorizationMode = ({
    verses,
    surahNumber,
    surahName,
    surahNameArabic,
    onClose,
}: MemorizationModeProps) => {
    const theme = useTheme();
    const { getEntry, markReviewed, getStats } = useMemorization();

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isRevealed, setIsRevealed] = useState(false);
    const [sessionReviewed, setSessionReviewed] = useState(0);

    const currentVerse = verses[currentIndex];
    const verseKey = `${surahNumber}:${currentVerse?.number}`;
    const entry = getEntry(verseKey);
    const level = entry?.level ?? 0;
    const levelInfo = LEVEL_INFO[level] || LEVEL_INFO[0];
    const stats = getStats(surahNumber);

    const progress = useMemo(
        () => (verses.length > 0 ? (currentIndex + 1) / verses.length : 0),
        [currentIndex, verses.length],
    );

    const handleReveal = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsRevealed(true);
    }, []);

    const handleRate = useCallback(
        async (quality: number) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await markReviewed(verseKey, quality);
            setSessionReviewed((s) => s + 1);

            // Move to next verse
            setIsRevealed(false);
            if (currentIndex < verses.length - 1) {
                setCurrentIndex((i) => i + 1);
            } else {
                // Session complete — loop back or close
                setCurrentIndex(0);
            }
        },
        [verseKey, currentIndex, verses.length, markReviewed],
    );

    if (!currentVerse) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <Text style={{ color: theme.colors.onSurface }}>No verses available</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <LinearGradient
                colors={theme.dark ? ['#0F1419', '#1A1F26'] : (Gradients.primary as any)}
                style={styles.header}
            >
                <View style={styles.headerRow}>
                    <IconButton
                        icon="close"
                        iconColor="#FFF"
                        size={24}
                        onPress={onClose}
                    />
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerArabic}>{surahNameArabic}</Text>
                        <Text style={styles.headerEnglish}>{surahName}</Text>
                    </View>
                    <View style={styles.sessionBadge}>
                        <Text style={styles.sessionCount}>{sessionReviewed}</Text>
                        <Text style={styles.sessionLabel}>reviewed</Text>
                    </View>
                </View>

                {/* Progress bar */}
                <View style={styles.progressContainer}>
                    <ProgressBar
                        progress={progress}
                        color="#FFF"
                        style={styles.progressBar}
                    />
                    <Text style={styles.progressText}>
                        {currentIndex + 1} / {verses.length}
                    </Text>
                </View>
            </LinearGradient>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Mastery Level Badge */}
                <View style={[styles.levelBadge, { backgroundColor: levelInfo.color + '20' }]}>
                    <Ionicons name={levelInfo.icon as any} size={16} color={levelInfo.color} />
                    <Text style={[styles.levelText, { color: levelInfo.color }]}>
                        {levelInfo.label}
                    </Text>
                    {entry && (
                        <Text style={[styles.levelDetail, { color: theme.colors.onSurfaceVariant }]}>
                            · {entry.repetitions} reviews
                        </Text>
                    )}
                </View>

                {/* Verse Card */}
                <View style={[
                    styles.verseCard,
                    { backgroundColor: theme.colors.surface },
                    Shadows.md,
                ]}>
                    {/* Verse number */}
                    <View style={[styles.verseNumberBadge, { backgroundColor: theme.colors.primaryContainer }]}>
                        <Text style={[styles.verseNumber, { color: theme.colors.primary }]}>
                            {currentVerse.number}
                        </Text>
                    </View>

                    {/* Arabic text — always visible */}
                    <Text style={[styles.arabicText, { color: theme.colors.onSurface }]}>
                        {currentVerse.text}
                    </Text>

                    {/* Translation — hidden until revealed */}
                    <AnimatePresence>
                        {isRevealed ? (
                            <MotiView
                                from={{ opacity: 0, translateY: 10 }}
                                animate={{ opacity: 1, translateY: 0 }}
                                transition={{ type: 'spring', damping: 20 }}
                                key="revealed"
                            >
                                <View style={[styles.translationDivider, { backgroundColor: theme.colors.outline }]} />
                                <Text style={[styles.translationText, { color: theme.colors.onSurfaceVariant }]}>
                                    {currentVerse.translation || 'No translation available'}
                                </Text>
                            </MotiView>
                        ) : (
                            <MotiView
                                from={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                key="hidden"
                            >
                                <Pressable onPress={handleReveal} style={styles.revealButton}>
                                    <LinearGradient
                                        colors={[
                                            theme.colors.surfaceVariant + 'CC',
                                            theme.colors.surfaceVariant,
                                        ]}
                                        style={styles.revealGradient}
                                    >
                                        <Ionicons name="eye-outline" size={24} color={theme.colors.primary} />
                                        <Text style={[styles.revealText, { color: theme.colors.primary }]}>
                                            Tap to reveal meaning
                                        </Text>
                                    </LinearGradient>
                                </Pressable>
                            </MotiView>
                        )}
                    </AnimatePresence>
                </View>

                {/* Quality Rating Buttons — visible only after reveal */}
                <AnimatePresence>
                    {isRevealed && (
                        <MotiView
                            from={{ opacity: 0, translateY: 20 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            exit={{ opacity: 0, translateY: 10 }}
                            transition={{ type: 'spring', delay: 200, damping: 18 }}
                        >
                            <Text style={[styles.ratePrompt, { color: theme.colors.onSurfaceVariant }]}>
                                How well did you recall this verse?
                            </Text>
                            <View style={styles.qualityRow}>
                                {QUALITY_BUTTONS.map((btn) => (
                                    <Pressable
                                        key={btn.quality}
                                        onPress={() => handleRate(btn.quality)}
                                        style={({ pressed }) => [
                                            styles.qualityButton,
                                            {
                                                backgroundColor: theme.colors.surface,
                                                borderColor: btn.color + '40',
                                            },
                                            Shadows.sm,
                                            pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] },
                                        ]}
                                    >
                                        <Text style={styles.qualityEmoji}>{btn.emoji}</Text>
                                        <Text style={[styles.qualityLabel, { color: btn.color }]}>
                                            {btn.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </MotiView>
                    )}
                </AnimatePresence>

                {/* Session Stats */}
                <View style={[styles.statsCard, { backgroundColor: theme.colors.surface }, Shadows.sm]}>
                    <Text style={[styles.statsTitle, { color: theme.colors.onSurface }]}>
                        Surah Progress
                    </Text>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statNumber, { color: '#6C5CE7' }]}>
                                {stats.mastered}
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                                Mastered
                            </Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={[styles.statNumber, { color: '#48BB78' }]}>
                                {stats.reviewing}
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                                Reviewing
                            </Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={[styles.statNumber, { color: '#ED8936' }]}>
                                {stats.learning}
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                                Learning
                            </Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={[styles.statNumber, { color: '#E53E3E' }]}>
                                {stats.dueToday}
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                                Due Today
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

// ═══════════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingBottom: Spacing.md,
        paddingHorizontal: Spacing.sm,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerCenter: {
        alignItems: 'center',
        flex: 1,
    },
    headerArabic: {
        fontSize: 22,
        color: '#FFF',
        fontWeight: '600',
    },
    headerEnglish: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 2,
    },
    sessionBadge: {
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
    },
    sessionCount: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFF',
    },
    sessionLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.6)',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    progressContainer: {
        paddingHorizontal: Spacing.md,
        marginTop: Spacing.sm,
    },
    progressBar: {
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    progressText: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'right',
        marginTop: 4,
    },
    content: {
        padding: Spacing.lg,
        paddingBottom: 100,
    },
    levelBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
        marginBottom: Spacing.lg,
    },
    levelText: {
        fontSize: 13,
        fontWeight: '700',
        marginLeft: Spacing.xs,
    },
    levelDetail: {
        fontSize: 12,
        marginLeft: Spacing.xs,
    },
    verseCard: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        marginBottom: Spacing.lg,
    },
    verseNumberBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: Spacing.lg,
    },
    verseNumber: {
        fontSize: 15,
        fontWeight: '800',
    },
    arabicText: {
        fontSize: 30,
        textAlign: 'center',
        lineHeight: 56,
        marginBottom: Spacing.lg,
    },
    translationDivider: {
        height: 1,
        opacity: 0.15,
        marginBottom: Spacing.lg,
    },
    translationText: {
        fontSize: 16,
        lineHeight: 26,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    revealButton: {
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        marginTop: Spacing.sm,
    },
    revealGradient: {
        paddingVertical: Spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BorderRadius.lg,
    },
    revealText: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: Spacing.xs,
    },
    ratePrompt: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: Spacing.md,
    },
    qualityRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.xl,
    },
    qualityButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: Spacing.md,
        marginHorizontal: Spacing.xs,
        borderRadius: BorderRadius.lg,
        borderWidth: 1.5,
    },
    qualityEmoji: {
        fontSize: 24,
        marginBottom: Spacing.xs,
    },
    qualityLabel: {
        fontSize: 12,
        fontWeight: '700',
    },
    statsCard: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
    },
    statsTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: Spacing.md,
        textAlign: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 22,
        fontWeight: '800',
    },
    statLabel: {
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 2,
    },
});

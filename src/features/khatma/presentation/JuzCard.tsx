/**
 * JuzCard — Today's reading card with "Continue Reading" navigation
 * Links to actual Surah pages for an integrated reading experience
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { JuzInfo } from '../data/khatmaData';
import { Spacing, BorderRadius, Shadows } from '../../../core/theme/DesignSystem';

interface JuzCardProps {
    juz: JuzInfo;
    isCompleted: boolean;
    onToggle: () => void;
    /** Last-read Surah number within this Juz (for resume) */
    lastReadSurahNumber?: number;
}

export const JuzCard: React.FC<JuzCardProps> = ({
    juz,
    isCompleted,
    onToggle,
    lastReadSurahNumber,
}) => {
    const theme = useTheme();
    const router = useRouter();

    // Determine which Surah to open: last-read or first of the Juz
    const resumeSurahNumber = lastReadSurahNumber || juz.startSurahNumber;

    const handleContinueReading = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push(`/surah/${resumeSurahNumber}`);
    };

    return (
        <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 20, delay: 100 }}
        >
            <View
                style={[
                    styles.card,
                    {
                        borderColor: isCompleted
                            ? '#38A169'
                            : theme.colors.primaryContainer,
                        borderWidth: 1.5,
                        backgroundColor: 'transparent', // Let gradient show through
                    },
                    Shadows.md,
                ]}
            >
                {/* Tactile Depth Gradient */}
                <LinearGradient
                    colors={[theme.colors.surfaceVariant, theme.colors.surface]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={[StyleSheet.absoluteFill, { borderRadius: BorderRadius.lg }]}
                />

                {/* Header Row */}
                <View style={styles.headerRow}>
                    <View style={styles.juzBadge}>
                        <View
                            style={[
                                styles.juzNumberContainer,
                                {
                                    backgroundColor: isCompleted
                                        ? '#38A169'
                                        : theme.colors.primaryContainer,
                                },
                            ]}
                        >
                            {isCompleted ? (
                                <Ionicons name="checkmark" size={18} color="#FFF" />
                            ) : (
                                <Text
                                    style={[
                                        styles.juzNumber,
                                        { color: theme.colors.primary },
                                    ]}
                                >
                                    {juz.juzNumber}
                                </Text>
                            )}
                        </View>
                        <View>
                            <Text style={[styles.juzTitle, { color: theme.colors.onSurface }]}>
                                Juz {juz.juzNumber}
                            </Text>
                            <Text style={[styles.pageRange, { color: theme.colors.onSurfaceVariant }]}>
                                Pages {juz.startPage}–{juz.endPage} · {juz.totalPages} pages
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Surah Range */}
                <View style={[styles.surahRange, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <View style={styles.surahItem}>
                        <Text style={[styles.surahArabic, { color: theme.colors.primary }]}>
                            {juz.startSurahArabic}
                        </Text>
                        <Text style={[styles.surahEnglish, { color: theme.colors.onSurfaceVariant }]}>
                            {juz.startSurah}
                        </Text>
                    </View>
                    <Ionicons name="arrow-forward" size={14} color={theme.colors.onSurfaceVariant} />
                    <View style={styles.surahItem}>
                        <Text style={[styles.surahArabic, { color: theme.colors.primary }]}>
                            {juz.endSurahArabic}
                        </Text>
                        <Text style={[styles.surahEnglish, { color: theme.colors.onSurfaceVariant }]}>
                            {juz.endSurah}
                        </Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                    {/* Continue Reading / Start Reading — soft tinted pill */}
                    {!isCompleted && (
                        <Pressable
                            onPress={handleContinueReading}
                            style={({ pressed }) => [
                                styles.readButton,
                                {
                                    backgroundColor: theme.colors.primaryContainer,
                                },
                                pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
                            ]}
                        >
                            <Ionicons
                                name={lastReadSurahNumber ? 'book' : 'book-outline'}
                                size={16}
                                color={theme.colors.primary}
                            />
                            <Text style={[styles.readButtonText, { color: theme.colors.primary }]}>
                                {lastReadSurahNumber ? 'Continue' : 'Start Reading'}
                            </Text>
                        </Pressable>
                    )}

                    {/* Complete / Undo — subtle tinted pill */}
                    <Pressable
                        onPress={() => {
                            Haptics.notificationAsync(
                                isCompleted
                                    ? Haptics.NotificationFeedbackType.Warning
                                    : Haptics.NotificationFeedbackType.Success
                            );
                            onToggle();
                        }}
                        style={({ pressed }) => [
                            styles.completeButton,
                            {
                                backgroundColor: isCompleted
                                    ? 'rgba(0,0,0,0.04)'
                                    : 'rgba(56, 161, 105, 0.10)',
                                flex: isCompleted ? 1 : undefined,
                            },
                            pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
                        ]}
                    >
                        <Ionicons
                            name={isCompleted ? 'arrow-undo-outline' : 'checkmark-circle-outline'}
                            size={16}
                            color={isCompleted ? '#999' : '#38A169'}
                        />
                        <Text
                            style={[
                                styles.completeButtonText,
                                { color: isCompleted ? '#999' : '#38A169' },
                            ]}
                        >
                            {isCompleted ? 'Undo' : 'Complete'}
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
        marginHorizontal: Spacing.md,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    juzBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    juzNumberContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    juzNumber: {
        fontSize: 16,
        fontWeight: '700',
    },
    juzTitle: {
        fontSize: 17,
        fontWeight: '700',
    },
    pageRange: {
        fontSize: 12,
        marginTop: 1,
    },
    surahRange: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.md,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.md,
        marginTop: Spacing.sm,
    },
    surahItem: {
        alignItems: 'center',
    },
    surahArabic: {
        fontSize: 18,
        fontWeight: '600',
    },
    surahEnglish: {
        fontSize: 11,
        marginTop: 2,
    },
    actionRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginTop: Spacing.md,
    },
    readButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 11,
        borderRadius: BorderRadius.full,
        gap: 7,
    },
    readButtonText: {
        fontWeight: '600',
        fontSize: 14,
        letterSpacing: 0.2,
    },
    completeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 11,
        paddingHorizontal: 16,
        borderRadius: BorderRadius.full,
        gap: 6,
    },
    completeButtonText: {
        fontWeight: '600',
        fontSize: 13,
    },
});

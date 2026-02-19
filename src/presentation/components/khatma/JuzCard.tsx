/**
 * JuzCard — Today's reading card with "Continue Reading" navigation
 * Links to actual Surah pages for an integrated reading experience
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { JuzInfo } from '../../../data/khatmaData';
import { Spacing, BorderRadius, Shadows } from '../../theme/DesignSystem';

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
                        backgroundColor: theme.colors.surface,
                        borderColor: isCompleted
                            ? '#38A169'
                            : theme.colors.primaryContainer,
                        borderWidth: 1.5,
                    },
                    Shadows.md,
                ]}
            >
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
                    {/* Continue Reading / Start Reading button */}
                    {!isCompleted && (
                        <Pressable
                            onPress={handleContinueReading}
                            style={({ pressed }) => [
                                styles.continueButtonWrapper,
                                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                            ]}
                        >
                            <LinearGradient
                                colors={['#5B7FFF', '#7B5FFF']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.continueButton}
                            >
                                <MaterialCommunityIcons
                                    name="book-open-page-variant"
                                    size={18}
                                    color="#FFF"
                                />
                                <Text style={styles.continueButtonText}>
                                    {lastReadSurahNumber ? 'Continue Reading' : 'Start Reading'}
                                </Text>
                            </LinearGradient>
                        </Pressable>
                    )}

                    {/* Mark Complete / Undo button */}
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
                            styles.toggleButton,
                            {
                                backgroundColor: isCompleted
                                    ? 'rgba(0,0,0,0.05)'
                                    : 'rgba(56, 161, 105, 0.08)',
                                flex: isCompleted ? 1 : 0,
                            },
                            pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
                        ]}
                    >
                        <Ionicons
                            name={isCompleted ? 'close-circle-outline' : 'checkmark-circle'}
                            size={18}
                            color={isCompleted ? '#888' : '#38A169'}
                        />
                        <Text
                            style={[
                                styles.toggleButtonText,
                                {
                                    color: isCompleted ? '#888' : '#38A169',
                                },
                            ]}
                        >
                            {isCompleted ? 'Undo' : 'Mark Complete'}
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
    continueButtonWrapper: {
        flex: 1,
        borderRadius: BorderRadius.full,
        shadowColor: '#5B7FFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    continueButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 13,
        borderRadius: BorderRadius.full,
        gap: 8,
    },
    continueButtonText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 15,
        letterSpacing: 0.3,
    },
    toggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: BorderRadius.full,
        gap: 6,
    },
    toggleButtonText: {
        fontWeight: '600',
        fontSize: 13,
    },
});

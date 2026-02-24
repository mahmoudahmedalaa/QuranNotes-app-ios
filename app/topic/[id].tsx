/**
 * Topic Detail Screen — Shows all verses for a selected topic.
 * Reuses design patterns from Quran surah screen.
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useTheme, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getTopicById } from '../../src/features/verse-of-the-day/domain/QuranTopics';
import { Spacing, BorderRadius, Shadows } from '../../src/core/theme/DesignSystem';
import * as Haptics from 'expo-haptics';

export default function TopicDetailScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const topic = getTopicById(id || '');

    if (!topic) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <View style={styles.header}>
                    <IconButton
                        icon="arrow-left"
                        onPress={() => router.back()}
                        iconColor={theme.colors.onSurface}
                    />
                </View>
                <View style={styles.center}>
                    <Text style={[styles.errorText, { color: theme.colors.onSurface }]}>
                        Topic not found
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    const handleVersePress = (surah: number, verse: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push(`/surah/${surah}?verse=${verse}`);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <IconButton
                    icon="arrow-left"
                    onPress={() => router.back()}
                    iconColor={theme.colors.onSurface}
                />
                <View style={styles.headerTitleGroup}>
                    <Ionicons name={topic.icon as any} size={28} color={topic.color} style={{ marginRight: Spacing.xs }} />
                    <View>
                        <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
                            {topic.name}
                        </Text>
                        <Text style={[styles.headerArabic, { color: topic.color }]}>
                            {topic.arabicTitle}
                        </Text>
                    </View>
                </View>
                <View style={{ width: 48 }} />
            </View>

            {/* Description */}
            <MotiView
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 400 }}
                style={styles.descriptionContainer}
            >
                <Text style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
                    {topic.description}
                </Text>
                <Text style={[styles.verseCountLabel, { color: topic.color }]}>
                    {topic.verses.length} curated verses
                </Text>
            </MotiView>

            {/* Verses List */}
            <ScrollView
                contentContainerStyle={styles.versesContainer}
                showsVerticalScrollIndicator={false}
            >
                {topic.verses.map((verse, index) => (
                    <MotiView
                        key={`${verse.surah}-${verse.verse}`}
                        from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'timing', duration: 400, delay: index * 80 }}
                    >
                        <Pressable
                            onPress={() => handleVersePress(verse.surah, verse.verse)}
                            style={({ pressed }) => [
                                styles.verseCard,
                                { backgroundColor: theme.colors.surface },
                                Shadows.sm,
                                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                            ]}
                        >
                            {/* Verse number badge */}
                            <View style={[styles.verseBadge, { backgroundColor: `${topic.color}20` }]}>
                                <Text style={[styles.verseBadgeText, { color: topic.color }]}>
                                    {verse.verse}
                                </Text>
                            </View>

                            {/* Arabic text */}
                            <Text style={[styles.arabicText, { color: theme.colors.onSurface }]}>
                                {verse.arabicSnippet}
                            </Text>

                            {/* Translation */}
                            <Text style={[styles.translationText, { color: theme.colors.onSurfaceVariant }]}>
                                {verse.translation}
                            </Text>

                            {/* Surah reference */}
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
                                    size={18}
                                    color={theme.colors.onSurfaceVariant}
                                />
                            </View>
                        </Pressable>
                    </MotiView>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        fontWeight: '500',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
    },
    headerTitleGroup: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        justifyContent: 'center',
    },
    headerEmoji: {
        fontSize: 28,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    headerArabic: {
        fontSize: 16,
        fontWeight: '600',
    },
    descriptionContainer: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
    },
    description: {
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
    },
    verseCountLabel: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: Spacing.xs,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    versesContainer: {
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.xxl,
    },
    verseCard: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
    },
    verseBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'flex-end',
        marginBottom: Spacing.sm,
    },
    verseBadgeText: {
        fontSize: 13,
        fontWeight: '700',
    },
    arabicText: {
        fontSize: 22,
        lineHeight: 42,
        textAlign: 'right',
        fontWeight: '400',
        marginBottom: Spacing.md,
    },
    translationText: {
        fontSize: 14,
        lineHeight: 22,
        marginBottom: Spacing.md,
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

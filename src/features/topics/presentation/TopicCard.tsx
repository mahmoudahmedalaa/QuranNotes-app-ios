/**
 * TopicCard — Compact card for a topic category.
 * Shows emoji, name, Arabic title, and tinted background.
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from 'react-native-paper';
import { MotiView } from 'moti';
import { QuranTopic } from '../../verse-of-the-day/domain/QuranTopics';
import { Spacing, BorderRadius, Shadows } from '../../../core/theme/DesignSystem';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

interface TopicCardProps {
    topic: QuranTopic;
    index: number;
    onPress: (topic: QuranTopic) => void;
}

export const TopicCard: React.FC<TopicCardProps> = ({ topic, index, onPress }) => {
    const theme = useTheme();

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress(topic);
    };

    return (
        <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 16, delay: index * 60 }}
            style={styles.container}
        >
            <Pressable
                onPress={handlePress}
                style={({ pressed }) => [
                    styles.card,
                    { backgroundColor: theme.colors.surface },
                    Shadows.sm,
                    pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
                ]}
            >
                {/* Tinted accent strip */}
                <View style={[styles.accentStrip, { backgroundColor: `${topic.color}20` }]}>
                    <Ionicons name={topic.icon as any} size={24} color={topic.color} />
                </View>

                <View style={styles.textGroup}>
                    <Text style={[styles.name, { color: theme.colors.onSurface }]} numberOfLines={1}>
                        {topic.name}
                    </Text>
                    <Text style={[styles.arabicTitle, { color: topic.color }]}>
                        {topic.arabicTitle}
                    </Text>
                    <Text style={[styles.verseCount, { color: theme.colors.onSurfaceVariant }]}>
                        {topic.verses.length} verses
                    </Text>
                </View>
            </Pressable>
        </MotiView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: Spacing.xs,
    },
    card: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        minHeight: 120,
    },
    accentStrip: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
    },
    emoji: {
        fontSize: 24,
    },
    textGroup: {
        flex: 1,
    },
    name: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 2,
    },
    arabicTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    verseCount: {
        fontSize: 11,
        fontWeight: '500',
    },
});

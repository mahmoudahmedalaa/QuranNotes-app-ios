import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius, Shadows, Colors } from '../../../core/theme/DesignSystem';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.md * 3) / 2;

interface StatCardProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
    badge?: string;
    color: string;
    gradientColors: [string, string];
    delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, badge, color, gradientColors, delay = 0 }) => {
    const theme = useTheme();
    return (
        <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 400, delay }}
            style={[styles.card, Shadows.sm]}>
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}>
                {/* Top accent line */}
                <View style={[styles.accentLine, { backgroundColor: color }]} />

                <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                    <Ionicons name={icon} size={22} color={color} />
                </View>
                <View style={styles.textContainer}>
                    <View style={styles.valueRow}>
                        <Text style={[styles.value, { color: theme.dark ? '#FAFAFA' : '#1C1033' }]}>{value}</Text>
                        {badge && (
                            <View style={[styles.badgeContainer, { backgroundColor: color + '15' }]}>
                                <Text style={[styles.badgeText, { color }]}>{badge}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
                        {label}
                    </Text>
                </View>
            </LinearGradient>
        </MotiView>
    );
};

interface StatsWidgetGridProps {
    currentStreak: number;
    longestStreak: number;
    totalTime: string;
    pagesRead: number;
    completedJuzCount: number;
    currentRound: number;
}

export const StatsWidgetGrid: React.FC<StatsWidgetGridProps> = ({
    currentStreak,
    longestStreak,
    totalTime,
    pagesRead,
    completedJuzCount,
    currentRound,
}) => {
    const theme = useTheme();

    const cardGradients: { light: [string, string]; dark: [string, string] }[] = [
        {
            light: ['#FFFFFF', '#F5F0FF'],
            dark: ['#1E1A2E', '#252130'],
        },
        {
            light: ['#FFFFFF', '#EEF0FF'],
            dark: ['#1A1D2E', '#202330'],
        },
        {
            light: ['#FFFFFF', '#F0F5FF'],
            dark: ['#1A1E2E', '#1F2430'],
        },
        {
            light: ['#FFFFFF', '#F8F0FF'],
            dark: ['#1E1A2E', '#251F30'],
        },
    ];

    return (
        <View style={styles.grid}>
            <StatCard
                icon="flame"
                label="Current Streak"
                value={`${currentStreak || 0} Days`}
                badge={longestStreak > currentStreak ? `Best: ${longestStreak}` : undefined}
                color={Colors.widgetOrange}
                gradientColors={theme.dark ? cardGradients[0].dark : cardGradients[0].light}
                delay={100}
            />
            <StatCard
                icon="time"
                label="Total Time"
                value={totalTime || '0m'}
                color={Colors.widgetBlue}
                gradientColors={theme.dark ? cardGradients[1].dark : cardGradients[1].light}
                delay={200}
            />
            <StatCard
                icon="book"
                label="Pages Read"
                value={(pagesRead || 0).toLocaleString()}
                color={Colors.widgetPurple}
                gradientColors={theme.dark ? cardGradients[2].dark : cardGradients[2].light}
                delay={300}
            />
            <StatCard
                icon="book-outline"
                label="Khatma Progress"
                value={`${completedJuzCount}/30 Juz`}
                badge={currentRound > 1 ? `Round ${currentRound}` : undefined}
                color={Colors.widgetEmerald}
                gradientColors={theme.dark ? cardGradients[3].dark : cardGradients[3].light}
                delay={400}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
        paddingHorizontal: Spacing.md,
        marginBottom: Spacing.md,
    },
    card: {
        width: CARD_WIDTH,
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
    },
    cardGradient: {
        padding: Spacing.md,
        flexDirection: 'column',
        gap: Spacing.sm,
        position: 'relative',
    },
    accentLine: {
        position: 'absolute',
        top: 0,
        left: 16,
        right: 16,
        height: 3,
        borderRadius: 2,
        opacity: 0.6,
    },
    iconContainer: {
        width: 42,
        height: 42,
        borderRadius: 13,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'flex-start',
    },
    textContainer: {
        gap: 2,
    },
    valueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    value: {
        fontSize: 19,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    badgeContainer: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    label: {
        fontSize: 13,
        fontWeight: '500',
    },
});

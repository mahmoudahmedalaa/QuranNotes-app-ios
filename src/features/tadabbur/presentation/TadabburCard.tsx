/**
 * TadabburCard — Dashboard card for starting a guided reflection session.
 * Violet gradient card showing streak, session count, and a CTA button.
 */
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MotiView } from 'moti';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTadabbur } from '../infrastructure/TadabburContext';
import { usePro } from '../../auth/infrastructure/ProContext';
import { Spacing } from '../../../core/theme/DesignSystem';
import { TrackSelectionSheet } from './TrackSelectionSheet';

export default function TadabburCard() {
    const theme = useTheme();
    const router = useRouter();
    const { isPro } = usePro();
    const {
        stats,
        canStartSession,
        remainingFreeSessions,
        weeklySessionCount,
        startSession,
        tracks,
        hasSeenOnboarding,
    } = useTadabbur();
    const [showTrackSheet, setShowTrackSheet] = React.useState(false);

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (!canStartSession) {
            // Redirect to paywall
            router.push('/paywall');
            return;
        }
        // Show track selection sheet
        setShowTrackSheet(true);
    };

    const gradientColors: readonly [string, string, ...string[]] = theme.dark
        ? ['#2D1F6E', '#1E1A2E']
        : ['#8B5CF6', '#6246EA'];

    const streakText = stats.currentStreak > 0
        ? `${stats.currentStreak}-day streak 🔥`
        : 'Start your reflection journey';

    const subtitleText = isPro
        ? `${stats.totalSessions} sessions completed`
        : `${remainingFreeSessions} free sessions left this week`;

    return (
        <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, delay: 50 }}
            style={styles.cardWrapper}
        >
            <Pressable onPress={handlePress} style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
                <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.card}
                >
                    {/* Top row: icon + title */}
                    <View style={styles.topRow}>
                        <View style={styles.iconCircle}>
                            <MaterialCommunityIcons name="moon-waning-crescent" size={22} color="#FFFFFF" />
                        </View>
                        <View style={styles.titleBlock}>
                            <Text style={styles.title}>Tadabbur</Text>
                            <Text style={styles.subtitle}>{streakText}</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={24} color="rgba(255,255,255,0.7)" />
                    </View>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Bottom row: session info */}
                    <View style={styles.bottomRow}>
                        <View style={styles.statPill}>
                            <MaterialCommunityIcons name="book-open-variant" size={14} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.statText}>{subtitleText}</Text>
                        </View>
                        <View style={styles.ctaChip}>
                            <Text style={styles.ctaText}>
                                {canStartSession ? 'Begin' : 'Unlock'}
                            </Text>
                        </View>
                    </View>
                </LinearGradient>
            </Pressable>

            {/* Track Selection Sheet */}
            <TrackSelectionSheet
                visible={showTrackSheet}
                onDismiss={() => setShowTrackSheet(false)}
            />
        </MotiView>
    );
}

const styles = StyleSheet.create({
    cardWrapper: {
        paddingHorizontal: Spacing.md,
    },
    card: {
        borderRadius: 20,
        padding: 20,
        overflow: 'hidden',
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconCircle: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    titleBlock: {
        flex: 1,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.12)',
        marginVertical: 14,
    },
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
    },
    ctaChip: {
        backgroundColor: 'rgba(255,255,255,0.22)',
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderRadius: 14,
    },
    ctaText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
});

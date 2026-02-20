import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import { MotiView } from 'moti';
import { WaveBackground } from '../../src/presentation/components/animated/WaveBackground';
import { FloatingParticles } from '../../src/presentation/components/animated/FloatingParticles';
import { NoorMascot } from '../../src/presentation/components/mascot/NoorMascot';
import { Spacing, BorderRadius, Shadows } from '../../src/presentation/theme/DesignSystem';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { StreakCounter } from '../../src/presentation/components/stats/StreakCounter';
import MoodCheckInCard from '../../src/presentation/components/mood/MoodCheckInCard';
import { PrayerTimesCard } from '../../src/presentation/components/prayer/PrayerTimesCard';
import { DailyVerseCard } from '../../src/presentation/components/home/DailyVerseCard';
import { KhatmaProgressRing } from '../../src/presentation/components/home/KhatmaProgressRing';
import { ReadingPositionService, ReadingPosition } from '../../src/infrastructure/reading/ReadingPositionService';
import { useKhatma } from '../../src/infrastructure/khatma/KhatmaContext';
import { useAudio } from '../../src/infrastructure/audio/AudioContext';
import { useAdhkar } from '../../src/infrastructure/adhkar/AdhkarContext';
import { AdhkarScreen } from '../../src/presentation/screens/AdhkarScreen';

export default function DashboardScreen() {
    const router = useRouter();
    const theme = useTheme();
    const { playingVerse } = useAudio();
    const { completedSurahs } = useKhatma();
    const [globalPosition, setGlobalPosition] = useState<ReadingPosition | null>(null);
    const [showAdhkar, setShowAdhkar] = useState(false);
    const { getCompletionPercentage } = useAdhkar();
    const currentHour = new Date().getHours();
    const adhkarPeriod = currentHour < 15 ? 'morning' : 'evening';
    const adhkarPct = getCompletionPercentage(adhkarPeriod as any);

    // Refresh global position when home screen gains focus OR audio stops.
    useFocusEffect(
        useCallback(() => {
            if (playingVerse) {
                setGlobalPosition(null);
                return;
            }
            ReadingPositionService.getGlobal().then(pos => {
                if (pos && pos.verse > 1) {
                    setGlobalPosition(pos);
                } else {
                    setGlobalPosition(null);
                }
            });
        }, [playingVerse])
    );

    const showContinueReading = globalPosition && !completedSurahs.includes(globalPosition.surah);

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <StatusBar style={theme.dark ? 'light' : 'dark'} />

                {/* Header */}
                <MotiView
                    from={{ opacity: 0, translateY: -20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'spring', damping: 18, delay: 50 }}
                    style={styles.header}>
                    <View style={styles.headerContent}>
                        <View style={styles.headerRow}>
                            <NoorMascot size={48} mood="happy" style={styles.headerMascot} />
                            <View style={styles.headerTextGroup}>
                                <Text style={[styles.greeting, { color: theme.colors.primary }]}>
                                    Assalamualaikum
                                </Text>
                                <Text style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
                                    Dashboard
                                </Text>
                            </View>
                        </View>
                    </View>

                    <Pressable
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.push('/(tabs)/settings');
                        }}
                        style={({ pressed }) => [
                            styles.settingsButton,
                            { backgroundColor: theme.colors.surfaceVariant },
                            pressed && { opacity: 0.7, transform: [{ scale: 0.92 }] },
                        ]}
                    >
                        <Ionicons
                            name="settings-outline"
                            size={20}
                            color={theme.colors.onSurfaceVariant}
                        />
                    </Pressable>
                </MotiView>

                <StreakCounter />

                {/* Dashboard cards — scrollable */}
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Continue Reading — highest priority action */}
                    {showContinueReading && globalPosition && (
                        <MotiView
                            from={{ opacity: 0, translateY: 10 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ type: 'spring', damping: 18, delay: 100 }}
                            style={{ paddingHorizontal: Spacing.md, marginBottom: Spacing.sm }}
                        >
                            <Pressable
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    router.push(`/surah/${globalPosition.surah}?verse=${globalPosition.verse}&autoplay=true`);
                                }}
                                style={({ pressed }) => [
                                    styles.actionCard,
                                    { backgroundColor: theme.colors.surface },
                                    Shadows.md,
                                    pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                                ]}
                            >
                                <View style={[styles.actionIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
                                    <MaterialCommunityIcons name="book-open-page-variant" size={22} color={theme.colors.primary} />
                                </View>
                                <View style={styles.actionTextGroup}>
                                    <Text style={[styles.actionTitle, { color: theme.colors.onSurface }]} numberOfLines={1}>
                                        Continue Reading
                                    </Text>
                                    <Text style={[styles.actionSubtitle, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
                                        {globalPosition.surahName || `Surah ${globalPosition.surah}`} · Verse {globalPosition.verse}
                                    </Text>
                                </View>
                                <MaterialCommunityIcons name="play-circle" size={32} color={theme.colors.primary} />
                            </Pressable>
                        </MotiView>
                    )}

                    {/* Prayer Times — compact, collapsible */}
                    <PrayerTimesCard />

                    {/* Daily Verse — collapsible */}
                    <DailyVerseCard />

                    {/* Khatma Progress — ring + journey status */}
                    <KhatmaProgressRing />

                    {/* Mood Check-In */}
                    <MoodCheckInCard />

                    {/* Adhkar Quick Access */}
                    <MotiView
                        from={{ opacity: 0, translateY: 10 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'spring', damping: 18, delay: 140 }}
                        style={{ paddingHorizontal: Spacing.md, marginBottom: Spacing.sm }}
                    >
                        <Pressable
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                setShowAdhkar(true);
                            }}
                            style={({ pressed }) => [
                                styles.actionCard,
                                { backgroundColor: theme.colors.surface },
                                Shadows.md,
                                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                            ]}
                        >
                            <View style={[styles.actionIcon, {
                                backgroundColor: adhkarPeriod === 'morning' ? '#FEF3C720' : '#312E8120'
                            }]}>
                                <Text style={{ fontSize: 22 }}>
                                    {adhkarPeriod === 'morning' ? '☀️' : '🌙'}
                                </Text>
                            </View>
                            <View style={styles.actionTextGroup}>
                                <Text style={[styles.actionTitle, { color: theme.colors.onSurface }]} numberOfLines={1}>
                                    {adhkarPeriod === 'morning' ? 'Morning Adhkar' : 'Evening Adhkar'}
                                </Text>
                                <Text style={[styles.actionSubtitle, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
                                    {adhkarPct > 0 ? `${adhkarPct}% complete` : 'Tap to begin'}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={theme.colors.onSurfaceVariant} />
                        </Pressable>
                    </MotiView>

                    {/* Bottom padding for tab bar */}
                    <View style={{ height: 100 }} />
                </ScrollView>
            </SafeAreaView>

            {/* Adhkar fullscreen modal */}
            <Modal
                visible={showAdhkar}
                animationType="slide"
                presentationStyle="fullScreen"
                onRequestClose={() => setShowAdhkar(false)}
            >
                <AdhkarScreen onClose={() => setShowAdhkar(false)} />
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: Spacing.xs,
    },
    header: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerContent: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerMascot: {
        marginRight: Spacing.sm,
    },
    headerTextGroup: {
        justifyContent: 'center',
    },
    greeting: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.5,
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    settingsButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        gap: Spacing.sm,
    },
    actionIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionTextGroup: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 15,
        fontWeight: '700',
    },
    actionSubtitle: {
        fontSize: 13,
        marginTop: 2,
    },
});

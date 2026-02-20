import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { NoorMascot } from '../../src/presentation/components/mascot/NoorMascot';
import { Spacing, BorderRadius, Shadows } from '../../src/presentation/theme/DesignSystem';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { StreakCounter } from '../../src/presentation/components/stats/StreakCounter';
import MoodCheckInCard from '../../src/presentation/components/mood/MoodCheckInCard';
import { PrayerTimesCard } from '../../src/presentation/components/prayer/PrayerTimesCard';
import { usePrayer } from '../../src/infrastructure/prayer/PrayerContext';
import { DailyVerseCard } from '../../src/presentation/components/home/DailyVerseCard';
import { ReadingPositionService, ReadingPosition } from '../../src/infrastructure/reading/ReadingPositionService';
import { useKhatma } from '../../src/infrastructure/khatma/KhatmaContext';
import { useAudio } from '../../src/infrastructure/audio/AudioContext';
import { useAdhkar } from '../../src/infrastructure/adhkar/AdhkarContext';
import { AdhkarScreen } from '../../src/presentation/screens/AdhkarScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 10;
const GRID_PAD = 16;
const TILE_WIDTH = (SCREEN_WIDTH - GRID_PAD * 2 - GRID_GAP) / 2;

// Khatma ring constants
const RING_SIZE = 52;
const STROKE_WIDTH = 4;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GOLD = '#D4A853';

export default function DashboardScreen() {
    const router = useRouter();
    const theme = useTheme();
    const { playingVerse } = useAudio();
    const { completedSurahs, completedJuz } = useKhatma();
    const { nextPrayer } = usePrayer();
    const [globalPosition, setGlobalPosition] = useState<ReadingPosition | null>(null);
    const [showAdhkar, setShowAdhkar] = useState(false);
    const { getCompletionPercentage } = useAdhkar();

    // Smart Adhkar timing: Morning = Fajr until Dhuhr, Evening = after Dhuhr
    // If prayer data available, use it; otherwise fall back to time-based heuristic
    const getAdhkarPeriod = (): 'morning' | 'evening' => {
        if (nextPrayer) {
            // If next prayer is Dhuhr, Fajr, or Sunrise → we're in morning window
            const morningPrayers = ['Fajr', 'Sunrise', 'Dhuhr'];
            if (morningPrayers.includes(nextPrayer.name)) return 'morning';
            return 'evening';
        }
        // Fallback: 5 AM–12 PM = morning, rest = evening
        const h = new Date().getHours();
        return h >= 5 && h < 12 ? 'morning' : 'evening';
    };
    const adhkarPeriod = getAdhkarPeriod();
    const adhkarPct = getCompletionPercentage(adhkarPeriod as any);

    // Khatma progress
    const completedCount = completedJuz?.length || 0;
    const progress = completedCount / 30;
    const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

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
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
                        <Ionicons name="settings-outline" size={20} color={theme.colors.onSurfaceVariant} />
                    </Pressable>
                </MotiView>

                <StreakCounter />

                {/* Dashboard cards */}
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── Continue Reading ── Slim gradient bar */}
                    {showContinueReading && globalPosition && (
                        <MotiView
                            from={{ opacity: 0, translateY: 8 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ type: 'spring', damping: 18, delay: 80 }}
                            style={styles.gridPad}
                        >
                            <Pressable
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    router.push(`/surah/${globalPosition.surah}?verse=${globalPosition.verse}&autoplay=true`);
                                }}
                                style={({ pressed }) => [
                                    styles.continueCard,
                                    pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                                ]}
                            >
                                <LinearGradient
                                    colors={['#5B7FFF', '#7B5FFF']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={StyleSheet.absoluteFill}
                                />
                                <View style={styles.continueLeft}>
                                    <MaterialCommunityIcons name="book-open-page-variant" size={18} color="#FFFFFF" />
                                    <View style={styles.continueTextGroup}>
                                        <Text style={styles.continueTitle}>Continue Reading</Text>
                                        <Text style={styles.continueSubtitle}>
                                            {globalPosition.surahName || `Surah ${globalPosition.surah}`} · Verse {globalPosition.verse}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.playCircle}>
                                    <Ionicons name="play" size={14} color="#5B7FFF" />
                                </View>
                            </Pressable>
                        </MotiView>
                    )}

                    {/* ── Prayer Times (full width, collapsible) ── */}
                    <PrayerTimesCard />

                    {/* ── Daily Verse (full width, collapsible) ── */}
                    <DailyVerseCard />

                    {/* ── 2-Column Grid: Khatma + Adhkar ── */}
                    <MotiView
                        from={{ opacity: 0, translateY: 10 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'spring', damping: 18, delay: 140 }}
                        style={styles.gridRow}
                    >
                        {/* Khatma Tile */}
                        <Pressable
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                router.push('/(tabs)/khatma' as any);
                            }}
                            style={({ pressed }) => [
                                styles.gridTile,
                                { backgroundColor: theme.colors.surface },
                                Shadows.md,
                                pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
                            ]}
                        >
                            <LinearGradient
                                colors={theme.dark
                                    ? ['#D4A85308', '#D4A85303']
                                    : ['#D4A85310', '#D4A85305']
                                }
                                style={[StyleSheet.absoluteFill, { borderRadius: BorderRadius.lg }]}
                            />
                            {/* Ring */}
                            <View style={styles.tileRingWrap}>
                                <Svg width={RING_SIZE} height={RING_SIZE}>
                                    <Circle
                                        cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS}
                                        stroke={theme.dark ? '#2D3A4F' : '#E2E8F0'}
                                        strokeWidth={STROKE_WIDTH} fill="none"
                                    />
                                    <Circle
                                        cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS}
                                        stroke={GOLD} strokeWidth={STROKE_WIDTH} fill="none"
                                        strokeLinecap="round"
                                        strokeDasharray={CIRCUMFERENCE}
                                        strokeDashoffset={strokeDashoffset}
                                        rotation="-90"
                                        origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
                                    />
                                </Svg>
                                <View style={styles.tileRingCenter}>
                                    <Text style={[styles.tileRingNum, { color: GOLD }]}>{completedCount}</Text>
                                    <Text style={[styles.tileRingDenom, { color: theme.colors.onSurfaceVariant }]}>/30</Text>
                                </View>
                            </View>
                            <Text style={[styles.tileLabel, { color: theme.colors.onSurface }]}>Khatma</Text>
                            <Text style={[styles.tileSub, { color: theme.colors.onSurfaceVariant }]}>
                                {completedCount === 0 ? 'Start journey' : `${30 - completedCount} remaining`}
                            </Text>
                        </Pressable>

                        {/* Adhkar Tile */}
                        <Pressable
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                setShowAdhkar(true);
                            }}
                            style={({ pressed }) => [
                                styles.gridTile,
                                { backgroundColor: theme.colors.surface },
                                Shadows.md,
                                pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
                            ]}
                        >
                            <LinearGradient
                                colors={theme.dark
                                    ? (adhkarPeriod === 'morning'
                                        ? ['#FEF3C708', '#FCD34D03']
                                        : ['#312E8108', '#6366F103'])
                                    : (adhkarPeriod === 'morning'
                                        ? ['#FEF3C718', '#FCD34D08']
                                        : ['#312E8118', '#6366F108'])
                                }
                                style={[StyleSheet.absoluteFill, { borderRadius: BorderRadius.lg }]}
                            />
                            <View style={styles.tileEmojiWrap}>
                                <Text style={styles.tileEmoji}>
                                    {adhkarPeriod === 'morning' ? '☀️' : '🌙'}
                                </Text>
                            </View>
                            <Text style={[styles.tileLabel, { color: theme.colors.onSurface }]}>
                                {adhkarPeriod === 'morning' ? 'Morning' : 'Evening'}
                            </Text>
                            <Text style={[styles.tileSub, { color: theme.colors.onSurface, fontWeight: '600' }]}>
                                Adhkar
                            </Text>
                            <Text style={[styles.tileSub2, { color: theme.colors.onSurfaceVariant }]}>
                                {adhkarPct > 0 ? `${adhkarPct}% done` : 'Tap to begin'}
                            </Text>
                        </Pressable>
                    </MotiView>

                    {/* ── Mood Check-In ── */}
                    <MoodCheckInCard />

                    {/* Bottom padding for tab bar */}
                    <View style={{ height: 120 }} />
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
    container: { flex: 1 },
    safeArea: { flex: 1 },
    scrollView: { flex: 1 },
    scrollContent: { paddingTop: Spacing.xs },

    // ── Header ──
    header: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerContent: { flex: 1 },
    headerRow: { flexDirection: 'row', alignItems: 'center' },
    headerMascot: { marginRight: Spacing.sm },
    headerTextGroup: { justifyContent: 'center' },
    greeting: {
        fontSize: 12, fontWeight: '600', letterSpacing: 0.5,
        marginBottom: 2, textTransform: 'uppercase',
    },
    headerTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
    settingsButton: {
        width: 36, height: 36, borderRadius: 18,
        alignItems: 'center', justifyContent: 'center',
    },

    // ── Continue Reading ── Slim gradient bar
    gridPad: { paddingHorizontal: GRID_PAD, marginBottom: GRID_GAP },
    continueCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
    },
    continueLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    continueTextGroup: { flex: 1 },
    continueTitle: {
        fontSize: 14, fontWeight: '700', color: '#FFFFFF',
    },
    continueSubtitle: {
        fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 1,
    },
    playCircle: {
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: '#FFFFFF',
        alignItems: 'center', justifyContent: 'center',
        marginLeft: 8,
    },

    // ── 2-Column Grid ──
    gridRow: {
        flexDirection: 'row',
        paddingHorizontal: GRID_PAD,
        gap: GRID_GAP,
        marginBottom: GRID_GAP,
    },
    gridTile: {
        flex: 1,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 140,
        overflow: 'hidden',
    },

    // ── Khatma Tile ──
    tileRingWrap: {
        width: RING_SIZE, height: RING_SIZE,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 8,
    },
    tileRingCenter: {
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    tileRingNum: { fontSize: 16, fontWeight: '800' },
    tileRingDenom: { fontSize: 10, fontWeight: '500' },

    // ── Adhkar Tile ──
    tileEmojiWrap: {
        width: 48, height: 48, borderRadius: 24,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 8,
    },
    tileEmoji: { fontSize: 28 },

    // ── Tile text ──
    tileLabel: { fontSize: 15, fontWeight: '700', marginBottom: 1 },
    tileSub: { fontSize: 12, textAlign: 'center' },
    tileSub2: { fontSize: 11, textAlign: 'center', marginTop: 2 },
});

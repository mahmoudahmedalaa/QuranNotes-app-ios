import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import { MotiView } from 'moti';
import { BlurView } from 'expo-blur';
import Svg, { Circle } from 'react-native-svg';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { NoorMascot } from '../../src/core/components/mascot/NoorMascot';
import { Spacing, BorderRadius, Shadows, TAB_BAR_HEIGHT, BrandTokens } from '../../src/core/theme/DesignSystem';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { StreakCounter } from '../../src/features/user-stats/presentation/StreakCounter';
import MoodCheckInCard from '../../src/features/mood/presentation/MoodCheckInCard';
import { PrayerTimesCard } from '../../src/features/prayer/presentation/PrayerTimesCard';
import { usePrayer } from '../../src/features/prayer/infrastructure/PrayerContext';
import { DailyVerseCard } from '../../src/features/verse-of-the-day/presentation/DailyVerseCard';
import { ReadingPositionService, ReadingPosition } from '../../src/features/quran-reading/infrastructure/ReadingPositionService';
import { useKhatma } from '../../src/features/khatma/infrastructure/KhatmaContext';
import { useAudio } from '../../src/features/audio-player/infrastructure/AudioContext';
import { useAdhkar } from '../../src/features/adhkar/infrastructure/AdhkarContext';
import { AdhkarScreen } from '../../src/core/presentation/screens/AdhkarScreen';
import { useQuran } from '../../src/core/hooks/useQuran';
import { useSettings } from '../../src/features/settings/infrastructure/SettingsContext';
import { useTimeOfDayPhase } from '../../src/core/hooks/useTimeOfDayPhase';
import { LinearGradient } from 'expo-linear-gradient';

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
    const { playingVerse, isPlaying, playFromVerse } = useAudio();
    const { completedSurahs, completedJuz } = useKhatma();
    const { nextPrayer } = usePrayer();
    const [globalPosition, setGlobalPosition] = useState<ReadingPosition | null>(null);
    const { settings } = useSettings();
    const { surah: continueSurah, loadSurah } = useQuran();
    const [showAdhkar, setShowAdhkar] = useState(false);
    const insets = useSafeAreaInsets();
    const tabBarHeight = useBottomTabBarHeight();  // actual runtime height, safe-area-inclusive
    // Reliable bottom offset: Math.max(insets.bottom, 16) + 8 (tab margin) + 64 (strict tab height) + 8 (gap) = 80
    const pillBottom = Math.max(insets.bottom, 16) + 80;
    const { getCompletionPercentage } = useAdhkar();
    const timePhase = useTimeOfDayPhase();

    // Smart Adhkar timing: Morning = Fajr until Asr begins. Evening = Asr onwards.
    // If prayer data available, use it; otherwise fall back to hour < 15 heuristic.
    const getAdhkarPeriod = (): 'morning' | 'evening' => {
        if (nextPrayer) {
            // Evening begins when next prayer is Maghrib, Isha, or Midnight
            // (meaning Asr has already passed)
            const eveningPrayers = ['Maghrib', 'Isha', 'Midnight'];
            if (eveningPrayers.includes(nextPrayer.name)) return 'evening';
            return 'morning'; // Fajr, Sunrise, Dhuhr, Asr upcoming = still morning
        }
        // Fallback: 3 PM (15:00) = approximate Asr in most timezones
        const h = new Date().getHours();
        return h >= 15 ? 'evening' : 'morning';
    };
    const adhkarPeriod = getAdhkarPeriod();
    const adhkarPct = getCompletionPercentage(adhkarPeriod as any);

    // Khatma progress
    const completedCount = completedJuz?.length || 0;
    const progress = completedCount / 30;
    const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

    // Reload reading position whenever the screen comes into focus
    // (e.g. returning from the surah detail screen which updates the position)
    useFocusEffect(
        useCallback(() => {
            ReadingPositionService.getGlobal().then(pos => {
                if (pos && pos.verse > 1) {
                    setGlobalPosition(pos);
                } else {
                    setGlobalPosition(null);
                }
            });
        }, []) // No deps — always reload fresh on every focus
    );

    // Separately: when audio STOPS playing, immediately restore the pill.
    // We cannot rely on useFocusEffect for this because it only fires on focus events,
    // not on dependency changes while the screen is already focused.
    useEffect(() => {
        if (!playingVerse) {
            // Audio stopped — reload so the pill reappears
            ReadingPositionService.getGlobal().then(pos => {
                if (pos && pos.verse > 1) setGlobalPosition(pos);
                else setGlobalPosition(null);
            });
        }
        // When playingVerse is set, showContinueReading already hides the pill
        // via !isPlaying — no need to clear globalPosition.
    }, [playingVerse]);

    // When the reading position changes, silently pre-load the surah
    // so the play button can trigger in-place audio without navigating
    useFocusEffect(
        useCallback(() => {
            if (!globalPosition) return;
            loadSurah(globalPosition.surah, settings.translationEdition);
        }, [globalPosition?.surah, settings.translationEdition])
    );

    const showContinueReading = globalPosition && !playingVerse && !completedSurahs.includes(globalPosition.surah);

    // Ambient background phases
    const getAmbientGlow = (): readonly [string, string, ...string[]] => {
        if (theme.dark) {
            return timePhase === 'morning' ? ['#09090B', '#18181B'] :
                timePhase === 'evening' ? ['#130A19', '#09090B'] : // Very dark plum sunset tint
                    ['#050508', '#09090B'];  // Deepest night
        }
        return timePhase === 'morning' ? ['#FFFFFF', '#F8F5FF'] : // Fresh morning light
            timePhase === 'evening' ? ['#FDF4FF', '#F8F5FF'] : // Soft sunset blush
                ['#F0EFFF', '#F8F5FF'];  // Cool evening/night slate
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={getAmbientGlow()} style={StyleSheet.absoluteFillObject} />
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
                        <Feather name="settings" size={20} color={theme.colors.onSurfaceVariant} />
                    </Pressable>
                </MotiView>

                <StreakCounter />

                {/* Dashboard cards */}
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >


                    {/* ── 1. Mood Check-In ── */}
                    <MoodCheckInCard />

                    {/* ── 2. 2-Column Grid: Khatma + Adhkar ── */}
                    <MotiView
                        from={{ opacity: 0, translateY: 10 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'spring', damping: 18, delay: 100 }}
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
                                { backgroundColor: theme.colors.primaryContainer },
                                Shadows.sm,
                                pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
                            ]}
                        >
                            {/* Ring */}
                            <View style={styles.tileRingWrap}>
                                <Svg width={RING_SIZE} height={RING_SIZE}>
                                    <Circle
                                        cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS}
                                        stroke={theme.colors.primary} strokeOpacity={0.2}
                                        strokeWidth={STROKE_WIDTH} fill="none"
                                    />
                                    <Circle
                                        cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS}
                                        stroke={theme.colors.primary} strokeWidth={STROKE_WIDTH} fill="none"
                                        strokeLinecap="round"
                                        strokeDasharray={CIRCUMFERENCE}
                                        strokeDashoffset={strokeDashoffset}
                                        rotation="-90"
                                        origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
                                    />
                                </Svg>
                                <View style={styles.tileRingCenter}>
                                    <Text style={[styles.tileRingNum, { color: theme.colors.primary }]}>{completedCount}</Text>
                                    <Text style={[styles.tileRingDenom, { color: theme.colors.primary }]}>/30</Text>
                                </View>
                            </View>
                            <Text style={[styles.tileLabel, { color: theme.colors.primary }]}>Khatma</Text>
                            <Text style={[styles.tileSub, { color: theme.colors.primary, opacity: 0.8 }]}>
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
                                { backgroundColor: theme.colors.primaryContainer },
                                Shadows.sm,
                                pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
                            ]}
                        >
                            <View style={styles.tileEmojiWrap}>
                                {adhkarPeriod === 'morning' ? (
                                    <Feather name="sun" size={28} color={theme.colors.primary} />
                                ) : (
                                    <Feather name="moon" size={28} color={theme.colors.primary} />
                                )}
                            </View>
                            <Text style={[styles.tileLabel, { color: theme.colors.primary }]}>
                                {adhkarPeriod === 'morning' ? 'Morning' : 'Evening'}
                            </Text>
                            <Text style={[styles.tileSub, { color: theme.colors.primary, fontWeight: '600' }]}>
                                Adhkar
                            </Text>
                            <Text style={[styles.tileSub2, { color: theme.colors.primary, opacity: 0.8 }]}>
                                {adhkarPct > 0 ? `${adhkarPct}% done` : 'Tap to begin'}
                            </Text>
                        </Pressable>
                    </MotiView>

                    {/* ── 3. Prayer Times (full width, collapsible) ── */}
                    <PrayerTimesCard />

                    {/* ── 4. Daily Verse (full width, collapsible) ── */}
                    <DailyVerseCard />

                    {/* Bottom padding — extra when floating pill is visible */}
                    <View style={{ height: showContinueReading ? 176 : 120 }} />
                </ScrollView>
            </SafeAreaView>

            {/* ── Floating Continue Reading pill — Apple Music / Spotify pattern ── */}
            {showContinueReading && globalPosition && (
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'spring', damping: 18 }}
                    style={[styles.floatingPillWrap, { bottom: pillBottom }]}
                >
                    <BlurView
                        intensity={60}
                        tint={theme.dark ? 'dark' : 'light'}
                        style={[
                            styles.floatingPillBlur,
                            {
                                borderColor: theme.dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                                borderWidth: 1,
                            }
                        ]}
                    />

                    {/* Body — tapping navigates to reading position */}
                    <Pressable
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            router.push(`/surah/${globalPosition.surah}?verse=${globalPosition.verse}`);
                        }}
                        style={({ pressed }) => [
                            styles.floatingPillInner,
                            pressed && { opacity: 0.85 },
                        ]}
                    >
                        <Feather name="book-open" size={18} color={theme.colors.surface} />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.continueTitle, { color: theme.colors.onSurface }]} numberOfLines={1}>
                                Continue Reading
                            </Text>
                            <Text style={[styles.continueSubtitle, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
                                {globalPosition.surahName || `Surah ${globalPosition.surah}`} · Verse {globalPosition.verse}
                            </Text>
                        </View>
                    </Pressable>
                    {/* Play button */}
                    <Pressable
                        onPress={async () => {
                            if (!continueSurah) {
                                router.push(`/surah/${globalPosition.surah}?verse=${globalPosition.verse}&autoplay=true`);
                                return;
                            }
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            await playFromVerse(continueSurah, globalPosition.verse);
                        }}
                        hitSlop={8}
                        style={({ pressed }) => [styles.playCircleWrap, pressed && { opacity: 0.7 }]}
                    >
                        <Feather name="play-circle" size={24} color={theme.colors.surface} />
                    </Pressable>
                </MotiView>
            )}

            {/* Adhkar fullscreen modal */}
            <Modal
                visible={showAdhkar}
                animationType="slide"
                presentationStyle="fullScreen"
                onRequestClose={() => setShowAdhkar(false)}
            >
                <AdhkarScreen onClose={() => setShowAdhkar(false)} initialPeriod={adhkarPeriod} />
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    scrollView: { flex: 1 },
    scrollContent: { paddingTop: Spacing.lg },

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
        fontSize: 13, fontWeight: '600', letterSpacing: 0.5,
        marginBottom: 2, textTransform: 'uppercase',
    },
    headerTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
    settingsButton: {
        width: 36, height: 36, borderRadius: 18,
        alignItems: 'center', justifyContent: 'center',
    },

    // ── Floating Continue Reading pill ──
    floatingPillWrap: {
        position: 'absolute',
        alignSelf: 'center',
        width: '85%',
        height: 52,
        zIndex: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 8,
    },
    floatingPillBlur: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 26,
        overflow: 'hidden',
    },
    floatingPillInner: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingLeft: 16,
        paddingRight: 4,
        height: 52,
    },
    playCircleWrap: {
        width: 48,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        paddingRight: 8,
        position: 'absolute',
        right: 0,
    },
    continueTitle: {
        fontSize: 14, fontWeight: '700',
    },
    continueSubtitle: {
        fontSize: 12, marginTop: -2,
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
        minHeight: 110,
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
    tileLabel: { fontSize: 17, fontWeight: '700', marginBottom: 2 },
    tileSub: { fontSize: 13, textAlign: 'center' },
    tileSub2: { fontSize: 12, textAlign: 'center', marginTop: 2 },
});

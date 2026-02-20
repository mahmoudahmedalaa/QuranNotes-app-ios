/**
 * Onboarding Slide 2 — "Listen & Explore"
 * Combines: pick-surah + listen + reciter picker + subtle language hint
 *
 * Flow: tap verse → audio plays → reciter list slides in → Continue → Capture slide
 */
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Animated } from 'react-native';
import { Text, useTheme, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import { useOnboarding } from '../../src/infrastructure/onboarding/OnboardingContext';
import { RECITERS } from '../../src/domain/entities/Reciter';
import { useSettings } from '../../src/infrastructure/settings/SettingsContext';
import { Spacing, BorderRadius, Shadows, Gradients } from '../../src/presentation/theme/DesignSystem';
import * as Haptics from 'expo-haptics';

const STEP = 2;
const TOTAL_STEPS = 6;

// Top 4 reciters to show in picker
const FEATURED_RECITERS = RECITERS.slice(0, 4);

export default function OnboardingListenExplore() {
    const theme = useTheme();
    const router = useRouter();
    const { goToStep, skipOnboarding } = useOnboarding();
    const { settings, updateSettings } = useSettings();

    const [phase, setPhase] = useState<'verse' | 'reciter'>('verse');
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasPlayed, setHasPlayed] = useState(false);
    const [selectedReciter, setSelectedReciter] = useState(settings.reciterId || RECITERS[0].id);
    const [playingReciterId, setPlayingReciterId] = useState<string | null>(null);
    const soundRef = useRef<Audio.Sound | null>(null);

    useEffect(() => {
        return () => {
            soundRef.current?.unloadAsync();
        };
    }, []);

    const stopSound = async () => {
        if (soundRef.current) {
            try {
                const status = await soundRef.current.getStatusAsync();
                if (status.isLoaded) await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
            } catch (_) { }
            soundRef.current = null;
        }
        setIsPlaying(false);
        setPlayingReciterId(null);
    };

    const playVerse = async (reciterId?: string) => {
        await stopSound();
        const rid = reciterId ?? selectedReciter;
        const reciter = RECITERS.find(r => r.id === rid) ?? RECITERS[0];
        const url = `https://everyayah.com/data/${reciter.cdnFolder}/001001.mp3`;

        try {
            await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, shouldDuckAndroid: true });
            const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
            soundRef.current = sound;
            setIsPlaying(true);
            setHasPlayed(true);
            if (reciterId) setPlayingReciterId(reciterId);

            sound.setOnPlaybackStatusUpdate(s => {
                if (s.isLoaded && s.didJustFinish) {
                    setIsPlaying(false);
                    setPlayingReciterId(null);
                }
            });

            // Auto-stop after 8s
            setTimeout(async () => {
                if (soundRef.current) {
                    try {
                        const s = await soundRef.current.getStatusAsync();
                        if (s.isLoaded) await soundRef.current.stopAsync();
                    } catch (_) { }
                    setIsPlaying(false);
                    setPlayingReciterId(null);
                }
            }, 8000);
        } catch {
            setIsPlaying(false);
            setHasPlayed(true);
        }
    };

    const handlePlayPress = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (isPlaying) {
            await stopSound();
        } else {
            await playVerse();
        }
    };

    const handleVerseNext = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setPhase('reciter');
    };

    const handleReciterSelect = async (reciterId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedReciter(reciterId);
        updateSettings({ reciterId });
        await playVerse(reciterId);
    };

    const handleContinue = async () => {
        await stopSound();
        goToStep(STEP + 1);
        router.push('/onboarding/record');
    };

    const handleSkip = async () => {
        await stopSound();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await skipOnboarding();
        router.replace('/welcome');
    };

    return (
        <LinearGradient
            colors={theme.dark ? (['#0F1419', '#1A1F26'] as const) : Gradients.sereneSky}
            style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                {/* Progress dots */}
                <View style={styles.progressBar}>
                    {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.dot,
                                {
                                    backgroundColor:
                                        i < STEP ? theme.colors.primary : theme.colors.surfaceVariant,
                                    width: i === STEP - 1 ? 20 : 8,
                                },
                            ]}
                        />
                    ))}
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Phase 1 — Verse player */}
                    <MotiView
                        from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'timing', duration: 400 }}>

                        {/* Coach bubble */}
                        <View style={styles.coachRow}>
                            <View style={[styles.coachBubble, { backgroundColor: theme.colors.primary }]}>
                                <Text style={styles.coachText}>
                                    {phase === 'verse' ? '🎧 Tap to hear the recitation' : '🎙️ Choose your favourite reciter'}
                                </Text>
                            </View>
                        </View>

                        {/* Verse card */}
                        <View style={[styles.verseCard, { backgroundColor: theme.colors.surface }, Shadows.md]}>
                            <Text style={[styles.surahLabel, { color: theme.colors.onSurfaceVariant }]}>
                                Al-Fatiha · Verse 1
                            </Text>
                            <Text style={[styles.arabicText, { color: theme.colors.onSurface }]}>
                                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                            </Text>
                            <Text style={[styles.translation, { color: theme.colors.onSurfaceVariant }]}>
                                In the name of Allah, the Most Gracious, the Most Merciful
                            </Text>

                            {/* Play button */}
                            <MotiView
                                animate={{
                                    scale: hasPlayed ? 1 : [1, 1.06, 1],
                                }}
                                transition={{ loop: !hasPlayed, duration: 1400 }}>
                                <Pressable
                                    onPress={handlePlayPress}
                                    style={[styles.playButton, { backgroundColor: theme.colors.primary }]}>
                                    <Ionicons name={isPlaying ? 'pause' : 'play'} size={30} color="#fff" />
                                </Pressable>
                            </MotiView>

                            {isPlaying && (
                                <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 10 }}>
                                    <Text style={[styles.nowPlaying, { color: theme.colors.primary }]}>♪ Now playing...</Text>
                                </MotiView>
                            )}

                            {/* Subtle language hint — shown only on verse phase */}
                            {phase === 'verse' && (
                                <MotiView
                                    from={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1200 }}>
                                    <View style={[styles.languageHint, { backgroundColor: theme.colors.surfaceVariant }]}>
                                        <Ionicons name="globe-outline" size={12} color={theme.colors.onSurfaceVariant} />
                                        <Text style={[styles.languageHintText, { color: theme.colors.onSurfaceVariant }]}>
                                            Change translation language in Settings › Preferences
                                        </Text>
                                    </View>
                                </MotiView>
                            )}
                        </View>
                    </MotiView>

                    {/* Phase 2 — Reciter picker (slides in after hasPlayed) */}
                    {hasPlayed && phase === 'reciter' && (
                        <MotiView
                            from={{ opacity: 0, translateY: 30 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ type: 'spring', damping: 18 }}
                            style={styles.reciterSection}>
                            {FEATURED_RECITERS.map((reciter, index) => {
                                const isSelected = reciter.id === selectedReciter;
                                const isPlayingThis = reciter.id === playingReciterId;
                                return (
                                    <MotiView
                                        key={reciter.id}
                                        from={{ opacity: 0, translateX: -20 }}
                                        animate={{ opacity: 1, translateX: 0 }}
                                        transition={{ delay: index * 60 }}>
                                        <Pressable
                                            onPress={() => handleReciterSelect(reciter.id)}
                                            style={({ pressed }) => [
                                                styles.reciterCard,
                                                {
                                                    backgroundColor: theme.colors.surface,
                                                    borderColor: isSelected ? theme.colors.primary : 'transparent',
                                                    borderWidth: 2,
                                                },
                                                Shadows.sm,
                                                pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
                                            ]}>
                                            <View
                                                style={[
                                                    styles.reciterIcon,
                                                    {
                                                        backgroundColor: isSelected
                                                            ? theme.colors.primaryContainer
                                                            : theme.colors.surfaceVariant,
                                                    },
                                                ]}>
                                                <Ionicons
                                                    name={isPlayingThis ? 'volume-high' : 'person'}
                                                    size={18}
                                                    color={isSelected ? theme.colors.primary : theme.colors.onSurfaceVariant}
                                                />
                                            </View>
                                            <Text
                                                style={[
                                                    styles.reciterName,
                                                    { color: isSelected ? theme.colors.primary : theme.colors.onSurface },
                                                ]}>
                                                {reciter.name}
                                            </Text>
                                            {isSelected && (
                                                <Ionicons name="checkmark-circle" size={18} color={theme.colors.primary} />
                                            )}
                                        </Pressable>
                                    </MotiView>
                                );
                            })}
                        </MotiView>
                    )}
                </ScrollView>

                {/* Bottom actions */}
                <View style={styles.bottom}>
                    {phase === 'verse' ? (
                        hasPlayed ? (
                            <Button
                                mode="contained"
                                onPress={handleVerseNext}
                                style={styles.cta}
                                labelStyle={styles.ctaLabel}>
                                Choose Your Reciter →
                            </Button>
                        ) : (
                            <Text style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
                                Tap the play button above
                            </Text>
                        )
                    ) : (
                        <Button
                            mode="contained"
                            onPress={handleContinue}
                            style={styles.cta}
                            labelStyle={styles.ctaLabel}>
                            Continue
                        </Button>
                    )}
                    <Pressable onPress={handleSkip} style={styles.skipBtn}>
                        <Text style={[styles.skipText, { color: theme.colors.onSurfaceVariant }]}>Maybe Later</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    progressBar: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.xs,
    },
    dot: { height: 8, borderRadius: 4 },
    scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: 20, gap: Spacing.md },
    coachRow: { alignItems: 'center', marginBottom: Spacing.md, marginTop: Spacing.sm },
    coachBubble: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.lg,
    },
    coachText: { color: '#fff', fontSize: 15, fontWeight: '600' },
    verseCard: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        alignItems: 'center',
    },
    surahLabel: { fontSize: 12, fontWeight: '500', marginBottom: Spacing.sm },
    arabicText: { fontSize: 26, textAlign: 'center', lineHeight: 42, marginBottom: Spacing.md },
    translation: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: Spacing.lg },
    playButton: {
        width: 68,
        height: 68,
        borderRadius: 34,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#5B7FFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    nowPlaying: { fontSize: 13, fontWeight: '500' },
    languageHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: Spacing.md,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: BorderRadius.md,
    },
    languageHintText: { fontSize: 11 },
    reciterSection: { gap: Spacing.sm },
    reciterCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        gap: Spacing.md,
    },
    reciterIcon: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
    },
    reciterName: { flex: 1, fontSize: 15, fontWeight: '600' },
    bottom: {
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.xl,
        gap: Spacing.sm,
    },
    cta: { borderRadius: BorderRadius.xl, width: '100%' },
    ctaLabel: { fontSize: 16, fontWeight: '700', paddingVertical: Spacing.xs },
    hint: { fontSize: 14, paddingVertical: Spacing.sm },
    skipBtn: { paddingVertical: Spacing.sm },
    skipText: { fontSize: 14, fontWeight: '500' },
});

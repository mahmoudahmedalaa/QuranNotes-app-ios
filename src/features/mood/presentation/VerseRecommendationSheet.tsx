/**
 * VerseRecommendationSheet — Full-screen modal showing recommended verses.
 * Option E "Soft & Soothing" design with:
 *  - Full-screen mood-tinted gradient background
 *  - Habiba's mood PNG illustrations
 *  - Warm, elevated verse cards with mood-colored accents
 *  - Inline audio playback, share, and "Read in Surah" actions
 */
import React, { useRef, useCallback, useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Modal,
    Pressable,
    ScrollView,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Text, useTheme } from 'react-native-paper';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { MoodType, MoodVerse, MOOD_CONFIGS } from '../../../core/domain/entities/Mood';
import { useAudio } from '../../audio-player/infrastructure/AudioContext';
import { useQuran } from '../../../core/hooks/useQuran';
import { Spacing, BorderRadius, Shadows, Typography } from '../../../core/theme/DesignSystem';

interface Props {
    visible: boolean;
    verses: MoodVerse[];
    mood: MoodType | null;
    onDismiss: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Keep track of which subtitle to show next for each mood globally
const subtitleIndices: Partial<Record<MoodType, number>> = {};

/**
 * Returns soft gradient colors for the full-screen background,
 * tinted by the mood's signature color.
 */
function getMoodGradient(color: string, isDark: boolean): readonly [string, string, string] {
    if (isDark) {
        return [`${color}18`, `${color}08`, '#09090B'] as const;
    }
    return [`${color}20`, `${color}0C`, '#FDFBF7'] as const;
}

/**
 * Returns a softer accent color for card borders and subtle highlights.
 */
function getMoodAccent(color: string, isDark: boolean): string {
    return isDark ? `${color}30` : `${color}25`;
}

export default function VerseRecommendationSheet({
    visible,
    verses,
    mood,
    onDismiss,
}: Props) {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { playVerse, pause, isPlaying, playingVerse, stop } = useAudio();
    const { loadSurah } = useQuran();
    const [loadingVerse, setLoadingVerse] = useState<string | null>(null);

    // Dynamic subtitle
    const [currentSubtitle, setCurrentSubtitle] = useState('');

    // Runtime-enriched verses with full text from API
    const [enrichedVerses, setEnrichedVerses] = useState<MoodVerse[]>([]);
    const [loadingText, setLoadingText] = useState(false);

    // For sharing
    const viewShotRefs = useRef<Array<ViewShot | null>>([]);
    const [capturingVerseKey, setCapturingVerseKey] = useState<string | null>(null);

    // Cache to avoid re-fetching surahs we've already loaded
    const surahCacheRef = useRef<Map<number, { text: string; translation: string }[]>>(new Map());

    const moodConfig = mood ? MOOD_CONFIGS[mood] : null;
    const moodColor = moodConfig?.color || '#A78BFA';
    const gradientColors = getMoodGradient(moodColor, theme.dark);
    const accentColor = getMoodAccent(moodColor, theme.dark);

    // Cycle through subtitles dynamically
    useEffect(() => {
        if (visible && mood && moodConfig?.subtitles?.length) {
            const idx = subtitleIndices[mood] || 0;
            setCurrentSubtitle(moodConfig.subtitles[idx % moodConfig.subtitles.length]);
            subtitleIndices[mood] = idx + 1;
        } else {
            setCurrentSubtitle('Here are some verses for you');
        }
    }, [visible, mood]);

    // Fetch full verse text when the sheet opens
    useEffect(() => {
        if (!visible || verses.length === 0) {
            setEnrichedVerses([]);
            return;
        }

        let cancelled = false;

        const fetchFullText = async () => {
            setLoadingText(true);

            // Group verses by surah number to minimize API calls
            const surahNumbers = [...new Set(verses.map(v => v.surah))];

            // Fetch only surahs we haven't cached
            const fetchPromises = surahNumbers
                .filter(num => !surahCacheRef.current.has(num))
                .map(async (surahNum) => {
                    try {
                        const surah = await loadSurah(surahNum);
                        if (surah && !cancelled) {
                            const verseMap = surah.verses.map(v => ({
                                text: v.text,
                                translation: v.translation,
                            }));
                            surahCacheRef.current.set(surahNum, verseMap);
                        }
                    } catch {
                        // Silently fail — will fall back to snippet
                    }
                });

            await Promise.all(fetchPromises);

            if (cancelled) return;

            // Enrich verses with full text from cache
            const enriched = verses.map(v => {
                const cachedSurah = surahCacheRef.current.get(v.surah);
                if (cachedSurah && v.verse > 0 && v.verse <= cachedSurah.length) {
                    const fullVerse = cachedSurah[v.verse - 1]; // verse numbers are 1-indexed
                    return {
                        ...v,
                        arabicFull: fullVerse.text,
                        translationFull: fullVerse.translation,
                    };
                }
                return v;
            });

            setEnrichedVerses(enriched);
            setLoadingText(false);
        };

        fetchFullText();

        return () => {
            cancelled = true;
        };
    }, [visible, verses, loadSurah]);

    const handlePlayVerse = useCallback(async (surahNum: number, verseNum: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const verseKey = `${surahNum}:${verseNum}`;

        // If already playing this verse, toggle pause
        if (playingVerse && playingVerse.surah === surahNum && playingVerse.verse === verseNum) {
            if (isPlaying) {
                pause();
            }
            return;
        }

        try {
            setLoadingVerse(verseKey);
            // Stop any existing playback first to prevent conflicts
            await stop();
            await playVerse(surahNum, verseNum);
        } catch (e) {
            if (__DEV__) console.error('[VerseRec] Error playing verse:', e);
        } finally {
            setLoadingVerse(null);
        }
    }, [playVerse, pause, isPlaying, playingVerse, stop]);

    const handleOpenSurah = useCallback((surah: number, verse: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        stop();
        onDismiss();
        router.push(`/surah/${surah}?verse=${verse}&autoplay=true`);
    }, [onDismiss, router, stop]);

    const handleShareVerse = async (verseKey: string, idx: number) => {
        const ref = viewShotRefs.current[idx];
        if (!ref) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setCapturingVerseKey(verseKey);

        setTimeout(async () => {
            try {
                const uri = await ref.capture?.();
                if (uri) {
                    await Sharing.shareAsync(uri, {
                        dialogTitle: 'Share Verse',
                        mimeType: 'image/png'
                    });
                }
            } catch (err) {
                if (__DEV__) console.error('Error sharing verse:', err);
            } finally {
                setCapturingVerseKey(null);
            }
        }, 150);
    };

    if (!mood || verses.length === 0) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onDismiss}
        >
            {/* Full-screen mood-tinted gradient */}
            <LinearGradient
                colors={gradientColors}
                locations={[0, 0.45, 1]}
                style={[styles.container, { paddingTop: insets.top }]}
            >
                {/* Close button */}
                <Pressable
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        stop();
                        onDismiss();
                    }}
                    style={({ pressed }) => [
                        styles.closeButton,
                        {
                            backgroundColor: theme.dark
                                ? 'rgba(255,255,255,0.12)'
                                : 'rgba(0,0,0,0.06)',
                        },
                        pressed && { opacity: 0.6 },
                    ]}
                >
                    <MaterialCommunityIcons
                        name="close"
                        size={20}
                        color={theme.dark ? '#FFFFFF' : '#333333'}
                    />
                </Pressable>

                {/* Mood header — icon + label + subtitle */}
                <MotiView
                    from={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', damping: 14, delay: 100 }}
                    style={styles.moodHeader}
                >
                    {mood && <Image
                        source={moodConfig?.imageSource}
                        style={styles.moodIllustration}
                        contentFit="contain"
                        transition={200}
                    />}
                    <Text style={[styles.moodLabel, { color: theme.colors.onSurface }]}>
                        {moodConfig?.label}
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                        {currentSubtitle}
                    </Text>
                </MotiView>

                {/* Verse cards */}
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingBottom: insets.bottom + Spacing.xl },
                    ]}
                    showsVerticalScrollIndicator={false}
                >
                    {(enrichedVerses.length > 0 ? enrichedVerses : verses).map((verse, idx) => {
                        const verseKey = `${verse.surah}:${verse.verse}`;
                        const isCurrentlyPlaying = playingVerse &&
                            playingVerse.surah === verse.surah &&
                            playingVerse.verse === verse.verse;
                        const isLoading = loadingVerse === verseKey;
                        const displayArabic = verse.arabicFull || verse.arabicSnippet;
                        const displayTranslation = verse.translationFull || verse.translation;

                        return (
                            <MotiView
                                key={`${verse.surah}-${verse.verse}-${idx}`}
                                from={{ opacity: 0, translateY: 20 }}
                                animate={{ opacity: 1, translateY: 0 }}
                                transition={{
                                    type: 'spring',
                                    damping: 16,
                                    delay: 200 + idx * 120,
                                }}
                            >
                                <ViewShot
                                    ref={el => { viewShotRefs.current[idx] = el; }}
                                    options={{ format: 'png', quality: 1.0 }}
                                    style={capturingVerseKey === verseKey ? {
                                        backgroundColor: theme.dark ? '#18181B' : '#FFFFFF',
                                        padding: Spacing.md,
                                        borderRadius: BorderRadius.xl,
                                    } : {}}
                                >
                                    <View style={[
                                        styles.verseCard,
                                        {
                                            backgroundColor: theme.dark ? '#1C1C1E' : '#FFFFFF',
                                            borderColor: accentColor,
                                        },
                                        Shadows.sm,
                                    ]}>
                                        {/* Arabic text */}
                                        <Text style={[styles.arabicText, { color: theme.colors.onSurface }]}>
                                            {displayArabic}
                                        </Text>

                                        {/* Decorative divider with mood accent */}
                                        <View style={styles.dividerRow}>
                                            <View style={[styles.dividerLine, { backgroundColor: accentColor }]} />
                                            <View style={[styles.dividerDot, { backgroundColor: moodColor }]} />
                                            <View style={[styles.dividerLine, { backgroundColor: accentColor }]} />
                                        </View>

                                        {/* Translation */}
                                        <Text style={[styles.translation, { color: theme.colors.onSurfaceVariant }]}>
                                            {displayTranslation}
                                        </Text>

                                        {/* Surah reference */}
                                        <Text style={[styles.surahRef, { color: moodColor }]}>
                                            {verse.theme}
                                        </Text>

                                        {/* Action buttons */}
                                        <View style={styles.actionRow}>
                                            {/* Play */}
                                            <Pressable
                                                onPress={() => handlePlayVerse(verse.surah, verse.verse)}
                                                style={({ pressed }) => [
                                                    styles.actionBtn,
                                                    {
                                                        backgroundColor: isCurrentlyPlaying && isPlaying
                                                            ? moodColor
                                                            : `${moodColor}15`,
                                                    },
                                                    pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
                                                ]}
                                            >
                                                {isLoading ? (
                                                    <ActivityIndicator size={14} color={moodColor} />
                                                ) : (
                                                    <MaterialCommunityIcons
                                                        name={isCurrentlyPlaying && isPlaying ? 'pause' : 'play'}
                                                        size={16}
                                                        color={isCurrentlyPlaying && isPlaying ? '#FFFFFF' : moodColor}
                                                    />
                                                )}
                                            </Pressable>

                                            {/* Read in Surah */}
                                            <Pressable
                                                onPress={() => handleOpenSurah(verse.surah, verse.verse)}
                                                style={({ pressed }) => [
                                                    styles.actionBtnWide,
                                                    { backgroundColor: `${moodColor}15` },
                                                    pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
                                                ]}
                                            >
                                                <MaterialCommunityIcons
                                                    name="book-open-page-variant"
                                                    size={14}
                                                    color={moodColor}
                                                />
                                                <Text style={[styles.actionBtnText, { color: moodColor }]}>
                                                    Read
                                                </Text>
                                            </Pressable>

                                            {/* Share */}
                                            <Pressable
                                                onPress={() => handleShareVerse(verseKey, idx)}
                                                style={({ pressed }) => [
                                                    styles.actionBtn,
                                                    { backgroundColor: `${moodColor}15` },
                                                    pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
                                                ]}
                                            >
                                                <MaterialCommunityIcons
                                                    name="share-variant"
                                                    size={15}
                                                    color={moodColor}
                                                />
                                            </Pressable>
                                        </View>

                                        {/* Watermark for sharing */}
                                        {capturingVerseKey === verseKey && (
                                            <View style={styles.watermarkContainer}>
                                                <Text style={[styles.watermarkText, { color: theme.colors.onSurfaceVariant }]}>
                                                    QuranNotes App
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </ViewShot>
                            </MotiView>
                        );
                    })}
                </ScrollView>
            </LinearGradient>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    closeButton: {
        alignSelf: 'flex-end',
        width: 36,
        height: 36,
        borderRadius: BorderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
        marginTop: Spacing.xs,
    },
    moodHeader: {
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        marginBottom: Spacing.md,
    },
    moodIllustration: {
        width: 120,
        height: 120,
        marginBottom: 4,
    },
    moodLabel: {
        ...Typography.displayMedium,
        fontSize: 34,
        lineHeight: 38,
        textAlign: 'center',
    },
    subtitle: {
        ...Typography.bodyMedium,
        textAlign: 'center',
        marginTop: 2,
        opacity: 0.8,
    },
    scrollContent: {
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.sm,
        gap: Spacing.md,
    },
    verseCard: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        borderWidth: 1,
    },
    arabicText: {
        fontSize: 22,
        lineHeight: 38,
        textAlign: 'right',
        fontFamily: 'System',
        marginBottom: Spacing.md,
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
        paddingHorizontal: Spacing.lg,
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    dividerDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        marginHorizontal: 10,
        opacity: 0.6,
    },
    translation: {
        ...Typography.bodyLarge,
        fontStyle: 'italic',
        lineHeight: 26,
        marginBottom: Spacing.sm,
    },
    surahRef: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: Spacing.md,
        textTransform: 'capitalize',
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionBtn: {
        width: 38,
        height: 38,
        borderRadius: BorderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionBtnWide: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: Spacing.sm + 4,
        paddingVertical: Spacing.xs + 2,
        borderRadius: BorderRadius.full,
    },
    actionBtnText: {
        fontSize: 13,
        fontWeight: '600',
    },
    watermarkContainer: {
        marginTop: Spacing.lg,
        alignItems: 'center',
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    watermarkText: {
        ...Typography.labelMedium,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
});

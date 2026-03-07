/**
 * VerseRecommendationSheet — Full-screen modal showing recommended verses.
 * Option E "Soft & Soothing" design with:
 *  - Full-screen mood-tinted gradient background
 *  - Habiba's mood PNG illustrations
 *  - Warm, elevated verse cards with mood-colored accents
 *  - Inline audio playback, share, and "Read in Surah" actions
 *
 * All styling uses DesignSystem tokens (Spacing, BorderRadius, Typography, Shadows).
 * Theme colors come from react-native-paper useTheme() — no raw hex codes.
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
    Animated as RNAnimated,
    Easing as RNEasing,
} from 'react-native';
import { Image } from 'expo-image';
import { Text, useTheme } from 'react-native-paper';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path as SvgPath } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { MoodType, MoodVerse, MOOD_CONFIGS } from '../../../core/domain/entities/Mood';
import { useAudio } from '../../audio-player/infrastructure/AudioContext';
import { useQuran } from '../../../core/hooks/useQuran';
import { Spacing, BorderRadius, Shadows, Typography, Springs } from '../../../core/theme/DesignSystem';
import { getQuranFontFamily } from '../../../core/theme/QuranFonts';
import { useSettings } from '../../settings/infrastructure/SettingsContext';

// ── Layout constants (avoids magic numbers throughout) ──────────────────
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ICON_BUTTON_SIZE = 36;
const ACTION_BUTTON_SIZE = 38;
const ILLUSTRATION_SIZE = 120;
const DIVIDER_DOT_SIZE = 5;
const CURVE_DEPTH = 65;                               // how deep the elliptical arc is (wide & shallow)
const COLORED_ZONE_HEIGHT = 220;                      // height of the gradient top zone (before curve)
const ICON_OVERLAP = ILLUSTRATION_SIZE * 0.5;         // how much the icon drops below the curve boundary

// SVG path for the wide, shallow elliptical dome (Headspace-style)
const CURVE_SVG_PATH = `M 0 ${CURVE_DEPTH} Q ${SCREEN_WIDTH / 2} 0 ${SCREEN_WIDTH} ${CURVE_DEPTH} L ${SCREEN_WIDTH} ${CURVE_DEPTH} L 0 ${CURVE_DEPTH} Z`;

// ── Arabic text style (not in DesignSystem — unique to Quran rendering) ─
const ARABIC_FONT_SIZE = 22;
const ARABIC_LINE_HEIGHT = 38;

/**
 * BreathingIcon — Same soothing scale animation as the dashboard mood pill.
 * Scale 1.2 → 2.2 → 1.2, 3s each direction (6s full cycle).
 */
function BreathingIcon({ imageSource, size }: { imageSource: any; size: number }) {
    const scaleAnim = useRef(new RNAnimated.Value(1.2)).current;

    useEffect(() => {
        const loop = RNAnimated.loop(
            RNAnimated.sequence([
                RNAnimated.timing(scaleAnim, {
                    toValue: 2.2,
                    duration: 3000,
                    easing: RNEasing.inOut(RNEasing.ease),
                    useNativeDriver: true,
                }),
                RNAnimated.timing(scaleAnim, {
                    toValue: 1.2,
                    duration: 3000,
                    easing: RNEasing.inOut(RNEasing.ease),
                    useNativeDriver: true,
                }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [scaleAnim]);

    return (
        <RNAnimated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Image
                source={imageSource}
                style={{ width: size, height: size }}
                contentFit="contain"
                transition={200}
            />
        </RNAnimated.View>
    );
}

interface Props {
    visible: boolean;
    verses: MoodVerse[];
    mood: MoodType | null;
    onDismiss: () => void;
}

// Keep track of which subtitle to show next for each mood globally
const subtitleIndices: Partial<Record<MoodType, number>> = {};

/**
 * Returns soft gradient colors for the full-screen background,
 * tinted by the mood's signature color.
 */
function getMoodGradient(color: string, isDark: boolean): readonly [string, string, string] {
    if (isDark) {
        return [`${color}40`, `${color}28`, `${color}18`] as const;
    }
    return [`${color}50`, `${color}35`, `${color}20`] as const;
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
    const { settings } = useSettings();
    const quranFontFamily = getQuranFontFamily(settings.quranFont);
    const { playVerse, pause, isPlaying, playingVerse, stop } = useAudio();
    const { loadSurah } = useQuran();
    const [loadingVerse, setLoadingVerse] = useState<string | null>(null);

    // Dynamic subtitle
    const [currentSubtitle, setCurrentSubtitle] = useState('');

    // Runtime-enriched verses with full text from API
    const [enrichedVerses, setEnrichedVerses] = useState<MoodVerse[]>([]);
    const [, setLoadingText] = useState(false);

    // For sharing
    const viewShotRefs = useRef<(ViewShot | null)[]>([]);
    const [capturingVerseKey, setCapturingVerseKey] = useState<string | null>(null);

    // Cache to avoid re-fetching surahs we've already loaded
    const surahCacheRef = useRef<Map<number, { text: string; translation: string }[]>>(new Map());

    const moodConfig = mood ? MOOD_CONFIGS[mood] : null;
    const moodColor = moodConfig?.color || theme.colors.primary;
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

            const surahNumbers = [...new Set(verses.map(v => v.surah))];

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

            const enriched = verses.map(v => {
                const cachedSurah = surahCacheRef.current.get(v.surah);
                if (cachedSurah && v.verse > 0 && v.verse <= cachedSurah.length) {
                    const fullVerse = cachedSurah[v.verse - 1];
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

        if (playingVerse && playingVerse.surah === surahNum && playingVerse.verse === verseNum) {
            if (isPlaying) {
                pause();
            }
            return;
        }

        try {
            setLoadingVerse(verseKey);
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
            <View style={styles.container}>
                {/* ── Full-height Gradient — always visible as background ── */}
                <LinearGradient
                    colors={[...gradientColors, moodColor + '33']}
                    locations={[0, 0.15, 0.35, 1]}
                    style={styles.coloredZone}
                />

                {/* Close button — fixed above everything */}
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
                                ? 'rgba(255,255,255,0.15)'
                                : 'rgba(255,255,255,0.7)',
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

                {/* ── Scrollable Content ── */}
                <ScrollView
                    contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
                    showsVerticalScrollIndicator={false}
                    style={styles.scrollView}
                >
                    {/* Transparent spacer — gradient shows through */}
                    <View style={styles.gradientSpacer} />

                    {/* SVG dome — wide, shallow elliptical curve (Headspace style) */}
                    <Svg
                        width={SCREEN_WIDTH}
                        height={CURVE_DEPTH}
                        style={styles.curveSvg}
                    >
                        <SvgPath d={CURVE_SVG_PATH} fill={theme.colors.surface} />
                    </Svg>

                    {/* White content area — connects seamlessly with the dome arch */}
                    <View style={[styles.headerArea, { backgroundColor: theme.colors.surface }]}>
                        {/* Breathing icon — floats up through dome into gradient */}
                        <MotiView
                            from={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', ...Springs.gentle, delay: 100 }}
                            style={styles.floatingIconWrap}
                        >
                            {mood && (
                                <BreathingIcon imageSource={moodConfig?.imageSource} size={ILLUSTRATION_SIZE} />
                            )}
                        </MotiView>

                        {/* Mood label + subtitle */}
                        <MotiView
                            from={{ opacity: 0, translateY: 10 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ type: 'spring', ...Springs.gentle, delay: 200 }}
                            style={styles.moodHeader}
                        >
                            <Text style={[styles.moodLabel, { color: theme.colors.onSurface }]}>
                                {moodConfig?.label}
                            </Text>
                            <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                                {currentSubtitle}
                            </Text>
                        </MotiView>

                        {/* Verse cards */}
                        <View style={styles.scrollContent}>
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
                                        from={{ opacity: 0, translateY: Spacing.lg }}
                                        animate={{ opacity: 1, translateY: 0 }}
                                        transition={{
                                            type: 'spring',
                                            ...Springs.gentle,
                                            delay: 200 + idx * 120,
                                        }}
                                    >
                                        <ViewShot
                                            ref={el => { viewShotRefs.current[idx] = el; }}
                                            options={{ format: 'png', quality: 1.0 }}
                                            style={capturingVerseKey === verseKey ? {
                                                backgroundColor: theme.colors.surface,
                                                padding: Spacing.md,
                                                borderRadius: BorderRadius.xl,
                                            } : {}}
                                        >
                                            <View style={[
                                                styles.verseCard,
                                                {
                                                    backgroundColor: theme.colors.surface,
                                                    borderColor: accentColor,
                                                },
                                                Shadows.sm,
                                            ]}>
                                                {/* Arabic text */}
                                                <Text style={[styles.arabicText, { color: theme.colors.onSurface, fontFamily: quranFontFamily }]}>
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

                                                {/* Theme badge */}
                                                <Text style={[styles.themeBadge, { color: moodColor }]}>
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
                                                            <ActivityIndicator size="small" color={moodColor} />
                                                        ) : (
                                                            <MaterialCommunityIcons
                                                                name={isCurrentlyPlaying && isPlaying ? 'pause' : 'play'}
                                                                size={Spacing.md}
                                                                color={isCurrentlyPlaying && isPlaying
                                                                    ? theme.colors.onPrimary
                                                                    : moodColor}
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
                                                            size={Spacing.md - 1}
                                                            color={moodColor}
                                                        />
                                                    </Pressable>
                                                </View>

                                                {/* Watermark for sharing */}
                                                {capturingVerseKey === verseKey && (
                                                    <View style={[styles.watermarkContainer, {
                                                        borderTopColor: `${theme.colors.outline}20`,
                                                    }]}>
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
                        </View>
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
}

// ── Styles — all values use design system tokens ────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    coloredZone: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,    // full-height so gradient persists when scrolled
    },
    scrollView: {
        flex: 1,
    },
    gradientSpacer: {
        height: COLORED_ZONE_HEIGHT - CURVE_DEPTH,    // let gradient show fully before the curve begins
    },
    curveSvg: {
        // no extra spacing — dome sits seamlessly above the content card
    },
    floatingIconWrap: {
        alignSelf: 'center',
        marginTop: -(CURVE_DEPTH + ICON_OVERLAP),    // float up through the SVG dome into gradient
        zIndex: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xs,
    },
    headerArea: {
        // connects seamlessly with the SVG dome — holds icon + title + subtitle
        overflow: 'visible',
        paddingBottom: Spacing.md,
    },
    closeButton: {
        position: 'absolute',
        top: Spacing.md,
        right: Spacing.md,
        width: ICON_BUTTON_SIZE,
        height: ICON_BUTTON_SIZE,
        borderRadius: BorderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 30,
    },
    moodHeader: {
        alignItems: 'center',
        paddingTop: Spacing.sm,               // title sits closer to the icon
        marginBottom: Spacing.md,
    },
    moodIllustration: {
        width: ILLUSTRATION_SIZE,
        height: ILLUSTRATION_SIZE,
    },
    moodLabel: {
        ...Typography.displayLarge,
        textAlign: 'center',
    },
    subtitle: {
        ...Typography.bodyLarge,
        textAlign: 'center',
        marginTop: Spacing.sm,
        paddingHorizontal: Spacing.lg,
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
        fontSize: ARABIC_FONT_SIZE,
        lineHeight: ARABIC_LINE_HEIGHT,
        textAlign: 'right',
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
        width: DIVIDER_DOT_SIZE,
        height: DIVIDER_DOT_SIZE,
        borderRadius: DIVIDER_DOT_SIZE / 2,
        marginHorizontal: Spacing.sm,
        opacity: 0.6,
    },
    translation: {
        ...Typography.bodyLarge,
        fontStyle: 'italic',
        marginBottom: Spacing.sm,
    },
    themeBadge: {
        ...Typography.labelMedium,
        marginBottom: Spacing.md,
        textTransform: 'capitalize',
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    actionBtn: {
        width: ACTION_BUTTON_SIZE,
        height: ACTION_BUTTON_SIZE,
        borderRadius: BorderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionBtnWide: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingHorizontal: Spacing.sm + Spacing.xs,
        paddingVertical: Spacing.xs + 2,
        borderRadius: BorderRadius.full,
    },
    actionBtnText: {
        ...Typography.labelMedium,
    },
    watermarkContainer: {
        marginTop: Spacing.lg,
        alignItems: 'center',
        paddingTop: Spacing.md,
        borderTopWidth: 1,
    },
    watermarkText: {
        ...Typography.labelMedium,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
});

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { IconButton, useTheme } from 'react-native-paper';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { Verse } from '../../../core/domain/entities/Quran';
import { Spacing, BorderRadius, Shadows } from '../../../core/theme/DesignSystem';
import { HIGHLIGHT_COLORS } from '../../notes/infrastructure/HighlightContext';

// Dark-mode background lookup: maps light color → darkBg
const DARK_BG_MAP = Object.fromEntries(
    HIGHLIGHT_COLORS.map(c => [c.color, c.darkBg]),
);
// Softer border/icon colors for dark mode (the light color at 80% opacity)
const getDarkBorderColor = (color: string) => color + 'CC';
import { getQuranFontFamily } from '../../../core/theme/QuranFonts';
import { useSettings } from '../../settings/infrastructure/SettingsContext';
import * as Haptics from 'expo-haptics';

const ACCENT = {
    gold: '#F5A623',
    goldBgLight: '#F5A62315',
    goldBgDark: '#3D2A0E',
    goldBorder: '#F5A62350',
};

interface VerseItemProps {
    verse: Verse;
    index: number;
    onPlay?: () => void;
    onPause?: () => void;
    onNote?: () => void;
    onRecord?: () => void;
    onShare?: () => void;
    onExplain?: () => void;
    onHighlight?: () => void;
    isPlaying?: boolean;
    hasNote?: boolean;
    isStudyMode?: boolean;
    isHighlighted?: boolean; // For Follow Along feature
    highlightColor?: string; // Persistent verse highlight color
    showTransliteration?: boolean; // Show Latin script pronunciation
}

export const VerseItem = ({
    verse,
    index,
    onPlay,
    onPause,
    onNote,
    onRecord,
    onShare,
    onExplain,
    onHighlight,
    isPlaying,
    hasNote,
    isStudyMode,
    isHighlighted,
    highlightColor,
    showTransliteration,
}: VerseItemProps) => {
    const theme = useTheme();
    const { settings } = useSettings();
    const quranFontFamily = getQuranFontFamily(settings.quranFont);
    const [isPeeking, setIsPeeking] = React.useState(false);
    const showTranslit = showTransliteration && verse.transliteration;

    const handleLongPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onHighlight?.();
    };

    const handlePlay = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (isPlaying) {
            onPause?.();
        } else {
            onPlay?.();
        }
    };



    return (
        <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
                type: 'timing',
                duration: 500,
                delay: Math.min(index * 50, 600),
            }}>
            <Pressable
                onLongPress={handleLongPress}
                style={({ pressed }) => [
                    styles.container,
                    { backgroundColor: theme.colors.background },
                    // Gold accent for currently-playing verse
                    isPlaying && [
                        styles.playingContainer,
                        {
                            backgroundColor: theme.dark
                                ? ACCENT.goldBgDark
                                : ACCENT.goldBgLight,
                            borderLeftColor: ACCENT.gold,
                        },
                    ],
                    // Persistent user highlight color
                    !isPlaying && highlightColor && [
                        styles.userHighlightContainer,
                        {
                            backgroundColor: theme.dark
                                ? (DARK_BG_MAP[highlightColor] || highlightColor + '20')
                                : highlightColor + '25',
                            borderLeftColor: theme.dark
                                ? getDarkBorderColor(highlightColor)
                                : highlightColor,
                        },
                    ],

                    isHighlighted && [
                        styles.highlightedContainer,
                        {
                            backgroundColor: theme.dark
                                ? '#2A2040'
                                : theme.colors.tertiaryContainer,
                            borderColor: theme.dark
                                ? '#7B5FFF80'
                                : theme.colors.tertiary,
                        },
                    ],
                    pressed && { opacity: 0.95 },
                ]}>
                {/* Header: Verse Number & Controls */}
                <View style={styles.header}>
                    <View
                        style={[
                            styles.numberBadge,
                            { backgroundColor: theme.colors.surface },
                            isPlaying && { backgroundColor: ACCENT.gold },
                            Shadows.sm,
                        ]}>
                        <Text
                            style={[
                                styles.numberText,
                                { color: theme.colors.primary },
                                isPlaying && { color: '#FFF' },
                            ]}>
                            {verse.number}
                        </Text>
                    </View>
                    <View style={styles.controlsRow}>
                        {onPlay && (
                            <IconButton
                                icon={isPlaying ? 'pause-circle' : 'play-circle-outline'}
                                iconColor={isPlaying ? ACCENT.gold : theme.colors.onSurfaceVariant}
                                size={22}
                                onPress={handlePlay}
                                style={styles.controlButton}
                            />
                        )}
                        {onNote && (
                            <View>
                                <IconButton
                                    icon={hasNote ? 'pencil' : 'pencil-outline'}
                                    iconColor={theme.colors.onSurfaceVariant}
                                    size={22}
                                    onPress={onNote}
                                    style={styles.controlButton}
                                />
                                {hasNote && (
                                    <View
                                        style={[
                                            styles.noteDot,
                                            { backgroundColor: theme.colors.primary },
                                        ]}
                                    />
                                )}
                            </View>
                        )}
                        {onRecord && (
                            <IconButton
                                icon="microphone-outline"
                                iconColor={theme.colors.onSurfaceVariant}
                                size={22}
                                onPress={onRecord}
                                style={styles.controlButton}
                            />
                        )}
                        {onShare && (
                            <IconButton
                                icon="share-variant-outline"
                                iconColor={theme.colors.onSurfaceVariant}
                                size={22}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    onShare();
                                }}
                                style={styles.controlButton}
                            />
                        )}
                        {onExplain && (
                            <Pressable
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    onExplain();
                                }}
                                hitSlop={8}
                                style={styles.tafsirButton}
                            >
                                <MotiView
                                    from={{ scale: 0.95 }}
                                    animate={{ scale: 1.05 }}
                                    transition={{
                                        type: 'timing',
                                        duration: 2000,
                                        loop: true,
                                    }}
                                >
                                    <Ionicons name="sparkles" size={20} color={ACCENT.gold} />
                                </MotiView>
                            </Pressable>
                        )}
                        {onHighlight && (
                            <IconButton
                                icon={highlightColor ? 'marker-check' : 'format-color-highlight'}
                                iconColor={highlightColor
                                    ? (theme.dark ? getDarkBorderColor(highlightColor) : highlightColor)
                                    : theme.colors.onSurfaceVariant
                                }
                                size={22}
                                onPress={onHighlight}
                                style={styles.controlButton}
                            />
                        )}

                    </View>
                </View>

                {/* Arabic Text */}
                <Pressable
                    onPress={() => isStudyMode && setIsPeeking(!isPeeking)}
                    style={styles.textWrapper}>
                    <MotiView
                        animate={{
                            opacity: isStudyMode && !isPeeking ? 0.05 : 1,
                            scale: isStudyMode && !isPeeking ? 0.98 : 1,
                        }}
                        transition={{ type: 'timing', duration: 300 }}>
                        <Text style={[styles.arabicText, { color: theme.colors.onSurface, fontFamily: quranFontFamily }]}>
                            {verse.text}
                        </Text>
                    </MotiView>
                </Pressable>

                {/* Transliteration (Latin pronunciation) */}
                {showTranslit && (
                    <Text style={[styles.transliterationText, { color: theme.colors.secondary }]}>
                        {verse.transliteration}
                    </Text>
                )}

                {/* Translation */}
                {verse.translation && (
                    <Text
                        style={[styles.translationText, { color: theme.colors.onSurfaceVariant }]}>
                        {verse.translation}
                    </Text>
                )}

                <View style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
            </Pressable>
        </MotiView>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
    },
    playingContainer: {
        borderLeftWidth: 3,
        borderRadius: BorderRadius.md,
        marginHorizontal: Spacing.xs,
    },

    highlightedContainer: {
        borderRadius: BorderRadius.lg,
        marginHorizontal: Spacing.sm,
        borderWidth: 2,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 6,
    },
    userHighlightContainer: {
        borderLeftWidth: 3,
        borderRadius: BorderRadius.md,
        marginHorizontal: Spacing.xs,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    controlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    controlButton: {
        margin: 0,
    },
    numberBadge: {
        borderRadius: BorderRadius.md,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    numberText: {
        fontSize: 13,
        fontWeight: '700',
    },
    arabicText: {
        fontSize: 28,
        textAlign: 'right',
        lineHeight: 52,
    },
    textWrapper: {
        marginBottom: Spacing.md,
    },
    translationText: {
        fontSize: 15,
        lineHeight: 24,
        textAlign: 'left',
    },
    transliterationText: {
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'left',
        fontStyle: 'italic',
        marginBottom: Spacing.sm,
        opacity: 0.85,
    },
    divider: {
        height: 1,
        opacity: 0.15,
        marginTop: Spacing.lg,
    },
    tafsirButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    noteDot: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 8,
        height: 8,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: '#FFF',
    },
});

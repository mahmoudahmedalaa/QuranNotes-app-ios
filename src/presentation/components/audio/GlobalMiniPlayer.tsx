/**
 * GlobalMiniPlayer — Persistent audio controls shown across all screens
 * Bottom-positioned, Apple Music / Spotify style — sits above the floating tab bar.
 * Slides up from the bottom when audio starts playing.
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useRouter, usePathname } from 'expo-router';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { useAudio } from '../../../infrastructure/audio/AudioContext';
import { Spacing, BorderRadius } from '../../theme/DesignSystem';

export const GlobalMiniPlayer: React.FC = () => {
    const theme = useTheme();
    const router = useRouter();
    const pathname = usePathname();
    const tabBarHeight = useBottomTabBarHeight();
    const { playingVerse, isPlaying, currentSurahName, currentSurahNum, pause, resume, stop } = useAudio();

    // Don't show if nothing is playing or paused (verse is null = fully stopped)
    if (!playingVerse) return null;

    // Don't show on the surah detail screen — it has its own StickyAudioPlayer
    if (pathname.startsWith('/surah/')) return null;

    const handlePlayPause = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (isPlaying) {
            await pause();
        } else {
            await resume();
        }
    };

    const handleStop = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await stop();
    };

    const handleTap = () => {
        if (currentSurahNum && playingVerse) {
            router.push(`/surah/${currentSurahNum}?verse=${playingVerse.verse}` as any);
        }
    };

    const surahLabel = currentSurahName || `Surah ${playingVerse.surah}`;
    const pillBg = theme.dark ? 'rgba(50, 50, 55, 0.97)' : 'rgba(28, 28, 30, 0.96)';

    return (
        <MotiView
            from={{ translateY: 80, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            exit={{ translateY: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 280 }}
            style={[styles.container, { bottom: tabBarHeight + 8 }]}
        >
            <Pressable
                onPress={handleTap}
                style={({ pressed }) => [
                    styles.pill,
                    { backgroundColor: pillBg },
                    pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
                ]}
            >
                {/* Artwork dot */}
                <View style={[styles.artDot, { backgroundColor: theme.colors.primary }]}>
                    <MaterialCommunityIcons
                        name={isPlaying ? 'volume-high' : 'volume-off'}
                        size={16}
                        color="#FFFFFF"
                    />
                </View>

                {/* Info */}
                <View style={styles.info}>
                    <Text style={styles.title} numberOfLines={1}>
                        {surahLabel}
                    </Text>
                    <Text style={styles.subtitle} numberOfLines={1}>
                        Verse {playingVerse.verse} · {isPlaying ? 'Playing' : 'Paused'}
                    </Text>
                </View>

                {/* Controls */}
                <View style={styles.controls}>
                    <Pressable
                        onPress={handlePlayPause}
                        hitSlop={8}
                        style={({ pressed }) => [pressed && { opacity: 0.6 }]}
                    >
                        <MaterialCommunityIcons
                            name={isPlaying ? 'pause' : 'play'}
                            size={28}
                            color="#FFFFFF"
                        />
                    </Pressable>
                    <Pressable
                        onPress={handleStop}
                        hitSlop={8}
                        style={({ pressed }) => [pressed && { opacity: 0.6 }]}
                    >
                        <MaterialCommunityIcons
                            name="close"
                            size={22}
                            color="rgba(255,255,255,0.5)"
                        />
                    </Pressable>
                </View>
            </Pressable>
        </MotiView>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        alignSelf: 'center',  // centred — matches FloatingTabBar pill alignment
        width: '90%',         // ~matches tab bar pill width across device sizes
        zIndex: 50,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: BorderRadius.full,
        paddingVertical: 10,
        paddingHorizontal: 12,
        gap: Spacing.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
    },
    artDot: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    info: {
        flex: 1,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: -0.1,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 11,
        fontWeight: '500',
        marginTop: 1,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
    },
});

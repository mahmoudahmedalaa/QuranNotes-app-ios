/**
 * GlobalMiniPlayer — slim persistent audio bar, Spotify / Apple Music style.
 * Single row, compact height (~44pt), same visual width as the FloatingTabBar pill.
 * Sits 8pt above the tab bar, slides up from bottom when audio is active.
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAudio } from '../../../infrastructure/audio/AudioContext';
import { TAB_BAR_HEIGHT } from '../../theme/DesignSystem';

export const GlobalMiniPlayer: React.FC = () => {
    const router = useRouter();
    const pathname = usePathname();
    const insets = useSafeAreaInsets();
    const { playingVerse, isPlaying, currentSurahName, currentSurahNum, pause, resume, stop } = useAudio();

    const bottom = insets.bottom + TAB_BAR_HEIGHT + 8;

    if (!playingVerse) return null;
    if (pathname.startsWith('/surah/')) return null;

    const handlePlayPause = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (isPlaying) { await pause(); } else { await resume(); }
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

    return (
        <MotiView
            from={{ translateY: 60, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            exit={{ translateY: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            style={[styles.container, { bottom }]}
        >
            <LinearGradient
                colors={['rgba(98, 70, 234, 0.92)', 'rgba(72, 48, 180, 0.92)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
            />

            {/* Surah name + verse — tap to navigate */}
            <Pressable
                onPress={handleTap}
                style={({ pressed }) => [styles.body, pressed && { opacity: 0.85 }]}
            >
                <MaterialCommunityIcons
                    name={isPlaying ? 'volume-high' : 'volume-off'}
                    size={15}
                    color="rgba(255,255,255,0.85)"
                />
                <Text style={styles.label} numberOfLines={1}>
                    {surahLabel}
                    <Text style={styles.labelSub}>  ·  Verse {playingVerse.verse}</Text>
                </Text>
            </Pressable>

            {/* Play / pause */}
            <Pressable
                onPress={handlePlayPause}
                hitSlop={8}
                style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
            >
                <MaterialCommunityIcons
                    name={isPlaying ? 'pause' : 'play'}
                    size={18}
                    color="#FFFFFF"
                />
            </Pressable>

            {/* Close */}
            <Pressable
                onPress={handleStop}
                hitSlop={8}
                style={({ pressed }) => [styles.iconBtn, styles.closeBtn, pressed && { opacity: 0.6 }]}
            >
                <MaterialCommunityIcons name="close" size={16} color="rgba(255,255,255,0.7)" />
            </Pressable>
        </MotiView>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        alignSelf: 'center',
        width: '82%',          // slightly narrower than 90% to sit inside the tab bar width naturally
        height: 44,
        borderRadius: 22,      // full pill shape matching tab bar
        overflow: 'hidden',
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 100,
        // subtle shadow
        shadowColor: '#3B22C8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 10,
        elevation: 10,
    },
    body: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        paddingLeft: 14,
        paddingRight: 4,
    },
    label: {
        flex: 1,
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    labelSub: {
        fontSize: 12,
        fontWeight: '400',
        color: 'rgba(255,255,255,0.65)',
    },
    iconBtn: {
        width: 36,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeBtn: {
        paddingRight: 4,
    },
});

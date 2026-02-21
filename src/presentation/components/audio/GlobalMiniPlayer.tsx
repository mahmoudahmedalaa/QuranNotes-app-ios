/**
 * GlobalMiniPlayer — persistent audio pill, Apple Music / Spotify style.
 * Matches the Continue Reading pill style (frosted purple glass) so the
 * transition between states feels seamless and part of the same design system.
 *
 * Position: floats above the FloatingTabBar using TAB_BAR_HEIGHT constant
 * (cannot use useBottomTabBarHeight — rendered outside tab navigator context).
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAudio } from '../../../infrastructure/audio/AudioContext';
import { Spacing, BorderRadius, TAB_BAR_HEIGHT } from '../../theme/DesignSystem';

export const GlobalMiniPlayer: React.FC = () => {
    const theme = useTheme();
    const router = useRouter();
    const pathname = usePathname();
    const insets = useSafeAreaInsets();
    const { playingVerse, isPlaying, currentSurahName, currentSurahNum, pause, resume, stop } = useAudio();

    // TAB_BAR_HEIGHT constant used instead of useBottomTabBarHeight() because
    // GlobalMiniPlayer renders as a sibling of <Tabs> in _layout.tsx —
    // outside the tab navigator context where the hook would throw.
    const miniPlayerBottom = insets.bottom + TAB_BAR_HEIGHT + 8;

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
    const gradientColors = theme.dark
        ? ['rgba(80, 60, 200, 0.55)', 'rgba(55, 40, 150, 0.50)'] as const
        : ['rgba(105, 85, 230, 0.30)', 'rgba(75, 55, 200, 0.24)'] as const;

    return (
        <MotiView
            from={{ translateY: 80, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            exit={{ translateY: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 280 }}
            style={[styles.container, { bottom: miniPlayerBottom }]}
        >
            {/* Same frosted-glass gradient as the Continue Reading pill */}
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
            />

            {/* Info — tapping the body navigates to surah */}
            <Pressable
                onPress={handleTap}
                style={({ pressed }) => [
                    styles.body,
                    pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                ]}
            >
                <MaterialCommunityIcons
                    name={isPlaying ? 'volume-high' : 'volume-off'}
                    size={18}
                    color="#FFFFFF"
                />
                <View style={styles.textArea}>
                    <Text style={styles.title} numberOfLines={1}>{surahLabel}</Text>
                    <Text style={styles.subtitle} numberOfLines={1}>
                        Verse {playingVerse.verse} · {isPlaying ? 'Playing' : 'Paused'}
                    </Text>
                </View>
            </Pressable>

            {/* Controls — separate Pressables so they don't trigger body navigation */}
            <Pressable
                onPress={handlePlayPause}
                hitSlop={8}
                style={({ pressed }) => [styles.controlCircle, pressed && { opacity: 0.7 }]}
            >
                <MaterialCommunityIcons
                    name={isPlaying ? 'pause' : 'play'}
                    size={16}
                    color="#A898FF"
                />
            </Pressable>
            <Pressable
                onPress={handleStop}
                hitSlop={8}
                style={({ pressed }) => [styles.closeWrap, pressed && { opacity: 0.6 }]}
            >
                <MaterialCommunityIcons name="close" size={18} color="rgba(255,255,255,0.6)" />
            </Pressable>
        </MotiView>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        alignSelf: 'center',
        width: '90%',
        zIndex: 100,
        borderRadius: 20,
        overflow: 'hidden',
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.22)',
        shadowColor: '#5B3FD0',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.22,
        shadowRadius: 16,
        elevation: 10,
    },
    body: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 13,
        paddingLeft: 16,
        paddingRight: 8,
    },
    textArea: { flex: 1 },
    title: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    subtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.72)',
        marginTop: 1,
    },
    controlCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.30)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeWrap: {
        paddingHorizontal: 12,
        paddingVertical: 13,
    },
});

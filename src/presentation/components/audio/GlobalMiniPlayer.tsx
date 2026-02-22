/**
 * GlobalMiniPlayer — slim persistent audio bar, Spotify / Apple Music style.
 * Single row, compact height (~44pt), same visual width as the FloatingTabBar pill.
 * Sits 8pt above the tab bar, slides up from bottom when audio is active.
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { BlurView } from 'expo-blur';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useAudio } from '../../../infrastructure/audio/AudioContext';
import { TAB_BAR_HEIGHT } from '../../theme/DesignSystem';

export const GlobalMiniPlayer: React.FC = () => {
    const router = useRouter();
    const pathname = usePathname();
    const insets = useSafeAreaInsets();
    const theme = useTheme();
    const { playingVerse, isPlaying, currentSurahName, currentSurahNum, pause, resume, stop } = useAudio();

    const bottom = insets.bottom + 56;

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
            style={[styles.containerWrap, { bottom }]}
        >
            <BlurView
                intensity={60}
                tint={theme.dark ? 'dark' : 'light'}
                style={[
                    styles.blurContainer,
                    {
                        borderColor: theme.dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                        borderWidth: 1,
                    }
                ]}
            >
                {/* Surah name + verse — tap to navigate */}
                <Pressable
                    onPress={handleTap}
                    style={({ pressed }) => [styles.body, pressed && { opacity: 0.85 }]}
                >
                    <MaterialCommunityIcons
                        name={isPlaying ? 'volume-high' : 'volume-off'}
                        size={16}
                        color={theme.colors.primary}
                    />
                    <View style={{ flex: 1, marginLeft: 4 }}>
                        <Text style={[styles.label, { color: theme.colors.onSurface }]} numberOfLines={1}>
                            Now Reciting
                        </Text>
                        <Text style={[styles.labelSub, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
                            {surahLabel}  ·  Verse {playingVerse.verse}
                        </Text>
                    </View>
                </Pressable>

                {/* Play / pause */}
                <Pressable
                    onPress={handlePlayPause}
                    hitSlop={8}
                    style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
                >
                    <MaterialCommunityIcons
                        name={isPlaying ? 'pause-circle' : 'play-circle'}
                        size={26}
                        color={theme.colors.primary}
                    />
                </Pressable>

                {/* Close */}
                <Pressable
                    onPress={handleStop}
                    hitSlop={8}
                    style={({ pressed }) => [styles.iconBtn, styles.closeBtn, pressed && { opacity: 0.6 }]}
                >
                    <MaterialCommunityIcons name="close" size={20} color={theme.colors.onSurfaceVariant} />
                </Pressable>
            </BlurView>
        </MotiView>
    );
};

const styles = StyleSheet.create({
    containerWrap: {
        position: 'absolute',
        alignSelf: 'center',
        width: '85%',
        height: 52,
        zIndex: 100,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 8,
    },
    blurContainer: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 26,
        overflow: 'hidden',
        flexDirection: 'row',
        alignItems: 'center',
    },
    body: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingLeft: 16,
        paddingRight: 4,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
    },
    labelSub: {
        fontSize: 12,
        fontWeight: '400',
        marginTop: -2,
    },
    iconBtn: {
        width: 40,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeBtn: {
        paddingRight: 8,
    },
});

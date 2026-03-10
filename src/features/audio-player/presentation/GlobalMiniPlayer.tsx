/**
 * GlobalMiniPlayer — Persistent audio bar, Spotify / Apple Music style.
 *
 * THREE STATES:
 * 1. Playing  → "Now Reciting · Surah · Verse N"  [pause] [stop]
 * 2. Paused   → "Paused · Surah · Verse N"        [play]  [stop]
 * 3. Session  → "Continue · Surah · Verse N"       [play]  [dismiss]
 *
 * Visible on all tabs except the surah detail page.
 * After stop, persists as "Continue" so user always has a way back.
 * User can dismiss entirely via the ✕ button in session mode.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { BlurView } from 'expo-blur';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useAudio } from '../infrastructure/AudioContext';
import { ReadingHistorySheet } from '../../quran-reading/presentation/ReadingHistorySheet';

type MiniPlayerState = 'playing' | 'paused' | 'session';

export const GlobalMiniPlayer: React.FC = () => {
    const router = useRouter();
    const pathname = usePathname();
    const insets = useSafeAreaInsets();
    const theme = useTheme();
    const {
        playingVerse, isPlaying, currentSurahName, currentSurahNum,
        pause, resume, stop, lastSession, dismissSession,
    } = useAudio();
    const [historyVisible, setHistoryVisible] = useState(false);

    // Tab bar wrapper bottom is Math.max(insets.bottom, 16) + 8.
    // Tab bar height is precisely 64.
    // 8 + 64 + 8 gap = 80.
    const bottom = Math.max(insets.bottom, 16) + 80;

    // ── Determine state ──
    const isActive = !!playingVerse;
    const hasSession = !!lastSession;

    // Nothing to show
    if (!isActive && !hasSession) return null;
    // Hide on surah pages (StickyAudioPlayer handles it there)
    if (pathname.startsWith('/surah/')) return null;

    const state: MiniPlayerState = isActive
        ? (isPlaying ? 'playing' : 'paused')
        : 'session';

    // Derive display values
    const surahLabel = isActive
        ? (currentSurahName || `Surah ${playingVerse!.surah}`)
        : (lastSession!.surahName);
    const verseNum = isActive ? playingVerse!.verse : lastSession!.verse;
    const surahNum = isActive ? (currentSurahNum || playingVerse!.surah) : lastSession!.surahNum;
    const isCompleted = state === 'session' && lastSession!.completed;

    const statusLabel = state === 'playing' ? 'Now Reciting'
        : state === 'paused' ? 'Paused'
            : isCompleted ? 'Completed' : 'Continue';

    const statusIcon: React.ComponentProps<typeof MaterialCommunityIcons>['name'] =
        state === 'playing' ? 'volume-high'
            : state === 'paused' ? 'volume-off'
                : 'bookmark-outline';

    // ── Handlers ──
    const handlePlayPause = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (state === 'playing') {
            await pause();
        } else if (state === 'paused') {
            await resume();
        } else {
            // Session mode — navigate to surah to resume
            router.push(`/surah/${surahNum}?verse=${verseNum}&autoplay=true` as any);
        }
    };

    const handleClose = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (isActive) {
            await stop();
        } else {
            dismissSession();
        }
    };

    const handleTap = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/surah/${surahNum}?verse=${verseNum}` as any);
    };

    const handleLongPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setHistoryVisible(true);
    };

    return (
        <>
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
                    {/* Surah name + verse — tap to navigate, long-press for history */}
                    <Pressable
                        onPress={handleTap}
                        onLongPress={handleLongPress}
                        delayLongPress={400}
                        style={({ pressed }) => [styles.body, pressed && { opacity: 0.85 }]}
                    >
                        <MaterialCommunityIcons
                            name={statusIcon}
                            size={16}
                            color={state === 'session' ? theme.colors.tertiary : theme.colors.primary}
                        />
                        <View style={{ flex: 1, marginLeft: 4 }}>
                            <Text style={[
                                styles.label,
                                { color: state === 'session' ? theme.colors.tertiary : theme.colors.onSurface },
                            ]} numberOfLines={1}>
                                {statusLabel}
                            </Text>
                            <Text style={[styles.labelSub, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
                                {surahLabel}  ·  {isCompleted ? 'Finished' : `Verse ${verseNum}`}
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
                            name={state === 'playing' ? 'pause-circle' : 'play-circle'}
                            size={26}
                            color={theme.colors.primary}
                        />
                    </Pressable>

                    {/* Close / Dismiss */}
                    <Pressable
                        onPress={handleClose}
                        hitSlop={8}
                        style={({ pressed }) => [styles.iconBtn, styles.closeBtn, pressed && { opacity: 0.6 }]}
                    >
                        <MaterialCommunityIcons name="close" size={20} color={theme.colors.onSurfaceVariant} />
                    </Pressable>
                </BlurView>
            </MotiView>

            {/* Reading History Bottom Sheet */}
            <Modal
                visible={historyVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setHistoryVisible(false)}
            >
                <ReadingHistorySheet onClose={() => setHistoryVisible(false)} />
            </Modal>
        </>
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

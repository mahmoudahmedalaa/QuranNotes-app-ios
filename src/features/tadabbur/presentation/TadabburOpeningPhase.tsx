/**
 * TadabburOpeningPhase — Bismillah + breathing animation.
 * Starts soft ambient audio for immersive meditation.
 * Auto-advances after ~5 seconds.
 *
 * Mood-aware: when the session has a moodType, the breathing circle renders
 * the mood icon and uses mood-colored rings instead of the default purple.
 */
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { BreathingCircle } from './components/BreathingCircle';
import { useTadabbur } from '../infrastructure/TadabburContext';
import { startAmbient } from '../infrastructure/TadabburAudioService';
import { MOOD_CONFIGS } from '../../../core/domain/entities/Mood';

const OPENING_DURATION = 5000;

interface Props {
    /** When false the opening timer is paused (onboarding overlay is visible) */
    hasSeenOnboarding: boolean;
}

export const TadabburOpeningPhase: React.FC<Props> = ({ hasSeenOnboarding }) => {
    const theme = useTheme();
    const { dispatch, currentMoodType } = useTadabbur();

    // Get mood config if this is a mood-based session
    const moodConfig = currentMoodType ? MOOD_CONFIGS[currentMoodType] : null;

    useEffect(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // Start ambient background audio for immersive meditation
        startAmbient().catch((e) => {
            if (__DEV__) console.warn('[TadabburOpening] Ambient start failed:', e);
        });
    }, []);

    // Only start the auto-advance timer AFTER onboarding is dismissed
    useEffect(() => {
        if (!hasSeenOnboarding) return;

        const timer = setTimeout(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            dispatch({ type: 'OPENING_COMPLETE' });
        }, OPENING_DURATION);
        return () => clearTimeout(timer);
    }, [hasSeenOnboarding, dispatch]);

    return (
        <View style={styles.container}>
            <BreathingCircle
                size={180}
                label={moodConfig ? undefined : 'بِسْمِ اللَّهِ'}
                moodImageSource={moodConfig?.imageSource}
                moodColor={moodConfig?.color}
            />

            <MotiView
                from={{ opacity: 0, translateY: 16 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 800, delay: 600 }}
                style={styles.textBlock}
            >
                <Text style={[styles.arabic, { color: theme.dark ? '#E9E5FF' : '#1C1033' }]}>
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </Text>
                <Text style={[styles.english, { color: theme.dark ? '#A1A1AA' : '#64748B' }]}>
                    In the name of Allah, the Most Gracious, the Most Merciful
                </Text>
            </MotiView>

            <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ type: 'timing', duration: 1000, delay: 1500 }}
            >
                <Text style={[styles.hint, { color: theme.dark ? '#A1A1AA' : '#64748B' }]}>
                    Take a deep breath and settle your heart…
                </Text>
            </MotiView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        gap: 40,
    },
    textBlock: {
        alignItems: 'center',
        gap: 8,
    },
    arabic: {
        fontSize: 28,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 42,
    },
    english: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
    hint: {
        fontSize: 14,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});

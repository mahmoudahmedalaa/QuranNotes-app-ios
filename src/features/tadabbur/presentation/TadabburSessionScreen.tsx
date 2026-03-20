/**
 * TadabburSessionScreen — Main orchestrator that renders the correct phase component
 * based on the session state machine output.
 *
 * v2 — Adds AI loading state:
 *  - Shows elegant loading UI while AI selects verses
 *  - Handles AI errors with retry option
 *  - Shows selection reason for each verse during the session
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, StatusBar, ActivityIndicator, Pressable } from 'react-native';
import { Text, IconButton, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { useTadabbur } from '../infrastructure/TadabburContext';
import { SessionProgress } from './components/SessionProgress';
import { TadabburOpeningPhase } from './TadabburOpeningPhase';
import { TadabburVerseBlock } from './TadabburVerseBlock';
import { TadabburPausePhase } from './TadabburPausePhase';
import { TadabburResponsePhase } from './TadabburResponsePhase';
import { TadabburClosingPhase } from './TadabburClosingPhase';
import { TadabburOnboarding } from './TadabburOnboarding';
import { stopAll as stopTadabburAudio } from '../infrastructure/TadabburAudioService';

export const TadabburSessionScreen: React.FC = () => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const {
        session,
        dispatch,
        hasSeenOnboarding,
        isLoadingVerses,
        aiError,
    } = useTadabbur();

    // Auto-advance when reaching ADVANCE phase
    useEffect(() => {
        if (session.phase === 'ADVANCE') {
            const timer = setTimeout(() => {
                dispatch({ type: 'ADVANCE_NEXT' });
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [session.phase, dispatch]);

    const handleClose = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        stopTadabburAudio();
        dispatch({ type: 'ABORT' });
        router.back();
    };

    const bgColor = theme.dark ? '#09090B' : '#F8F5FF';
    const softPurple = theme.dark ? '#C4B5FD' : '#8B5CF6';

    // ── AI Loading State ────────────────────────────────────────────────
    if (isLoadingVerses && session.phase === 'IDLE') {
        return (
            <View style={[styles.container, { backgroundColor: bgColor }]}>
                <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
                <View style={styles.safeArea}>
                    <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
                        <IconButton
                            icon="close"
                            size={22}
                            iconColor={theme.dark ? '#A1A1AA' : '#64748B'}
                            onPress={handleClose}
                            style={styles.closeBtn}
                        />
                        <View style={styles.closePlaceholder} />
                        <View style={styles.closePlaceholder} />
                    </View>

                    <View style={styles.loadingContent}>
                        <MotiView
                            from={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', damping: 20 }}
                            style={styles.loadingCenter}
                        >
                            <ActivityIndicator
                                size="large"
                                color={softPurple}
                            />
                            <Text
                                style={[
                                    styles.loadingTitle,
                                    { color: theme.dark ? '#FAFAFA' : '#1C1033' },
                                ]}
                            >
                                Finding the right verses…
                            </Text>
                            <Text
                                style={[
                                    styles.loadingSub,
                                    { color: theme.dark ? '#A1A1AA' : '#64748B' },
                                ]}
                            >
                                Selecting Quranic passages that match your intention
                            </Text>
                        </MotiView>

                        {/* Decorative dots */}
                        <View style={styles.dotsRow}>
                            {[0, 1, 2].map((i) => (
                                <MotiView
                                    key={i}
                                    from={{ opacity: 0.2 }}
                                    animate={{ opacity: 1 }}
                                    transition={{
                                        type: 'timing',
                                        duration: 800,
                                        delay: i * 300,
                                        loop: true,
                                    }}
                                    style={[styles.dot, {
                                        backgroundColor: theme.dark
                                            ? 'rgba(196,181,253,0.5)'
                                            : 'rgba(139,92,246,0.3)',
                                    }]}
                                />
                            ))}
                        </View>
                    </View>
                </View>
            </View>
        );
    }

    // ── AI Error State ──────────────────────────────────────────────────
    if (aiError && session.phase === 'IDLE') {
        return (
            <View style={[styles.container, { backgroundColor: bgColor }]}>
                <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
                <View style={styles.safeArea}>
                    <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
                        <IconButton
                            icon="close"
                            size={22}
                            iconColor={theme.dark ? '#A1A1AA' : '#64748B'}
                            onPress={handleClose}
                            style={styles.closeBtn}
                        />
                        <View style={styles.closePlaceholder} />
                        <View style={styles.closePlaceholder} />
                    </View>

                    <View style={styles.loadingContent}>
                        <MotiView
                            from={{ opacity: 0, translateY: 10 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ type: 'timing', duration: 400 }}
                            style={styles.loadingCenter}
                        >
                            <Text style={{ fontSize: 36, marginBottom: 12 }}>🤲</Text>
                            <Text
                                style={[
                                    styles.loadingTitle,
                                    { color: theme.dark ? '#FAFAFA' : '#1C1033' },
                                ]}
                            >
                                Something went wrong
                            </Text>
                            <Text
                                style={[
                                    styles.loadingSub,
                                    { color: theme.dark ? '#A1A1AA' : '#64748B' },
                                ]}
                            >
                                {aiError}
                            </Text>
                            <Pressable
                                onPress={handleClose}
                                style={({ pressed }) => [
                                    styles.retryBtn,
                                    {
                                        backgroundColor: theme.dark
                                            ? 'rgba(167,139,250,0.12)'
                                            : 'rgba(139,92,246,0.08)',
                                        opacity: pressed ? 0.7 : 1,
                                    },
                                ]}
                            >
                                <Text style={[styles.retryText, { color: softPurple }]}>
                                    Go Back & Try Again
                                </Text>
                            </Pressable>
                        </MotiView>
                    </View>
                </View>
            </View>
        );
    }

    // ── Normal IDLE (shouldn't normally reach here) ─────────────────────
    if (session.phase === 'IDLE') {
        return null;
    }

    const showProgress = !['OPENING', 'CLOSING', 'IDLE'].includes(session.phase);
    const showClose = session.phase !== 'CLOSING';

    // ── CLOSING phase gets full-screen treatment (gradient fills edge-to-edge)
    if (session.phase === 'CLOSING') {
        return (
            <View style={[styles.container, { backgroundColor: bgColor }]}>
                <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
                <TadabburClosingPhase />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
            <View style={styles.safeArea}>
                {/* Top bar */}
                <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
                    {showClose ? (
                        <IconButton
                            icon="close"
                            size={22}
                            iconColor={theme.dark ? '#A1A1AA' : '#64748B'}
                            onPress={handleClose}
                            style={styles.closeBtn}
                        />
                    ) : (
                        <View style={styles.closePlaceholder} />
                    )}

                    {showProgress && (
                        <SessionProgress
                            total={session.totalVerses}
                            current={session.currentVerseIndex}
                        />
                    )}

                    {/* Spacer for balance */}
                    <View style={styles.closePlaceholder} />
                </View>

                {/* Phase content */}
                <View style={styles.content}>
                    {session.phase === 'OPENING' && <TadabburOpeningPhase hasSeenOnboarding={hasSeenOnboarding} />}
                    {session.phase === 'PLAYING' && <TadabburVerseBlock />}
                    {session.phase === 'PAUSING' && <TadabburPausePhase />}
                    {session.phase === 'RESPONDING' && <TadabburResponsePhase />}
                    {session.phase === 'ADVANCE' && (
                        <View style={styles.advanceIndicator}>
                            <Text style={[styles.advanceText, { color: theme.dark ? '#A1A1AA' : '#64748B' }]}>
                                Next verse…
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Onboarding overlay (shown once) */}
            {!hasSeenOnboarding && session.phase === 'OPENING' && <TadabburOnboarding />}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingBottom: 6,
        minHeight: 44,
    },
    closeBtn: {
        margin: 0,
    },
    closePlaceholder: {
        width: 40,
        height: 40,
    },
    content: {
        flex: 1,
    },
    advanceIndicator: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    advanceText: {
        fontSize: 16,
        fontWeight: '500',
    },
    // AI Loading state
    loadingContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    loadingCenter: {
        alignItems: 'center',
        gap: 12,
    },
    loadingTitle: {
        fontSize: 20,
        fontWeight: '600',
        textAlign: 'center',
    },
    loadingSub: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    dotsRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 24,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    retryBtn: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 16,
    },
    retryText: {
        fontSize: 15,
        fontWeight: '600',
    },
});

import React from 'react';
import { View, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Text, useTheme, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useOnboarding } from '../../src/features/onboarding/infrastructure/OnboardingContext';
import {
    Spacing,
    BorderRadius,
    Shadows,
} from '../../src/core/theme/DesignSystem';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_W } = Dimensions.get('window');
const TOTAL_STEPS = 8;
const CURRENT_STEP = 7;

// Sparkle positions for ambient floating particles
const SPARKLES = [
    { x: 30, y: 60, size: 6, delay: 0 },
    { x: SCREEN_W - 50, y: 90, size: 8, delay: 400 },
    { x: 60, y: 180, size: 5, delay: 800 },
    { x: SCREEN_W - 80, y: 220, size: 7, delay: 200 },
    { x: SCREEN_W / 2 - 20, y: 50, size: 6, delay: 600 },
    { x: SCREEN_W / 2 + 40, y: 140, size: 5, delay: 1000 },
    { x: 45, y: 300, size: 4, delay: 300 },
    { x: SCREEN_W - 40, y: 340, size: 6, delay: 700 },
];

export default function OnboardingAiTafseer() {
    const theme = useTheme();
    const router = useRouter();
    const { goToStep } = useOnboarding();

    const handleContinue = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        goToStep(CURRENT_STEP + 1);
        router.push('/onboarding/premium');
    };

    const handleSkip = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        goToStep(CURRENT_STEP + 1);
        router.push('/onboarding/premium');
    };

    return (
        <View style={styles.container}>
            {/* Deep dark gradient background */}
            <LinearGradient
                colors={
                    theme.dark
                        ? ['#0A0A14', '#12101F', '#1A1530']
                        : ['#F8F5FF', '#EDE5FF', '#E0D4FF']
                }
                style={StyleSheet.absoluteFill}
            />

            {/* Ambient floating sparkles */}
            {SPARKLES.map((s, i) => (
                <MotiView
                    key={i}
                    from={{ opacity: 0, scale: 0.3 }}
                    animate={{ opacity: 0.7, scale: 1 }}
                    transition={{
                        type: 'timing',
                        duration: 2000,
                        delay: s.delay,
                        loop: true,
                    }}
                    style={[
                        styles.floatingSparkle,
                        { left: s.x, top: s.y },
                    ]}
                >
                    <Ionicons
                        name="sparkles"
                        size={s.size}
                        color={theme.dark ? '#A78BFA' : '#8B5CF6'}
                    />
                </MotiView>
            ))}

            <SafeAreaView style={styles.safeArea}>
                {/* Progress Indicator */}
                <View style={styles.progressContainer}>
                    {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(step => (
                        <View
                            key={step}
                            style={[
                                styles.progressDot,
                                {
                                    backgroundColor:
                                        step <= CURRENT_STEP
                                            ? theme.colors.primary
                                            : theme.dark ? 'rgba(255,255,255,0.15)' : theme.colors.surfaceVariant,
                                },
                            ]}
                        />
                    ))}
                </View>

                {/* Hero Section */}
                <MotiView
                    from={{ opacity: 0, translateY: -20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 500 }}
                    style={styles.heroSection}
                >
                    {/* Glowing AI icon with sparkle ring */}
                    <View style={styles.iconOuter}>
                        <MotiView
                            from={{ opacity: 0.4, scale: 0.95 }}
                            animate={{ opacity: 0.8, scale: 1.05 }}
                            transition={{
                                type: 'timing',
                                duration: 2500,
                                loop: true,
                            }}
                            style={[
                                styles.glowRing,
                                {
                                    borderColor: theme.dark ? '#A78BFA' : '#8B5CF6',
                                },
                            ]}
                        />
                        <LinearGradient
                            colors={
                                theme.dark
                                    ? ['#2D1B69', '#1A103D']
                                    : ['#EDE5FF', '#D8CCFF']
                            }
                            style={styles.iconCircle}
                        >
                            <Ionicons name="sparkles" size={36} color={theme.dark ? '#C4B5FD' : '#7C3AED'} />
                        </LinearGradient>
                    </View>

                    {/* Title with gradient feel */}
                    <Text style={[styles.headline, { color: theme.dark ? '#F5F3FF' : '#1E1B4B' }]}>
                        AI Tafsir
                    </Text>
                    <Text style={[styles.headlineSub, { color: theme.dark ? '#A78BFA' : '#7C3AED' }]}>
                        Understand every verse instantly
                    </Text>
                </MotiView>

                {/* Visual Demo Card — mockup of the tafsir experience */}
                <MotiView
                    from={{ opacity: 0, translateY: 30 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 500, delay: 300 }}
                    style={styles.demoContainer}
                >
                    <LinearGradient
                        colors={
                            theme.dark
                                ? ['rgba(45,27,105,0.6)', 'rgba(26,16,61,0.8)']
                                : ['rgba(245,243,255,0.9)', 'rgba(237,229,255,0.9)']
                        }
                        style={[
                            styles.demoCard,
                            {
                                borderColor: theme.dark ? 'rgba(167,139,250,0.3)' : 'rgba(124,58,237,0.15)',
                            },
                        ]}
                    >
                        {/* Simulated verse */}
                        <Text
                            style={[
                                styles.demoArabic,
                                { color: theme.dark ? '#E9E5F5' : '#1E1B4B' },
                            ]}
                        >
                            بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                        </Text>

                        <View style={[styles.demoDivider, { backgroundColor: theme.dark ? 'rgba(167,139,250,0.2)' : 'rgba(124,58,237,0.1)' }]} />

                        {/* Simulated tafsir response */}
                        <View style={styles.demoResponseRow}>
                            <MotiView
                                from={{ opacity: 0.3 }}
                                animate={{ opacity: 1 }}
                                transition={{ type: 'timing', duration: 1200, delay: 600, loop: true }}
                            >
                                <Ionicons name="sparkles" size={14} color={theme.dark ? '#A78BFA' : '#7C3AED'} />
                            </MotiView>
                            <Text style={[styles.demoLabel, { color: theme.dark ? '#A78BFA' : '#7C3AED' }]}>
                                AI Tafsir
                            </Text>
                        </View>
                        <Text style={[styles.demoText, { color: theme.dark ? '#C9C2DB' : '#4B3B73' }]}>
                            The Basmalah opens every chapter. "In the Name of Allah" teaches that every action,
                            every reading, begins by invoking divine blessing...
                        </Text>

                        {/* Source pills */}
                        <View style={styles.demoPills}>
                            <View style={[styles.pill, styles.pillActive, { backgroundColor: theme.dark ? '#7C3AED' : '#8B5CF6' }]}>
                                <Text style={styles.pillTextActive}>Ibn Kathir</Text>
                            </View>
                            <View style={[styles.pill, { backgroundColor: theme.dark ? 'rgba(167,139,250,0.15)' : 'rgba(124,58,237,0.1)' }]}>
                                <Text style={[styles.pillText, { color: theme.dark ? '#A78BFA' : '#7C3AED' }]}>Al-Sa'di</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </MotiView>

                {/* Feature highlights — minimal, icon-first */}
                <MotiView
                    from={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: 'timing', duration: 400, delay: 600 }}
                    style={styles.featureStrip}
                >
                    {[
                        { icon: 'book-outline' as const, label: 'Classical\nScholars' },
                        { icon: 'flash-outline' as const, label: 'Instant\nAnswers' },
                        { icon: 'cloud-offline-outline' as const, label: 'Works\nOffline' },
                    ].map((f, i) => (
                        <MotiView
                            key={f.label}
                            from={{ opacity: 0, translateY: 10 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ type: 'timing', duration: 300, delay: 700 + i * 150 }}
                            style={styles.featureItem}
                        >
                            <View
                                style={[
                                    styles.featureIcon,
                                    {
                                        backgroundColor: theme.dark ? 'rgba(167,139,250,0.15)' : 'rgba(124,58,237,0.08)',
                                    },
                                ]}
                            >
                                <Ionicons name={f.icon} size={22} color={theme.dark ? '#C4B5FD' : '#7C3AED'} />
                            </View>
                            <Text
                                style={[
                                    styles.featureLabel,
                                    { color: theme.dark ? '#A1A1AA' : '#6B7280' },
                                ]}
                            >
                                {f.label}
                            </Text>
                        </MotiView>
                    ))}
                </MotiView>

                {/* Disclaimer */}
                <MotiView
                    from={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    transition={{ type: 'timing', duration: 500, delay: 1000 }}
                    style={styles.disclaimerContainer}
                >
                    <Text style={[styles.disclaimerText, { color: theme.dark ? '#71717A' : '#9CA3AF' }]}>
                        AI explanations complement — never replace — traditional scholarship
                    </Text>
                </MotiView>

                {/* Action Buttons */}
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'spring', delay: 800 }}
                    style={styles.footer}
                >
                    <LinearGradient
                        colors={['#7C3AED', '#6246EA'] as const}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.continueGradient}
                    >
                        <Pressable
                            onPress={handleContinue}
                            style={styles.continuePress}
                        >
                            <Text style={styles.continueText}>Continue</Text>
                            <Ionicons name="arrow-forward" size={18} color="#FFF" />
                        </Pressable>
                    </LinearGradient>

                    <Pressable
                        onPress={handleSkip}
                        style={styles.skipButton}
                    >
                        <Text style={[styles.skipText, { color: theme.dark ? '#71717A' : '#9CA3AF' }]}>
                            Skip
                        </Text>
                    </Pressable>
                </MotiView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1, paddingHorizontal: Spacing.lg },

    // ── Progress ──
    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: Spacing.md,
    },
    progressDot: { width: 18, height: 3, borderRadius: 1.5 },

    // ── Floating sparkles ──
    floatingSparkle: {
        position: 'absolute',
        zIndex: 0,
    },

    // ── Hero ──
    heroSection: {
        alignItems: 'center',
        marginTop: Spacing.md,
    },
    iconOuter: {
        width: 100,
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    glowRing: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
    },
    iconCircle: {
        width: 76,
        height: 76,
        borderRadius: 38,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headline: {
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: -1,
        marginBottom: 4,
    },
    headlineSub: {
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.3,
    },

    // ── Demo Card ──
    demoContainer: {
        marginTop: Spacing.lg,
    },
    demoCard: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        borderWidth: 1,
    },
    demoArabic: {
        fontSize: 22,
        fontFamily: 'KFGQPC HAFS Uthmanic Script',
        textAlign: 'center',
        lineHeight: 38,
    },
    demoDivider: {
        height: 1,
        marginVertical: Spacing.md,
    },
    demoResponseRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    demoLabel: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    demoText: {
        fontSize: 14,
        lineHeight: 21,
        marginBottom: Spacing.md,
    },
    demoPills: {
        flexDirection: 'row',
        gap: 8,
    },
    pill: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
    },
    pillActive: {},
    pillTextActive: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
    },
    pillText: {
        fontSize: 12,
        fontWeight: '600',
    },

    // ── Features ──
    featureStrip: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: Spacing.lg,
        paddingHorizontal: Spacing.sm,
    },
    featureItem: {
        alignItems: 'center',
        gap: 8,
    },
    featureIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureLabel: {
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 14,
    },

    // ── Disclaimer ──
    disclaimerContainer: {
        marginTop: Spacing.md,
        paddingHorizontal: Spacing.md,
    },
    disclaimerText: {
        fontSize: 11,
        textAlign: 'center',
        lineHeight: 16,
    },

    // ── Footer ──
    footer: {
        paddingBottom: Spacing.xl,
        marginTop: 'auto',
    },
    continueGradient: {
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
    },
    continuePress: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    continueText: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: '700',
    },
    skipButton: {
        alignItems: 'center',
        paddingVertical: Spacing.md,
    },
    skipText: {
        fontSize: 14,
        fontWeight: '500',
    },
});

/**
 * Onboarding Slide 4 — "Tadabbur (Guided Reflection)"
 * A calm, meditative screen that introduces the three-step Tadabbur flow.
 */
import React from 'react';
import { View, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useOnboarding } from '../../src/features/onboarding/infrastructure/OnboardingContext';
import { Spacing, BorderRadius, Gradients } from '../../src/core/theme/DesignSystem';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_W } = Dimensions.get('window');
const TOTAL_STEPS = 9;
const CURRENT_STEP = 4;

const STEPS = [
    {
        icon: 'headset' as const,
        label: 'Listen',
        desc: 'A verse is recited for you',
    },
    {
        icon: 'leaf' as const,
        label: 'Pause',
        desc: 'Sit in stillness and reflect',
    },
    {
        icon: 'create-outline' as const,
        label: 'Write',
        desc: 'Journal what the verse means to you',
    },
];

// Soft floating particles — smaller and more subtle than AI Tafsir
const PARTICLES = [
    { x: 40, y: 70, size: 4, delay: 0 },
    { x: SCREEN_W - 60, y: 100, size: 5, delay: 500 },
    { x: 70, y: 200, size: 3, delay: 1000 },
    { x: SCREEN_W - 45, y: 250, size: 4, delay: 300 },
    { x: SCREEN_W / 2, y: 60, size: 3, delay: 700 },
];

export default function OnboardingTadabbur() {
    const theme = useTheme();
    const router = useRouter();
    const { goToStep, skipOnboarding } = useOnboarding();

    const handleContinue = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        goToStep(CURRENT_STEP + 1);
        router.push('/onboarding/quran-font' as any);
    };

    const handleSkip = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await skipOnboarding();
        router.replace('/welcome');
    };

    return (
        <LinearGradient
            colors={theme.dark ? (['#0F1419', '#1A1F26'] as const) : Gradients.sereneSky}
            style={{ flex: 1 }}
        >
            {/* Soft floating dots */}
            {PARTICLES.map((p, i) => (
                <MotiView
                    key={i}
                    from={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: 0.5, scale: 1 }}
                    transition={{
                        type: 'timing',
                        duration: 2500,
                        delay: p.delay,
                        loop: true,
                    }}
                    style={[styles.particle, { left: p.x, top: p.y }]}
                >
                    <View
                        style={[
                            styles.particleDot,
                            {
                                width: p.size,
                                height: p.size,
                                borderRadius: p.size / 2,
                                backgroundColor: theme.dark ? '#A78BFA' : '#6246EA',
                            },
                        ]}
                    />
                </MotiView>
            ))}

            <SafeAreaView style={styles.safeArea}>
                {/* Progress dots */}
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
                                            : theme.dark
                                              ? 'rgba(255,255,255,0.15)'
                                              : theme.colors.surfaceVariant,
                                },
                            ]}
                        />
                    ))}
                </View>

                {/* Hero — meditation icon */}
                <MotiView
                    from={{ opacity: 0, translateY: -20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 500 }}
                    style={styles.heroSection}
                >
                    {/* Breathing circle behind icon */}
                    <View style={styles.iconOuter}>
                        <MotiView
                            from={{ opacity: 0.3, scale: 0.9 }}
                            animate={{ opacity: 0.6, scale: 1.1 }}
                            transition={{
                                type: 'timing',
                                duration: 3000,
                                loop: true,
                            }}
                            style={[
                                styles.breatheRing,
                                {
                                    borderColor: theme.dark ? '#A78BFA' : '#6246EA',
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
                            <MaterialCommunityIcons
                                name="meditation"
                                size={36}
                                color={theme.dark ? '#C4B5FD' : '#6246EA'}
                            />
                        </LinearGradient>
                    </View>

                    <Text
                        style={[
                            styles.headline,
                            { color: theme.dark ? '#F5F3FF' : '#1E1B4B' },
                        ]}
                    >
                        Tadabbur
                    </Text>
                    <Text
                        style={[
                            styles.headlineSub,
                            { color: theme.dark ? '#A78BFA' : '#6246EA' },
                        ]}
                    >
                        Guided Quranic meditation
                    </Text>
                </MotiView>

                {/* Three-step flow */}
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 500, delay: 300 }}
                    style={styles.stepsContainer}
                >
                    {STEPS.map((step, i) => (
                        <MotiView
                            key={step.label}
                            from={{ opacity: 0, translateX: -16 }}
                            animate={{ opacity: 1, translateX: 0 }}
                            transition={{
                                type: 'timing',
                                duration: 350,
                                delay: 400 + i * 120,
                            }}
                        >
                            <View
                                style={[
                                    styles.stepRow,
                                    {
                                        backgroundColor: theme.dark
                                            ? 'rgba(45,27,105,0.4)'
                                            : 'rgba(245,243,255,0.9)',
                                        borderColor: theme.dark
                                            ? 'rgba(167,139,250,0.2)'
                                            : 'rgba(98,70,234,0.12)',
                                    },
                                ]}
                            >
                                <View
                                    style={[
                                        styles.stepIconWrap,
                                        {
                                            backgroundColor: theme.dark
                                                ? 'rgba(167,139,250,0.15)'
                                                : 'rgba(98,70,234,0.08)',
                                        },
                                    ]}
                                >
                                    <Ionicons
                                        name={step.icon}
                                        size={20}
                                        color={theme.dark ? '#A78BFA' : '#6246EA'}
                                    />
                                </View>
                                <View style={styles.stepTextGroup}>
                                    <Text
                                        style={[
                                            styles.stepLabel,
                                            {
                                                color: theme.dark
                                                    ? '#F5F3FF'
                                                    : '#1E1B4B',
                                            },
                                        ]}
                                    >
                                        {step.label}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.stepDesc,
                                            {
                                                color: theme.dark
                                                    ? '#9CA3AF'
                                                    : '#6B7280',
                                            },
                                        ]}
                                    >
                                        {step.desc}
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        styles.stepNumber,
                                        {
                                            backgroundColor: theme.dark
                                                ? 'rgba(167,139,250,0.2)'
                                                : 'rgba(98,70,234,0.1)',
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.stepNumberText,
                                            {
                                                color: theme.dark
                                                    ? '#A78BFA'
                                                    : '#6246EA',
                                            },
                                        ]}
                                    >
                                        {i + 1}
                                    </Text>
                                </View>
                            </View>
                        </MotiView>
                    ))}
                </MotiView>

                {/* Feature tags */}
                <MotiView
                    from={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: 'timing', duration: 400, delay: 800 }}
                    style={styles.featureStrip}
                >
                    {[
                        { icon: 'musical-notes-outline' as const, label: 'Ambient\nSounds' },
                        { icon: 'timer-outline' as const, label: 'Meditation\nTimer' },
                        { icon: 'heart-outline' as const, label: 'Mood\nTracking' },
                    ].map((f, i) => (
                        <MotiView
                            key={f.label}
                            from={{ opacity: 0, translateY: 10 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{
                                type: 'timing',
                                duration: 300,
                                delay: 900 + i * 120,
                            }}
                            style={styles.featureItem}
                        >
                            <View
                                style={[
                                    styles.featureIcon,
                                    {
                                        backgroundColor: theme.dark
                                            ? 'rgba(167,139,250,0.15)'
                                            : 'rgba(98,70,234,0.08)',
                                    },
                                ]}
                            >
                                <Ionicons
                                    name={f.icon}
                                    size={22}
                                    color={theme.dark ? '#C4B5FD' : '#6246EA'}
                                />
                            </View>
                            <Text
                                style={[
                                    styles.featureLabel,
                                    {
                                        color: theme.dark ? '#A1A1AA' : '#6B7280',
                                    },
                                ]}
                            >
                                {f.label}
                            </Text>
                        </MotiView>
                    ))}
                </MotiView>

                {/* Tagline */}
                <MotiView
                    from={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: 'timing', duration: 500, delay: 1000 }}
                    style={styles.taglineContainer}
                >
                    <Text
                        style={[
                            styles.taglineText,
                            { color: theme.dark ? '#D4D4D8' : '#374151' },
                        ]}
                    >
                        Five minutes of reflection, one verse at a time
                    </Text>
                </MotiView>

                {/* Actions */}
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
                            <Ionicons
                                name="arrow-forward"
                                size={18}
                                color="#FFF"
                            />
                        </Pressable>
                    </LinearGradient>

                    <Pressable onPress={handleSkip} style={styles.skipButton}>
                        <Text
                            style={[
                                styles.skipText,
                                {
                                    color: theme.dark ? '#71717A' : '#9CA3AF',
                                },
                            ]}
                        >
                            Skip
                        </Text>
                    </Pressable>
                </MotiView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, paddingHorizontal: Spacing.lg },

    // ── Particles ──
    particle: { position: 'absolute', zIndex: 0 },
    particleDot: {},

    // ── Progress ──
    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: Spacing.md,
    },
    progressDot: { width: 18, height: 3, borderRadius: 1.5 },

    // ── Hero ──
    heroSection: {
        alignItems: 'center',
        marginTop: Spacing.sm,
    },
    iconOuter: {
        width: 88,
        height: 88,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
    },
    breatheRing: {
        position: 'absolute',
        width: 88,
        height: 88,
        borderRadius: 44,
        borderWidth: 2,
    },
    iconCircle: {
        width: 66,
        height: 66,
        borderRadius: 33,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headline: {
        fontSize: 30,
        fontWeight: '900',
        letterSpacing: -1,
        marginBottom: 2,
    },
    headlineSub: {
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: 0.3,
    },

    // ── Steps ──
    stepsContainer: {
        marginTop: Spacing.lg,
        gap: 10,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        gap: 14,
    },
    stepIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepTextGroup: { flex: 1 },
    stepLabel: {
        fontSize: 16,
        fontWeight: '700',
    },
    stepDesc: {
        fontSize: 13,
        marginTop: 1,
    },
    stepNumber: {
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepNumberText: {
        fontSize: 12,
        fontWeight: '800',
    },

    // ── Feature strip ──
    featureStrip: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: Spacing.lg,
        paddingHorizontal: Spacing.sm,
    },
    featureItem: {
        alignItems: 'center',
        gap: 6,
    },
    featureIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureLabel: {
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 14,
    },

    // ── Tagline ──
    taglineContainer: {
        marginTop: Spacing.md,
        paddingHorizontal: Spacing.md,
    },
    taglineText: {
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

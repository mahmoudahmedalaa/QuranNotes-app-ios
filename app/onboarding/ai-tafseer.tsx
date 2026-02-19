import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { useRouter } from 'expo-router';
import { useOnboarding } from '../../src/infrastructure/onboarding/OnboardingContext';
import {
    Spacing,
    BorderRadius,
    Shadows,
    Gradients,
} from '../../src/presentation/theme/DesignSystem';
import * as Haptics from 'expo-haptics';

const TOTAL_STEPS = 15;
const CURRENT_STEP = 14;

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

    const features = [
        { emoji: '💡', title: 'Instant Explanations', desc: 'Tap the lightbulb on any verse for AI-powered tafseer' },
        { emoji: '🧠', title: 'Context & Wisdom', desc: 'Learn when and why each verse was revealed' },
        { emoji: '📚', title: 'Practical Lessons', desc: 'Discover how to apply Quranic guidance daily' },
        { emoji: '⚡', title: 'Smart Caching', desc: 'Explanations are saved for instant access offline' },
    ];

    return (
        <LinearGradient
            colors={theme.dark ? (['#0F1419', '#1A1F26'] as const) : Gradients.sereneSky}
            style={styles.container}>
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
                                            : theme.colors.surfaceVariant,
                                },
                            ]}
                        />
                    ))}
                </View>

                {/* Header */}
                <MotiView
                    from={{ opacity: 0, translateY: -20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 400 }}
                    style={styles.header}>
                    <View
                        style={[
                            styles.iconCircle,
                            { backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(212,168,83,0.1)' },
                        ]}>
                        <Text style={{ fontSize: 44 }}>🤖</Text>
                    </View>
                    <Text style={[styles.title, { color: theme.colors.onBackground }]}>
                        AI Verse Explanation
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                        Understand the Quran deeper with AI-powered tafseer
                    </Text>
                </MotiView>

                {/* Feature Cards */}
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'spring', delay: 300 }}
                    style={styles.content}>
                    <View
                        style={[
                            styles.card,
                            { backgroundColor: theme.colors.surface },
                            Shadows.md,
                        ]}>
                        {features.map((feature, index) => (
                            <MotiView
                                key={feature.title}
                                from={{ opacity: 0, translateX: -10 }}
                                animate={{ opacity: 1, translateX: 0 }}
                                transition={{ type: 'timing', duration: 300, delay: 400 + index * 100 }}>
                                <View
                                    style={[
                                        styles.featureRow,
                                        index < features.length - 1 && {
                                            borderBottomWidth: StyleSheet.hairlineWidth,
                                            borderBottomColor: theme.colors.outlineVariant,
                                        },
                                    ]}>
                                    <Text style={styles.featureEmoji}>{feature.emoji}</Text>
                                    <View style={styles.featureInfo}>
                                        <Text style={[styles.featureTitle, { color: theme.colors.onSurface }]}>
                                            {feature.title}
                                        </Text>
                                        <Text style={[styles.featureDesc, { color: theme.colors.onSurfaceVariant }]}>
                                            {feature.desc}
                                        </Text>
                                    </View>
                                </View>
                            </MotiView>
                        ))}
                    </View>

                    {/* Disclaimer */}
                    <MotiView
                        from={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ type: 'timing', duration: 500, delay: 800 }}
                        style={styles.disclaimerContainer}>
                        <Text style={[styles.disclaimerText, { color: theme.colors.onSurfaceVariant }]}>
                            💡 AI explanations complement — not replace — traditional scholarly tafseer
                        </Text>
                    </MotiView>
                </MotiView>

                {/* Action Buttons */}
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'spring', delay: 600 }}
                    style={styles.footer}>
                    <Button
                        mode="contained"
                        onPress={handleContinue}
                        style={styles.continueButton}
                        contentStyle={styles.continueButtonContent}
                        labelStyle={styles.continueButtonLabel}>
                        Continue
                    </Button>
                    <Pressable
                        onPress={handleSkip}
                        style={styles.skipButton}>
                        <Text style={[styles.skipText, { color: theme.colors.onSurfaceVariant }]}>
                            Skip
                        </Text>
                    </Pressable>
                </MotiView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1, paddingHorizontal: Spacing.lg },
    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: Spacing.md,
    },
    progressDot: { width: 18, height: 3, borderRadius: 1.5 },
    header: { alignItems: 'center', marginTop: Spacing.lg },
    iconCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: Spacing.xs },
    subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, paddingHorizontal: Spacing.md },
    content: { flex: 1, paddingTop: Spacing.xl },
    card: { borderRadius: BorderRadius.xl, padding: Spacing.md },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        gap: Spacing.md,
    },
    featureEmoji: { fontSize: 28 },
    featureInfo: { flex: 1 },
    featureTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
    featureDesc: { fontSize: 13, lineHeight: 18 },
    disclaimerContainer: {
        marginTop: Spacing.md,
        paddingHorizontal: Spacing.sm,
    },
    disclaimerText: {
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
        fontStyle: 'italic',
    },
    footer: { paddingBottom: Spacing.xl },
    continueButton: { borderRadius: BorderRadius.lg },
    continueButtonContent: { paddingVertical: Spacing.sm },
    continueButtonLabel: { fontSize: 16, fontWeight: '700' },
    skipButton: { alignItems: 'center', paddingVertical: Spacing.md },
    skipText: { fontSize: 14, fontWeight: '500' },
});

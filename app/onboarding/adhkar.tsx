import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
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
    Gradients,
} from '../../src/core/theme/DesignSystem';
import * as Haptics from 'expo-haptics';

export default function OnboardingAdhkar() {
    const theme = useTheme();
    const router = useRouter();
    const { goToStep } = useOnboarding();

    const handleContinue = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        goToStep(11);
        router.push('/onboarding/languages');
    };

    const handleSkip = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        goToStep(11);
        router.push('/onboarding/languages');
    };

    const features = [
        { icon: 'sunny-outline' as const, title: 'Morning Adhkar', desc: 'Start your day with remembrance' },
        { icon: 'moon-outline' as const, title: 'Evening Adhkar', desc: 'End your day in peace' },
        { icon: 'checkmark-circle-outline' as const, title: 'Track Progress', desc: 'Mark completed dhikr with a counter' },
        { icon: 'trophy-outline' as const, title: 'Daily Streaks', desc: 'Build a consistent habit' },
    ];

    return (
        <LinearGradient
            colors={theme.dark ? (['#0F1419', '#1A1F26'] as const) : Gradients.sereneSky}
            style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                {/* Progress Indicator */}
                <View style={styles.progressContainer}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(step => (
                        <View
                            key={step}
                            style={[
                                styles.progressDot,
                                {
                                    backgroundColor:
                                        step <= 10
                                            ? theme.colors.primary
                                            : theme.colors.surfaceVariant,
                                },
                            ]}
                        />
                    ))}
                </View>

                {/* Header with Icon */}
                <MotiView
                    from={{ opacity: 0, translateY: -20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 400 }}
                    style={styles.header}>
                    <View
                        style={[
                            styles.iconCircle,
                            { backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(91,127,255,0.1)' },
                        ]}>
                        <Ionicons name="time-outline" size={44} color={theme.colors.primary} />
                    </View>
                    <Text style={[styles.title, { color: theme.colors.onBackground }]}>
                        Morning & Evening Adhkar
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                        Build your daily spiritual routine with authentic supplications
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
                                <View style={[
                                    styles.featureRow,
                                    index < features.length - 1 && {
                                        borderBottomWidth: StyleSheet.hairlineWidth,
                                        borderBottomColor: theme.colors.outlineVariant,
                                    },
                                ]}>
                                    <Ionicons name={feature.icon as keyof typeof Ionicons.glyphMap} size={28} color={theme.colors.primary} style={styles.featureEmoji} />
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
                </MotiView>

                {/* CTA Buttons */}
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'spring', delay: 800 }}
                    style={styles.ctaContainer}>
                    <Button
                        mode="contained"
                        onPress={handleContinue}
                        style={styles.ctaButton}
                        labelStyle={styles.ctaLabel}
                        contentStyle={{ height: 54 }}>
                        Continue
                    </Button>
                    <Pressable onPress={handleSkip} style={styles.skipButton}>
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
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 5,
        paddingTop: Spacing.md,
    },
    progressDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
    },
    header: {
        alignItems: 'center',
        paddingTop: Spacing.xxl,
        paddingBottom: Spacing.lg,
        paddingHorizontal: Spacing.xl,
    },
    iconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: -0.5,
        marginBottom: Spacing.sm,
    },
    subtitle: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        opacity: 0.8,
    },
    content: {
        flex: 1,
        paddingHorizontal: Spacing.lg,
    },
    card: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.md,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.sm,
    },
    featureEmoji: {
        fontSize: 24,
        width: 36,
        textAlign: 'center',
    },
    featureInfo: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    featureDesc: {
        fontSize: 13,
        marginTop: 2,
        opacity: 0.8,
    },
    ctaContainer: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.xl,
    },
    ctaButton: {
        borderRadius: BorderRadius.xl,
    },
    ctaLabel: {
        fontSize: 17,
        fontWeight: '700',
    },
    skipButton: {
        alignItems: 'center',
        paddingVertical: Spacing.md,
    },
    skipText: {
        fontSize: 15,
        fontWeight: '500',
    },
});

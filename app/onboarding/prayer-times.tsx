import React from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
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

const TOTAL_STEPS = 15;
const CURRENT_STEP = 12;

export default function OnboardingPrayerTimes() {
    const theme = useTheme();
    const router = useRouter();
    const { goToStep } = useOnboarding();

    const handleContinue = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        goToStep(CURRENT_STEP + 1);
        router.push('/onboarding/topics' as any);
    };

    const handleSkip = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        goToStep(CURRENT_STEP + 1);
        router.push('/onboarding/topics' as any);
    };

    const features = [
        { icon: 'moon-outline' as const, title: 'Accurate Times', desc: 'Prayer times based on your precise location' },
        { icon: 'calendar-outline' as const, title: 'Hijri Calendar', desc: 'See today\'s Islamic date at a glance' },
        { icon: 'time-outline' as const, title: 'Smart Countdown', desc: 'Know exactly when the next prayer is' },
        { icon: 'location-outline' as const, title: 'Auto Location', desc: 'Automatically detects your city' },
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
                        <Ionicons name="moon" size={44} color={theme.colors.primary} />
                    </View>
                    <Text style={[styles.title, { color: theme.colors.onBackground }]}>
                        Prayer Times
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                        Never miss a prayer with accurate, location-based times
                    </Text>
                </MotiView>

                {/* Feature Cards */}
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.contentInner}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
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
                                    <View style={styles.featureIconContainer}>
                                        <Ionicons name={feature.icon} size={28} color={theme.colors.primary} />
                                    </View>
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
                </ScrollView>

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
    content: { flex: 1, paddingTop: Spacing.lg },
    contentInner: { paddingBottom: Spacing.md },
    card: { borderRadius: BorderRadius.xl, padding: Spacing.md },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        gap: Spacing.md,
    },
    featureIconContainer: {
        width: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureInfo: { flex: 1 },
    featureTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
    featureDesc: { fontSize: 13, lineHeight: 18 },
    footer: { paddingBottom: Spacing.xl },
    continueButton: { borderRadius: BorderRadius.lg },
    continueButtonContent: { paddingVertical: Spacing.sm },
    continueButtonLabel: { fontSize: 16, fontWeight: '700' },
    skipButton: { alignItems: 'center', paddingVertical: Spacing.md },
    skipText: { fontSize: 14, fontWeight: '500' },
});

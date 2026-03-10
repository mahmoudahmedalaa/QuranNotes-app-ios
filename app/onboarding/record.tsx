/**
 * Onboarding Slide 3 — "Capture & Organize"
 * Combines: record + note + folders + library-tour into one feature showcase slide
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, Button } from 'react-native-paper';
import { WaveBackground } from '../../src/core/components/animated/WaveBackground';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useOnboarding } from '../../src/features/onboarding/infrastructure/OnboardingContext';
import { Spacing, BorderRadius, Shadows, Gradients, BrandTokens } from '../../src/core/theme/DesignSystem';
import * as Haptics from 'expo-haptics';

const STEP = 3;
const TOTAL_STEPS = 6;

const FEATURES = [
    {
        icon: 'mic',
        color: BrandTokens.light.accentPrimary,
        bg: '#EDE5FF',
        title: 'Voice Reflections',
        desc: 'Record thoughts while you listen',
    },
    {
        icon: 'create',
        color: '#10B981',
        bg: '#D1FAE5',
        title: 'Notes & Bookmarks',
        desc: 'Write and save your favourite verses',
    },
    {
        icon: 'folder',
        color: '#F59E0B',
        bg: '#FEF3C7',
        title: 'Folders',
        desc: 'Organise by topic, Surah, or mood',
    },
    {
        icon: 'library',
        color: '#EC4899',
        bg: '#FCE7F3',
        title: 'Library',
        desc: 'Everything in one beautiful place',
    },
];

export default function OnboardingCaptureOrganize() {
    const theme = useTheme();
    const router = useRouter();
    const { goToStep, skipOnboarding } = useOnboarding();

    const handleContinue = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        goToStep(STEP + 1);
        router.push('/onboarding/widgets' as any);
    };

    const handleSkip = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await skipOnboarding();
        router.replace('/welcome');
    };

    return (
        <WaveBackground variant="spiritual" intensity="subtle">
            <SafeAreaView style={styles.safeArea}>
                {/* Progress dots */}
                <View style={styles.progressBar}>
                    {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.dot,
                                {
                                    backgroundColor:
                                        i < STEP ? theme.colors.primary : theme.colors.surfaceVariant,
                                    width: i === STEP - 1 ? 20 : 8,
                                },
                            ]}
                        />
                    ))}
                </View>

                <View style={styles.content}>
                    {/* Header */}
                    <MotiView
                        from={{ opacity: 0, translateY: -16 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'timing', duration: 400 }}
                        style={styles.headerBlock}>
                        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
                            Capture Your Journey
                        </Text>
                        <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                            Record reflections, take notes, and keep everything organised
                        </Text>
                    </MotiView>

                    {/* Feature cards */}
                    <View style={styles.featureList}>
                        {FEATURES.map((f, index) => (
                            <MotiView
                                key={f.title}
                                from={{ opacity: 0, translateX: -24 }}
                                animate={{ opacity: 1, translateX: 0 }}
                                transition={{ type: 'spring', delay: 100 + index * 80 }}>
                                <View style={[styles.featureRow, { backgroundColor: theme.colors.surface }, Shadows.sm]}>
                                    {/* Icon */}
                                    <View style={[styles.iconBadge, {
                                        backgroundColor: theme.dark ? theme.colors.surfaceVariant : f.bg,
                                    }]}>
                                        <Ionicons
                                            name={f.icon as any}
                                            size={22}
                                            color={theme.dark ? theme.colors.primary : f.color}
                                        />
                                    </View>
                                    {/* Text */}
                                    <View style={styles.featureText}>
                                        <Text style={[styles.featureTitle, { color: theme.colors.onSurface }]}>
                                            {f.title}
                                        </Text>
                                        <Text style={[styles.featureDesc, { color: theme.colors.onSurfaceVariant }]}>
                                            {f.desc}
                                        </Text>
                                    </View>
                                    {/* Right arrow */}
                                    <Ionicons
                                        name="chevron-forward"
                                        size={16}
                                        color={theme.colors.onSurfaceVariant}
                                    />
                                </View>
                            </MotiView>
                        ))}
                    </View>
                </View>

                {/* Bottom actions */}
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'spring', delay: 600 }}
                    style={styles.bottom}>
                    <Button
                        mode="contained"
                        onPress={handleContinue}
                        style={styles.cta}
                        labelStyle={styles.ctaLabel}>
                        Continue
                    </Button>
                    <View style={{ height: Spacing.sm }} />
                    <Text
                        onPress={handleSkip}
                        style={[styles.skipText, { color: theme.colors.onSurfaceVariant }]}>
                        Maybe Later
                    </Text>
                </MotiView>
            </SafeAreaView>
        </WaveBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    progressBar: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        paddingTop: Spacing.md,
    },
    dot: { height: 8, borderRadius: 4 },
    content: {
        flex: 1,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
    },
    headerBlock: {
        marginBottom: Spacing.xl,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        textAlign: 'center',
        letterSpacing: -0.5,
        marginBottom: Spacing.sm,
    },
    subtitle: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
    featureList: { gap: Spacing.sm },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        gap: Spacing.md,
    },
    iconBadge: {
        width: 46,
        height: 46,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureText: { flex: 1 },
    featureTitle: { fontSize: 16, fontWeight: '700' },
    featureDesc: { fontSize: 13, marginTop: 2, lineHeight: 18 },
    bottom: {
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.xl,
    },
    cta: { borderRadius: BorderRadius.xl, width: '100%' },
    ctaLabel: { fontSize: 16, fontWeight: '700', paddingVertical: Spacing.xs },
    skipText: { fontSize: 14, fontWeight: '500' },
});

/**
 * Onboarding Slide 4 — "Widgets"
 * Educates users on adding QuranNotes home screen widgets
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useOnboarding } from '../../src/infrastructure/onboarding/OnboardingContext';
import { Spacing, BorderRadius, Shadows, Gradients } from '../../src/presentation/theme/DesignSystem';
import * as Haptics from 'expo-haptics';

const STEP = 4;
const TOTAL_STEPS = 6;

// Widget mockup component
const WidgetMockup = ({
    size,
    gradient,
    children,
}: {
    size: 'small' | 'medium';
    gradient: readonly [string, string, string];
    children: React.ReactNode;
}) => {
    const isSmall = size === 'small';
    return (
        <LinearGradient
            colors={gradient}
            style={[styles.widget, isSmall ? styles.widgetSmall : styles.widgetMedium]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            {children}
        </LinearGradient>
    );
};

export default function OnboardingWidgets() {
    const theme = useTheme();
    const router = useRouter();
    const { goToStep, skipOnboarding } = useOnboarding();

    const handleContinue = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        goToStep(STEP + 1);
        router.push('/onboarding/reminders');
    };

    const handleSkip = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await skipOnboarding();
        router.replace('/welcome');
    };

    return (
        <LinearGradient
            colors={theme.dark ? (['#0F1419', '#1A1F26'] as const) : Gradients.sereneSky}
            style={styles.container}>
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
                        transition={{ type: 'timing', duration: 400 }}>
                        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
                            Your Quran,{'\n'}Always Visible
                        </Text>
                        <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                            Add beautiful widgets to your home screen — verse of the day, prayer times, and your Khatma progress at a glance
                        </Text>
                    </MotiView>

                    {/* Widget mockups */}
                    <MotiView
                        from={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', delay: 200 }}
                        style={styles.widgetPreview}>

                        {/* Medium verse widget */}
                        <WidgetMockup size="medium" gradient={['#1E293B', '#1E3A8A', '#5B7FFF'] as const}>
                            <Text style={styles.wGold}>✦ VERSE OF THE DAY</Text>
                            <Text style={styles.wArabic}>حَسْبُنَا اللَّهُ</Text>
                            <Text style={styles.wTranslation}>Sufficient for us is Allah</Text>
                            <View style={styles.wFooter}>
                                <Text style={styles.wRef}>Ali Imran · 173</Text>
                                <Text style={styles.wBrand}>QuranNotes</Text>
                            </View>
                        </WidgetMockup>

                        {/* Two small widgets side by side */}
                        <View style={styles.smallRow}>
                            <WidgetMockup size="small" gradient={['#1A1B3A', '#2D1B69', '#5B3A8C'] as const}>
                                <View style={styles.wPrayerIcon}>
                                    <Ionicons name="moon-sharp" size={18} color="#C9A0DC" />
                                </View>
                                <Text style={styles.wPrayerName}>Isha</Text>
                                <Text style={styles.wPrayerTime}>20:45</Text>
                                <Text style={styles.wPrayerCountdown}>in 1h 20m</Text>
                            </WidgetMockup>

                            <WidgetMockup size="small" gradient={['#0F172A', '#1E293B', '#2D3A5F'] as const}>
                                {/* Progress ring (drawn with borders) */}
                                <View style={styles.wRingOuter}>
                                    <View style={styles.wRingInner}>
                                        <Text style={styles.wRingNum}>5</Text>
                                        <Text style={styles.wRingOf}>of 30</Text>
                                    </View>
                                </View>
                                <Text style={styles.wKhatmaLabel}>Khatma</Text>
                                <Text style={styles.wKhatmaSub}>25 remaining</Text>
                            </WidgetMockup>
                        </View>
                    </MotiView>

                    {/* How to add */}
                    <MotiView
                        from={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 400 }}
                        style={[styles.howToCard, { backgroundColor: theme.colors.surface }, Shadows.sm]}>
                        <Text style={[styles.howToTitle, { color: theme.colors.onSurface }]}>
                            💡 How to add a widget
                        </Text>
                        <Text style={[styles.howToText, { color: theme.colors.onSurfaceVariant }]}>
                            Long-press your home screen → tap{' '}
                            <Text style={{ fontWeight: '700', color: theme.colors.onSurface }}>+</Text>
                            {' '}(top left) → search{' '}
                            <Text style={{ fontWeight: '700', color: theme.colors.primary }}>QuranNotes</Text>
                        </Text>
                    </MotiView>
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
        </LinearGradient>
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
        gap: Spacing.lg,
    },
    title: {
        fontSize: 30,
        fontWeight: '800',
        textAlign: 'center',
        letterSpacing: -0.5,
        marginBottom: Spacing.sm,
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 21,
    },
    widgetPreview: { gap: Spacing.sm },
    widget: {
        borderRadius: 20,
        padding: 12,
        overflow: 'hidden',
    },
    widgetSmall: {
        flex: 1,
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    widgetMedium: {
        width: '100%',
        justifyContent: 'space-between',
        minHeight: 110,
    },
    smallRow: { flexDirection: 'row', gap: Spacing.sm },
    // Verse widget text
    wGold: { color: '#D4A853', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
    wArabic: { color: '#fff', fontSize: 20, fontWeight: '500', marginVertical: 4 },
    wTranslation: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontStyle: 'italic' },
    wFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    wRef: { color: 'rgba(255,255,255,0.5)', fontSize: 9 },
    wBrand: { color: 'rgba(255,255,255,0.4)', fontSize: 9 },
    // Prayer widget
    wPrayerIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(201,160,220,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    wPrayerName: { color: '#fff', fontSize: 13, fontWeight: '700' },
    wPrayerTime: { color: '#C9A0DC', fontSize: 16, fontWeight: '800' },
    wPrayerCountdown: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 9,
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        marginTop: 4,
        overflow: 'hidden',
    },
    // Khatma widget
    wRingOuter: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 4,
        borderColor: '#D4A853',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    wRingInner: { alignItems: 'center' },
    wRingNum: { color: '#fff', fontSize: 14, fontWeight: '800', lineHeight: 16 },
    wRingOf: { color: 'rgba(255,255,255,0.5)', fontSize: 7 },
    wKhatmaLabel: { color: '#fff', fontSize: 12, fontWeight: '700' },
    wKhatmaSub: { color: 'rgba(255,255,255,0.5)', fontSize: 9 },
    // How to card
    howToCard: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        gap: Spacing.xs,
    },
    howToTitle: { fontSize: 14, fontWeight: '700' },
    howToText: { fontSize: 13, lineHeight: 20 },
    // Bottom
    bottom: {
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.xl,
    },
    cta: { borderRadius: BorderRadius.xl, width: '100%' },
    ctaLabel: { fontSize: 16, fontWeight: '700', paddingVertical: Spacing.xs },
    skipText: { fontSize: 14, fontWeight: '500' },
});

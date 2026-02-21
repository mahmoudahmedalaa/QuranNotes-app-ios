/**
 * Onboarding Slide 4 — "Widgets"
 * Showcases both home screen AND lock screen widgets — our biggest
 * differentiator vs competing Quran apps. The lock screen section is
 * the hero marketing moment: it's what Muslim Pro built retention on.
 */
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useOnboarding } from '../../src/infrastructure/onboarding/OnboardingContext';
import { Spacing, BorderRadius, Shadows, Gradients } from '../../src/presentation/theme/DesignSystem';
import * as Haptics from 'expo-haptics';

const STEP = 4;
const TOTAL_STEPS = 6;

// ── Brand purple gradient used in all mockups ──────────────────────
const DAY_GRAD = ['#C4B5FD', '#8B5CF6', '#6D28D9'] as const;
const MED_GRAD = ['#EDE9FE', '#A78BFA', '#7C3AED'] as const;

// ── Home screen widget mockup ──────────────────────────────────────
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


const LockCircle = ({ value, total, label }: { value: number; total: number; label: string }) => (
    <View style={styles.lockCircle}>
        <View style={styles.lockArc}>
            <Text style={styles.lockArcNum}>{value}</Text>
            <Text style={styles.lockArcOf}>/{total}</Text>
        </View>
        <Text style={styles.lockCircleLabel}>{label}</Text>
    </View>
);

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

                <ScrollView
                    contentContainerStyle={[styles.content, { paddingBottom: 120 }]}
                    showsVerticalScrollIndicator={false}>

                    {/* Header */}
                    <MotiView
                        from={{ opacity: 0, translateY: -16 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'timing', duration: 400 }}>
                        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
                            Your Quran,{'\n'}Everywhere
                        </Text>
                        <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                            Beautiful widgets on your home screen and lock screen — verse of the day, prayer times, and Khatma progress, always at a glance
                        </Text>
                    </MotiView>

                    {/* ── HOME SCREEN WIDGETS ─────────────────────── */}
                    <MotiView
                        from={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', delay: 150 }}>

                        <View style={styles.sectionHeader}>
                            <Ionicons name="grid-outline" size={14} color={theme.colors.primary} />
                            <Text style={[styles.sectionLabel, { color: theme.colors.primary }]}>
                                HOME SCREEN
                            </Text>
                        </View>

                        {/* Medium verse widget */}
                        <WidgetMockup size="medium" gradient={MED_GRAD}>
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
                            <WidgetMockup size="small" gradient={DAY_GRAD}>
                                <Ionicons name="moon-sharp" size={20} color="rgba(255,255,255,0.9)" />
                                <Text style={styles.wPrayerName}>Isha</Text>
                                <Text style={styles.wPrayerTime}>20:45</Text>
                                <Text style={styles.wPrayerCountdown}>in 1h 20m</Text>
                            </WidgetMockup>

                            <WidgetMockup size="small" gradient={DAY_GRAD}>
                                <View style={styles.wRingOuter}>
                                    <View style={styles.wRingInner}>
                                        <Text style={styles.wRingNum}>12</Text>
                                        <Text style={styles.wRingOf}>/30</Text>
                                    </View>
                                </View>
                                <Text style={styles.wKhatmaLabel}>Khatma</Text>
                                <Text style={styles.wKhatmaSub}>18 remaining</Text>
                            </WidgetMockup>
                        </View>
                    </MotiView>

                    {/* ── LOCK SCREEN WIDGETS ─────────────────────── */}
                    <MotiView
                        from={{ opacity: 0, translateY: 16 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'spring', delay: 320 }}>

                        <View style={styles.sectionHeader}>
                            <Ionicons name="lock-closed-outline" size={14} color={theme.colors.primary} />
                            <Text style={[styles.sectionLabel, { color: theme.colors.primary }]}>
                                LOCK SCREEN  ·  iOS 16+
                            </Text>
                        </View>

                        {/* Lock screen mockup — dark phone-like panel */}
                        <View style={[styles.lockScreen, { backgroundColor: theme.dark ? '#0D0520' : '#1A0533' }]}>
                            {/* Fake clock */}
                            <Text style={styles.lockTime}>12:51</Text>
                            <Text style={styles.lockDate}>Friday, February 21</Text>

                            {/* Lock screen widget row */}
                            <View style={styles.lockWidgetRow}>
                                {/* Khatma circular progress */}
                                <LockCircle value={12} total={30} label="Khatma" />

                                {/* Prayer rectangular */}
                                <View style={[styles.lockRect, { flex: 1 }]}>
                                    <View style={styles.lockRectRow}>
                                        <Ionicons name="moon-sharp" size={14} color="rgba(255,255,255,0.9)" />
                                        <Text style={styles.lockRectName}>Isha</Text>
                                    </View>
                                    <Text style={styles.lockRectTime}>20:45</Text>
                                    <Text style={styles.lockRectSub}>in 1h 20m</Text>
                                </View>
                            </View>

                            {/* Verse rectangular at bottom */}
                            <View style={styles.lockRectWide}>
                                <MaterialCommunityIcons name="book-open-page-variant" size={13} color="rgba(255,255,255,0.85)" />
                                <View>
                                    <Text style={styles.lockRectWideName}>Verse of the Day</Text>
                                    <Text style={styles.lockRectWideRef}>Ali Imran · Verse 173</Text>
                                </View>
                            </View>
                        </View>

                        <Text style={[styles.lockCaption, { color: theme.colors.onSurfaceVariant }]}>
                            Your Quran reminder every time you pick up your phone
                        </Text>
                    </MotiView>

                    {/* ── HOW TO ADD ──────────────────────────────── */}
                    <MotiView
                        from={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 480 }}>
                        <View style={[styles.howToCard, { backgroundColor: theme.colors.surface }, Shadows.sm]}>
                            <Text style={[styles.howToTitle, { color: theme.colors.onSurface }]}>
                                💡 How to add a widget
                            </Text>
                            <View style={styles.howToSteps}>
                                <Text style={[styles.howToStep, { color: theme.colors.onSurfaceVariant }]}>
                                    <Text style={[styles.howToStepNum, { color: theme.colors.primary }]}>① </Text>
                                    Long-press an empty spot on your home or lock screen
                                </Text>
                                <Text style={[styles.howToStep, { color: theme.colors.onSurfaceVariant }]}>
                                    <Text style={[styles.howToStepNum, { color: theme.colors.primary }]}>② </Text>
                                    Tap the{' '}<Text style={{ fontWeight: '700', color: theme.colors.onSurface }}>+</Text>{' '}button in the top-left corner
                                </Text>
                                <Text style={[styles.howToStep, { color: theme.colors.onSurfaceVariant }]}>
                                    <Text style={[styles.howToStepNum, { color: theme.colors.primary }]}>③ </Text>
                                    Search{' '}<Text style={{ fontWeight: '700', color: theme.colors.primary }}>QuranNotes App</Text>{' '}and choose a size
                                </Text>
                            </View>
                        </View>
                    </MotiView>

                </ScrollView>

                {/* Bottom actions — float above scroll */}
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

    // ── Section labels ──
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginBottom: Spacing.xs,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.8,
    },

    // ── Home screen widget mockups ──
    widget: {
        borderRadius: 20,
        padding: 12,
        overflow: 'hidden',
        marginBottom: Spacing.sm,
    },
    widgetSmall: {
        flex: 1,
        aspectRatio: 1,
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        gap: 3,
    },
    widgetMedium: {
        width: '100%',
        justifyContent: 'space-between',
        minHeight: 110,
    },
    smallRow: { flexDirection: 'row', gap: Spacing.sm },
    wGold: { color: '#DDD6FE', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
    wArabic: { color: '#fff', fontSize: 20, fontWeight: '500', marginVertical: 4 },
    wTranslation: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontStyle: 'italic' },
    wFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    wRef: { color: 'rgba(255,255,255,0.55)', fontSize: 10 },
    wBrand: { color: 'rgba(255,255,255,0.45)', fontSize: 10 },
    wPrayerName: { color: '#fff', fontSize: 12, fontWeight: '700' },
    wPrayerTime: { color: '#DDD6FE', fontSize: 16, fontWeight: '800' },
    wPrayerCountdown: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 9,
        backgroundColor: 'rgba(255,255,255,0.12)',
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 6,
        overflow: 'hidden',
    },
    wRingOuter: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 3,
    },
    wRingInner: { flexDirection: 'row', alignItems: 'baseline', gap: 1 },
    wRingNum: { color: '#fff', fontSize: 14, fontWeight: '800', lineHeight: 16 },
    wRingOf: { color: 'rgba(255,255,255,0.6)', fontSize: 8 },
    wKhatmaLabel: { color: '#fff', fontSize: 11, fontWeight: '700' },
    wKhatmaSub: { color: 'rgba(255,255,255,0.6)', fontSize: 9 },

    // ── Lock screen mockup ──
    lockScreen: {
        borderRadius: 24,
        padding: 20,
        alignItems: 'center',
        gap: 6,
        overflow: 'hidden',
    },
    lockTime: {
        color: '#FFFFFF',
        fontSize: 52,
        fontWeight: '300',
        letterSpacing: -2,
        opacity: 0.95,
    },
    lockDate: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        fontWeight: '400',
        marginBottom: 12,
    },
    lockWidgetRow: {
        flexDirection: 'row',
        gap: 10,
        width: '100%',
        alignItems: 'center',
    },
    lockCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 1,
    },
    lockArc: { flexDirection: 'row', alignItems: 'baseline' },
    lockArcNum: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', opacity: 0.95 },
    lockArcOf: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
    lockCircleLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 9, fontWeight: '600', letterSpacing: 0.3 },
    lockRect: {
        backgroundColor: 'rgba(255,255,255,0.10)',
        borderRadius: 14,
        padding: 10,
        justifyContent: 'center',
        gap: 2,
    },
    lockRectRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    lockRectName: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' },
    lockRectTime: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
    lockRectSub: { color: 'rgba(255,255,255,0.55)', fontSize: 10 },
    lockRectWide: {
        flexDirection: 'row',
        gap: 8,
        backgroundColor: 'rgba(255,255,255,0.10)',
        borderRadius: 13,
        paddingHorizontal: 12,
        paddingVertical: 8,
        width: '100%',
        alignItems: 'center',
    },
    lockRectWideName: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '600' },
    lockRectWideRef: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
    lockCaption: {
        textAlign: 'center',
        fontSize: 12,
        marginTop: 6,
        fontStyle: 'italic',
    },

    // ── How to card ──
    howToCard: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        gap: Spacing.xs,
    },
    howToTitle: { fontSize: 16, fontWeight: '700' },
    howToSteps: { gap: 10, marginTop: 4 },
    howToStep: { fontSize: 15, lineHeight: 22 },
    howToStepNum: { fontWeight: '800' },

    // ── Bottom ──
    bottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.xl,
        paddingTop: Spacing.md,
    },
    cta: { borderRadius: BorderRadius.xl, width: '100%' },
    ctaLabel: { fontSize: 16, fontWeight: '700', paddingVertical: Spacing.xs },
    skipText: { fontSize: 14, fontWeight: '500' },
});

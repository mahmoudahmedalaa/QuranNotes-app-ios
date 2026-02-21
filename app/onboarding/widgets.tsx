/**
 * Onboarding Slide 4 — "Widgets"
 * Home screen + Lock screen widgets — clean, readable, premium.
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
import { Spacing, BorderRadius, Shadows } from '../../src/presentation/theme/DesignSystem';
import * as Haptics from 'expo-haptics';

const STEP = 4;
const TOTAL_STEPS = 6;

// ── Widget palette — each widget has its own distinct identity ──────
// Verse: deep violet (brand purple)
const VERSE_GRAD = ['#3B0764', '#6D28D9'] as const;
// Prayer: deep navy — distinct from verse
const PRAYER_GRAD = ['#0F172A', '#1E3A8A'] as const;
// Khatma: warm dark chocolate-gold — matches the gold ring identity
const KHATMA_GRAD = ['#1C0A02', '#3B1A06'] as const;

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

    const bg = theme.dark
        ? (['#0F1419', '#1A1F26'] as const)
        : (['#F5F3FF', '#EDE9FE'] as const);

    return (
        <LinearGradient colors={bg} style={styles.container}>
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
                    contentContainerStyle={[styles.content, { paddingBottom: 130 }]}
                    showsVerticalScrollIndicator={false}>

                    {/* ── Header ──────────────────────────────────── */}
                    <MotiView
                        from={{ opacity: 0, translateY: -16 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'timing', duration: 380 }}>
                        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
                            Your Quran,{'\n'}Always Within Reach
                        </Text>
                        <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                            Add widgets to your home screen and lock screen — verse of the day, prayer times, and Khatma progress at a glance
                        </Text>
                    </MotiView>

                    {/* ── HOME SCREEN SECTION ──────────────────────── */}
                    <MotiView
                        from={{ opacity: 0, translateY: 16 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'spring', delay: 150 }}>

                        <View style={styles.sectionRow}>
                            <Ionicons name="grid-outline" size={13} color={theme.colors.primary} />
                            <Text style={[styles.sectionLabel, { color: theme.colors.primary }]}>
                                HOME SCREEN
                            </Text>
                        </View>

                        {/* Verse of the Day — medium widget */}
                        <LinearGradient colors={VERSE_GRAD} style={styles.widgetMedium}>
                            <Text style={styles.wEyebrow}>✦  VERSE OF THE DAY</Text>
                            <Text style={styles.wArabic}>حَسْبُنَا اللَّهُ</Text>
                            <Text style={styles.wTranslation}>Sufficient for us is Allah</Text>
                            <View style={styles.wFooter}>
                                <Text style={styles.wRef}>Ali Imran · 173</Text>
                                <Text style={styles.wBrand}>QuranNotes</Text>
                            </View>
                        </LinearGradient>

                        {/* Prayer + Khatma — two small widgets */}
                        <View style={styles.smallRow}>
                            {/* Prayer */}
                            <LinearGradient colors={PRAYER_GRAD} style={styles.widgetSmall}>
                                <Ionicons name="moon-sharp" size={22} color="#93C5FD" />
                                <Text style={styles.wPrayerName}>Isha</Text>
                                <Text style={styles.wPrayerTime}>20:45</Text>
                                <Text style={styles.wPrayerSub}>in 1h 20m</Text>
                            </LinearGradient>

                            {/* Khatma */}
                            <LinearGradient colors={KHATMA_GRAD} style={styles.widgetSmall}>
                                <View style={styles.wRing}>
                                    <Text style={styles.wRingNum}>12</Text>
                                    <Text style={styles.wRingDenom}>/30</Text>
                                </View>
                                <Text style={styles.wKhatmaLabel}>Khatma</Text>
                                <Text style={styles.wKhatmaSub}>18 remaining</Text>
                            </LinearGradient>
                        </View>
                    </MotiView>

                    {/* ── LOCK SCREEN SECTION ──────────────────────── */}
                    <MotiView
                        from={{ opacity: 0, translateY: 16 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'spring', delay: 320 }}>

                        <View style={styles.sectionRow}>
                            <Ionicons name="lock-closed-outline" size={13} color={theme.colors.primary} />
                            <Text style={[styles.sectionLabel, { color: theme.colors.primary }]}>
                                LOCK SCREEN  ·  iOS 16+
                            </Text>
                        </View>

                        {/* Lock screen phone mockup */}
                        <View style={styles.lockPhone}>
                            <Text style={styles.lockClock}>12:51</Text>
                            <Text style={styles.lockDate}>Friday, 21 February</Text>

                            <View style={styles.lockWidgetRow}>
                                {/* Khatma circle */}
                                <View style={styles.lockCircle}>
                                    <Text style={styles.lockCircleNum}>12</Text>
                                    <Text style={styles.lockCircleDenom}>/30</Text>
                                    <Text style={styles.lockCircleLabel}>Khatma</Text>
                                </View>

                                {/* Prayer rectangle */}
                                <View style={[styles.lockRect, { flex: 1 }]}>
                                    <View style={styles.lockRectRow}>
                                        <Ionicons name="moon-sharp" size={12} color="rgba(255,255,255,0.85)" />
                                        <Text style={styles.lockRectPrayer}>Isha</Text>
                                    </View>
                                    <Text style={styles.lockRectTime}>20:45</Text>
                                    <Text style={styles.lockRectSub}>in 1h 20m</Text>
                                </View>
                            </View>

                            {/* Verse rectangle */}
                            <View style={styles.lockRectWide}>
                                <MaterialCommunityIcons name="book-open-page-variant" size={13} color="rgba(255,255,255,0.8)" />
                                <View>
                                    <Text style={styles.lockRectWideSub}>Verse of the Day</Text>
                                    <Text style={styles.lockRectWideTitle}>Ali Imran · 173</Text>
                                </View>
                            </View>
                        </View>

                        <Text style={[styles.lockCaption, { color: theme.colors.onSurfaceVariant }]}>
                            Your Quran reminder, every time you pick up your phone
                        </Text>
                    </MotiView>

                    {/* ── HOW TO ADD ───────────────────────────────── */}
                    <MotiView
                        from={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 460 }}>
                        <View style={[styles.howTo, { backgroundColor: theme.colors.surface }, Shadows.sm]}>
                            <Text style={[styles.howToTitle, { color: theme.colors.onSurface }]}>
                                💡 How to add a widget
                            </Text>
                            <Text style={[styles.howToStep, { color: theme.colors.onSurfaceVariant }]}>
                                <Text style={{ fontWeight: '800', color: theme.colors.primary }}>① </Text>
                                Long-press an empty spot on your home or lock screen
                            </Text>
                            <Text style={[styles.howToStep, { color: theme.colors.onSurfaceVariant }]}>
                                <Text style={{ fontWeight: '800', color: theme.colors.primary }}>② </Text>
                                Tap <Text style={{ fontWeight: '800', color: theme.colors.onSurface }}>+</Text> in the top-left corner
                            </Text>
                            <Text style={[styles.howToStep, { color: theme.colors.onSurfaceVariant }]}>
                                <Text style={{ fontWeight: '800', color: theme.colors.primary }}>③ </Text>
                                Search <Text style={{ fontWeight: '700', color: theme.colors.primary }}>QuranNotes App</Text> and choose a size
                            </Text>
                        </View>
                    </MotiView>
                </ScrollView>

                {/* ── Bottom CTA ───────────────────────────────────── */}
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'spring', delay: 580 }}
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

    // ── Header ──
    title: {
        fontSize: 28,
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

    // ── Section label ──
    sectionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginBottom: 10,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.8,
    },

    // ── Home screen: medium widget ──
    widgetMedium: {
        borderRadius: 20,
        padding: 14,
        minHeight: 108,
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    wEyebrow: {
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 1,
        color: '#DDD6FE',
    },
    wArabic: {
        fontSize: 20,
        fontWeight: '500',
        color: '#FFFFFF',
        marginVertical: 4,
    },
    wTranslation: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.82)',
        fontStyle: 'italic',
    },
    wFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    wRef: { color: 'rgba(255,255,255,0.6)', fontSize: 10 },
    wBrand: { color: 'rgba(255,255,255,0.45)', fontSize: 10 },

    // ── Home screen: small widget row ──
    smallRow: {
        flexDirection: 'row',
        gap: 10,
    },
    widgetSmall: {
        flex: 1,
        borderRadius: 20,
        padding: 12,
        aspectRatio: 1,
        justifyContent: 'flex-start',
        gap: 3,
    },

    // Prayer small
    wPrayerName: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginTop: 4 },
    wPrayerTime: { color: '#93C5FD', fontSize: 17, fontWeight: '800' },
    wPrayerSub: {
        color: 'rgba(255,255,255,0.65)',
        fontSize: 10,
        backgroundColor: 'rgba(255,255,255,0.12)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        overflow: 'hidden',
        alignSelf: 'flex-start',
        marginTop: 2,
    },

    // Khatma small
    wRing: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 1,
        borderWidth: 2.5,
        borderColor: '#D4A853',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        marginBottom: 4,
    },
    wRingNum: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
    wRingDenom: { color: 'rgba(255,255,255,0.5)', fontSize: 8 },
    wKhatmaLabel: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
    wKhatmaSub: { color: '#D4A853', fontSize: 10 },

    // ── Lock screen mockup ──
    lockPhone: {
        backgroundColor: '#100020',
        borderRadius: 22,
        padding: 18,
        alignItems: 'center',
        gap: 4,
    },
    lockClock: {
        color: '#FFFFFF',
        fontSize: 48,
        fontWeight: '200',
        letterSpacing: -2,
    },
    lockDate: {
        color: 'rgba(255,255,255,0.55)',
        fontSize: 13,
        marginBottom: 12,
    },
    lockWidgetRow: {
        flexDirection: 'row',
        gap: 8,
        width: '100%',
        alignItems: 'center',
    },
    lockCircle: {
        width: 68,
        height: 68,
        borderRadius: 34,
        borderWidth: 2.5,
        borderColor: 'rgba(255,255,255,0.28)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    lockCircleNum: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
    lockCircleDenom: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
    lockCircleLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '600' },
    lockRect: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 13,
        padding: 10,
        justifyContent: 'center',
        gap: 2,
    },
    lockRectRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    lockRectPrayer: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' },
    lockRectTime: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
    lockRectSub: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
    lockRectWide: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        width: '100%',
    },
    lockRectWideSub: { color: 'rgba(255,255,255,0.55)', fontSize: 10 },
    lockRectWideTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
    lockCaption: {
        textAlign: 'center',
        fontSize: 12,
        fontStyle: 'italic',
        marginTop: 6,
    },

    // ── How to card ──
    howTo: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        gap: 10,
    },
    howToTitle: { fontSize: 15, fontWeight: '700' },
    howToStep: { fontSize: 14, lineHeight: 21 },

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

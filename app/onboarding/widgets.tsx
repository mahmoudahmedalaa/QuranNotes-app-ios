/**
 * Onboarding Slide 4 — "Widgets"
 *
 * Design principles:
 * - Single brand family: rich violet (#1E0A3C → #6D28D9) as the unifying tone
 * - Widget differentiation through *accent* color, not wildly different backgrounds
 *   Prayer: cool blue-violet accent | Khatma: warm gold accent | Verse: white/light accent
 * - Lock screen section mirrors actual iOS look (dark frosted, monochrome)
 * - Generous whitespace, clear hierarchy, 8pt grid throughout
 */
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useOnboarding } from '../../src/features/onboarding/infrastructure/OnboardingContext';
import { Spacing, BorderRadius } from '../../src/core/theme/DesignSystem';
import * as Haptics from 'expo-haptics';

const STEP = 4;
const TOTAL_STEPS = 6;

// ── Brand palette — one family, accent differentiation ─────────────────
// Dark violet base is on-brand and legible for all text colours below
const WIDGET_BG = ['#2D1665', '#1A0940'] as const;   // Unified brand dark violet
const VERSE_ACCENT = '#DDD6FE';  // Soft lavender (primaryContainer-ish)
const PRAYER_ACCENT = '#93C5FD';  // Cool sky blue (calm, prayer/night)
const KHATMA_ACCENT = '#FCD34D';  // Warm gold (Khatma gold ring identity)

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

    const pageBg = theme.dark
        ? (['#0B0613', '#130A2E'] as const)
        : (['#F5F3FF', '#EDE9FE'] as const);

    return (
        <LinearGradient colors={pageBg} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>

                {/* Progress dots */}
                <View style={styles.progressBar}>
                    {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.dot,
                                {
                                    backgroundColor: i === STEP - 1
                                        ? theme.colors.primary
                                        : theme.colors.outlineVariant,
                                    width: i === STEP - 1 ? 20 : 8,
                                },
                            ]}
                        />
                    ))}
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── Headline ────────────────────────────── */}
                    <MotiView
                        from={{ opacity: 0, translateY: 12 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'spring', delay: 80 }}
                    >
                        <Text style={[styles.headline, { color: theme.colors.onBackground }]}>
                            Your Quran,{'\n'}
                            <Text style={{ color: theme.colors.primary }}>Always Within Reach</Text>
                        </Text>
                        <Text style={[styles.subheadline, { color: theme.colors.onSurfaceVariant }]}>
                            Glanceable widgets for your home screen and lock screen
                        </Text>
                    </MotiView>

                    {/* ── HOME SCREEN widgets ─────────────────── */}
                    <MotiView
                        from={{ opacity: 0, translateY: 16 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'spring', delay: 160 }}
                        style={styles.section}
                    >
                        <View style={styles.sectionLabel}>
                            <Ionicons name="phone-portrait-outline" size={13} color={theme.colors.primary} />
                            <Text style={[styles.sectionLabelText, { color: theme.colors.primary }]}>
                                HOME SCREEN
                            </Text>
                        </View>

                        {/* Verse of the Day — medium widget */}
                        <LinearGradient colors={WIDGET_BG} style={styles.widgetMedium}>
                            <Text style={[styles.wEyebrow, { color: VERSE_ACCENT }]}>✦  VERSE OF THE DAY</Text>
                            <Text style={[styles.wArabic, { color: '#FFFFFF' }]}>حَسْبُنَا ٱللَّهُ</Text>
                            <Text style={[styles.wTranslation, { color: 'rgba(255,255,255,0.80)' }]}>
                                Sufficient for us is Allah
                            </Text>
                            <View style={styles.wFooter}>
                                <Text style={[styles.wRef, { color: VERSE_ACCENT }]}>Ali Imran · 173</Text>
                                <Text style={[styles.wBrand, { color: 'rgba(255,255,255,0.40)' }]}>QuranNotes</Text>
                            </View>
                        </LinearGradient>

                        {/* Prayer + Khatma — two small widgets */}
                        <View style={styles.smallRow}>
                            {/* Prayer */}
                            <LinearGradient colors={WIDGET_BG} style={styles.widgetSmall}>
                                <Ionicons name="moon-sharp" size={20} color={PRAYER_ACCENT} />
                                <Text style={[styles.wPrayerName, { color: '#FFFFFF' }]}>Isha</Text>
                                <Text style={[styles.wPrayerTime, { color: PRAYER_ACCENT }]}>20:45</Text>
                                <Text style={[styles.wPrayerSub, { color: 'rgba(255,255,255,0.55)' }]}>in 1h 20m</Text>
                            </LinearGradient>

                            {/* Khatma */}
                            <LinearGradient colors={WIDGET_BG} style={styles.widgetSmall}>
                                <View style={[styles.wRing, { borderColor: KHATMA_ACCENT }]}>
                                    <Text style={[styles.wRingNum, { color: KHATMA_ACCENT }]}>12</Text>
                                    <Text style={[styles.wRingDenom, { color: 'rgba(255,255,255,0.55)' }]}>/30</Text>
                                </View>
                                <Text style={[styles.wKhatmaLabel, { color: '#FFFFFF' }]}>Khatma</Text>
                                <Text style={[styles.wKhatmaSub, { color: 'rgba(255,255,255,0.55)' }]}>18 remaining</Text>
                            </LinearGradient>
                        </View>
                    </MotiView>

                    {/* ── LOCK SCREEN widgets ─────────────────── */}
                    <MotiView
                        from={{ opacity: 0, translateY: 16 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'spring', delay: 260 }}
                        style={styles.section}
                    >
                        <View style={styles.sectionLabel}>
                            <Ionicons name="lock-closed-outline" size={13} color={theme.colors.primary} />
                            <Text style={[styles.sectionLabelText, { color: theme.colors.primary }]}>
                                LOCK SCREEN · iOS 16+
                            </Text>
                        </View>

                        {/* iOS Lock screen mock */}
                        <View style={styles.lockMock}>
                            {/* Clock */}
                            <Text style={styles.lockTime}>12:51</Text>
                            <Text style={styles.lockDate}>Friday, 21 February</Text>

                            {/* Circular + Rectangular widget row */}
                            <View style={styles.lockWidgetRow}>
                                {/* Circular — Khatma */}
                                <View style={styles.lockCircle}>
                                    <Text style={styles.lockCircleNum}>12</Text>
                                    <Text style={styles.lockCircleSub}>/30</Text>
                                </View>

                                {/* Rectangular — Prayer */}
                                <View style={styles.lockRect}>
                                    <Ionicons name="moon-sharp" size={12} color="rgba(255,255,255,0.7)" />
                                    <Text style={styles.lockRectTitle}>Isha  20:45</Text>
                                    <Text style={styles.lockRectSub}>in 1h 20m</Text>
                                </View>
                            </View>

                            {/* Full-width rect — Verse */}
                            <View style={styles.lockVerseRect}>
                                <Text style={styles.lockVerseTrans}>Sufficient for us is Allah, and He is the best guardian.</Text>
                                <Text style={styles.lockVerseRef}>— Ali Imran · 173</Text>
                            </View>

                            <Text style={[styles.lockCaption, { color: 'rgba(255,255,255,0.55)' }]}>
                                Your Quran reminder, every time you pick up your phone
                            </Text>
                        </View>
                    </MotiView>
                </ScrollView>

                {/* Bottom actions */}
                <View style={styles.bottom}>
                    <Button
                        mode="contained"
                        onPress={handleContinue}
                        style={styles.cta}
                        labelStyle={styles.ctaLabel}
                    >
                        Continue
                    </Button>
                    <Text style={[styles.howToTip, { color: theme.colors.onSurfaceVariant }]}>
                        How to add a widget: long-press your home screen → + → QuranNotes
                    </Text>
                    <Text
                        style={[styles.skipText, { color: theme.colors.onSurfaceVariant }]}
                        onPress={handleSkip}
                    >
                        Maybe Later
                    </Text>
                </View>
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
        paddingBottom: Spacing.xs,
    },
    dot: { height: 8, borderRadius: 4 },

    scrollContent: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.lg,
        gap: Spacing.lg,
    },

    // ── Header ──
    headline: {
        fontSize: 30,
        fontWeight: '800',
        letterSpacing: -0.5,
        lineHeight: 36,
        marginTop: Spacing.sm,
    },
    subheadline: {
        fontSize: 15,
        lineHeight: 22,
        marginTop: Spacing.sm,
    },

    // ── Section ──
    section: { gap: 10 },
    sectionLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginBottom: 2,
    },
    sectionLabelText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.8,
    },

    // ── Home screen widgets ──
    widgetMedium: {
        borderRadius: BorderRadius.xl,
        padding: 14,
        gap: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    wEyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
    wArabic: { fontSize: 22, fontWeight: '600', textAlign: 'right', lineHeight: 32, marginTop: 2 },
    wTranslation: { fontSize: 12, lineHeight: 18, fontStyle: 'italic' },
    wFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    wRef: { fontSize: 10, fontWeight: '700' },
    wBrand: { fontSize: 10 },

    smallRow: { flexDirection: 'row', gap: 10 },
    widgetSmall: {
        flex: 1,
        borderRadius: BorderRadius.xl,
        padding: 12,
        gap: 2,
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'flex-start',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    wPrayerName: { fontSize: 13, fontWeight: '700', marginTop: 4 },
    wPrayerTime: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
    wPrayerSub: { fontSize: 10 },

    wRing: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 2.5,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 1,
    },
    wRingNum: { fontSize: 13, fontWeight: '800' },
    wRingDenom: { fontSize: 9, fontWeight: '500', marginTop: 2 },
    wKhatmaLabel: { fontSize: 13, fontWeight: '700', marginTop: 4 },
    wKhatmaSub: { fontSize: 10 },

    // ── Lock screen mock ──
    lockMock: {
        backgroundColor: '#1A1A2E',
        borderRadius: BorderRadius.xl,
        padding: 20,
        alignItems: 'center',
        gap: 6,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
    },
    lockTime: {
        color: '#FFFFFF',
        fontSize: 44,
        fontWeight: '200',
        letterSpacing: -1,
        lineHeight: 48,
    },
    lockDate: {
        color: 'rgba(255,255,255,0.65)',
        fontSize: 13,
        fontWeight: '400',
        marginBottom: 4,
    },
    lockWidgetRow: {
        flexDirection: 'row',
        gap: 10,
        width: '100%',
    },
    lockCircle: {
        width: 62,
        height: 62,
        borderRadius: 31,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    lockCircleNum: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', lineHeight: 20 },
    lockCircleSub: { color: 'rgba(255,255,255,0.55)', fontSize: 9, lineHeight: 11 },
    lockRect: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 14,
        padding: 10,
        gap: 1,
    },
    lockRectTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    lockRectSub: { color: 'rgba(255,255,255,0.55)', fontSize: 11 },
    lockVerseRect: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 14,
        padding: 10,
        gap: 3,
    },
    lockVerseTrans: {
        color: '#FFFFFF',
        fontSize: 12,
        lineHeight: 17,
    },
    lockVerseRef: {
        color: 'rgba(255,255,255,0.55)',
        fontSize: 10,
        fontWeight: '600',
    },
    lockCaption: {
        fontSize: 11,
        textAlign: 'center',
        lineHeight: 16,
        marginTop: 4,
    },

    // ── Bottom ──
    bottom: {
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.xl,
        gap: Spacing.xs,
    },
    cta: { borderRadius: BorderRadius.xl, width: '100%' },
    ctaLabel: { fontSize: 16, fontWeight: '700', paddingVertical: Spacing.xs },
    howToTip: {
        fontSize: 12,
        textAlign: 'center',
        paddingHorizontal: Spacing.md,
        lineHeight: 18,
        marginTop: 4,
    },
    skipText: { fontSize: 14, fontWeight: '500', paddingVertical: Spacing.sm },
});

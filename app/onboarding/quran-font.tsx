/**
 * Onboarding Slide — "Choose Your Quran Font"
 *
 * Premium carousel-style font picker with large live previews.
 * Each font card shows a full bismillah rendering so users can
 * instantly compare readability and aesthetics.
 */
import React, { useState, useRef, useCallback } from 'react';
import {
    View, StyleSheet, Pressable, ScrollView, Dimensions, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { Text, useTheme, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useOnboarding } from '../../src/features/onboarding/infrastructure/OnboardingContext';
import { useSettings } from '../../src/features/settings/infrastructure/SettingsContext';
import { QURAN_FONT_OPTIONS, getQuranFontFamily } from '../../src/core/theme/QuranFonts';
import type { QuranFontId } from '../../src/core/theme/QuranFonts';
import { LinearGradient } from 'expo-linear-gradient';
import { Spacing, BorderRadius, Shadows, BrandTokens, Gradients } from '../../src/core/theme/DesignSystem';
import * as Haptics from 'expo-haptics';

const STEP = 3;
const TOTAL_STEPS = 7;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - Spacing.lg * 2;
const CARD_GAP = Spacing.md;

const PREVIEW_VERSE = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ';
const PREVIEW_TRANSLATION = 'In the name of Allah, the Most Gracious, the Most Merciful';

/** Accent colors for each font card — unique per font for visual variety */
const FONT_ACCENTS: Record<string, { gradient: [string, string]; badge: string }> = {
    system: { gradient: ['#475569', '#334155'], badge: '🔤' },
    kfgqpc: { gradient: ['#6246EA', '#4B2FD4'], badge: '📜' },
    scheherazade: { gradient: ['#059669', '#047857'], badge: '✨' },
    amiri: { gradient: ['#B45309', '#92400E'], badge: '🖋' },
    noto: { gradient: ['#2563EB', '#1D4ED8'], badge: '📱' },
    lateef: { gradient: ['#7C3AED', '#6D28D9'], badge: '🪶' },
};

export default function OnboardingQuranFont() {
    const theme = useTheme();
    const router = useRouter();
    const { goToStep, skipOnboarding } = useOnboarding();
    const { settings, updateSettings } = useSettings();
    const scrollRef = useRef<ScrollView>(null);
    const isDark = theme.dark;

    const [selectedFont, setSelectedFont] = useState<QuranFontId>(
        (settings.quranFont as QuranFontId) || 'kfgqpc'
    );
    const [activeIndex, setActiveIndex] = useState(
        Math.max(0, QURAN_FONT_OPTIONS.findIndex(f => f.id === selectedFont))
    );

    const handleFontSelect = useCallback((fontId: QuranFontId) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedFont(fontId);
        updateSettings({ quranFont: fontId });
    }, [updateSettings]);

    const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offset = e.nativeEvent.contentOffset.x;
        const index = Math.round(offset / (CARD_WIDTH + CARD_GAP));
        if (index !== activeIndex && index >= 0 && index < QURAN_FONT_OPTIONS.length) {
            setActiveIndex(index);
            handleFontSelect(QURAN_FONT_OPTIONS[index].id);
        }
    }, [activeIndex, handleFontSelect]);

    const handleContinue = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        goToStep(STEP + 1);
        router.push('/onboarding/record');
    };

    const handleSkip = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await skipOnboarding();
        router.replace('/welcome');
    };

    return (
        <LinearGradient colors={theme.dark ? (['#0F1419', '#1A1F26'] as const) : Gradients.sereneSky} style={{ flex: 1 }}>
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

                {/* Title */}
                <MotiView
                    from={{ opacity: 0, translateY: -15 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 500 }}>
                    <View style={styles.titleSection}>
                        <MaterialCommunityIcons
                            name="format-text"
                            size={28}
                            color={theme.colors.primary}
                        />
                        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
                            Choose Your Script
                        </Text>
                        <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                            Swipe to compare • tap to select
                        </Text>
                    </View>
                </MotiView>

                {/* Font Carousel */}
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'spring', damping: 18, delay: 200 }}
                    style={styles.carouselContainer}
                >
                    <ScrollView
                        ref={scrollRef}
                        horizontal
                        pagingEnabled={false}
                        snapToInterval={CARD_WIDTH + CARD_GAP}
                        decelerationRate="fast"
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.carouselContent}
                        onMomentumScrollEnd={handleScroll}
                    >
                        {QURAN_FONT_OPTIONS.map((font, index) => {
                            const isSelected = font.id === selectedFont;
                            const accent = FONT_ACCENTS[font.id] || FONT_ACCENTS.kfgqpc;

                            return (
                                <Pressable
                                    key={font.id}
                                    onPress={() => handleFontSelect(font.id)}
                                    style={({ pressed }) => [
                                        styles.fontCard,
                                        {
                                            width: CARD_WIDTH,
                                            backgroundColor: isDark
                                                ? 'rgba(255,255,255,0.06)'
                                                : '#FFFFFF',
                                            borderColor: isSelected
                                                ? theme.colors.primary
                                                : isDark
                                                    ? 'rgba(255,255,255,0.1)'
                                                    : 'rgba(0,0,0,0.06)',
                                            borderWidth: isSelected ? 2 : 1,
                                        },
                                        Shadows.md,
                                        pressed && { transform: [{ scale: 0.98 }] },
                                    ]}
                                >
                                    {/* Font name header with accent gradient */}
                                    <View style={styles.cardHeader}>
                                        <View style={styles.cardTitleRow}>
                                            <Text style={styles.fontBadge}>{accent.badge}</Text>
                                            <View style={styles.cardTitleText}>
                                                <Text
                                                    style={[
                                                        styles.fontName,
                                                        {
                                                            color: isSelected
                                                                ? theme.colors.primary
                                                                : theme.colors.onSurface,
                                                        },
                                                    ]}
                                                    numberOfLines={1}
                                                >
                                                    {font.name}
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.fontDescription,
                                                        { color: theme.colors.onSurfaceVariant },
                                                    ]}
                                                    numberOfLines={1}
                                                >
                                                    {font.description}
                                                </Text>
                                            </View>
                                            {isSelected && (
                                                <View style={[styles.selectedBadge, { backgroundColor: theme.colors.primary }]}>
                                                    <Ionicons name="checkmark" size={14} color="#fff" />
                                                </View>
                                            )}
                                        </View>
                                    </View>

                                    {/* Large Arabic preview */}
                                    <View style={[
                                        styles.previewArea,
                                        {
                                            backgroundColor: isDark
                                                ? 'rgba(255,255,255,0.03)'
                                                : 'rgba(98,70,234,0.03)',
                                        },
                                    ]}>
                                        <Text
                                            style={[
                                                styles.previewArabic,
                                                {
                                                    color: theme.colors.onSurface,
                                                    fontFamily: getQuranFontFamily(font.id),
                                                },
                                            ]}
                                        >
                                            {PREVIEW_VERSE}
                                        </Text>
                                    </View>

                                    {/* Translation */}
                                    <Text style={[styles.previewTranslation, { color: theme.colors.onSurfaceVariant }]}>
                                        {PREVIEW_TRANSLATION}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>

                    {/* Pagination dots */}
                    <View style={styles.paginationDots}>
                        {QURAN_FONT_OPTIONS.map((font, i) => (
                            <View
                                key={font.id}
                                style={[
                                    styles.pageDot,
                                    {
                                        backgroundColor: i === activeIndex
                                            ? theme.colors.primary
                                            : isDark
                                                ? 'rgba(255,255,255,0.2)'
                                                : 'rgba(0,0,0,0.15)',
                                        width: i === activeIndex ? 20 : 8,
                                    },
                                ]}
                            />
                        ))}
                    </View>
                </MotiView>

                {/* Bottom actions */}
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 400, delay: 400 }}
                    style={styles.bottom}
                >
                    <Button
                        mode="contained"
                        onPress={handleContinue}
                        style={styles.cta}
                        labelStyle={styles.ctaLabel}>
                        Continue
                    </Button>
                    <Pressable onPress={handleSkip} style={styles.skipBtn}>
                        <Text style={[styles.skipText, { color: theme.colors.onSurfaceVariant }]}>
                            Maybe Later
                        </Text>
                    </Pressable>
                    <Text style={[styles.settingsTip, { color: theme.colors.onSurfaceVariant }]}>
                        You can change this anytime in Settings → Reading
                    </Text>
                </MotiView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, justifyContent: 'space-between' },
    progressBar: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.xs,
    },
    dot: { height: 8, borderRadius: 4 },
    titleSection: {
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.sm,
        gap: 6,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        letterSpacing: -0.3,
        marginTop: 4,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
        opacity: 0.8,
    },

    // ── Carousel ──
    carouselContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    carouselContent: {
        paddingHorizontal: Spacing.lg,
        gap: CARD_GAP,
        alignItems: 'center',
    },
    fontCard: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        gap: Spacing.md,
        marginRight: 0,
    },
    cardHeader: {
        gap: 4,
    },
    cardTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    fontBadge: {
        fontSize: 20,
    },
    cardTitleText: {
        flex: 1,
        gap: 2,
    },
    fontName: {
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: -0.2,
    },
    fontDescription: {
        fontSize: 12,
        fontWeight: '400',
    },
    selectedBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewArea: {
        borderRadius: BorderRadius.lg,
        paddingVertical: Spacing.xl,
        paddingHorizontal: Spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 120,
    },
    previewArabic: {
        fontSize: 28,
        textAlign: 'center',
        lineHeight: 50,
        writingDirection: 'rtl',
    },
    previewTranslation: {
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
        fontStyle: 'italic',
        opacity: 0.7,
    },

    // ── Pagination ──
    paginationDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        marginTop: Spacing.md,
        marginBottom: Spacing.lg,
    },
    pageDot: {
        height: 6,
        borderRadius: 3,
    },

    // ── Bottom ──
    bottom: {
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.xl,
        gap: Spacing.sm,
    },
    cta: { borderRadius: BorderRadius.xl, width: '100%' },
    ctaLabel: { fontSize: 16, fontWeight: '700', paddingVertical: Spacing.xs },
    skipBtn: { paddingVertical: Spacing.sm },
    skipText: { fontSize: 14, fontWeight: '500' },
    settingsTip: { fontSize: 11, textAlign: 'center', opacity: 0.65, paddingBottom: 4 },
});

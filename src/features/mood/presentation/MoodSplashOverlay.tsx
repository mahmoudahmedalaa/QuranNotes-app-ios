/**
 * MoodSplashOverlay — Full-screen mood transition before Tadabbur session.
 *
 * Theme-aware: uses BrandTokens + VioletPalette to match dark/light mode.
 * The mood icon is the hero — large, centered, breathing gently.
 * Auto-advances after 10 seconds → Session begins.
 */
import React, { useEffect, useRef, useMemo } from 'react';
import {
    View,
    StyleSheet,
    Animated as RNAnimated,
    Easing as RNEasing,
    Pressable,
    Modal,
    Dimensions,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { MotiView } from 'moti';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

import { MoodType, MOOD_CONFIGS } from '../../../core/domain/entities/Mood';
import { BrandTokens, VioletPalette } from '../../../core/theme/DesignSystem';

const SPLASH_DURATION = 10000;
const { width: SCREEN_W } = Dimensions.get('window');

interface MoodSplashOverlayProps {
    mood: MoodType;
    onComplete: () => void;
    onCancel: () => void;
}

function hexToRgba(hex: string, opacity: number): string {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${opacity})`;
}

export const MoodSplashOverlay: React.FC<MoodSplashOverlayProps> = ({
    mood,
    onComplete,
    onCancel,
}) => {
    const theme = useTheme();
    const isDark = theme.dark;
    const config = MOOD_CONFIGS[mood];
    const moodColor = config.color;
    const tokens = isDark ? BrandTokens.dark : BrandTokens.light;

    // ── Theme-aware colours ─────────────────────────────────────────────
    const themeColors = useMemo(() => {
        if (isDark) {
            return {
                // Dark: deep space → zinc black
                gradient: [
                    VioletPalette.deepSpace,   // #0F0A2A — subtle violet tint
                    BrandTokens.dark.bgMain,   // #09090B — Zinc 950
                    BrandTokens.dark.bgMain,
                ] as readonly [string, string, ...string[]],
                labelColor: BrandTokens.dark.textPrimary, // #FAFAFA
                subtitleColor: 'rgba(255,255,255,0.55)',
                breatheColor: hexToRgba(tokens.accentPrimary, 0.6),
                cancelColor: 'rgba(255,255,255,0.25)',
                glowBg: hexToRgba(moodColor, 0.12),
            };
        }
        return {
            // Light: soft lavender → white
            gradient: [
                VioletPalette.softLavender,  // #F8F5FF
                VioletPalette.paleViolet,    // #EDE9FE — from brand palette
                BrandTokens.light.bgSurface, // #FFFFFF
            ] as readonly [string, string, ...string[]],
            labelColor: tokens.textPrimary,          // #1C1033
            subtitleColor: tokens.textSecondary,      // #64748B
            breatheColor: hexToRgba(tokens.accentPrimary, 0.5),
            cancelColor: 'rgba(0,0,0,0.2)',
            glowBg: hexToRgba(moodColor, 0.10),
        };
    }, [isDark, moodColor, tokens]);

    // ── Animations ──────────────────────────────────────────────────────
    const iconScale = useRef(new RNAnimated.Value(0.9)).current;
    const glowOpacity = useRef(new RNAnimated.Value(0.15)).current;

    useEffect(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Gentle breathing on icon
        RNAnimated.loop(
            RNAnimated.sequence([
                RNAnimated.timing(iconScale, {
                    toValue: 1.08,
                    duration: 2500,
                    easing: RNEasing.inOut(RNEasing.ease),
                    useNativeDriver: true,
                }),
                RNAnimated.timing(iconScale, {
                    toValue: 0.9,
                    duration: 2500,
                    easing: RNEasing.inOut(RNEasing.ease),
                    useNativeDriver: true,
                }),
            ]),
        ).start();

        // Subtle glow pulse behind icon
        RNAnimated.loop(
            RNAnimated.sequence([
                RNAnimated.timing(glowOpacity, {
                    toValue: 0.35,
                    duration: 2000,
                    easing: RNEasing.inOut(RNEasing.ease),
                    useNativeDriver: true,
                }),
                RNAnimated.timing(glowOpacity, {
                    toValue: 0.1,
                    duration: 2000,
                    easing: RNEasing.inOut(RNEasing.ease),
                    useNativeDriver: true,
                }),
            ]),
        ).start();

        // Auto-advance
        const timer = setTimeout(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onComplete();
        }, SPLASH_DURATION);

        return () => clearTimeout(timer);
    }, [onComplete, iconScale, glowOpacity]);

    // Pick a subtitle
    const subtitle =
        config.subtitles?.[Math.floor(Math.random() * (config.subtitles?.length ?? 1))] ??
        'Preparing your reflection…';

    return (
        <Modal visible transparent={false} animationType="fade" statusBarTranslucent>
            <Pressable style={styles.container} onPress={onCancel}>
                {/* Theme-aware gradient background */}
                <LinearGradient
                    colors={themeColors.gradient}
                    locations={[0, 0.5, 1]}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                />

                <View style={styles.content}>
                    {/* ── Mood icon hero ──────────────────────────────── */}
                    <View style={styles.iconSection}>
                        {/* Glow ring behind icon — mood-coloured */}
                        <RNAnimated.View
                            style={[
                                styles.glowRing,
                                {
                                    backgroundColor: themeColors.glowBg,
                                    opacity: glowOpacity,
                                },
                            ]}
                        />

                        {/* The mood icon — large and breathing */}
                        <RNAnimated.View style={{ transform: [{ scale: iconScale }] }}>
                            <Image
                                source={config.imageSource}
                                style={styles.moodIcon}
                                contentFit="contain"
                                transition={300}
                            />
                        </RNAnimated.View>
                    </View>

                    {/* ── Text section — clean, centered ──────────────── */}
                    <MotiView
                        from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'timing', duration: 700, delay: 400 }}
                        style={styles.textSection}
                    >
                        <RNAnimated.Text
                            style={[styles.label, { color: themeColors.labelColor }]}
                        >
                            {config.label}
                        </RNAnimated.Text>

                        <RNAnimated.Text
                            style={[styles.subtitle, { color: themeColors.subtitleColor }]}
                        >
                            {subtitle}
                        </RNAnimated.Text>
                    </MotiView>

                    {/* ── Breathing guide (fades in after 3s) ─────────── */}
                    <MotiView
                        from={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ type: 'timing', duration: 1200, delay: 3500 }}
                    >
                        <RNAnimated.Text
                            style={[styles.breatheGuide, { color: themeColors.breatheColor }]}
                        >
                            Take a deep breath…
                        </RNAnimated.Text>
                    </MotiView>

                    {/* ── Cancel hint ─────────────────────────────────── */}
                    <MotiView
                        from={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ type: 'timing', duration: 500, delay: 2500 }}
                    >
                        <RNAnimated.Text
                            style={[styles.cancelHint, { color: themeColors.cancelColor }]}
                        >
                            Tap anywhere to cancel
                        </RNAnimated.Text>
                    </MotiView>
                </View>
            </Pressable>
        </Modal>
    );
};

const ICON_SIZE = Math.min(SCREEN_W * 0.5, 200);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },

    // ── Icon ──────────────────────────────────────────────────────────
    iconSection: {
        width: ICON_SIZE + 60,
        height: ICON_SIZE + 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
    },
    glowRing: {
        position: 'absolute',
        width: ICON_SIZE + 60,
        height: ICON_SIZE + 60,
        borderRadius: (ICON_SIZE + 60) / 2,
    },
    moodIcon: {
        width: ICON_SIZE,
        height: ICON_SIZE,
    },

    // ── Text ──────────────────────────────────────────────────────────
    textSection: {
        alignItems: 'center',
        gap: 12,
        marginBottom: 48,
    },
    label: {
        fontSize: 34,
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 17,
        textAlign: 'center',
        fontStyle: 'italic',
        lineHeight: 24,
    },

    // ── Breathing guide ───────────────────────────────────────────────
    breatheGuide: {
        fontSize: 15,
        textAlign: 'center',
        fontStyle: 'italic',
        marginBottom: 24,
    },

    // ── Cancel ────────────────────────────────────────────────────────
    cancelHint: {
        fontSize: 13,
        textAlign: 'center',
    },
});

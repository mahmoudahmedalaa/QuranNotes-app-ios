/**
 * BreathingCircle — Calm/Headspace-inspired meditation animation.
 * Multiple translucent concentric rings that pulse with a slow inhale-exhale rhythm.
 * Softer palette, staggered layers, and gentle opacity shifts.
 *
 * Supports mood-aware rendering:
 * - `moodImageSource`: when provided, renders the mood image inside the core circle instead of text label
 * - `moodColor`: when provided, tints the rings to match the mood color
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MotiView } from 'moti';
import { Text, useTheme } from 'react-native-paper';
import { Image } from 'expo-image';

interface BreathingCircleProps {
    size?: number;
    label?: string;
    /** When provided, renders this image source in the core circle instead of the text label */
    moodImageSource?: any;
    /** When provided, tints the ring colors to this mood color instead of default purple */
    moodColor?: string;
}

/** Convert a hex color to rgba with given opacity */
function hexToRgba(hex: string, opacity: number): string {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${opacity})`;
}

export const BreathingCircle: React.FC<BreathingCircleProps> = ({
    size = 180,
    label,
    moodImageSource,
    moodColor,
}) => {
    const theme = useTheme();

    // If a mood color is provided, use it for the rings; otherwise fall back to default purple
    const baseColor = moodColor ?? (theme.dark ? 'rgba(167,139,250' : 'rgba(139,92,246');

    let ring1: string, ring2: string, ring3: string, coreColor: string;
    if (moodColor) {
        ring1 = hexToRgba(moodColor, theme.dark ? 0.08 : 0.06);
        ring2 = hexToRgba(moodColor, theme.dark ? 0.14 : 0.10);
        ring3 = hexToRgba(moodColor, theme.dark ? 0.20 : 0.15);
        coreColor = hexToRgba(moodColor, theme.dark ? 0.30 : 0.22);
    } else {
        ring1 = theme.dark ? 'rgba(167,139,250,0.08)' : 'rgba(139,92,246,0.06)';
        ring2 = theme.dark ? 'rgba(167,139,250,0.14)' : 'rgba(139,92,246,0.10)';
        ring3 = theme.dark ? 'rgba(167,139,250,0.20)' : 'rgba(139,92,246,0.15)';
        coreColor = theme.dark ? 'rgba(167,139,250,0.30)' : 'rgba(139,92,246,0.22)';
    }

    const labelColor = moodColor
        ? (theme.dark ? '#F0F0F0' : '#1A1A1A')
        : (theme.dark ? '#E9E5FF' : '#4C1D95');

    const borderColor = moodColor
        ? hexToRgba(moodColor, theme.dark ? 0.25 : 0.18)
        : (theme.dark ? 'rgba(167,139,250,0.2)' : 'rgba(139,92,246,0.15)');

    const BREATH_DURATION = 5000; // 5s per half-cycle (inhale/exhale)

    return (
        <View style={styles.container}>
            {/* Ring 4 — outermost, very faint, largest motion */}
            <MotiView
                from={{ scale: 0.7, opacity: 0.15 }}
                animate={{ scale: 1.25, opacity: 0.03 }}
                transition={{
                    type: 'timing',
                    duration: BREATH_DURATION,
                    loop: true,
                    repeatReverse: true,
                }}
                style={[
                    styles.ring,
                    {
                        width: size * 2,
                        height: size * 2,
                        borderRadius: size,
                        backgroundColor: ring1,
                    },
                ]}
            />

            {/* Ring 3 */}
            <MotiView
                from={{ scale: 0.75, opacity: 0.2 }}
                animate={{ scale: 1.18, opacity: 0.06 }}
                transition={{
                    type: 'timing',
                    duration: BREATH_DURATION,
                    loop: true,
                    repeatReverse: true,
                    delay: 200,
                }}
                style={[
                    styles.ring,
                    {
                        width: size * 1.55,
                        height: size * 1.55,
                        borderRadius: (size * 1.55) / 2,
                        backgroundColor: ring2,
                    },
                ]}
            />

            {/* Ring 2 — mid glow */}
            <MotiView
                from={{ scale: 0.8, opacity: 0.25 }}
                animate={{ scale: 1.12, opacity: 0.1 }}
                transition={{
                    type: 'timing',
                    duration: BREATH_DURATION,
                    loop: true,
                    repeatReverse: true,
                    delay: 400,
                }}
                style={[
                    styles.ring,
                    {
                        width: size * 1.2,
                        height: size * 1.2,
                        borderRadius: (size * 1.2) / 2,
                        backgroundColor: ring3,
                    },
                ]}
            />

            {/* Core circle — translucent, not solid */}
            <MotiView
                from={{ scale: 0.85, opacity: 0.5 }}
                animate={{ scale: 1.05, opacity: 0.85 }}
                transition={{
                    type: 'timing',
                    duration: BREATH_DURATION,
                    loop: true,
                    repeatReverse: true,
                    delay: 500,
                }}
                style={[
                    styles.core,
                    {
                        width: size * 0.65,
                        height: size * 0.65,
                        borderRadius: (size * 0.65) / 2,
                        backgroundColor: coreColor,
                        borderWidth: 1,
                        borderColor,
                    },
                ]}
            >
                {moodImageSource ? (
                    <Image
                        source={moodImageSource}
                        style={{
                            width: size * 0.5,
                            height: size * 0.5,
                        }}
                        contentFit="contain"
                        transition={300}
                    />
                ) : label ? (
                    <Text style={[styles.label, { color: labelColor }]}>
                        {label}
                    </Text>
                ) : null}
            </MotiView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    ring: {
        position: 'absolute',
    },
    core: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    label: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        paddingHorizontal: 16,
    },
});

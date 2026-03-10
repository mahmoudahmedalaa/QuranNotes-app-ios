/**
 * ProgressRing — Modern gradient SVG progress ring for Khatma
 *
 * Features:
 *   • Gradient stroke: warm gold → emerald green as progress grows
 *   • Large percentage display inside (psychologically more motivating)
 *   • Subtle, calming aesthetic — never stressful
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useTheme } from 'react-native-paper';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';


// ── Palette — soft, calming tones ──────────────────────────────────────────
const ACCENT = {
    gold: '#F5A623',
    goldSoft: '#F7C97E',
    green: '#10B981',
    greenSoft: '#6EE7B7',
};

interface ProgressRingProps {
    completed: number;
    total?: number;
    totalPagesRead?: number;
    size?: number;
    strokeWidth?: number;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
    completed,
    total = 30,
    totalPagesRead = 0,
    size = 140,
    strokeWidth = 9,
}) => {
    const theme = useTheme();
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    // Page-based fractional progress for smoother arc
    const fractionalJuz = totalPagesRead > 0
        ? Math.min(totalPagesRead / (604 / 30), 30)
        : completed;
    const displayProgress = Math.max(completed, fractionalJuz);
    const progress = Math.min(displayProgress / total, 1);
    const strokeDashoffset = circumference * (1 - progress);

    const isComplete = completed >= total;
    const percentage = Math.round(progress * 100);

    // ── Gradient stops shift as progress increases ──
    // Early: mostly gold. Late: mostly green. Complete: full green.
    const gradientEnd = isComplete
        ? ACCENT.green
        : progress > 0.6
            ? ACCENT.greenSoft
            : ACCENT.goldSoft;
    const gradientStart = isComplete ? ACCENT.greenSoft : ACCENT.gold;

    return (
        <MotiView
            from={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 18, stiffness: 120 }}
        >
            <View style={[styles.container, { width: size, height: size }]}>
                <Svg width={size} height={size} style={styles.svg}>
                    <Defs>
                        <SvgGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
                            <Stop offset="0" stopColor={gradientStart} />
                            <Stop offset="1" stopColor={gradientEnd} />
                        </SvgGradient>
                    </Defs>

                    {/* Background track — very subtle */}
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}
                        strokeWidth={strokeWidth}
                        fill="none"
                    />

                    {/* Gradient progress arc */}
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="url(#ringGradient)"
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeDasharray={`${circumference}`}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    />
                </Svg>

                {/* Center content */}
                <View style={styles.centerContent}>
                    {isComplete ? (
                        <>
                            <Ionicons name="checkmark-circle" size={28} color={ACCENT.green} />
                            <Text style={[styles.completeLabel, { color: ACCENT.green }]}>
                                Complete
                            </Text>
                        </>
                    ) : (
                        <>
                            <Text style={[styles.percentText, { color: theme.colors.onSurface }]}>
                                {percentage}%
                            </Text>
                            <Text style={[styles.subtitleText, { color: theme.colors.onSurfaceVariant }]}>
                                {completed} of {total} Juz
                            </Text>
                        </>
                    )}
                </View>
            </View>
        </MotiView>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    svg: {
        position: 'absolute',
    },
    centerContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    percentText: {
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: -1,
    },
    subtitleText: {
        fontSize: 11,
        fontWeight: '500',
        marginTop: 2,
        opacity: 0.7,
    },
    completeLabel: {
        fontSize: 13,
        fontWeight: '700',
        marginTop: 4,
    },
});

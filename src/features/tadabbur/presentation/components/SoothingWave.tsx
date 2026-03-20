/**
 * SoothingWave — Smooth SVG wave animation for meditation screens.
 *
 * v7 — Proper SVG waves with Reanimated:
 *  - Uses react-native-svg Path for genuine smooth wave curves
 *  - Animated with react-native-reanimated for 60fps on UI thread
 *  - Multiple staggered wave layers at different speeds
 *  - Soft, translucent fills — calming, not distracting
 *  - Adapts to light/dark mode
 */
import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
    useSharedValue,
    useAnimatedProps,
    withRepeat,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { useTheme } from 'react-native-paper';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SoothingWaveProps {
    /** Height of the wave area (default: 240) */
    height?: number;
    /** Overall opacity multiplier (default: 1) */
    opacity?: number;
}

/**
 * Build an SVG path string for a smooth sine wave.
 * phase shifts the wave left/right (0–2π).
 * amplitude controls wave height.
 */
function buildWavePath(
    width: number,
    height: number,
    amplitude: number,
    frequency: number,
    phase: number,
    yOffset: number,
): string {
    'worklet';
    let path = '';
    const steps = 60; // enough segments for smooth curve

    for (let i = 0; i <= steps; i++) {
        const x = (i / steps) * width;
        const y =
            yOffset +
            amplitude * Math.sin((i / steps) * frequency * Math.PI * 2 + phase);
        if (i === 0) {
            path += `M ${x} ${y}`;
        } else {
            path += ` L ${x} ${y}`;
        }
    }

    // Close path: line down to bottom-right, across bottom, back up
    path += ` L ${width} ${height} L 0 ${height} Z`;

    return path;
}

interface WaveLayerProps {
    width: number;
    height: number;
    amplitude: number;
    frequency: number;
    yOffset: number;
    duration: number;
    color: string;
}

const WaveLayer: React.FC<WaveLayerProps> = ({
    width,
    height,
    amplitude,
    frequency,
    yOffset,
    duration,
    color,
}) => {
    const phase = useSharedValue(0);

    React.useEffect(() => {
        phase.value = withRepeat(
            withTiming(Math.PI * 2, {
                duration,
                easing: Easing.linear,
            }),
            -1, // infinite
            false, // don't reverse — continuous forward motion
        );
    }, [duration, phase]);

    const animatedProps = useAnimatedProps(() => {
        'worklet';
        return {
            d: buildWavePath(width, height, amplitude, frequency, phase.value, yOffset),
        };
    });

    return (
        <AnimatedPath
            animatedProps={animatedProps}
            fill={color}
        />
    );
};

export const SoothingWave: React.FC<SoothingWaveProps> = ({
    height = 240,
    opacity = 1,
}) => {
    const theme = useTheme();
    const width = SCREEN_WIDTH;

    // Soft purple tones
    const color1 = theme.dark ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.08)';
    const color2 = theme.dark ? 'rgba(167,139,250,0.12)' : 'rgba(124,58,237,0.06)';
    const color3 = theme.dark ? 'rgba(196,181,253,0.09)' : 'rgba(167,139,250,0.05)';

    return (
        <View style={[styles.container, { height, opacity }]} pointerEvents="none">
            <Svg width={width} height={height}>
                {/* Back wave — slowest, deepest */}
                <WaveLayer
                    width={width}
                    height={height}
                    amplitude={18}
                    frequency={1.5}
                    yOffset={height * 0.35}
                    duration={12000}
                    color={color1}
                />
                {/* Middle wave */}
                <WaveLayer
                    width={width}
                    height={height}
                    amplitude={14}
                    frequency={1.8}
                    yOffset={height * 0.5}
                    duration={9000}
                    color={color2}
                />
                {/* Front wave — fastest, shallowest */}
                <WaveLayer
                    width={width}
                    height={height}
                    amplitude={10}
                    frequency={2.2}
                    yOffset={height * 0.65}
                    duration={7000}
                    color={color3}
                />
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        overflow: 'hidden',
    },
});

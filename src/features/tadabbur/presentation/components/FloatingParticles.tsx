/**
 * FloatingParticles — Gentle glowing dots that drift upward slowly.
 *
 * Creates a starfield / barakah-radiating effect. Each particle starts
 * at a random position near the bottom, drifts up with slight horizontal
 * sway, and fades out before repeating. Uses moti for smooth looping.
 */
import React, { useMemo } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { MotiView } from 'moti';
import { useTheme } from 'react-native-paper';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface FloatingParticlesProps {
    /** Number of particles (default: 18) */
    count?: number;
}

interface Particle {
    id: number;
    size: number;
    startX: number;
    startY: number;
    endY: number;
    drift: number;
    duration: number;
    delay: number;
    opacity: number;
}

export const FloatingParticles: React.FC<FloatingParticlesProps> = ({
    count = 18,
}) => {
    const theme = useTheme();
    const color = theme.dark ? 'rgba(196,181,253,0.5)' : 'rgba(139,92,246,0.35)';

    const particles = useMemo<Particle[]>(() => {
        return Array.from({ length: count }, (_, i) => ({
            id: i,
            size: 2 + Math.random() * 3.5,                         // 2–5.5px
            startX: Math.random() * SCREEN_W,
            startY: SCREEN_H * 0.5 + Math.random() * SCREEN_H * 0.5, // bottom half
            endY: -(20 + Math.random() * 80),                      // drift off top
            drift: (Math.random() - 0.5) * 60,                     // slight horizontal sway
            duration: 6000 + Math.random() * 6000,                  // 6–12s
            delay: Math.random() * 4000,                            // stagger start
            opacity: 0.25 + Math.random() * 0.45,                  // 0.25–0.7
        }));
    }, [count]);

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {particles.map((p) => (
                <MotiView
                    key={p.id}
                    from={{
                        translateX: p.startX,
                        translateY: p.startY,
                        opacity: 0,
                        scale: 0.3,
                    }}
                    animate={{
                        translateX: p.startX + p.drift,
                        translateY: p.endY,
                        opacity: [
                            { value: p.opacity, type: 'timing', duration: p.duration * 0.2 },
                            { value: p.opacity, type: 'timing', duration: p.duration * 0.5 },
                            { value: 0, type: 'timing', duration: p.duration * 0.3 },
                        ] as any,
                        scale: 1,
                    }}
                    transition={{
                        type: 'timing',
                        duration: p.duration,
                        delay: p.delay,
                        loop: true,
                    }}
                    style={[
                        styles.dot,
                        {
                            width: p.size,
                            height: p.size,
                            borderRadius: p.size / 2,
                            backgroundColor: color,
                        },
                    ]}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    dot: {
        position: 'absolute',
    },
});

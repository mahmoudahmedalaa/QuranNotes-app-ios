import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import {
    Canvas,
    RoundedRect,
    RuntimeShader,
    Skia,
} from '@shopify/react-native-skia';
import { useSharedValue, useDerivedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';

const meshGradientShaderSource = `
uniform float2 resolution;
uniform float time;
uniform vec4 color1;
uniform vec4 color2;
uniform vec4 color3;
uniform vec4 color4;

vec4 main(vec2 pos) {
  vec2 uv = pos / resolution;
  
  // Make the time move very slowly for a gentle breathing effect
  float t = time;
  
  // Create 4 orbiting centers for the colors
  vec2 p1 = vec2(0.5 + 0.3 * sin(t), 0.5 + 0.3 * cos(t));
  vec2 p2 = vec2(0.5 + 0.4 * sin(t + 1.57), 0.5 + 0.2 * cos(t - 1.0));
  vec2 p3 = vec2(0.5 + 0.2 * sin(t * 0.7 - 2.0), 0.5 + 0.4 * cos(t * 0.5 + 1.0));
  vec2 p4 = vec2(0.5 + 0.3 * sin(t * 1.2 + 3.14), 0.5 + 0.3 * cos(t * 0.9 - 1.57));
  
  // Soft blending distances
  float d1 = length(uv - p1);
  float d2 = length(uv - p2);
  float d3 = length(uv - p3);
  float d4 = length(uv - p4);
  
  // Weights based on distance (inverse square with a smooth factor)
  float smoothFactor = 0.15;
  float w1 = 1.0 / (d1 * d1 + smoothFactor);
  float w2 = 1.0 / (d2 * d2 + smoothFactor);
  float w3 = 1.0 / (d3 * d3 + smoothFactor);
  float w4 = 1.0 / (d4 * d4 + smoothFactor);
  
  float total = w1 + w2 + w3 + w4;
  
  // Mix colors based on their weights
  return (color1 * w1 + color2 * w2 + color3 * w3 + color4 * w4) / total;
}
`;

const shader = Skia.RuntimeEffect.Make(meshGradientShaderSource);

interface MoodGradientSquareProps {
    palette: readonly [string, string, string, string];
    width: number;
    height: number;
    borderRadius?: number;
    style?: any;
}

const hexToVec4 = (hex: string) => {
    // Remove hash
    hex = hex.replace('#', '');

    // Parse hex
    const bigint = parseInt(hex, 16);
    let r, g, b, a;

    if (hex.length === 8) {
        r = (bigint >> 24) & 255;
        g = (bigint >> 16) & 255;
        b = (bigint >> 8) & 255;
        a = bigint & 255;
    } else {
        r = (bigint >> 16) & 255;
        g = (bigint >> 8) & 255;
        b = bigint & 255;
        a = 255;
    }

    // Return normalized values 0-1
    return [r / 255.0, g / 255.0, b / 255.0, a / 255.0];
};

export const MoodGradientSquare: React.FC<MoodGradientSquareProps> = ({
    palette,
    width,
    height,
    borderRadius = 16,
    style,
}) => {
    // Shared value for animation time
    const time = useSharedValue(0);

    useEffect(() => {
        time.value = withRepeat(
            withTiming(20, { duration: 100000, easing: Easing.linear }),
            -1
        );
    }, []);

    // Convert hex colors to vec4 arrays for Skia Shader
    const c1 = hexToVec4(palette[0]);
    const c2 = hexToVec4(palette[1]);
    const c3 = hexToVec4(palette[2]);
    const c4 = hexToVec4(palette[3]);

    const uniforms = useDerivedValue(() => ({
        resolution: [width, height],
        time: time.value,
        color1: c1,
        color2: c2,
        color3: c3,
        color4: c4,
    }));

    if (!shader) {
        return null;
    }

    return (
        <Canvas style={[{ width, height }, style]}>
            <RoundedRect
                x={0}
                y={0}
                width={width}
                height={height}
                r={borderRadius}
            >
                <RuntimeShader
                    source={shader}
                    uniforms={uniforms}
                />
            </RoundedRect>
        </Canvas>
    );
};

const styles = StyleSheet.create({});

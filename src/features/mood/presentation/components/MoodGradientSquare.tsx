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
uniform float u_time;
uniform float u_width;
uniform float u_height;

uniform float c1_r; uniform float c1_g; uniform float c1_b;
uniform float c2_r; uniform float c2_g; uniform float c2_b;
uniform float c3_r; uniform float c3_g; uniform float c3_b;
uniform float c4_r; uniform float c4_g; uniform float c4_b;

vec4 main(vec2 pos) {
  vec2 resolution = vec2(u_width, u_height);
  vec2 uv = pos / resolution;
  
  vec3 color1 = vec3(c1_r, c1_g, c1_b);
  vec3 color2 = vec3(c2_r, c2_g, c2_b);
  vec3 color3 = vec3(c3_r, c3_g, c3_b);
  vec3 color4 = vec3(c4_r, c4_g, c4_b);

  float t = u_time * 0.5; // Slightly slower, more premium breathing
  
  // Orbiting centers
  vec2 p1 = vec2(0.3 + 0.4 * sin(t), 0.3 + 0.4 * cos(t));
  vec2 p2 = vec2(0.7 + 0.3 * sin(t + 2.0), 0.8 + 0.2 * cos(t * 0.8));
  vec2 p3 = vec2(0.2 + 0.5 * sin(t * 0.7 - 1.0), 0.6 + 0.3 * cos(t * 1.2 + 1.0));
  vec2 p4 = vec2(0.8 + 0.2 * sin(t * 1.1 + 3.14), 0.2 + 0.4 * cos(t * 0.9 - 1.57));
  
  // Distance to centers
  float d1 = length(uv - p1);
  float d2 = length(uv - p2);
  float d3 = length(uv - p3);
  float d4 = length(uv - p4);
  
  // Inverse square-ish blending for organic blobs
  float sm = 0.12;
  float w1 = 1.0 / pow(d1 + sm, 2.5);
  float w2 = 1.0 / pow(d2 + sm, 2.5);
  float w3 = 1.0 / pow(d3 + sm, 2.5);
  float w4 = 1.0 / pow(d4 + sm, 2.5);
  
  float total = w1 + w2 + w3 + w4;
  vec3 finalColor = (color1 * w1 + color2 * w2 + color3 * w3 + color4 * w4) / total;
  
  // Add a tiny bit of brightness for that radiant feel
  finalColor = finalColor * 1.05;

  return vec4(finalColor, 1.0);
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
        u_width: width,
        u_height: height,
        u_time: time.value,
        c1_r: c1[0], c1_g: c1[1], c1_b: c1[2],
        c2_r: c2[0], c2_g: c2[1], c2_b: c2[2],
        c3_r: c3[0], c3_g: c3[1], c3_b: c3[2],
        c4_r: c4[0], c4_g: c4[1], c4_b: c4[2],
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

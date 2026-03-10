export const meshGradientShader = `
uniform float2 resolution;
uniform float time;
uniform vec4 color1;
uniform vec4 color2;
uniform vec4 color3;
uniform vec4 color4;

vec4 main(vec2 pos) {
  // Normalize coordinates
  vec2 uv = pos / resolution;
  
  // Create organic movement parameters
  float t = time * 0.5;
  
  // Center points for the 4 colors that orbit slowly
  vec2 p1 = vec2(
    0.5 + 0.3 * sin(t + 0.0),
    0.5 + 0.3 * cos(t + 0.0)
  );
  vec2 p2 = vec2(
    0.5 + 0.3 * sin(t + 1.57),
    0.5 + 0.3 * cos(t + 1.57)
  );
  vec2 p3 = vec2(
    0.5 + 0.4 * sin(t * 0.7 + 3.14),
    0.5 + 0.4 * cos(t * 0.8 + 3.14)
  );
  vec2 p4 = vec2(
    0.5 + 0.2 * sin(t * 1.3 + 4.71),
    0.5 + 0.2 * cos(t * 1.1 + 4.71)
  );
  
  // Calculate distances with noise/distortion
  float d1 = length(uv - p1);
  float d2 = length(uv - p2);
  float d3 = length(uv - p3);
  float d4 = length(uv - p4);
  
  // Inverse square falling off
  float w1 = 1.0 / (d1 * d1 + 0.1);
  float w2 = 1.0 / (d2 * d2 + 0.1);
  float w3 = 1.0 / (d3 * d3 + 0.1);
  float w4 = 1.0 / (d4 * d4 + 0.1);
  
  float sum = w1 + w2 + w3 + w4;
  
  // Mix colors based on weights
  return (color1 * w1 + color2 * w2 + color3 * w3 + color4 * w4) / sum;
}
`;

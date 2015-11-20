/*jshint multistr: true */
module.exports = ' \
  precision mediump float; \
  uniform vec2 u_resolution; \
  uniform mat3 u_transform; \
  attribute float a_position; \
  attribute vec4 a_rgba; \
  attribute vec2 a_center; \
  attribute float a_radius; \
  varying vec4 rgba; \
  varying vec2 center; \
  varying float radius; \
  void main() { \
    rgba = a_rgba / 255.0; \
    radius = a_radius * u_transform[0][0] + 1.0; \
    \
    float shaderSize = radius + 10.0; \
    float triangleAdjust = shaderSize * (1.0 + sqrt(2.0)); \
    \
    vec3 transformed = u_transform * vec3(a_center, 1); \
    center = a_center; \
    vec2 position; \
    \
    if (a_position == 0.0) { \
      position = a_center + vec2(1.0, 0.0); \
    } else if (a_position == 1.0) { \
      position = a_center + vec2(0.0, 1.0); \
    } else if (a_position == 2.0) { \
      position = a_center + vec2(-1.0, 0.0); \
    } \
    \
    vec2 clipspace = position / u_resolution * 2.0 - 1.0; \
    gl_Position = vec4(clipspace * vec2(1, -1), 0, 1); \
    \
  }';

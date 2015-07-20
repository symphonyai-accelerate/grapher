module.exports = ' \
uniform vec2 u_resolution; \
attribute vec2 a_position; \
attribute float a_color; \
varying vec4 color; \
varying vec2 position; \
varying vec2 resolution; \
void main() { \
  vec2 clipspace = a_position / u_resolution * 2.0 - 1.0; \
  gl_Position = vec4(clipspace * vec2(1, -1), 0, 1); \
  float c = a_color; \
  color.b = mod(c, 256.0); c = floor(c / 256.0); \
  color.g = mod(c, 256.0); c = floor(c / 256.0); \
  color.r = mod(c, 256.0); c = floor(c / 256.0); color /= 255.0; \
  color.a = 1.0; \
}';

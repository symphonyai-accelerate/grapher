uniform vec2 u_resolution;
attribute vec2 a_position;
attribute float a_color;
attribute vec2 a_center;
attribute float a_radius;
varying vec3 rgb;
varying vec2 center;
varying vec2 resolution;
varying float radius;
void main() {
  vec2 clipspace = a_position / u_resolution * 2.0 - 1.0;
  gl_Position = vec4(clipspace * vec2(1, -1), 0, 1);
  float c = a_color;
  rgb.b = mod(c, 256.0); c = floor(c / 256.0);
  rgb.g = mod(c, 256.0); c = floor(c / 256.0);
  rgb.r = mod(c, 256.0); c = floor(c / 256.0); rgb /= 255.0;
  radius = a_radius - 1.0 ;
  center = a_center;
  resolution = u_resolution;
}

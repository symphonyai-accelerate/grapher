precision mediump float;
varying vec4 color;
varying vec2 center;
varying vec2 resolution;
varying float radius;
void main() {
  vec4 color0 = vec4(0.0, 0.0, 0.0, 0.0);
  float x = gl_FragCoord.x;
  float y = resolution[1] - gl_FragCoord.y;
  float dx = center[0] - x;
  float dy = center[1] - y;
  float distance = sqrt(dx*dx + dy*dy);
  if ( distance < radius )
    gl_FragColor = color;
  else 
    gl_FragColor = color0;
}

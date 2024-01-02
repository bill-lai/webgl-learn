precision mediump float;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

void main(){
  // gl_FragColor = vec4(fract(gl_FragCoord.xy  / 50.0), 0, 1);
  // gl_FragColor = vec4(gl_FragCoord.xy / u_resolution, 0, 1);
  // gl_FragColor = vec4(fract((gl_FragCoord.xy - u_mouse) / u_resolution), 0, 1);
  gl_FragColor = vec4(fract((gl_FragCoord.xy - u_mouse) / u_resolution), fract(u_time), 1);
}
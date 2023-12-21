precision mediump float;

uniform sampler2D u_texture;
uniform vec4 u_fogColor;
uniform float u_fogDensity;


varying vec2 v_texcoord;
varying float v_fogDepth;

#define LOG2 1.442695

void main(){
  vec4 color = texture2D(u_texture, v_texcoord);
  float fogAmount = 1. - exp2(-u_fogDensity * u_fogDensity * v_fogDepth * v_fogDepth * LOG2);

  fogAmount = clamp(fogAmount, .0, 1.);
  vec4 fogColor = mix(color, u_fogColor, fogAmount);

  gl_FragColor = fogColor;
}
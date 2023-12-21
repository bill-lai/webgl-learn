precision mediump float;

uniform sampler2D u_texture;
uniform vec4 u_fogColor;
uniform float u_fogNear;
uniform float u_fogFar;


varying vec2 v_texcoord;
varying float v_fogDepth;

void main(){
  vec4 color = texture2D(u_texture, v_texcoord);
  float fogAmount = smoothstep(u_fogNear, u_fogFar, v_fogDepth);
  vec4 fogColor = mix(color, u_fogColor, fogAmount);

  gl_FragColor = fogColor;
}
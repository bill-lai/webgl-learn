attribute vec2 position;
attribute vec3 displacement;

uniform float currentTime;
uniform float animationTime;
varying vec2 v_texcoord;

void main(){
  float t = clamp((displacement.z - currentTime) / animationTime, 0., 1.);
  vec2 offset = t * displacement.xy;

  gl_Position = vec4(position + offset, -1, 1);
  v_texcoord = position.xy * 0.5 + 0.5;

  // gl_Position = vec4(position, -1, 1);
  // v_texcoord = (position + offset) * 0.5 + 0.5;
}
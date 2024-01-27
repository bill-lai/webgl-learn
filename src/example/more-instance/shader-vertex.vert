attribute float id;
attribute vec4 position;
attribute vec2 texcoord;

uniform float time;

varying vec4 v_color;
varying vec2 v_texcoord;

void main(){
  float o = id + time;
  vec2 diff = vec2(fract(o * 0.3373), fract(o * 0.5127)) * 2.0 - 1.0;
  gl_Position = vec4(position.xy + diff, position.zw);
  v_color = vec4(fract(vec3(id) * vec3(0.127, 0.373, 0.513)), 1);
  v_texcoord = texcoord;
}
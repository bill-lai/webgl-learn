attribute vec4 a_position;
attribute vec2 a_texcoord;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;
uniform mat4 u_projectedMatrix;

varying vec2 v_texcoord;
varying vec4 v_projectedTexcoord;

void main(){
  vec4 wordPosition = u_world * a_position;
  gl_Position = u_projection * u_view * wordPosition;
  v_projectedTexcoord = u_projectedMatrix * wordPosition;
  v_texcoord = a_texcoord;
}
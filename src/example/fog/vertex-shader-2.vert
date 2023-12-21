attribute vec4 a_position;
attribute vec2 a_texcoord;

uniform mat4 u_projectionMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_worldMatrix;

varying vec2 v_texcoord;
varying float v_fogDepth;

void main(){
  gl_Position = u_projectionMatrix * u_viewMatrix * u_worldMatrix * a_position;
  v_fogDepth = length((u_viewMatrix * u_worldMatrix * a_position).xyz);
  v_texcoord = a_texcoord;
}
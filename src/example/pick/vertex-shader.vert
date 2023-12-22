attribute vec4 a_position;
attribute vec4 a_color;

uniform mat4 u_projectionMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_worldMatrix;

varying vec4 v_color;

void main(){
  gl_Position = u_projectionMatrix * u_viewMatrix * u_worldMatrix * a_position;
  v_color = a_color;
}
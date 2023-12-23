attribute vec4 a_position;
attribute vec4 a_normal;

uniform mat4 u_projectionMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_worldMatrix;

varying vec3 v_normal;

void main(){
  gl_Position = u_projectionMatrix * u_viewMatrix * u_worldMatrix * a_position;
  v_normal = (u_worldMatrix * a_normal).xyz;
}
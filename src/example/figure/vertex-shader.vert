attribute vec4 a_position;
attribute vec4 a_normal;

uniform mat4 u_matrix;
uniform mat4 u_meshMatrix;
uniform mat4 u_normalMatrix;
uniform vec3 u_lightPosition;

varying vec3 v_normal;
varying vec3 v_lightToFace; 


void main(){
  gl_Position = u_matrix * a_position;

  vec4 meshPosition = u_meshMatrix * a_position;
  v_lightToFace = (meshPosition.xyz - u_lightPosition);
  v_normal = (u_normalMatrix * a_normal).xyz;
}
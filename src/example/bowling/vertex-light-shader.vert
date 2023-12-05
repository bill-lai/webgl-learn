attribute vec4 a_position;
attribute vec2 a_texcoord;
attribute vec3 a_normal;

uniform mat4 u_matrix;
uniform mat4 u_normalMatrix;
uniform mat4 u_modalMatrix;
uniform vec3 u_lightPosition;
uniform vec3 u_cameraPosition;

varying vec2 v_texcoord;
varying vec3 v_normal;
varying vec3 v_lightToFace;
varying vec3 v_cameraToFace;

void main(){
  gl_Position = u_matrix * a_position;
  v_texcoord = a_texcoord;

  vec3 modalPos = (u_modalMatrix * a_position).xyz;
  v_lightToFace = modalPos - u_lightPosition;
  v_cameraToFace = modalPos - u_cameraPosition;

  v_normal = mat3(u_normalMatrix) * a_normal;
  // v_normal = a_normal;
}
attribute vec4 a_position;
attribute vec3 a_normal;
attribute vec2 a_texcoord;

uniform mat4 u_matrix;
uniform mat4 u_meshMatrix;
uniform mat4 u_normalMatrix;
uniform vec3 u_lightPosition;
uniform vec3 u_cameraPosition;

varying vec3 v_lightToFace;
varying vec3 v_faceToCamera;
varying vec2 v_texcoord;
varying vec3 v_normal;

void main(){
  gl_Position = u_matrix * a_position;

  vec3 meshPosition = (u_meshMatrix * a_position).xyz;
  v_lightToFace = meshPosition - u_lightPosition;
  v_faceToCamera = u_cameraPosition - meshPosition;
  v_texcoord = a_texcoord;
  v_normal = (u_normalMatrix * vec4(a_normal, 0)).xyz;
}
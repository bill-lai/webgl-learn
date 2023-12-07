attribute vec4 a_position;
attribute vec3 a_normal;
attribute vec4 a_color;
// 法线切线
attribute vec3 a_tangent;
attribute vec2 a_texcoord;

uniform mat4 u_matrix;
uniform mat4 u_meshMatrix;
uniform mat4 u_normalMatrix;
uniform vec3 u_cameraPosition;

varying vec3 v_normal;
varying vec4 v_color;
varying vec3 v_cameraToFace;
varying vec2 v_texcoord;
varying vec3 v_tangent;

void main(){
  gl_Position = u_matrix * a_position;
  vec3 meshPosition = vec3(u_meshMatrix * a_position);
  v_cameraToFace = meshPosition - u_cameraPosition;

  mat3 normalMatrix = mat3(u_meshMatrix);
  v_normal = normalize(normalMatrix * a_normal);
  v_tangent = normalize(normalMatrix * a_tangent);

  v_color = a_color;
  v_texcoord = a_texcoord;
}
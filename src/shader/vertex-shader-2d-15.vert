// 模拟聚光灯
attribute vec4 a_position;
attribute vec3 a_normal;

uniform mat4 u_matrix;
uniform mat4 u_meshMatrix;
uniform mat4 u_normalMatrix;
uniform vec3 u_lightPosition;
uniform vec3 u_cameraPosition;


varying vec3 v_normal;
varying vec3 v_faceToLight;
varying vec3 v_cameraToFace;

void main(){
  gl_Position = u_matrix * a_position;

  vec3 meshPosition = vec3(u_meshMatrix * a_position);

  v_faceToLight = u_lightPosition - meshPosition;
  v_cameraToFace = meshPosition - u_cameraPosition;
  v_normal = mat3(u_normalMatrix) * a_normal;
  
}
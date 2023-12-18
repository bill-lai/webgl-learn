attribute vec4 a_position;
attribute vec4 a_normal;
attribute vec2 a_texcoord;

uniform mat4 u_projectionMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_worldMatrix;
uniform mat4 u_lightMatrix;
uniform vec3 u_lightPosition;
uniform vec3 u_cameraPosition;

varying vec3 v_normal;
varying vec3 v_lightToFaceDirection;
varying vec3 v_cameraToFaceDirection;
varying vec2 v_texcoord;
varying vec4 v_lightProjectionPosition;

void main(){
  vec4 worldPosition = u_worldMatrix * a_position;
  vec4 viewPosition = u_viewMatrix * worldPosition;

  v_lightToFaceDirection = worldPosition.xyz - u_lightPosition;
  v_cameraToFaceDirection = worldPosition.xyz - u_cameraPosition;

  gl_Position = u_projectionMatrix * viewPosition;

  v_normal = (u_worldMatrix * a_normal).xyz;
  v_texcoord = a_texcoord;

  v_lightProjectionPosition = u_lightMatrix * worldPosition;
}
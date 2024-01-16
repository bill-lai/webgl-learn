attribute vec4 position;
attribute vec4 normal;
attribute vec2 texcoord;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 worldMatrix;
uniform mat4 normalMatrix;
uniform vec3 lightPosition;
uniform vec3 cameraPosition;

varying vec2 v_texcoord;
varying vec3 v_lightToMeshDirection;
varying vec3 v_cameraToMeshDirection;
varying vec3 v_normal;

void main(){
  vec4 worldPosition = worldMatrix * position;

  v_texcoord = texcoord;
  v_lightToMeshDirection = worldPosition.xyz - lightPosition;
  v_cameraToMeshDirection = worldPosition.xyz - cameraPosition;
  v_normal = (normalMatrix * normal).xyz;

  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
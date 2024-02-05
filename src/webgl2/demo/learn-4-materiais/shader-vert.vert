#version 300 es

in vec4 position;
in vec4 normal;

uniform mat4 projectionMat;
uniform mat4 viewMat;
uniform mat4 worldMat;
uniform mat4 norMat;

out vec3 vNormal;
out vec3 vFragPosition;

void main() {
  vec4 worldPostion = worldMat * position;
  gl_Position = projectionMat * viewMat * worldPostion;

  vFragPosition = worldPostion.xyz;
  vNormal = (norMat * normal).xyz;
}
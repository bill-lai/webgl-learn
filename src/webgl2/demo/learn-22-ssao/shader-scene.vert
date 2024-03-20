#version 300 es
layout(location = 1) in vec4 position;
layout(location = 2) in vec3 normal;

uniform mat4 projectionMat;
uniform mat4 viewMat;
uniform mat4 worldMat;
uniform mat4 norMat;

out vec3 vNormal;
out vec3 vFragPosition;

void main(){
  vec4 worldPosition = viewMat * worldMat * position;

  gl_Position = projectionMat * worldPosition;
  vNormal = mat3(norMat) * normal;
  vFragPosition = worldPosition.xyz;
}
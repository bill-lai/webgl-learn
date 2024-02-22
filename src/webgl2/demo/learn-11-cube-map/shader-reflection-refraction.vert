#version 300 es
layout(location = 1) in vec4 position;
layout(location = 2) in vec3 normal;

uniform mat4 projectionMat;
uniform mat4 viewMat;
uniform mat4 worldMat;
uniform mat4 normalMat;

out vec3 vFragPosition;
out vec3 vNormal;

void main(){
  vec4 worldPosition = worldMat * position;
  gl_Position = projectionMat * viewMat * worldPosition;

  vFragPosition = worldPosition.xyz;
  vNormal = mat3(normalMat) * normal;
}
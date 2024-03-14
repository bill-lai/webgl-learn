#version 300 es
layout(location = 1) in vec4 position;
layout(location = 2) in vec3 normal;
layout(location = 3) in vec2 texcoord;

uniform mat4 projectionMat;
uniform mat4 viewMat;
uniform mat4 modelMat;
uniform mat3 norMat;

out vec3 vFragPosition;
out vec2 vTexcoord;
out vec3 vNormal;

void main(){
  vec4 modelPosition = modelMat * position;
  gl_Position = projectionMat * viewMat * modelPosition;
  vFragPosition = modelPosition.xyz;
  vNormal = norMat * normal;
  vTexcoord = texcoord;
}
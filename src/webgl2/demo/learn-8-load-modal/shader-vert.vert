#version 300 es
layout(location = 0) in vec4 position;
layout(location = 1) in vec3 normal;
layout(location = 2) in vec2 texcoord;

uniform mat4 projectionMat;
uniform mat4 viewMat;
uniform mat4 worldMat;

out vec3 vFragPosition;
out vec2 vTexcoord;
out vec3 vNormal;

void main(){
  vec4 worldPosition = worldMat * position;
  gl_Position = projectionMat * viewMat * worldPosition;

  vTexcoord = texcoord;
  vNormal = normal;
  vFragPosition = worldPosition.xyz;
}

#version 300 es
layout(location = 1) in vec4 position;

uniform mat4 projectionMat;
uniform mat4 viewMat;
uniform mat4 worldMat;

out vec3 vTexcoord;

void main(){
  gl_Position = projectionMat * viewMat * worldMat * position;
  vTexcoord = position.xyz;
}
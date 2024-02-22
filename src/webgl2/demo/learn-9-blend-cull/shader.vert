#version 300 es

layout(location = 1) in vec4 position;
layout(location = 3) in vec2 texcoord;

uniform mat4 worldMat;
uniform mat4 viewMat;
uniform mat4 projectionMat;

out vec2 vTexcoord;

void main(){
  gl_Position = projectionMat * viewMat * worldMat * position;
  vTexcoord = texcoord;
}
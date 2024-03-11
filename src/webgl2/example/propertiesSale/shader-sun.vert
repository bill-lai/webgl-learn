#version 300 es
layout(location = 1) in vec4 position;
layout(location = 2) in vec3 normal;

uniform mat4 projectionMat;
uniform mat4 viewMat;
uniform mat4 worldMat;

void main(){
  gl_Position = projectionMat * viewMat * worldMat * position;
}
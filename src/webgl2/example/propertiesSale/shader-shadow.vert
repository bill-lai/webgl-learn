#version 300 es
layout(location = 1) in vec4 position;
layout(location = 2) in vec3 normal;

uniform mat4 sunProjectionMat;
uniform mat4 worldMat;

void main(){
  vec4 worldPosition = worldMat * position;
  gl_Position = sunProjectionMat * worldPosition;
}
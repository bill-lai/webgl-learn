#version 300 es
layout(location = 1) in vec4 position;

uniform mat4 shadowViewProjectionMat;
uniform mat4 modelMat;

void main(){
  gl_Position = shadowViewProjectionMat * modelMat * position;
}
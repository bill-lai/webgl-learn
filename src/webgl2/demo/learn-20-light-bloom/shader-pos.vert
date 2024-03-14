#version 300 es
layout(location = 1) in vec4 position;

uniform mat4 projectionMat;
uniform mat4 viewMat;
uniform mat4 modelMat;

void main(){
  vec4 modelPosition = modelMat * position;
  gl_Position = projectionMat * viewMat * modelPosition, 1;
}
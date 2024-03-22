#version 300 es
layout(location = 1) in vec4 position;

uniform mat4 projectionMat;
uniform mat4 viewMat;
uniform mat4 modelMat;

out vec4 vLocPosition;

void main() {
  gl_Position = projectionMat * viewMat * modelMat * position;
  vLocPosition = position;
}
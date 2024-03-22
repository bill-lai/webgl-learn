#version 300 es
layout(location = 1) in vec4 position;

uniform mat4 invViewProjectionMat;

out vec4 vLocPosition;

void main() {
  gl_Position = position.xyww;
  vLocPosition = invViewProjectionMat * gl_Position;
}
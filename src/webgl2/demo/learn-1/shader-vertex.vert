#version 300 es

layout(location = 1) in vec4 position;
layout(location = 2) in vec4 color;

out vec4 vColor;
void main() {
  gl_Position = position;
  vColor = color;
}
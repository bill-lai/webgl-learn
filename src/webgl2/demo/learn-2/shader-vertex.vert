#version 300 es

layout(location = 1) in vec4 position;
layout(location = 2) in vec4 color;
layout(location = 3) in vec2 texcoord;

out vec4 vColor;
out vec2 vTexcoord;

void main() {
  gl_Position = position;
  vColor = color;
  vTexcoord = texcoord;
}
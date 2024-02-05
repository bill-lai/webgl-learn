#version 300 es
in vec4 position;
in vec2 texcoord;

uniform mat4 worldMat4;
uniform mat4 projectionMat4;
uniform mat4 viewMat4;

out vec2 vTexcoord;

void main() {
  gl_Position = projectionMat4 * viewMat4 * worldMat4 * position;
  vTexcoord = texcoord;
}
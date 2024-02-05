#version 300 es
in vec4 position;
in vec2 texcoord;

uniform mat4 matrix;

out vec2 vTexcoord;

void main(){
  gl_Position = matrix * position;
  vTexcoord = texcoord;
}
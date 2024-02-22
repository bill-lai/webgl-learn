#version 300 es

layout(location = 1) in vec4 position;
layout(location = 3) in vec2 texcoord;

out vec2 vTexcoord;

void main(){
  gl_Position = vec4(position.xy, 1, 1);
  vTexcoord = texcoord;
}
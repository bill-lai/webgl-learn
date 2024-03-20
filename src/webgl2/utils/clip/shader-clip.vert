#version 300 es
layout(location = 1) in vec4 position;

out vec2 vTexcoord;

void main(){
  gl_Position = vec4(position.xy, 0, 1);
  vTexcoord = gl_Position.xy * 0.5 + 0.5;
}
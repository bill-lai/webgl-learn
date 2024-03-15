#version 300 es
layout(location = 0) in vec3 position;
layout(location = 2) in vec2 texcoord;

out vec2 vTexcoord;

void main(){
  gl_Position = vec4(position.xy, -0.9, 1);
  vTexcoord = texcoord;
}
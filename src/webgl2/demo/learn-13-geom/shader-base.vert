#version 300 es
layout(location = 1) in vec4 position;

out vec3 vColor;

void main(){
  gl_Position = position;
  vColor = position.xyz * 0.5 + 0.5;
}
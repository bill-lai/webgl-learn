#version 300 es
layout(location = 1) in vec3 position;

out vec4 vFragPosition;

void main(){
  gl_Position = vec4(position.xy, 1, 1);
  vFragPosition = gl_Position;
}
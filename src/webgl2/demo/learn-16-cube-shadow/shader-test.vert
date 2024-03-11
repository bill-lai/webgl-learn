#version 300 es
layout(location = 1) in vec3 position;

void main(){
  gl_Position = vec4(position.xy, 0, 1.0);
}
#version 300 es
in vec4 position;
in vec4 color;
uniform mat4 matrix;

out vec4 vColor;
void main(){
  gl_Position = matrix * position;
  vColor = color;
}
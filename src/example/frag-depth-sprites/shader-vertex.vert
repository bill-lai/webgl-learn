attribute vec4 position;
attribute vec2 texcoord;

uniform mat4 matrix;

varying vec2 v_texcoord;

void main(){
  gl_Position = matrix * position;
  v_texcoord = texcoord;
  
}
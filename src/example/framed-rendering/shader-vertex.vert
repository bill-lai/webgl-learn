attribute vec4 position;

uniform mat4 worldMatrix;

void main(){
  gl_Position = worldMatrix * position;
}
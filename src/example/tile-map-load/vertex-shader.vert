attribute vec4 position;
attribute vec2 texcoord;

uniform mat4 projectionMatrix;
uniform mat4 worldMatrix;
uniform mat4 texMatrix;

varying vec2 v_texcoord;

void main(){
  gl_Position = projectionMatrix * worldMatrix * position;
  v_texcoord = (texMatrix * vec4(texcoord, 0, 1)).xy;
}
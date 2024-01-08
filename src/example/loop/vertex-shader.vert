attribute vec4 position;
attribute vec2 texcoord;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 worldMatrix;

varying vec2 v_texcoord;


void main(){
  gl_Position = projectionMatrix * viewMatrix * worldMatrix * position;
  v_texcoord = texcoord;
}
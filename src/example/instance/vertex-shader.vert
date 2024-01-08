attribute vec4 a_position;
attribute vec4 a_color;
attribute mat4 a_worldMatrix;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;

varying vec4 v_color;

void main(){
  v_color = a_color;
  gl_Position = projectionMatrix * viewMatrix * a_worldMatrix * a_position;
}
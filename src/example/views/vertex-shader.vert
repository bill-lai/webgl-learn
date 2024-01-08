attribute vec4 a_position;
attribute vec4 a_normal;

uniform mat4 prejectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 worldMatrix;

varying vec4 v_normal;

void main(){
  gl_Position = prejectionMatrix * viewMatrix * worldMatrix * a_position;
  v_normal = a_normal;
}
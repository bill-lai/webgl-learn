attribute vec4 position;
attribute vec4 normal;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 worldMatrix;
uniform mat4 normalMatrix;

varying vec4 v_normal;

void main(){
  v_normal = normalMatrix * normal;
  gl_Position = projectionMatrix * viewMatrix * worldMatrix * position;
}
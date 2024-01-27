attribute vec4 position;
attribute vec3 normal;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 worldMatrix;

varying vec3 v_normal;

void main(){
  gl_Position = projectionMatrix * viewMatrix * worldMatrix * position;
  v_normal = mat3(worldMatrix) * normal;
}
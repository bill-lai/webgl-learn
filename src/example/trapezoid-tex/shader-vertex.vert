attribute vec4 position;
attribute vec2 texcoord;

uniform mat4 prejectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 worldMatrix;


varying vec3 v_texcoord;

void main(){
  gl_Position = prejectionMatrix * viewMatrix * worldMatrix * position;
  v_texcoord = vec3(texcoord, 1) * abs(position.x);
  // v_texcoord = vec3(texcoord, 1);
}
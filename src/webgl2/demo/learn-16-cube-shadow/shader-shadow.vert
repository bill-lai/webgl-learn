#version 300 es

layout(location = 1) in vec4 position;

uniform mat4 projViewMat;
uniform mat4 worldMat;

out vec3 vFragPosition;

void main(){
  vec4 worldPosition = worldMat * position;
  gl_Position = projViewMat * worldPosition;
  vFragPosition = worldPosition.xyz;
}
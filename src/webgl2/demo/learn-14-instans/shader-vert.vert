#version 300 es
layout(location = 0) in vec4 position;
layout(location = 2) in vec2 texcoord;

uniform mat4 projectionMat;
uniform mat4 viewMat;
uniform mat4 worldMat;

out vec2 vTexcoord;

void main(){
  vec4 worldPosition = worldMat * position;
  gl_Position = projectionMat * viewMat * worldPosition;

  vTexcoord = texcoord;
}

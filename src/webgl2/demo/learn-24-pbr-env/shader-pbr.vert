#version 300 es
layout(location = 1) in vec4 position;
layout(location = 2) in vec3 normal;
layout(location = 3) in vec3 tangent;
layout(location = 4) in vec2 texcoord;

uniform mat4 projectionMat;
uniform mat4 viewMat;
uniform mat4 modelMat;
uniform mat4 norMat;
uniform sampler2D normalTex;

out vec2 vTexcoord;
out vec3 vFragPosition;
out vec3 vNormal;


void main(){
  vec4 modelPosition = modelMat * position;
  gl_Position = projectionMat * viewMat * modelPosition;

  vFragPosition = modelPosition.xyz;
  vNormal = mat3(norMat) * normal;
  vTexcoord = texcoord;
}
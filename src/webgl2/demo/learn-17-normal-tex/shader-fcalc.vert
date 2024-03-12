#version 300 es
layout(location = 1) in vec4 position;
layout(location = 2) in vec3 normal;
layout(location = 3) in vec3 tangent;
layout(location = 4) in vec3 bitangent;
layout(location = 5) in vec2 texcoord;

uniform mat4 projectionMat;
uniform mat4 viewMat;
uniform mat4 modelMat;
uniform mat4 normalMat;


out vec2 vTexcoord;
out mat3 vTBN;

void main(){
  gl_Position = projectionMat * viewMat * modelMat * position;
  vTBN = mat3(normalMat) * mat3(tangent, bitangent, normal);
  vTexcoord = texcoord;
}
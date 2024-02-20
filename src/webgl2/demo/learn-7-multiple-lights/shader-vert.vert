#version 300 es
layout(location = 0) in vec4 position;
layout(location = 2) in vec2 texcoord;
layout(location = 1) in vec3 normal;

uniform mat4 projectionMat;
uniform mat4 viewMat;
uniform mat4 worldMat;
uniform mat4 norMat;
uniform mat4 spotTexMat;

out vec2 vTexcoord;
out vec2 vSpotTexcoord;
out vec3 vNormal;
out vec3 vFragPosition;

void main(){
  vec4 worldPosition = worldMat * position;
  gl_Position = projectionMat * viewMat * worldPosition;


  vFragPosition = worldPosition.xyz;
  vNormal = mat3(norMat) * normal;
  vTexcoord = texcoord;

  vec4 spotPos = spotTexMat * worldPosition;
  vSpotTexcoord = (spotPos.xy / spotPos.w) * 0.5 + 0.5;

  vSpotTexcoord = ((gl_Position.xy / gl_Position.w) * 0.5 + 0.5);
}

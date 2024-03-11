#version 300 es
layout(location = 0) in vec4 position;
layout(location = 2) in vec2 texcoord;
layout(location = 3) in mat4 worldMat;

uniform mat4 projectionMat;
uniform mat4 viewMat;
// uniform mat4 worldMats[250];

out vec2 vTexcoord;

void main(){
  // mat4 worldMat = worldMats[gl_InstanceID];

  vec4 worldPosition = worldMat * position;
  gl_Position = projectionMat * viewMat * worldPosition;

  vTexcoord = texcoord;
}

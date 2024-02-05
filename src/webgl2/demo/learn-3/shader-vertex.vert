#version 300 es
in vec4 position;
in vec4 normal;

uniform mat4 projectionMat;
uniform mat4 viewMat;
uniform mat4 worldMat;
uniform mat4 normalMat;

out vec3 vNormal;
out vec4 vWorldPos;

void main() {
  vWorldPos = worldMat * position;
  gl_Position = projectionMat * viewMat * vWorldPos;
  vNormal = (normalMat * normal).xyz;
  // vNormal = normal.xyz;
}
#version 300 es

in vec4 position;
in vec3 normal;

uniform vec3 lightPos;
uniform mat4 projectionMat;
uniform mat4 viewMat;
uniform mat4 worldMat;

out vec3 vLightPos;
out vec3 vNormal;
out vec3 vFragPosition;

void main() {
  vec4 viewPosition = viewMat * worldMat * position;
  gl_Position = projectionMat * viewPosition;

  vLightPos = (viewMat * worldMat * vec4(lightPos, 1)).xyz;
  vNormal = (transpose(inverse(viewMat * worldMat)) * vec4(normal, 1)).xyz;
  vFragPosition = viewPosition.xyz;
}
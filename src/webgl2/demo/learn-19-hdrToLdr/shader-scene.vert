#version 300 es
layout(location = 1) in vec4 position;
layout(location = 2) in vec3 normal;
layout(location = 3) in vec2 texcoord;
layout(location = 4) in vec3 tangent;

#define LIGHT_NUM 4

uniform bool useNor;
uniform mat4 projectionMat;
uniform mat4 viewMat;
uniform mat4 modelMat;
uniform mat3 norMat;
uniform vec3 lightPositions[LIGHT_NUM];

out vec3 vFragPosition;
out vec3 vLightPositions[LIGHT_NUM];
out vec2 vTexcoord;
out vec3 vNormal;

mat3 getTBN(vec3 tangent, vec3 normal, mat3 norMat) {
  vec3 n = normalize(norMat * normal);
  vec3 t = normalize(norMat * tangent);
  // 有可能不是正交需要转换一下，是的效果更加柔和
  t = normalize(t - dot(t, n));
  vec3 b = normalize(cross(n, t));

  return mat3(t, b, n);
}

void main(){
  vec4 modelPosition = modelMat * position;
  gl_Position = projectionMat * viewMat * modelPosition, 1;

  if (useNor) {
    mat3 tbn = transpose(getTBN(tangent, normal, norMat));
    vFragPosition = tbn * modelPosition.xyz;
    for (int i = 0; i < LIGHT_NUM; i++) {
      vLightPositions[i] = tbn * lightPositions[i];
    }
  } else {
    vLightPositions = lightPositions;
    vFragPosition = modelPosition.xyz;
  }
  vNormal = norMat * normal;
  vTexcoord = texcoord;
}
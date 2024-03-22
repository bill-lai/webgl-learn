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

vec3 getNormal() {
  vec3 T = mat3(norMat) * tangent;
  vec3 N = mat3(norMat) * normal;
  T = normalize(T - T * dot(T, N));
  vec3 B = normalize(cross(N, T));
  mat3 tbn = transpose(mat3(T,B,N));
  vec3 rnormal = texture(normalTex, texcoord).rgb * 2. - 1.;
  return tbn * rnormal;
}

void main(){
  vec4 modelPosition = modelMat * position;
  gl_Position = projectionMat * viewMat * modelPosition;

  vFragPosition = modelPosition.xyz;
  // vNormal = getNormal();
  vNormal = normal;
  vTexcoord = texcoord;
}
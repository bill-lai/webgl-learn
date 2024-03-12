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
uniform vec3 lightDirection;

out vec3 vLightDirection;
out vec2 vTexcoord;

// TBN 优化，因为切线和副切线在平均化时可能会出现不垂直，就不是正交矩阵了
mat3 getTBN(vec3 normal, vec3 tangent, mat4 normalMat) {
  vec3 T = normalize(vec3(normalMat * vec4(tangent, 0.0)));
  vec3 N = normalize(vec3(normalMat * vec4(normal, 0.0)));
  // 把 T转到正交
  T = normalize(T - dot(T, N) * N);
  vec3 B = normalize(cross(N, T));

  return mat3(T, B, N);
}

// 将世界坐标转到切线空间
void main(){
  gl_Position = projectionMat * viewMat * modelMat * position;

  // 正交矩阵，转置跟逆转一样，但是转置效率更高
  mat3 TBN = transpose(getTBN(normal, tangent, normalMat));
  vLightDirection = normalize(TBN * lightDirection);
  vTexcoord = texcoord;
}
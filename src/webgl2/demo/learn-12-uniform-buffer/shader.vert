#version 300 es
layout(location = 1) in vec4 position;
layout(location = 2) in vec3 normal;

// 声明内存布局
layout(std140) uniform mats {
  mat4 projectionMat;
  mat4 viewMat;
};

uniform mat4 worldMat;
uniform mat4 normalMat;

out vec3 vNormal;

void main(){
  gl_Position = projectionMat * viewMat * worldMat * position;
  vNormal = mat3(viewMat * normalMat) * normal;
}
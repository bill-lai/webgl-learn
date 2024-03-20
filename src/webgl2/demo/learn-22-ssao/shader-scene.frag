#version 300 es
precision mediump float;

uniform vec3 color;
uniform vec3 lightDirection;
uniform vec3 lightEmission;
uniform vec3 lightDiffuse;
uniform float ligntWeight;
uniform float near;
uniform float far;

in vec3 vNormal;
in vec3 vFragPosition;

layout(location = 0) out vec4 oFragPosition;
layout(location = 1) out vec4 oNormal;
layout(location = 2) out vec4 oFragColor;

// 获取线性的深度值
float getLinearizeDepth(float depth) {
  float z = depth * 2. - 1.;
  return (2. * near * far) / (far + near - z * (far - near));
}

void main(){
  vec3 nor = normalize(vNormal);

  oNormal = vec4(normalize(vNormal), 1);
  oFragPosition = vec4(vFragPosition, getLinearizeDepth(gl_FragCoord.z));
  oFragColor = vec4(color, 1);
}
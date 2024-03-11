#version 300 es
precision mediump float;

uniform sampler2D tex;
uniform samplerCube depthTex;
uniform float farPlane;
uniform vec3 lightPosition;
uniform vec3 eysPosition;

in vec2 vTexcoord;
in vec3 vFragPosition;
in vec3 vNormal;

bool isShadowInner(in vec3 lightToFrag) {
  float depth = texture(depthTex, normalize(lightToFrag)).r * farPlane;
  float currentDepth = length(lightToFrag);
  float bias = 0.02;
  return currentDepth - bias > depth;
}

float getShadowWeight() {
  float shadowWeight = 0.;
  // float diskRadius = 0.01;
  // 距离更远的时候阴影更柔和，更近了就更锐利。
  float diskRadius = (1. + length(eysPosition - lightPosition) / farPlane) / 25.;
  vec3 lightToFrag = vFragPosition - lightPosition;
  for (int i = -1; i <= 1; i++) {
    for (int j = -1; j <= 1; j++) {
      for (int z = -1; z <= 1; z++) {
        vec3 offset = vec3(i, j, z) * diskRadius;
        shadowWeight += isShadowInner(lightToFrag + offset) ? 1. : 0.;
      }
    }
  }
  return shadowWeight / 27.;
}


out vec4 fragColor;
void main(){
  float shadowWeight = getShadowWeight();
  vec3 color = texture(tex, vTexcoord).rgb * (0.3 + 1. - shadowWeight * 0.7);
  fragColor = vec4(color, 1);
}


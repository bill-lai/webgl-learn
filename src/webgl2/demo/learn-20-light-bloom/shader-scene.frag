#version 300 es
precision mediump float;

#define LIGHT_NUM 4

uniform vec3 lightDiffuses[LIGHT_NUM];
uniform vec3 lightPositions[LIGHT_NUM];
uniform sampler2D materialDiffuseTex;

in vec2 vTexcoord;
in vec3 vFragPosition;
in vec3 vNormal;

layout(location = 0) out vec4 fragColor;
layout(location = 1) out vec4 lightColor;

// 返回光照效果下的光照分量
vec3 getLightWeight(vec3 lightPosition, vec3 fragPosition, vec3 lightDiffuse, vec3 normal) {
  vec3 lightDirection = normalize(lightPosition - fragPosition);
  float weight = max(dot(lightDirection, normal), 0.0);
  float distance = length(lightPosition - fragPosition) * 0.3;
  // float distance = 1.0;
  return (weight / (distance * distance )) * lightDiffuse;
}

void main(){
  vec3 normal = normalize(vNormal) * (gl_FrontFacing ? 1. : -1.);
  vec3 color = texture(materialDiffuseTex, vTexcoord).rgb;

  vec3 lighting = vec3(0, 0, 0);
  for (int i = 0; i < LIGHT_NUM; i++) {
    vec3 lWeight = getLightWeight(
      lightPositions[i], 
      vFragPosition, 
      lightDiffuses[i],
      normal
    );
    lighting += color * lWeight;
  }
  fragColor = vec4(lighting, 1);

  // 判断如果颜色超过一定亮度就认为要发光晕
  if (dot(lighting, vec3(0.2126, 0.7152, 0.0722)) > 1.) {
    lightColor = fragColor;
  } else {
    lightColor = vec4(0, 0, 0, 1);
  }
}
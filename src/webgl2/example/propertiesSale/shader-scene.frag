#version 300 es
precision mediump float;

uniform vec3 color;
uniform vec3 lightDirection;
uniform float ligntWeight;
uniform sampler2D depthTex;

in vec3 vNormal;
in vec4 vSubPosition;

bool isShadowInner(vec2 texCoord, float depth, vec3 nor) {
  bool sunInner = texCoord.x >= 0.0 &&
    texCoord.x <= 1.0 &&
    texCoord.y >= 0.0 &&
    texCoord.y <= 1.0;

  // 在太阳视角下的深度
  float sunDepth = texture(depthTex, texCoord).r;
  float bias = max(0.001 * (1. - dot(nor, lightDirection)), 0.0005);

  return sunInner && depth - bias > sunDepth;
}

float getShadowWeight(vec3 nor) {
  vec3 sunVPosition = (vSubPosition.xyz / vSubPosition.w) * 0.5 + 0.5;
  // return isShadowInner(sunVPosition.xy, sunVPosition.z, nor) ? 1. : 0.;
  vec2 texOffset = 1. / vec2(textureSize(depthTex, 0));

  float shadowWeight = 0.;
  for (int i = -2; i <= 2; ++i) {
    for (int j = -2; j <= 2; ++j) {
      shadowWeight += isShadowInner(
        sunVPosition.xy + texOffset * vec2(i, j), 
        sunVPosition.z, 
        nor
      ) ? 1. : 0.;
    }
  }
  return shadowWeight / 25.;
}


out vec4 fragColor;
void main(){
  vec3 nor = normalize(vNormal);
  float shadowWeight = getShadowWeight(nor);

  float emissionWeight = 0.4;
  float direWeight = clamp(dot(lightDirection, nor) * ligntWeight, 0., 1. - shadowWeight); 
  float lightWeight = min(emissionWeight + direWeight, 1.);

  fragColor = vec4(lightWeight * color , 1);
}
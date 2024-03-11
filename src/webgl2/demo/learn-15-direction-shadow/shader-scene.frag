#version 300 es
precision mediump float;

uniform vec3 lightDirection;
uniform sampler2D tex;
uniform sampler2D depthTex;

in vec2 vTexcoord;
in vec4 vLinghtSpacePosition;
in vec3 vNormal;

bool isShadowInner(in vec2 texcoord, in vec3 normal, float currentDepth) {
  bool sunInner = texcoord.x >= 0.0 &&
    texcoord.x <= 1.0 &&
    texcoord.y >= 0.0 &&
    texcoord.y <= 1.0;
  if (!sunInner) {
    return false;
  }

  float depth = texture(depthTex, texcoord).r;
  float bias = max(0.001 * (1. - dot(normal, lightDirection)), 0.0005);
  return currentDepth - bias > depth;
}

float getShadowWeight(in vec3 normal) {
  vec3 lightSpacePosition = vLinghtSpacePosition.xyz / vLinghtSpacePosition.w;
  vec3 lightTexcoord = lightSpacePosition * 0.5 + 0.5;

  vec2 unitTexOffset = 1.0 / vec2(textureSize(depthTex, 0));

  float shadowWeight = 0.;
  for (int i = -1; i <= 1; i++) {
    for (int j = -1; j <= 1; j++) {
      vec2 texcoord = lightTexcoord.xy + vec2(i, j) * unitTexOffset;
      shadowWeight += isShadowInner(texcoord, normal, lightTexcoord.z) ? 1. : 0.;
    }
  }
  return shadowWeight / 9.;
}


out vec4 fragColor;
void main(){
  float shadowWeight = getShadowWeight(normalize(vNormal));
  vec3 color = texture(tex, vTexcoord).rgb * (1. - shadowWeight);
  fragColor = vec4(color, 1);
}


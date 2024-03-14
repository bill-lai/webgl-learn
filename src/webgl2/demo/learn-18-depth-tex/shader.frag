#version 300 es
precision mediump float;

uniform sampler2D diffuseTex;
uniform sampler2D normalTex;
uniform sampler2D depthTex;

in vec2 vTexcoord;
in vec3 vTBNSpaceLightDirection;
in vec3 vTBNSpaceEysPosition;
in vec3 vTBNSpaceFragPosition;

out vec4 fragColor;

// 直接获取，效果不佳
vec2 parallaxMapping(vec2 texcoord, vec3 viewDir) {
  float depthScale = 0.1;
  float depth = texture(depthTex, texcoord).r;
  vec2 offset = viewDir.xy / viewDir.z * (depthScale * depth);

  return texcoord - offset;
}

// 陡峭视差
vec2 parallaxMapping2(vec2 texcoord, vec3 viewDir) {
  float minLayers = 8.0;
  float maxLayers = 16.0;
  float depthScale = 0.1;
  // 优化，根据当前视角计算层数
  float numLayers = mix(maxLayers, minLayers, abs(dot(vec3(0.0, 0.0, 1.0), viewDir)));
  float layerDepth = 1.0 / numLayers;
  float currentLayerDepth = 0.0;
  vec2 p = viewDir.xy * depthScale;
  vec2 unitOffset = p / numLayers;
  vec2 currentTexcoord = texcoord;
  float currentDepth = texture(depthTex, currentTexcoord).r;


  while (currentDepth > currentLayerDepth) {
    currentTexcoord -= unitOffset;
    if (currentTexcoord.x < 0.0 || currentTexcoord.y < 0.0 
      || currentTexcoord.x > 1.0 || currentTexcoord.y > 1.0) {
      discard;
    }
    currentLayerDepth += layerDepth;
    currentDepth = texture(depthTex, currentTexcoord).r;
    
  }

  return currentTexcoord;
}

// 视差遮蔽映射,在陡峭视差得到纹理后 前后插值
vec2 parallaxMapping3(vec2 texcoord, vec3 viewDir) {
  float depthScale = 0.1;
  float minLayers = 8.0;
  float maxLayers = 32.0;
  float numLayers = mix(maxLayers, minLayers, abs(dot(viewDir, vec3(0, 0, 1))));
  float unitLayer = 1. / numLayers;
  vec2 p = viewDir.xy * depthScale;
  vec2 unitOffset = p / numLayers;
  float currentLayerDepth = 0.0;
  vec2 currentTexcoord = texcoord;
  float currentDepth = texture(depthTex, currentTexcoord).r;

  while (currentDepth > currentLayerDepth) {

    currentTexcoord -= unitOffset;
    if (currentTexcoord.x < 0. || currentTexcoord.y < 0.
      || currentTexcoord.x > 1. || currentTexcoord.y > 1.) {
      discard;
    }
    currentLayerDepth += unitLayer;
    currentDepth = texture(depthTex, currentTexcoord).r;
  }

  vec2 prevTexcoord = currentTexcoord + unitOffset;
  float prevDepth = texture(depthTex, prevTexcoord).r;
  float prevLayerDepth = currentLayerDepth - unitLayer;
  float beforeDiffDepth = prevDepth - prevLayerDepth;
  float afterDiffDepth = currentDepth - currentLayerDepth;
// -0.3  0.1  0.25

// 请填写企业名称和对应的统一社会信用代码
  // 前后插值
  float weight = afterDiffDepth / (afterDiffDepth - beforeDiffDepth);
  return prevTexcoord * weight + currentTexcoord * (1.0 - weight);
}


void main(){
  vec3 tbnViewDir = normalize(vTBNSpaceEysPosition - vTBNSpaceFragPosition);
  vec2 texcoord = parallaxMapping3( vTexcoord,  tbnViewDir);
  
  vec3 normal = texture(normalTex, texcoord).rgb * 2.0 - 1.0;
  vec3 color = texture(diffuseTex, texcoord).rgb;
  
  float lightWeight = max(dot(normal, -vTBNSpaceLightDirection), 0.) + 0.2;
  fragColor = vec4(color * (lightWeight + 0.2), 1.0);
  // fragColor = vec4(normal, 1.0);
}
#version 300 es
precision mediump float;

#define LIGHT_NUM 4

uniform vec3 lightDiffuses[LIGHT_NUM];
uniform sampler2D materialDiffuseTex;
uniform sampler2D materialNorTex;
uniform bool useNor;

in vec2 vTexcoord;
in vec3 vFragPosition;
in vec3 vLightPositions[LIGHT_NUM];
in vec3 vNormal;

out vec4 fragColor;

// 返回光照效果下的光照分量
vec3 getLightWeight(vec3 lightPosition, vec3 fragPosition, vec3 lightDiffuse, vec3 normal) {
  vec3 lightDirection = normalize(lightPosition - fragPosition);
  float weight = max(dot(lightDirection, normal), 0.0);
  float distance = length(lightPosition - fragPosition) * 0.3;
  // float distance = 1.0;
  return (weight / (distance * distance )) * lightDiffuse;
}

void main(){
  vec3 normal = vec3(0);
  
  if (useNor) {
    normal = texture(materialNorTex, vTexcoord).rgb * 2. - 1.;
  } else {
    normal = normalize(vNormal);
  }
  if (!gl_FrontFacing) {
    normal *= -1.;
  }

  vec3 color = texture(materialDiffuseTex, vTexcoord).rgb;


  vec3 lighting = vec3(0, 0, 0);
  for (int i = 0; i < LIGHT_NUM; i++) {
    vec3 lWeight = getLightWeight(
      vLightPositions[i], 
      vFragPosition, 
      lightDiffuses[i],
      normal
    );
    lighting += color * lWeight;
  }

  fragColor = vec4(lighting, 1);
}
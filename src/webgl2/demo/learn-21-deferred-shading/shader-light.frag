#version 300 es
precision mediump float;

struct DotLight {
  vec3 position;
  vec3 ambient;
  vec3 diffuse;
  vec3 specluar;

  float constant;
  float linear;
  float quadratic;
};

// 获取光强度
float getATT(
  vec3 fragPosition,
  vec3 lightPosition,
  vec3 lightDiffuse,
  float lightConstant,
  float lightLinear,
  float lightQuadratic
) {
  float d = length(fragPosition - lightPosition);
  return 1. / (lightConstant + d * lightLinear + lightQuadratic * pow(d, 2.));
}

#define NUM_DOT_LIGHT 30

uniform DotLight dotLights[NUM_DOT_LIGHT];
uniform vec3 eysPosition;
uniform sampler2D diffuseTex;
uniform sampler2D specularTex;
uniform sampler2D emissiveTex;
uniform sampler2D normalTex;
uniform sampler2D fragPositionTex;

in vec2 vTexcoord;
out vec4 fragColor;

void main() {
  vec3 fragPosition = texture(fragPositionTex, vTexcoord).xyz;
  vec3 nor = normalize(texture(normalTex, vTexcoord).xyz);
  vec3 diffuse = texture(diffuseTex, vTexcoord).xyz;
  vec3 specular = texture(specularTex, vTexcoord).xyz;
  vec3 emissive = texture(emissiveTex, vTexcoord).xyz;
  float shininess = texture(specularTex, vTexcoord).a;

  vec3 eysDire = normalize(fragPosition - eysPosition);

  vec3 effectColor = emissive * 0.1;
  for(int i = 0; i < NUM_DOT_LIGHT; i++) {
    DotLight dl = dotLights[i];
    float att = getATT(fragPosition, dl.position, dl.diffuse, dl.constant, dl.linear, dl.quadratic);

    vec3 lightDir = normalize(fragPosition - dl.position);
    effectColor += max(dot(-lightDir, nor), 0.f) * diffuse * att;

    vec3 specularColor = pow(max(dot(normalize(-eysDire - lightDir), nor), 0.f), 16.f) * specular * dl.specluar * att;
    effectColor += specularColor;
  }

  fragColor = vec4(effectColor, 1);
}
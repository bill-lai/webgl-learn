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
  float maxLight = max(max(lightDiffuse.r, lightDiffuse.g), lightDiffuse.b);
  return maxLight / (lightConstant + d * lightLinear + lightQuadratic * pow(d, 2.));
}

// 获取光照射下颜色
vec3 getLightEffectColor(
  in vec3 mDiffuse,
  in vec3 mSpecluar,
  in vec3 mEmission,
  in float mShininess,
  in vec2 texcoord,
  in vec3 lightDire,
  in vec3 eysDire,
  in vec3 nor,
  in vec3 lightAmbient,
  in vec3 lightDiffuse,
  in vec3 lightSpecluar
) {
  vec3 ldiffuseColor = max(dot(-lightDire, nor), 0.) * lightDiffuse;
  vec3 lspecluarColor = pow(max(dot(reflect(lightDire, nor), -eysDire), 0.), mShininess) * lightSpecluar;

  return (ldiffuseColor + lightAmbient) * mDiffuse + 
    lspecluarColor * mSpecluar + mEmission;
}


#define NUM_DOT_LIGHT 5

uniform DotLight dotLights[NUM_DOT_LIGHT];
uniform vec3 eysPosition;
uniform sampler2D diffuseTex;
uniform sampler2D specularTex;
uniform sampler2D emissiveTex;
uniform sampler2D normalTex;
uniform sampler2D fragPositionTex;

in vec2 vTexcoord;
out vec4 fragColor;

void main(){
  vec3 fragPosition = texture(fragPositionTex, vTexcoord).xyz;
  vec3 nor = texture(normalTex, vTexcoord).xyz;
  vec3 diffuse = texture(diffuseTex, vTexcoord).xyz;
  vec3 specular = texture(specularTex, vTexcoord).xyz;
  vec3 emissive = texture(emissiveTex, vTexcoord).xyz;
  float shininess = texture(specularTex, vTexcoord).a;

  vec3 eysDire = normalize(fragPosition - eysPosition);

  vec3 effectColor = vec3(0, 0, 0);
  for (int i = 0; i < NUM_DOT_LIGHT; i++) {
    DotLight dl = dotLights[i];
    float att = getATT(
      fragPosition, 
      dl.position, 
      dl.diffuse,
      dl.constant, 
      dl.linear, 
      dl.quadratic
    );
    att = 1.;

    effectColor += getLightEffectColor(
      diffuse,
      specular,
      emissive,
      shininess,
      vTexcoord,
      normalize(fragPosition - dl.position),
      eysDire,
      nor,
      dl.ambient * att,
      dl.diffuse * att,
      dl.specluar * att
    );
  }

  fragColor = vec4(effectColor, 1);
}
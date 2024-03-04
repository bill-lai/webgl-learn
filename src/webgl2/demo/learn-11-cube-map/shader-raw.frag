#version 300 es
precision mediump float;

struct Material {
  sampler2D diffuseTex;
  sampler2D specluarTex;
  sampler2D emissionTex;
  vec3 diffuse;
  vec3 specular;
  vec3 emissive;
  float shininess;
};

struct DotLight {
  vec3 position;
  vec3 ambient;
  vec3 diffuse;
  vec3 specluar;
};

// 获取光照射下颜色
vec3 getLightEffectColor(
  in Material material,
  in vec2 texcoord,
  in vec3 lightDire,
  in vec3 eysDire,
  in vec3 nor,
  in vec3 lightAmbient,
  in vec3 lightDiffuse,
  in vec3 lightSpecluar,
  in vec3 reflectionColor
) {
  vec3 diffuseTexColor = texture(material.diffuseTex, texcoord).rgb + material.diffuse;
  vec3 specluarTexColor = texture(material.specluarTex, texcoord).rgb + material.specular;
  vec3 emissionTexColor = texture(material.emissionTex, texcoord).rgb + material.emissive; 

  vec3 ldiffuseColor = max(dot(-lightDire, nor), 0.) * lightDiffuse;
  vec3 lspecluarColor = pow(max(dot(reflect(lightDire, nor), -eysDire), 0.), material.shininess) * lightSpecluar;

  return 
    (ldiffuseColor + lightAmbient) * diffuseTexColor + 
    lspecluarColor * specluarTexColor * reflectionColor +
    emissionTexColor;
}


uniform DotLight dl;
uniform Material material;
uniform vec3 eysPosition;
uniform samplerCube envTex;

in vec2 vTexcoord;
in vec3 vNormal;
in vec3 vFragPosition;

out vec4 fragColor;

void main(){
  vec3 nor = normalize(vNormal);
  vec3 eysDire = normalize(vFragPosition - eysPosition);
  vec3 lightDire = normalize(vFragPosition - dl.position);

  // 模拟反光
  vec3 reflectionColor = texture(envTex, reflect(eysDire, nor)).rgb;


  vec3 eColor = getLightEffectColor(
    material,
    vTexcoord,
    lightDire,
    eysDire,
    nor,
    dl.ambient,
    dl.diffuse,
    dl.specluar,
    reflectionColor
  );

  fragColor = vec4(eColor, 1);
  // fragColor = vec4(reflectionColor, 1);
}
#version 300 es
precision mediump float;

struct Material {
  sampler2D diffuseTex;
  sampler2D specluarTex;
  // 自身发光
  sampler2D emissionTex;
  float shininess;
};
struct Light {
  vec3 direction;
  vec3 ambient;
  vec3 diffuse;
  vec3 specluar;
};

uniform Material material;
uniform Light light;
uniform vec3 eysPosition;

in vec3 vNormal;
in vec3 vFragPosition;
in vec2 vTexcoord;
out vec4 fragColor;

vec3 calcFragColor(
  in Material material,
  in vec2 texcoord,
  in vec3 lightDire,
  in vec3 eysDire,
  in vec3 nor,
  in vec3 lightAmbient,
  in vec3 lightDiffuse,
  in vec3 lightSpecluar
) {
  vec3 diffuseTexColor = texture(material.diffuseTex, texcoord).rgb;
  vec3 specluarTexColor = texture(material.specluarTex, texcoord).rgb;
  vec3 emissionTexColor = texture(material.emissionTex, texcoord).rgb;

  vec3 ambientColor = diffuseTexColor * lightAmbient;
  vec3 diffuseColor = lightDiffuse * diffuseTexColor * max(dot(nor, -lightDire), 0.f);

  float spe = max(dot(reflect(lightDire, nor), -eysDire), 0.f);
  vec3 specluarColor = pow(spe, material.shininess) * specluarTexColor * lightSpecluar;

  return emissionTexColor + ambientColor + diffuseColor + specluarColor;
}

void main() {
  vec3 nor = normalize(vNormal);
  vec3 lightDire = normalize(light.direction);
  vec3 eysDire = normalize(vFragPosition - eysPosition);

  vec3 oColor = calcFragColor(material, vTexcoord, lightDire, eysDire, nor, light.ambient, light.diffuse, light.specluar);
  fragColor = vec4(oColor, 1);
}
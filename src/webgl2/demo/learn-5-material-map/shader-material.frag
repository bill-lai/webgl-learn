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
  vec3 position;
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

void main() {
  vec3 nor = normalize(vNormal);
  vec3 lightDire = normalize(vFragPosition - light.position);
  vec3 eysDire = normalize(vFragPosition - eysPosition);

  vec3 diffuseTexColor = texture(material.diffuseTex, vTexcoord).rgb;
  // vec3 specluarTexColor = 1.f - texture(material.specluarTex, vTexcoord).rgb;
  vec3 specluarTexColor = texture(material.specluarTex, vTexcoord).rgb;
  vec3 emissionTexColor = texture(material.emissionTex, vTexcoord).rgb;
  vec3 ambientColor = diffuseTexColor * light.ambient;
  vec3 diffuseColor = light.diffuse * diffuseTexColor * max(dot(nor, -lightDire), 0.f);

  float spe = max(dot(reflect(lightDire, nor), -eysDire), 0.f);
  vec3 specluarColor = pow(spe, material.shininess) * specluarTexColor * light.specluar;

  fragColor = vec4(emissionTexColor + ambientColor + diffuseColor + specluarColor, 1);
}
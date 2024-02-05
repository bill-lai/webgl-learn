#version 300 es
precision mediump float;

struct Material {
  vec3 ambient;
  vec3 diffuse;
  vec3 specluar;
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

out vec4 fragColor;

void main() {
  vec3 nor = normalize(vNormal);
  vec3 lightDire = normalize(vFragPosition - light.position);
  vec3 eysDire = normalize(vFragPosition - eysPosition);

  vec3 ambientColor = material.ambient * light.ambient;
  vec3 diffuseColor = light.diffuse * material.diffuse * max(dot(nor, -lightDire), 0.f);

  float spe = max(dot(reflect(lightDire, nor), -eysDire), 0.f);
  vec3 specluarColor = pow(spe, material.shininess) * material.specluar * light.specluar;

  fragColor = vec4(ambientColor + diffuseColor + specluarColor, 1);

  // fragColor = vec4(light.diffuse, 1);
  // fragColor = vec4(1, 1, 1, 1);
}
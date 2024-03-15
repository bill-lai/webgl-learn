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
uniform Material material;
uniform float id;

in vec2 vTexcoord;
in vec3 vNormal;
in vec3 vFragPosition;

layout (location = 0) out vec4 diffuseColor;
layout (location = 1) out vec4 specularColor;
layout (location = 2) out vec4 emissiveColor;
layout (location = 3) out vec4 normal;
layout (location = 4) out vec4 fragPosition;



void main(){
  diffuseColor = vec4(texture(material.diffuseTex, vTexcoord).rgb + material.diffuse, 1);
  specularColor = vec4(texture(material.specluarTex, vTexcoord).rgb + material.specular, material.shininess);
  emissiveColor = vec4(texture(material.emissionTex, vTexcoord).rgb + material.emissive, 1);
  fragPosition = vec4(vFragPosition, id);
  normal = vec4(normalize(vNormal), 1);
}
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
in vec2 vTexcoord;

out vec4 fragColor;

void main(){
  vec3 effectColor = vec3(0, 0, 0);
  effectColor += texture(material.diffuseTex, vTexcoord).rgb ;
  fragColor = vec4(effectColor, 1);
  // fragColor = vec4(vTexcoord, 1, 1);
}
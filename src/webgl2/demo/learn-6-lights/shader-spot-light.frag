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
  vec3 direction;
  vec3 ambient;
  vec3 diffuse;
  vec3 specluar;

  // 内切cos角度值
  float cutOff;
  // 外切cos角度值
  float outerOff;

  // 衰减参数
  float constant;
  // 线性系数，直线衰减
  float linear;
  // 二次曲线系数
  float quadratic;
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
  vec3 lightToFace = normalize(light.direction);
  vec3 lightDire = normalize(vFragPosition - light.position);
  vec3 eysDire = normalize(vFragPosition - eysPosition);

  float theta = dot(lightToFace, lightDire);
  float att = clamp((theta - light.outerOff) /  (light.cutOff - light.outerOff), 0., 1.);
  
  if (att > 0.) {
    float d = length(vFragPosition - light.position);
    att *= 1.f / (light.constant + light.linear * d + light.quadratic * pow(d, 2.f));
  }

  vec3 oColor = calcFragColor(
    material, 
    vTexcoord, 
    lightDire, 
    eysDire, 
    nor, 
    // 让物体变暗，但是还是得有点环境光
    light.ambient, 
    light.diffuse * att, 
    light.specluar * att
  );
  fragColor = vec4(oColor, 1);
}
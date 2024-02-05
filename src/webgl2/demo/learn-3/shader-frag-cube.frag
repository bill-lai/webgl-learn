#version 300 es
precision mediump float;

// 吸收反色分量
uniform vec3 objectColor;
uniform vec3 lightPos;
// 照射总量
uniform vec3 lightColor;
uniform vec3 eysPos;
uniform float ambient;
uniform float shininess;
uniform float specular;

in vec3 vNormal;
in vec4 vWorldPos;

out vec4 fragColor;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 worldPos = vWorldPos.xyz;
  vec3 lightDire = normalize(worldPos - lightPos);
  vec3 eysDire = normalize(eysPos - worldPos);

  vec3 ambientColor = ambient * lightColor;
  vec3 diffuseColor = max(dot(-lightDire, normal), 0.f) * lightColor;

  float spe = max(dot(reflect(lightDire, normal), eysDire), 0.f);
  vec3 specularColor = pow(spe, shininess) * specular * lightColor;

  fragColor = vec4((specularColor + diffuseColor + ambientColor) * objectColor, 1);
}
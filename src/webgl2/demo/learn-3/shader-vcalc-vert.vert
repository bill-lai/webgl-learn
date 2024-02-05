#version 300 es
in vec4 position;
in vec4 normal;

uniform mat4 projectionMat;
uniform mat4 viewMat;
uniform mat4 worldMat;
uniform mat4 normalMat;

// 吸收反色分量
uniform vec3 lightPos;
// 照射总量
uniform vec3 lightColor;
uniform vec3 eysPos;
uniform float ambient;
uniform float shininess;
uniform float specular;

out vec3 vFragColor;
out vec3 vLightColor;

void main() {
  gl_Position = projectionMat * viewMat * worldMat * position;
  vec3 worldPos = (worldMat * position).xyz;
  vec3 nor = normalize((normalMat * normal).xyz);

  vec3 lightDire = normalize(worldPos - lightPos);
  vec3 eysDire = normalize(eysPos - worldPos);

  vec3 ambientColor = ambient * lightColor;
  vec3 diffuseColor = max(dot(-lightDire, nor), 0.f) * lightColor;

  float spe = max(dot(reflect(lightDire, nor), eysDire), 0.f);
  vec3 specularColor = pow(spe, shininess) * specular * lightColor;

  vFragColor = specularColor + diffuseColor + ambientColor;

  vLightColor = lightColor;
}
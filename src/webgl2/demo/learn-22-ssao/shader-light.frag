#version 300 es
precision mediump float;

uniform sampler2D fragPositionTex;
uniform sampler2D normalTex;
uniform sampler2D colorTex;
uniform sampler2D ssaoTex;
uniform sampler2D shadowTex;
uniform mat4 sunViewProjectionMat;
uniform vec3 lightDirection;
uniform vec3 lightEmission;
uniform vec3 lightDiffuse;
uniform float ligntWeight;

in vec2 vTexcoord;

float getShadowWeight(in vec3 nor) {
  vec3 fragPosition = texture(fragPositionTex, vTexcoord).xyz;
  vec4 position = sunViewProjectionMat * vec4(fragPosition, 1);
  position /= position.w;
  vec2 uv = position.xy * 0.5 + 0.5;

  if (uv.x < 0. || uv.x > 1. || uv.y < 0. || uv.y > 1.) {
    return 0.;
  }
  float nearDepth = texture(shadowTex, uv).r * 2. - 1.;
  float realDepth = position.z;
  float bias = max(0.001 * (1. - dot(nor, lightDirection)), 0.0005);
  return realDepth - nearDepth > bias ? 0.3 : 0.;
}

out vec4 oFragColor;
void main(){
  vec3 nor = texture(normalTex, vTexcoord).xyz;
  vec3 color = texture(colorTex, vTexcoord).rgb;
  float occlusion = texture(ssaoTex, vTexcoord).r;

  float shadowWeight = getShadowWeight(nor);

  float direWeight = clamp(dot(lightDirection, nor) * (ligntWeight - shadowWeight), 0., 1.); 
  vec3 result = (lightDiffuse * direWeight + lightEmission * occlusion) * color;

  oFragColor = vec4(result, 1.);
}
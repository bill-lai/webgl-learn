#version 300 es
precision mediump float;

uniform samplerCube envTex;
uniform float eta;
uniform vec3 eysPosition;

in vec3 vFragPosition;
in vec3 vNormal;

out vec4 fragColor;
void main(){
  vec3 nor = normalize(vNormal);
  vec3 eysDirection = normalize(vFragPosition - eysPosition);
  fragColor = texture(envTex, refract(eysDirection, nor, eta));
}
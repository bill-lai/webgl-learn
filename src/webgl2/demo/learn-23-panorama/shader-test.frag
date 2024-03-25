#version 300 es
precision mediump float;


uniform samplerCube envTex;

in vec4 vLocPosition;


out vec4 vFragColor;
void main(){
  vec3 nor = normalize(vLocPosition.xyz / vLocPosition.w);
  vec3 color = texture(envTex, nor ).rgb;
  vFragColor = vec4(color, 1);
  // vFragColor = vec4(normalize(vLocPosition.xyz / vLocPosition.w), 1);
}

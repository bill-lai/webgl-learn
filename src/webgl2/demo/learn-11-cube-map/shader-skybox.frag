#version 300 es
precision mediump float;

uniform samplerCube envTex;
uniform mat4 invMat;

in vec4 vFragPosition;
out vec4 fragColor;
void main(){
  vec4 realPosition = invMat * vFragPosition;
  vec3 realDirection = normalize(realPosition.xyz / vFragPosition.w);
  fragColor = texture(envTex, realDirection);
}
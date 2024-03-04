#version 300 es
precision mediump float;

in vec3 vNormal;
out vec4 fragColor;
void main(){
  fragColor = vec4(vNormal.grb, 1);
}
#version 300 es
precision mediump float;

uniform samplerCube cubeTex;

in vec3 vTexcoord;
out vec4 fragColor;
void main(){
  fragColor = texture(cubeTex, vTexcoord);
}
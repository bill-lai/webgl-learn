#version 300 es
precision mediump float;

uniform sampler2D colorTex;

in vec2 vTexcoord;

out vec4 fragColor;
void main(){
  vec4 texColor = texture(colorTex, vTexcoord);
  fragColor = texColor;
}
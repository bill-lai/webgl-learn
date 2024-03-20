#version 300 es
precision mediump float;

uniform sampler2D colorTex;

in vec2 vTexcoord;
out vec4 oFragcolor;

const float gamma = 2.2;

void main(){
  vec3 color = texture(colorTex, vTexcoord).rgb;

  color = pow(color, vec3(1./gamma));
  oFragcolor = vec4(color, 1);
}
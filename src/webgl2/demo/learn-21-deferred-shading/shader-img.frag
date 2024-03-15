#version 300 es
precision mediump float;
uniform sampler2D colorTex;

in vec2 vTexcoord;

out vec4 fragColor;

const float gamma = 2.2;

void main(){
  vec3 color = texture(colorTex, vTexcoord).rgb;
  // 曝光平衡
  vec3 mapped = vec3(1) - exp(-color * 1.);

  mapped = pow(mapped, vec3(1.0 / gamma));
  fragColor = vec4(mapped, 1);
}
#version 300 es
precision mediump float;

uniform sampler2D tex;
uniform float[9] kernel;

in vec2 vTexcoord;

out vec4 oColor;

void main(){
  // 一个像素多少纹理
  vec2 onePixel = vec2(1, 1) / vec2(textureSize(tex, 0));

  int ndx = 0;
  float kernelWeight = 0.;
  vec4 sumColor = vec4(0, 0, 0, 0);
  for (int u = -1; u <= 1; u++) {
    for (int v = -1; v <= 1; v++) {
      kernelWeight += kernel[ndx];
      sumColor += texture(tex, vTexcoord + vec2(u, v) * onePixel) * kernel[ndx];
      ndx++;
    }
  }

  oColor = vec4(sumColor.rgb / (kernelWeight <= 0. ? 1. : kernelWeight), 1);
}
#version 300 es
precision mediump float;

#define NUM_KERNEL 9

uniform float kernels[NUM_KERNEL];
uniform sampler2D colorTex;

in vec2 vTexcoord;
out vec4 oFragcolor;

void main(){
  vec2 uvOffset = 1. / vec2(textureSize(colorTex, 0));
  float size = sqrt(float(NUM_KERNEL));
  float start = (size - 1.) / 2.;

  vec3 result = vec3(0, 0, 0);
  for(int i = 0; i <= NUM_KERNEL; i++) {
    float x = mod(float(float(i)), size) - start;
    float y = floor(float(float(i)) / size) - start;
    vec2 uv = vTexcoord + vec2(x, y) * uvOffset;
    result += texture(colorTex, uv).rgb * kernels[i];
  }

  oFragcolor = vec4(result, 1);
}
#version 300 es
precision mediump float;

uniform sampler2D colorTex;
uniform bool hor;

in vec2 vTexcoord;

// 周围像素影响
const float weight[5] = float[](0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);

out vec4 fragColor;
void main(){
  vec2 unitTexcoord = 1.0 / vec2(textureSize(colorTex, 0));
  vec2 offset = hor ? vec2(unitTexcoord.x, 0) : vec2(0, unitTexcoord.y);
  // vec2 offset = vec2(0, 0);

  vec3 result = vec3(0, 0, 0);
  for (int i = 0; i < 5; i++) {
    result += texture(colorTex, vTexcoord + offset * float(i)).rgb * weight[i];
    result += texture(colorTex, vTexcoord - offset * float(i)).rgb * weight[i];
  }
  fragColor = vec4(result, 1);
}
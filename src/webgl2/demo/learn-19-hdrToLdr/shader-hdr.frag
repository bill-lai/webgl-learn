#version 300 es
precision mediump float;

// 曝光度，  
// 曝光度越高保留黑暗细节越多，光亮处细节越少  
// 曝光越低保留黑暗细节越少，光亮处细节越多
uniform float exposure;
uniform sampler2D colorTex;

in vec2 vTexcoord;

out vec4 fragColor;

const float gamma = 2.2;
void main(){
  vec3 color = texture(colorTex, vTexcoord).rgb;

  // 贴图颜色可能超过1 从HDR调到LDR
  // vec3 mapped = color / (color + vec3(1.));

  // 使用曝光度调整, 曝光度算法
  vec3 mapped = vec3(1) - exp(-color * exposure);

  // gamma矫正
  mapped = pow(mapped, vec3(1.0 / gamma));
  fragColor = vec4(mapped, 1);
}
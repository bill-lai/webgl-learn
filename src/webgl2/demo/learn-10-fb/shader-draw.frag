#version 300 es
precision highp float;

uniform sampler2D colorTex;

in vec2 vTexcoord;

const float offset = 1. / 300.;

out vec4 fragColor;
void main(){
  // 反相
  // vec4 texColor = texture(colorTex, vTexcoord);
  // fragColor = vec4(1. - texColor.rgb, 1);

  // 灰度
  // vec4 texColor = texture(colorTex, vTexcoord);
  // float average = (texColor.r + texColor.g + texColor.b) / 3.;
  // float average = 0.2126 * texColor.r + 0.7152 * texColor.g + 0.0722 * texColor.b;
  // fragColor = vec4(average, average, average, 1);

  // 使用集卷

  // 锐化
  float kernel[9] = float[](
      -1., -1., -1.,
      -1.,  9., -1.,
      -1., -1., -1.
  );
  // // 模糊
  // float kernel[9] = float[](
  //   1.0 / 16., 2.0 / 16., 1.0 / 16.,
  //   2.0 / 16., 4.0 / 16., 2.0 / 16.,
  //   1.0 / 16., 2.0 / 16., 1.0 / 16.  
  // );
  // // 边缘检测
  // float kernel[9] = float[](
  //     1., 1., 1.,
  //     1.,  -8., 1.,
  //     1., 1., 1.
  // );
  vec2 offsets[9] = vec2[](
    vec2(-offset,  offset), // 左上
    vec2( 0.0f,    offset), // 正上
    vec2( offset,  offset), // 右上
    vec2(-offset,  0.0f),   // 左
    vec2( 0.0f,    0.0f),   // 中
    vec2( offset,  0.0f),   // 右
    vec2(-offset, -offset), // 左下
    vec2( 0.0f,   -offset), // 正下
    vec2( offset, -offset)  // 右下
  );
  vec3 sumColor = vec3(0, 0, 0);
  for (int i = 0; i < 9; i++) {
    sumColor += texture(colorTex, vTexcoord + offsets[i]).rgb * kernel[i];
  }
  fragColor = vec4(sumColor, 1);
}
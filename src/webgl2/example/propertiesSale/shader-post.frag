#version 300 es
precision mediump float;

uniform sampler2D tex;

in vec2 vTexcoord;
out vec4 fragColor;

const float offset = 1. / 600.;

void main(){
  fragColor = texture(tex, vTexcoord);


  // 正常
  float kernel[9] = float[](
      0.,0.,0.,
      0.,1.,0.,
      0.,0.,0.
  );

  // // 锐化
  // float kernel[9] = float[](
  //     -1., -1., -1.,
  //     -1.,  9., -1.,
  //     -1., -1., -1.
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
    sumColor += texture(tex, vTexcoord + offsets[i]).rgb * kernel[i];
  }
  fragColor = vec4(sumColor, 1);
  // fragColor = vec4(pow(sumColor, vec3(1./2.2)), 1);
}
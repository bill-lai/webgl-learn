precision mediump float;

uniform sampler2D u_texture;
// 当前绘制的尺寸
uniform vec2 u_dstSize;
// 当前元数据贴图尺寸
uniform vec2 u_texSize;

// 通过下标获取贴图数据
vec4 getTextureData(sampler2D texture, vec2 size, float index) {
  float us = mod(index, size.x);
  float vs = floor(index / size.x);
  // 获取值需要前往中心
  vec2 uv = (vec2(us, vs) + 0.5) / size;
  return texture2D(texture, uv);
}

void main(){
  // 当前绘制的位置
  vec2 dstPixel = floor(vec2(gl_FragCoord.xy));
  float index = dstPixel.x + dstPixel.y * u_dstSize.x;

  // 因为两两计算所以每次取两个并且两倍
  vec4 v1 = getTextureData(u_texture, u_texSize, index * 2.0);
  vec4 v2 = getTextureData(u_texture, u_texSize, index * 2.0 + 1.0);

  gl_FragColor = v1 + v2;
}
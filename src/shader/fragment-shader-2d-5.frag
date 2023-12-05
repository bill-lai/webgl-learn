precision mediump float;

uniform sampler2D u_texture;
uniform vec2 u_textureSize;

varying vec2 v_texCoord;

void main(){
  // 一个像素对应的纹理坐标偏移量
  vec2 onePixed = vec2(1, 1) / u_textureSize;
  // gl_FragColor = texture2D(u_texture, v_texCoord).bgra;
  // gl_FragColor = texture2D(u_texture, v_texCoord);
  // x左右中的颜色平均值
  gl_FragColor = (
    texture2D(u_texture, v_texCoord) + 
    texture2D(u_texture, v_texCoord + vec2(onePixed.x, 0)) +
    texture2D(u_texture, v_texCoord - vec2(onePixed.x, 0))
  ) / 3.0;
}
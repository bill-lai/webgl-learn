precision mediump float;

// 贴图
// 默认使用0单元贴图
uniform sampler2D u_texture;
// 贴图尺寸
uniform vec2 u_textureSize;
// 集卷内核
uniform float u_kernel[9];
// 集卷权重
uniform float u_kernelWidth;

// 着色坐标[0, 1]
varying vec2 v_texCoord;

void main(){
  vec2 onePiex = vec2(1, 1) / u_textureSize;
  vec4 colorSum = texture2D(u_texture, v_texCoord + onePiex * vec2(-1, -1)) * u_kernel[0] + 
    texture2D(u_texture, v_texCoord + onePiex * vec2(0, -1)) * u_kernel[1] + 
    texture2D(u_texture, v_texCoord + onePiex * vec2(1, -1)) * u_kernel[2] + 
    texture2D(u_texture, v_texCoord + onePiex * vec2(-1, 0)) * u_kernel[3] + 
    texture2D(u_texture, v_texCoord + onePiex * vec2(0, 0)) * u_kernel[4] + 
    texture2D(u_texture, v_texCoord + onePiex * vec2(1, 0)) * u_kernel[5] + 
    texture2D(u_texture, v_texCoord + onePiex * vec2(-1, 1)) * u_kernel[6] + 
    texture2D(u_texture, v_texCoord + onePiex * vec2(0, 1)) * u_kernel[7] + 
    texture2D(u_texture, v_texCoord + onePiex * vec2(1, 1)) * u_kernel[8];

  gl_FragColor = vec4((colorSum / u_kernelWidth).rgb, 1);
}
precision mediump float;

uniform sampler2D u_texture;
uniform sampler2D u_projectedTexture;
uniform vec4 u_colorMult;

varying vec2 v_texcoord;
varying vec4 v_projectedTexcoord;

void main(){
  // 贴图要用到的w值一定要传入片段着色器使用，不然插值会错乱
  vec2 projectedTexcoord = (v_projectedTexcoord.xyz / v_projectedTexcoord.w).xy;
  bool inRange = projectedTexcoord.x < 1.0 &&
    projectedTexcoord.x > 0.0 &&
    projectedTexcoord.y < 1.0 &&
    projectedTexcoord.y > 0.0;

  vec4 texColor = texture2D(u_texture, v_texcoord) * u_colorMult;
  vec4 projectedColor = texture2D(u_projectedTexture, projectedTexcoord);

  float projectedAmount = inRange ? 1.0 : 0.0;

  gl_FragColor = mix(texColor, projectedColor, projectedAmount);

  // gl_FragColor = texture2D(u_texture, v_texcoord) * u_colorMult;
  // gl_FragColor = texture2D(u_texture, v_texcoord);
}
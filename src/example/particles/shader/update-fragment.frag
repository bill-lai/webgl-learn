// 职责，更新位置
precision highp float;


// 速度贴图
uniform sampler2D u_velocityTex;
// 位置贴图
uniform sampler2D u_positionTex;
// 要应用的画布大小，超出时取余
uniform vec2 u_canvasSize;
// 贴图尺寸
uniform vec2 u_texSize;
// 当前时间 - 上次更新时间
uniform float u_deltaTime;

void main(){
  // 直接使用当前绘制像素坐标作为uv坐标
  vec2 uv = (gl_FragCoord.xy - 0.5) / u_texSize;
  
  vec2 position = texture2D(u_positionTex, uv).xy;
  vec2 velocity = texture2D(u_velocityTex, uv).xy;
  // vec2 newPosition = position + velocity * u_deltaTime;
  // newPosition = mod(mod(newPosition, u_canvasSize) + u_canvasSize, u_canvasSize);
  // 位置不能超过canvas
  vec2 newPosition = mod(position + velocity * u_deltaTime, u_canvasSize);

  gl_FragColor = vec4(newPosition, 0, 1);
}
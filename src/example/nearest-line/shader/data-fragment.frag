precision highp float;

uniform sampler2D u_tex;
uniform vec2 u_texSize;
uniform vec2 u_boxSize;
uniform float u_deltaTime;

void main(){
  // gl_FragCoord本身就是中心点
  vec2 uv = gl_FragCoord.xy / u_texSize;
  vec4 data = texture2D(u_tex, uv);
  vec2 position = data.xy;
  vec2 velocity = data.zw;

  vec2 newPosition = clamp(
    position + velocity * u_deltaTime, 
    vec2(0, 0), 
    u_boxSize
  );

  float xreversal = newPosition.x == 0.0 || newPosition.x == u_boxSize.x ? -1.0 : 1.0;
  float yreversal = newPosition.y == 0.0 || newPosition.y == u_boxSize.y ? -1.0 : 1.0;
  velocity.x *= xreversal;
  velocity.y *= yreversal;

  gl_FragColor = vec4(newPosition, velocity);
}
attribute float a_nlid;

uniform mat4 u_projectionMatrix;

uniform sampler2D u_pointsTex;
uniform vec2 u_pointsTexSize;

uniform sampler2D u_nearLineTex;
uniform vec2 u_nearLineSize;

uniform sampler2D u_linesTex;
uniform vec2 u_linesTexSize;

varying vec3 v_color;

vec4 getTexData(sampler2D tex, vec2 size, float index) {
  float su = mod(index, size.x) + 0.5;
  float sv = floor(index / size.x) + 0.5;
  vec2 uv = vec2(su, sv) / size;
  return texture2D(tex, uv);
}

vec3 hsv2rgb(vec3 c) {
  c = vec3(c.x, clamp(c.yz, 0.0, 1.0));
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main(){
  float pointId = floor(a_nlid / 2.0);
  vec4 lineCode = getTexData(u_nearLineTex, u_nearLineSize, pointId);
  float lineId = dot(lineCode, vec4(255, 256 * 255, 256 * 256 * 255, 256 * 256 * 256 * 255));
  float linePointId = lineId * 2.0 + mod(a_nlid, 2.0);
  vec3 position = vec3(getTexData(u_linesTex, u_linesTexSize, linePointId).xy, 0);


  float hue = pointId / (u_pointsTexSize.x * u_pointsTexSize.y);
  v_color = hsv2rgb(vec3(hue, 1, 1));

  gl_Position = u_projectionMatrix * vec4(position, 1);
}
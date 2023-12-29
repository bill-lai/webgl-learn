attribute float a_lid;

uniform mat4 u_projectionMatrix;
uniform sampler2D u_linesTex;
uniform vec2 u_linesTexSize;

vec4 getTexData(sampler2D tex, vec2 size, float index) {
  float su = mod(index, size.x) + 0.5;
  float sv = floor(index / size.x) + 0.5;
  vec2 uv = vec2(su, sv) / size;
  return texture2D(tex, uv);
}

void main(){
  vec2 position = getTexData(u_linesTex, u_linesTexSize, a_lid).xy;
  gl_Position = u_projectionMatrix * vec4(position, 0, 1);
  // gl_PointSize = 5.0;
}
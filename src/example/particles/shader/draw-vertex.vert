attribute float a_id;

uniform mat4 u_projectiomMatrix;
uniform sampler2D u_positionTex;
uniform vec2 u_texSize;


vec4 getTextureData(sampler2D tex, vec2 size, float index) {
  float su = mod(index, size.x);
  float sv = floor(index / size.x);
  vec2 uv = (vec2(su, sv) + 0.5) / size;
  return texture2D(tex, uv);
}

void main(){
  vec4 position = getTextureData(u_positionTex, u_texSize, a_id);
  gl_Position = u_projectiomMatrix * vec4(position.xy, 0, 1);
  gl_PointSize = 10.0;
}
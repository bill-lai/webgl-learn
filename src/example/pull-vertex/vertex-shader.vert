attribute vec2 a_index;

uniform mat4 meshMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform sampler2D positionTex;
uniform vec2 positionTexSize;
uniform sampler2D uvTex;
uniform vec2 uvTexSize;

varying vec2 v_texcoord;

vec4 getTexData(sampler2D tex, vec2 texSize, float index) {
  float su = mod(index, texSize.x);
  float sv = floor(index / texSize.x);
  vec2 uv = (vec2(su, sv) + 0.5) / texSize;
  return texture2D(tex, uv);
}

void main(){
  vec3 position = getTexData(positionTex, positionTexSize, a_index.x).xyz;
  v_texcoord = getTexData(uvTex, uvTexSize, a_index.y).xy;

  gl_Position = projectionMatrix * viewMatrix * meshMatrix * vec4(position, 1);
}
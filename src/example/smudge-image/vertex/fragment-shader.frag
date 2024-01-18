precision mediump float;

uniform sampler2D texture;

varying vec2 v_texcoord;

void main(){
  vec2 texcoord = vec2(v_texcoord.x, 1.0 - v_texcoord.y);
  gl_FragColor = texture2D(texture, texcoord);
}
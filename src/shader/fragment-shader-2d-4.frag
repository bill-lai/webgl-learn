precision mediump float;

uniform sampler2D u_texture;

void main(){
  vec2 texcoord = vec2(0.5, 0.5);
  gl_FragColor = texture2D(u_texture, texcoord);
}
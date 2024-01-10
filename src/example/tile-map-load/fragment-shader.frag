precision mediump float;

uniform sampler2D mapTex;

varying vec2 v_texcoord;

void main(){
  gl_FragColor = texture2D(mapTex, v_texcoord);
  // gl_FragColor = vec4(1, 0, 0, 1);
}
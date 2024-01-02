precision mediump float;

uniform sampler2D cubeTex;

varying vec2 v_texcoord;

void main(){
  gl_FragColor = texture2D(cubeTex, v_texcoord);
  // gl_FragColor = vec4(1, 0, 0, 1);
}
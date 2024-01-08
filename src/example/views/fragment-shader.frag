precision mediump float;

varying vec4 v_normal;

void main(){
  gl_FragColor = normalize(v_normal);
}
precision mediump float;

varying float cliped;

void main(){
  if (cliped > 0.0) {
    discard;
  }

  if (gl_FrontFacing) {
    gl_FragColor = vec4(1, 0, 0, 1);
  } else {
    gl_FragColor = vec4(0, 0, 1, 1);
  }
}
precision mediump float;

varying vec4 v_color;
varying vec2 v_texcoord;

void main(){
  vec2 texcoord = v_texcoord * 2.0 - 1.0;
  float inInner = step(1.0, length(texcoord));
  if (inInner < 1.0) {
    gl_FragColor = v_color;
  } else {
    discard;
  }
}
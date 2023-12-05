precision mediump float;

uniform vec4 u_colorMut;

varying vec4 v_color;

void main(){
  gl_FragColor = v_color * u_colorMut;
}
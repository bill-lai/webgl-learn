precision mediump float;

uniform vec4 u_colorMult;
uniform vec4 u_colorOffset;

varying vec4 v_color;

void main(){
  
  gl_FragColor = v_color * u_colorMult * u_colorOffset;
}
precision mediump float;

uniform float time;

varying float v_travel;

void main(){
  // x - floor(x)
  float u = fract(time + v_travel);
  gl_FragColor = vec4(0, u, 0, 1);
}

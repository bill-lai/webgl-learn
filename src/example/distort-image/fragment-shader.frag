precision mediump float;

uniform sampler2D texture;
uniform float time;

varying vec2 v_texcoord;

float upDown(float t) {
  return sin(t) * 0.5 + 0.5;
}
float distort(float referTo, float t1, float t2) {
  float offset1 = sin((referTo + 0.5) * mix(1., 6., upDown(t1))) * .1;
  float offset2 = sin((referTo + 0.5) * mix(1., 3., upDown(t2))) * .1;
  return max(0.0, min(referTo + offset1 + offset2, 1.0));
}

void main(){
  float t1 = time;
  float t2 = time * 0.37;
  float v = 1.0 - v_texcoord.y;
  float u = v_texcoord.x;
  v = distort(v, t1, t2);
  // u = distort(v_texcoord.x, t1, t2);
  gl_FragColor = texture2D(texture, vec2(u, v));
}
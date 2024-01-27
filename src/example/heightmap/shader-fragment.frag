precision mediump float;

varying vec3 v_normal;

void main(){
  vec3 lightDirection = normalize(vec3(1, 2, -3));
  vec3 normal = normalize(v_normal);
  float lightAmount = dot(lightDirection, -normal) * 0.5 + 0.5;
  gl_FragColor = vec4(vec3(0, 1, 0) * lightAmount, 1);
}
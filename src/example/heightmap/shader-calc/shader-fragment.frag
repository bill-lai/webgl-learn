#extension GL_OES_standard_derivatives : enable
precision highp float;

varying vec3 v_meshPosition;

void main(){
  vec3 vx = dFdx(v_meshPosition);
  vec3 vy = dFdy(v_meshPosition);
  vec3 normal = normalize(cross(vx, vy));

  vec3 lightDirection = normalize(-1. * vec3(-1, -2, 3));
  float lightAmount = dot(lightDirection, -normal) * 0.5 + 0.5;
  gl_FragColor = vec4(vec3(0, 1, 0) * lightAmount, 1);
}
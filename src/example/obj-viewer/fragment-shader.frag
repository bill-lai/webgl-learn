precision mediump float;

uniform vec3 u_lightDirection;
uniform vec4 u_diffuse;

varying vec3 v_normal;

void main(){
  vec3 normal = normalize(v_normal);
  // 最少亮一半
  float lightWeight = dot(v_normal, -u_lightDirection) * 0.5 + 0.5;

  gl_FragColor = vec4(u_diffuse.rgb * lightWeight, u_diffuse.a);
}
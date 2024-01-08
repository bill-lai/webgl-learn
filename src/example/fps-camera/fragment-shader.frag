precision mediump float;

uniform vec3 lightDirection;
uniform vec4 color;

varying vec4 v_normal;

void main(){
  vec3 normal = normalize(v_normal.xyz / v_normal.w);
  float lightWeight = dot(lightDirection, normal) * -1.0;
  lightWeight = lightWeight * 0.25 + 0.75;
  // lightWeight = lightWeight * 0.5 + 0.5;

  gl_FragColor = vec4(color.rgb * lightWeight, color.a);
}
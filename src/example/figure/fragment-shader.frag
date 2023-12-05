precision mediump float;

varying vec3 v_normal;
varying vec3 v_lightToFace; 


void main(){
  vec3 u_meshColor = vec3(0.2353, 0.4, 0.83);
  
  float light = dot(normalize(v_normal), -normalize(v_lightToFace));

  gl_FragColor = vec4(u_meshColor * vec3(1, 1, 1) * light, 1);
}
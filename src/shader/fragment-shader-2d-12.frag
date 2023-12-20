precision mediump float;

uniform samplerCube u_texture;

varying vec3 v_normal;

void main(){
  gl_FragColor = textureCube(u_texture, normalize(v_normal));
}
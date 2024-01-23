precision mediump float;

uniform sampler2D texImage;

varying vec3 v_texcoord;

void main(){
  gl_FragColor = texture2DProj(texImage, v_texcoord);;
}

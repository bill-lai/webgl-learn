precision mediump float;

uniform sampler2D u_image_0;
uniform sampler2D u_image_1;

varying vec2 v_texCoord;

void main(){
  gl_FragColor = texture2D(u_image_0, v_texCoord) * texture2D(u_image_1, v_texCoord);
}
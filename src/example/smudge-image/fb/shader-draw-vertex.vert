attribute vec2 position;

varying vec2 v_texcoord;

void main(){
  gl_Position = vec4(position.xy, -1, 1);
  v_texcoord = position * 0.5 + 0.5;
}
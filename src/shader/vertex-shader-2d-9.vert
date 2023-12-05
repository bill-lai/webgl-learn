
attribute vec2 a_position;
attribute vec2 a_texCoord;

uniform vec2 u_resolution;

varying vec2 v_texCoord;

void main(){
  vec2 clipCoord = ((a_position / u_resolution) * 2.0 - 1.0) * vec2(1, -1);
  gl_Position = vec4(clipCoord, 0, 1);

  v_texCoord = a_texCoord;
}
attribute vec2 a_position;
attribute vec2 a_texCoord;

uniform vec2 u_resolution;
uniform float u_flipY;

varying vec2 v_texCoord;

void main(){
  vec2 clipPosition = ((a_position / u_resolution) * 2.0 - 1.0) * vec2(1, u_flipY);

  gl_Position = vec4(clipPosition, 0, 1);

  v_texCoord = a_texCoord;
}
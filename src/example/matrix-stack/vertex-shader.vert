attribute vec4 a_position;
// attribute vec2 a_texcoord;

uniform mat4 u_texMatrix;
uniform mat4 u_matrix;

varying vec2 v_texcoord;

void main(){
  gl_Position = u_matrix * a_position;
  v_texcoord = a_position.xy;
  // v_texcoord = (u_texMatrix * a_position).xy;
  // v_texcoord = (u_texMatrix * vec4(a_texcoord, 0, 1)).xy;
}
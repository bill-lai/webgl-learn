attribute vec4 a_position;

varying vec4 v_position;

void main(){
  // 放在最远端
  gl_Position = a_position;
  gl_Position.z = 1.0;
  v_position = gl_Position;
}
attribute vec4 a_position;

void main(){
  gl_PointSize = 100.0;
  gl_Position = a_position;
}
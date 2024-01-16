attribute vec4 position;
attribute float distance;

varying float v_distance;

void main(){
  gl_Position = position;
  v_distance = distance;
}
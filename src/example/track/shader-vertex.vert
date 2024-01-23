attribute vec2 position;
attribute float travel;

varying float v_travel;

void main(){
  gl_Position = vec4(position, -1, 1);
  v_travel = travel;
}
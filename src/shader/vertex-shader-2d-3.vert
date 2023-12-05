attribute vec2 a_position;
uniform mat3 u_matrix;
varying vec4 v_color;

void main(){
  // 计算矩阵转化后的坐标
  vec2 t_position = (u_matrix * vec3(a_position, 1)).xy ;
  gl_Position = vec4(t_position, 0, 1);
  v_color = gl_Position * 0.5 + 0.5;
}
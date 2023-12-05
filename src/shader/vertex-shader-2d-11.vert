attribute vec4 a_position;
attribute vec4 a_color;

uniform mat4 u_matrix;
uniform float u_fudgeFactor;

varying vec4 v_color;

void main(){
  // vec4 position =  u_matrix * a_position;
  
  // // float zDivide = 1.0 + position.z * u_fudgeFactor;
  // // 近大远小
  // // gl_Position = vec4(position.xy / zDivide, position.zw);
  // // gl_Position = vec4(position.xyz / zDivide,  position.w);

  // // xyz 会自动除w系数，所以要实现近大远小也可以对w进行操作
  // gl_Position = position;

  // v_color = a_color;


  // Multiply the position by the matrix.
  gl_Position = u_matrix * a_position;
  

  // Pass the color to the fragment shader.
  v_color = a_color;
}
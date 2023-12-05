attribute vec4 a_position;
attribute vec3 a_normal;

uniform mat4 u_matrix;
uniform mat4 u_normalMatrix;

varying vec3 v_normal;

void main(){
  gl_Position = u_matrix * a_position;
  v_normal = mat3(u_normalMatrix) * a_normal;
}
attribute vec2 a_position;

uniform vec2 u_resolution;
uniform mat3 u_matrix;
uniform vec4 u_color;

varying vec4 v_color;

void main(){
  vec2 position = (u_matrix * vec3(a_position, 1)).xy;
  // ((position / u_resolution) * 2.0 - 1.0) * vec2(1, -1),
  gl_Position = vec4(position, 0, 1);

  v_color = u_color;
}
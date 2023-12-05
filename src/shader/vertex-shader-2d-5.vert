attribute vec2 a_position;

uniform vec2 u_resolution;
uniform vec2 u_translate;
uniform vec2 u_rotation;
uniform vec2 u_scale;

void main(){
  vec2 scaledPosition = a_position * u_scale;
  // 旋转计算就是正弦 和余弦操作
  vec2 rotatedPossition = vec2(
    scaledPosition.x * u_rotation.y + scaledPosition.y * u_rotation.x,
    scaledPosition.y * u_rotation.y - scaledPosition.x * u_rotation.x
  );
  vec2 position = rotatedPossition + u_translate;

  gl_Position = vec4(((position / u_resolution) * 2.0 - 1.0) * vec2(1, -1), 0, 1);
}
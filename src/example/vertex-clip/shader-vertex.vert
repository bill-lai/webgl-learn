attribute vec4 position;

uniform mat4 matrix;

// 远端被裁剪，会插值到片段着色器，插值就会大于0，这样就能实现裁剪整个三角形
varying float cliped;

void main(){
  gl_Position = matrix * position;
  cliped = any(greaterThan(abs(gl_Position.xyz), abs(gl_Position.www))) ? 1.0 : 0.0;
}

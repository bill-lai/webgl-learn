// buffer 绑定的数据
attribute vec2 a_position;
// 全局变量
uniform vec2 u_resolution;

void main(){
  // 使所有坐标都从 0～1 然后转化为 0~2 再转化为裁剪空间 -1 ~ 1
  vec2 clipShape = (a_position / u_resolution) * 2.0 - 1.0;

  // 转化为光栅化能识别的才裁剪坐标（GPU 始终从 gl_Position 获取裁剪坐标）
  gl_Position = vec4(clipShape * vec2(1, -1), 0, 1);
}
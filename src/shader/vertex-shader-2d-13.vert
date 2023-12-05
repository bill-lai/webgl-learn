attribute vec4 a_position;
attribute vec3 a_normal;

// 包括模型、相机转化、及裁剪的矩阵
uniform mat4 u_matrix;
// 法向量矩阵转换（仅包含模型矩阵，逆转后再转置就可活动）
uniform mat4 u_normalMatrix;

varying vec3 v_normal;

void main(){
  gl_Position = u_matrix * a_position;

  // 法向量不需要平移，仅代表方向 所以只需要三维矩阵，
  // 模型改变时需要改变法向量，不然灯光效果始终作用于一个面
  v_normal = mat3(u_normalMatrix) * a_normal;
}
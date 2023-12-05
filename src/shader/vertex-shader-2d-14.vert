attribute vec4 a_position;
attribute vec3 a_normal;

uniform mat4 u_matrix;
// 模型世界坐标矩阵
uniform mat4 u_meshMatrix;
// 法向量矩阵，计算方法：模型世界坐标矩阵逆转再转置
uniform mat4 u_normalMatrix;
// 光源位置
uniform vec3 u_lightPosition;
// 相机的位置
uniform vec3 u_cameraPosition;

varying vec3 v_normal;
// 光源到面的向量
varying vec3 v_lightToface;
// 面到相机的向量（为了计算反光）
varying vec3 v_faceToCamera;

void main(){
  gl_Position = u_matrix * a_position;

  vec3 fucePosition = (u_meshMatrix * a_position).xyz;

  v_lightToface = fucePosition - u_lightPosition;
  v_faceToCamera = u_cameraPosition - fucePosition;
  v_normal = mat3(u_normalMatrix) * a_normal;
}
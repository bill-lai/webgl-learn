precision mediump float;

uniform samplerCube u_texture;
// 投影逆矩阵
uniform mat4 projectionInverseMatrix;

varying vec4 v_position;

void main(){
  // 通过计算世界坐标的距离原点法向量来贴图
  vec4 position = projectionInverseMatrix * v_position;
  gl_FragColor = textureCube(u_texture, normalize(position.xyz / position.w));
}
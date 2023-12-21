attribute vec4 a_position;
attribute vec4 a_boneNdx;
attribute vec4 a_weight;

uniform mat4 u_bones[4];
uniform mat4 u_projectionMatrix;
uniform mat4 u_viewMatrix;

void main(){
  mat4 boneMatrix = u_bones[int(a_boneNdx[0])] * a_weight[0] +
    u_bones[int(a_boneNdx[1])] * a_weight[1] +
    u_bones[int(a_boneNdx[2])] * a_weight[2] +
    u_bones[int(a_boneNdx[3])] * a_weight[3];

  gl_Position = u_projectionMatrix * u_viewMatrix * boneMatrix * a_position;
}

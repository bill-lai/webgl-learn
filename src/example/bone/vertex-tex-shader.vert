attribute vec4 a_position;
attribute vec4 a_boneNdx;
attribute vec4 a_weight;

uniform sampler2D u_boneTexture;
uniform float u_numBones;
uniform mat4 u_projectionMatrix;
uniform mat4 u_viewMatrix;

#define ROW0_U ((0.5 + 0.0) / 4.)
#define ROW1_U ((0.5 + 1.0) / 4.)
#define ROW2_U ((0.5 + 2.0) / 4.)
#define ROW3_U ((0.5 + 3.0) / 4.)

mat4 getBoneMatrix(float boneNdx) {
  float v = (boneNdx + 0.5) / u_numBones;
  return mat4(
    texture2D(u_boneTexture, vec2(ROW0_U, v)),
    texture2D(u_boneTexture, vec2(ROW1_U, v)),
    texture2D(u_boneTexture, vec2(ROW2_U, v)),
    texture2D(u_boneTexture, vec2(ROW3_U, v))
  );
}

void main(){
  mat4 boneMatrix = getBoneMatrix(a_boneNdx[0]) * a_weight[0] +
    getBoneMatrix(a_boneNdx[1]) * a_weight[1] +
    getBoneMatrix(a_boneNdx[2]) * a_weight[2] +
    getBoneMatrix(a_boneNdx[3]) * a_weight[3];

  gl_Position = u_projectionMatrix * u_viewMatrix * boneMatrix * a_position;
}

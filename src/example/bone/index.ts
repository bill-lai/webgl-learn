// 骨骼动画
import { GLAttrib, GLObject, SceneNode, bufferPush, createMatrixTexture, createProgramBySource, identity, multiply, orthographic, rotateZ, translate } from '../../util'
import { inverse } from '../matrix4'
import fragSource from './fragment-shader.frag?raw'
// import vertSource from './vertex-shader.vert?raw'
import vertSource from './vertex-tex-shader.vert?raw'

const mesh = {
  positions: new Float32Array([
    0,  1,  // 0
    0, -1,  // 1
    2,  1,  // 2
    2, -1,  // 3
    4,  1,  // 4
    4, -1,  // 5
    6,  1,  // 6
    6, -1,  // 7
    8,  1,  // 8
    8, -1,  // 9
  ]),
  boneNdxs: new Float32Array([
    0, 0, 0, 0,
    0, 0, 0, 0,
    0, 1, 0, 0,
    0, 1, 0, 0,
    1, 0, 0, 0,
    1, 0, 0, 0,
    1, 2, 0, 0,
    1, 2, 0, 0,
    2, 0, 0, 0,
    2, 0, 0, 0
  ]),
  weights: new Float32Array([
    1, 0, 0, 0,
    1, 0, 0, 0,
    .5, .5, 0, 0,
    .5, .5, 0, 0,
    1, 0, 0, 0,
    1, 0, 0, 0,
    .5, .5, 0, 0,
    .5, .5, 0, 0,
    1, 0, 0, 0,
    1, 0, 0, 0,
  ]),
  includes: new Uint16Array([
    0, 1,
    0, 2,
    1, 3,
    2, 3, //
    2, 4,
    3, 5,
    4, 5,
    4, 6,
    5, 7, //
    6, 7,
    6, 8,
    7, 9,
    8, 9,
  ]),
}

const computedBoneMatrix = (angle: number) => {
  const bone1 = rotateZ(angle)
  const bone2 = multiply(bone1, translate(4, 0, 0), rotateZ(angle))
  const bone3 = multiply(bone2, translate(4, 0, 0), rotateZ(angle))

  return [bone1, bone2, bone3, identity()];
}

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext('webgl')!
  const program = createProgramBySource(gl, vertSource, fragSource);

  let bones = computedBoneMatrix(0)
  const initBoneInvs = bones.map(inverse)
  const bonesMatrix = new Float32Array(16 * bones.length)
  const boneTexture = createMatrixTexture(gl, bonesMatrix);

  const updateBonesMatrix = () => {
    for (let i = 0; i < bones.length; i++) {
      bufferPush(bonesMatrix, i, multiply(bones[i], initBoneInvs[i]))
    }
    gl.bindTexture(gl.TEXTURE_2D, boneTexture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 4, 4, 0, gl.RGBA, gl.FLOAT, bonesMatrix);
    return bonesMatrix;
  }

  const object = new GLObject({
    uniforms: {
      // u_bones: bonesMatrix,
      u_numBones: bones.length,
      u_boneTexture: 0,
      u_projectionMatrix: orthographic(-20, 20, -10, 10, -1, 1),
      u_viewMatrix: translate(-6, 0, 0)
    },
    sceneNode: new SceneNode(),
    attrib: new GLAttrib(
      { gl, program },
      mesh,
      {
        positions: { name: 'a_position', size: 2 },
        boneNdxs: { name: 'a_boneNdx', size: 4 },
        weights: { name: 'a_weight', size: 4 },
      }
    ),
    map: { 
      // u_bones: (index, data) => gl.uniformMatrix4fv(index, false, data) 
      u_boneTexture: 'uniform1i'
    }
  })
  
  const redraw = () => {
    gl.clear(gl.COLOR_BUFFER_BIT)
    updateBonesMatrix()
    object.draw(gl.LINES)
  }

  const animation = (now = 0) => {
    bones = computedBoneMatrix(Math.sin(now / 1000) )
    redraw()
    requestAnimationFrame(animation)
  }
  animation();
}

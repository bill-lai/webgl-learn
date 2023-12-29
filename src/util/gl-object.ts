import { identity, multiply, positionTransform } from './mt4';
import { SceneNode } from './scene-graph'
import { GLAttrib, getGlType } from "./gl-attrib";
import { NumArr } from '.';

export type GLObjectArgs = {
  sceneNode: SceneNode;
  attrib: GLAttrib,
  uniforms: {
    [key in string]: number | NumArr
  },
  map?: {[key in string]: string | ((index: WebGLUniformLocation, data: any) => void)}
  viewMatrix?: number[]
  cameraMatrix?: number[]
  perspectiveMatrix?: number[]
}

const initMatrix = identity()
export class GLObject {
  indexs: {[key in string]: WebGLUniformLocation} = {}
  attrib: GLAttrib;
  uniforms: GLObjectArgs['uniforms'];
  sceneNode: GLObjectArgs['sceneNode'];
  map: GLObjectArgs['map']
  viewMatrix?: number[]
  cameraMatrix?: number[]
  perspectiveMatrix?: number[]

  constructor({uniforms, sceneNode, attrib, viewMatrix, map, cameraMatrix, perspectiveMatrix}: GLObjectArgs) {
    this.uniforms = uniforms
    this.sceneNode = sceneNode
    this.attrib = attrib
    this.viewMatrix = viewMatrix
    this.map = map
    this.cameraMatrix = cameraMatrix
    this.perspectiveMatrix = perspectiveMatrix

  }

  init(program: WebGLProgram) {
    const { gl } = this.attrib.ctx
    gl.useProgram(program)
    for (const key in this.uniforms) {
      this.indexs[key] = gl.getUniformLocation(program, key)!
    }
    if (!this.uniforms.matrix) {
      this.indexs.u_matrix = gl.getUniformLocation(program, 'u_matrix')!
    }
  }

  draw(type: null | number = this.attrib.ctx.gl.TRIANGLES, program?: WebGLProgram, csize?: number, ccount?: number) {
    if (program) {
      this.attrib.active(program, !type)
      this.init(program)
    } else {
      this.attrib.active(this.attrib.ctx.program!)
      this.init(this.attrib.ctx.program!)
    }
    const { gl } = this.attrib.ctx

    for (const key in this.uniforms) {
      const val = this.uniforms[key]
      if (this.map && this.map[key]) {
        const mapper = this.map[key]
        if (typeof mapper === 'function') {
          mapper(this.indexs[key], val)
        } else {
          ;(gl as any)[mapper](this.indexs[key], val)

        }
      } else if (typeof val === 'number') {
        gl.uniform1f(this.indexs[key], val)
      } else if (val.length > 4) {
        gl.uniformMatrix4fv(this.indexs[key], false, val)
      } else {
        const api = `uniform${val.length}fv`;
        ;(gl as any)[api](this.indexs[key], val)
      }
    }
    if (!this.uniforms.u_matrix && this.perspectiveMatrix && this.cameraMatrix) {
      const objMatrix = this.sceneNode.worldMatrix.value;
      const viewMatrix = this.viewMatrix
        ? this.viewMatrix
        : this.perspectiveMatrix 
          ? multiply(this.perspectiveMatrix, this.cameraMatrix || initMatrix)
          : initMatrix
      gl.uniformMatrix4fv(this.indexs.u_matrix, false, multiply(viewMatrix, objMatrix))
    }
    const includes = this.attrib.data.includes as NumArr
    if (includes) {
      const map = this.attrib.map.includes || {}
      const count = includes.length
      if (type !== null)
        gl.drawElements(type, count, getGlType(gl, includes), map.offset || 0)

    } else {
      const size = csize || this.attrib.map?.positions?.size || 3
      const count = ccount || (this.attrib.data.positions as NumArr).length / size

      if (type !== null) {
        gl.drawArrays(type, 0, count)
      }
    }
  }
}
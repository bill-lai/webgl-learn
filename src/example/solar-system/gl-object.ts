import { multiply } from '../matrix4';
import { SceneNode } from '../scene-graph'
import { GLAttrib, getGlType } from "./gl-attrib";

export type GLObjectArgs = {
  sceneNode: SceneNode;
  attrib: GLAttrib,
  uniforms: {
    [key in string]: number | number[]
  }
  viewMatrix: number[]
}

export class GLObject {
  indexs: {[key in string]: WebGLUniformLocation} = {}
  attrib: GLAttrib;
  uniforms: GLObjectArgs['uniforms'];
  sceneNode: GLObjectArgs['sceneNode'];
  viewMatrix: number[]

  constructor({uniforms, sceneNode, attrib, viewMatrix}: GLObjectArgs) {
    this.uniforms = uniforms
    this.sceneNode = sceneNode
    this.attrib = attrib
    this.viewMatrix = viewMatrix

    this.init()
  }

  init() {
    const { gl, program } = this.attrib.ctx
    for (const key in this.uniforms) {
      this.indexs[key] = gl.getUniformLocation(program, key)!
    }
    if (!this.uniforms.matrix) {
      this.indexs.u_matrix = gl.getUniformLocation(program, 'u_matrix')!
    }
  }

  draw() {
    this.attrib.active()
    const { gl } = this.attrib.ctx

    for (const key in this.uniforms) {
      const val = this.uniforms[key]
      if (typeof val === 'number') {
        gl.uniform1f(this.indexs[key], val)
      } else if (val.length > 4) {
        gl.uniformMatrix4fv(this.indexs[key], false, val)
      } else {
        const api = `uniform${val.length}fv`;
        (gl as any)[api](this.indexs[key], val)
      }
    }
    if (!this.uniforms.u_matrix) {
      const objMatrix = this.sceneNode.worldMatrix.value;
      gl.uniformMatrix4fv(this.indexs.u_matrix, false, multiply(this.viewMatrix, objMatrix))
    }
    if (this.attrib.data.includes) {
      const map = this.attrib.map.includes || {}
      const data = this.attrib.data.includes
      const count = this.attrib.data.includes.length
      gl.drawElements(gl.TRIANGLES, count, getGlType(gl, data), map.offset || 0)
    } else {
      const count = this.attrib.data.positions.length / 3
      gl.drawArrays(gl.TRIANGLES, 0, count)
    }
  }
}
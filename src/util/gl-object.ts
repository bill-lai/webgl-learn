import { multiply } from './mt4';
import { SceneNode } from './scene-graph'
import { GLAttrib, getGlType } from "./gl-attrib";
import { NumArr } from '.';

export type GLObjectArgs = {
  sceneNode: SceneNode;
  attrib: GLAttrib,
  uniforms: {
    [key in string]: number | NumArr
  },
  map?: {[key in string]: string}
  viewMatrix: number[]
}

export class GLObject {
  indexs: {[key in string]: WebGLUniformLocation} = {}
  attrib: GLAttrib;
  uniforms: GLObjectArgs['uniforms'];
  sceneNode: GLObjectArgs['sceneNode'];
  map: GLObjectArgs['map']
  viewMatrix: number[]

  constructor({uniforms, sceneNode, attrib, viewMatrix, map}: GLObjectArgs) {
    this.uniforms = uniforms
    this.sceneNode = sceneNode
    this.attrib = attrib
    this.viewMatrix = viewMatrix
    this.map = map

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

  draw(type: number = this.attrib.ctx.gl.TRIANGLES) {
    this.attrib.active()
    const { gl } = this.attrib.ctx

    for (const key in this.uniforms) {
      const val = this.uniforms[key]
      if (this.map && this.map[key]) {
        (gl as any)[this.map[key]](this.indexs[key], val)
      } else if (typeof val === 'number') {
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
    const includes = this.attrib.data.includes as NumArr
    if (includes) {
      const map = this.attrib.map.includes || {}
      const count = includes.length
      gl.drawElements(type, count, getGlType(gl, includes), map.offset || 0)
    } else {
      const count = (this.attrib.data.positions as NumArr).length / 3
      gl.drawArrays(type, 0, count)
    }
  }
}
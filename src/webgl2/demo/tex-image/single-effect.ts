import { ExampleInit } from "@/status/example";
import Ctrl from './ctrl.vue'
import { computed, reactive, watchEffect } from "vue";
import kernels from './kernels'

import { NumArr, createProgramBySource, getProjectionMatrix, getRectTriangles, multiply, rotateZ, scale, translate, edgToRad, randRange, loadImage } from '@/util';
import fragmentSource from './shader-fragment.frag?raw'
import vertexSource from './shader-vertex.vert?raw'
import texImageURL from './leaves.jpg'

const bindAttrib = (gl: WebGL2RenderingContext, program: WebGLProgram) => {
  const positions = getRectTriangles([0, 0, 240, 180])
  const texcoords = getRectTriangles([0, 0, 1, 1])

  const vao = gl.createVertexArray()
  gl.bindVertexArray(vao)

  const positionLoc = gl.getAttribLocation(program, 'position')
  const positionBuffer = gl.createBuffer()
  gl.enableVertexAttribArray(positionLoc)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)
  gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0)

  const texcoordLoc = gl.getAttribLocation(program, 'texcoord')
  const texcoordBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, texcoords, gl.STATIC_DRAW)
  gl.enableVertexAttribArray(texcoordLoc)
  gl.vertexAttribPointer(texcoordLoc, 2, gl.FLOAT, false, 0, 0)
  
  return {
    useAttrib() {
      gl.bindVertexArray(vao)
    },
    numVertexs: positions.length / 2
  }
}

const bindUniform = (gl: WebGL2RenderingContext, program: WebGLProgram) => {
  const matrixLoc = gl.getUniformLocation(program, 'matrix')
  const texLoc = gl.getUniformLocation(program, 'tex');
  const kernelLoc = gl.getUniformLocation(program, 'kernel');

  const projectionMatrix = getProjectionMatrix(gl.canvas.width, gl.canvas.height)
  gl.uniformMatrix4fv(matrixLoc, false, projectionMatrix)

  return {
    useUniform: (kernel: number[], texIndex: number) => {
      gl.uniform1fv(kernelLoc, kernel)
      gl.uniform1i(texLoc, texIndex)
    }
  }
}

const getTexture = (gl: WebGL2RenderingContext, loadCb: () => void) => {
  const tex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 1, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, new Uint8Array([0x00]))
  gl.generateMipmap(gl.TEXTURE_2D)

  loadImage(texImageURL).then(image => {
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    loadCb()
  })

  return tex;
}


export const init: ExampleInit = (canvas, { setAppendComponent }) => {
  const data = reactive({ type: 'normal' })
  const kernel = computed(() => kernels[data.type])

  setAppendComponent(Ctrl, { data, seting: { options: kernels } })

  const gl = canvas.getContext('webgl2')!;
  const program = createProgramBySource(gl, vertexSource, fragmentSource)
  const w = canvas.width, h = canvas.height;

  gl.useProgram(program)
  gl.viewport(0, 0, w, h)

  const { useAttrib, numVertexs } = bindAttrib(gl, program)
  const { useUniform } = bindUniform(gl, program)

  
  const redraw = () => {
    gl.clear(gl.COLOR_BUFFER_BIT)
    useAttrib()
    useUniform(kernel.value, 0)
    gl.drawArrays(gl.TRIANGLES, 0, numVertexs)
  }
  getTexture(gl, redraw)
  watchEffect(redraw)
}
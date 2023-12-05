import { createProgramBySource, getImage } from './util'
import vertexSource from '../shader/vertex-shader-2d-9.vert?raw'
import fragmentSource from '../shader/fragment-shader-2d-7.frag?raw'
import { kernel, kernelOptions } from '../status/index'
import { watchEffect } from 'vue'

const getGeometry = (x:number, y:number, w: number, h: number) => {
  const x1 = x;
  const x2 = x + w;
  const y1 = y;
  const y2 = y + h;

  return new Float32Array([
    x1, y1,
    x2, y1,
    x1, y2,
    x1, y2,
    x2, y1,
    x2, y2,
  ])
}
// 纹理坐标系是 0->1
const getTextureGeometry = () => {
  return new Float32Array([
    0.0,  0.0,
    1.0,  0.0,
    0.0,  1.0,
    0.0,  1.0,
    1.0,  0.0,
    1.0,  1.0,
  ])
}

export const init = async (canvas:HTMLCanvasElement) => {
  const gl = canvas.getContext('webgl')!

  const vertexShader = gl.createShader(gl.VERTEX_SHADER)!
  gl.shaderSource(vertexShader, vertexSource);
  gl.compileShader(vertexShader)
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    return;
  }

  const fragShader = gl.createShader(gl.FRAGMENT_SHADER)!
  gl.shaderSource(fragShader, fragmentSource)
  gl.compileShader(fragShader)
  if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
    return;
  }

  const program = gl.createProgram()!
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragShader)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    return;
  }

  const image0 = await getImage("/leaves.jpg")
  const image1 = await getImage('/star.jpg')

  const positionIndex = gl.getAttribLocation(program, 'a_position')
  const texCoordIndex = gl.getAttribLocation(program, 'a_texCoord')
  const resolutionIndex = gl.getUniformLocation(program, 'u_resolution')
  const image0Index = gl.getUniformLocation(program, 'u_image_0')
  const image1Index = gl.getUniformLocation(program, 'u_image_1')

  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.useProgram(program)

  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, getGeometry(0, 0, image0.width, image1.height), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(positionIndex)
  gl.vertexAttribPointer(positionIndex, 2, gl.FLOAT, false, 0, 0)

  const texCoordBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, getTextureGeometry(), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(texCoordIndex)
  gl.vertexAttribPointer(texCoordIndex, 2, gl.FLOAT, false, 0, 0)

  gl.uniform2f(resolutionIndex, canvas.width, canvas.height)
  gl.uniform1i(image0Index, 1)
  gl.uniform1i(image1Index, 0)
  
  const texture0 = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture0)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image0)

  const texture1 = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture1)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image1)


  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, texture0)

  gl.activeTexture(gl.TEXTURE1)
  gl.bindTexture(gl.TEXTURE_2D, texture1)

  gl.drawArrays(gl.TRIANGLES, 0, 6)
}
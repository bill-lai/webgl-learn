import { createProgramBySource, getImage } from './util'
import vertexSource from '../shader/vertex-shader-2d-7.vert?raw'
import fragmentSource from '../shader/fragment-shader-2d-6.frag?raw'
import { kernel } from '../status/index'
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
  const image = await getImage("/leaves.jpg")
  const gl = canvas.getContext('webgl')!
  const program = createProgramBySource(gl, vertexSource, fragmentSource);
  
  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.useProgram(program)

  const positionIndex = gl.getAttribLocation(program, 'a_position')
  const texCoordIndex = gl.getAttribLocation(program, 'a_texCoord')
  const resolutionIndex = gl.getUniformLocation(program, 'u_resolution');
  const kernelIndex = gl.getUniformLocation(program, 'u_kernel')
  const kernelWeightIndex = gl.getUniformLocation(program, 'u_kernelWidth')
  const textureSizeIndex = gl.getUniformLocation(program, 'u_textureSize')

  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, getGeometry(0, 0, image.width, image.height), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(positionIndex)
  gl.vertexAttribPointer(positionIndex, 2, gl.FLOAT, false, 0, 0)

  const texcoordBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, getTextureGeometry(), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(texCoordIndex)
  gl.vertexAttribPointer(texCoordIndex, 2, gl.FLOAT, false, 0, 0)

  gl.uniform2f(resolutionIndex, canvas.width, canvas.height)
  gl.uniform2f(textureSizeIndex, image.width, image.height)

  // 创建贴图
  const texture = gl.createTexture()
  // 默认绑定到0单元
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);


  watchEffect(() => {
    gl.clear(gl.COLOR_BUFFER_BIT)
    console.log(kernel.value)
    gl.uniform1fv(kernelIndex, kernel.value)
    gl.uniform1f(kernelWeightIndex, kernel.value.reduce((t, c) => t + c, 0))
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  })
}
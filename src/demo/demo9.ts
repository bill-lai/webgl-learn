import { createProgramBySource, getImage } from './util'
import vertexSource from '../shader/vertex-shader-2d-7.vert?raw'
import fragmentSource from '../shader/fragment-shader-2d-5.frag?raw'

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
  
  const positionIndex = gl.getAttribLocation(program, 'a_position')
  const texCoordIndex = gl.getAttribLocation(program, 'a_texCoord')
  const resolutionIndex = gl.getUniformLocation(program, 'u_resolution')
  const textureSizeIndex = gl.getUniformLocation(program, 'u_textureSize')
  

  gl.useProgram(program)

  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, getGeometry(0, 0, image.width, image.height), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(positionIndex)
  gl.vertexAttribPointer(positionIndex, 2, gl.FLOAT, false, 0, 0)


  const texcoordBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, getTextureGeometry(), gl.STATIC_DRAW)
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer)
  gl.enableVertexAttribArray(texCoordIndex)
  gl.vertexAttribPointer(texCoordIndex, 2, gl.FLOAT, false, 0, 0)

  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture);
  // 设置纹理对象S 轴和 T轴上的环绕模式，当纹理坐标超出时，使用边缘颜色填充
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  // 设置放大缩小时不计算，而直接采用最近点位采样
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  // 填充贴图数据
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)

  gl.uniform2f(resolutionIndex, canvas.width, canvas.height)
  gl.uniform2f(textureSizeIndex, image.width, image.height)

  gl.drawArrays(gl.TRIANGLES, 0, 6)

}
import { createProgramBySource, getImage } from './util'
import vertexSource from '../shader/vertex-shader-2d-8.vert?raw'
import fragmentSource from '../shader/fragment-shader-2d-6.frag?raw'
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


const createAndSteupTexture = (gl: WebGLRenderingContext) => {
  const texture =  gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

  return texture;
}

export const init = async (canvas:HTMLCanvasElement) => {
  const image = await getImage("/leaves.jpg")
  const gl = canvas.getContext('webgl')!
  const program = createProgramBySource(gl, vertexSource, fragmentSource);

  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.useProgram(program)

  const positionIndex = gl.getAttribLocation(program, 'a_position') 
  const texCoordIndex = gl.getAttribLocation(program, 'a_texCoord')
  const resolutionIndex = gl.getUniformLocation(program, 'u_resolution')
  const flipYIndex = gl.getUniformLocation(program, 'u_flipY')
  const textureSizeIndex = gl.getUniformLocation(program, 'u_textureSize')
  const kernelIndex = gl.getUniformLocation(program, 'u_kernel')
  const u_kernelWidthIndex = gl.getUniformLocation(program, 'u_kernelWidth')

  const postionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, postionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, getGeometry(0, 0, image.width, image.height), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(positionIndex)
  gl.vertexAttribPointer(positionIndex, 2, gl.FLOAT, false, 0, 0)

  const texCoordBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, getTextureGeometry(), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(texCoordIndex)
  gl.vertexAttribPointer(texCoordIndex, 2, gl.FLOAT, false, 0, 0)

  const texture = createAndSteupTexture(gl)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.bindTexture(gl.TEXTURE_2D, texture)

  gl.uniform2f(textureSizeIndex, image.width, image.height)

  const frameBuffers: WebGLFramebuffer[] = []
  const frameTextures: WebGLTexture[] = []
  // 因为帧不能对目标纹理读取数据，所以需要两个帧两个纹理，
  // 第一个读第二个纹理的数据，第二个纹理读第一个纹理的数据，才不会出现问题
  for (let i = 0; i < 2; i++) {
    const frameTexture = createAndSteupTexture(gl)!
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, image.width, image.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    const frameBuffer = gl.createFramebuffer()!
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer)
    // 帧渲染的目标纹理
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, frameTexture, 0)

    frameBuffers.push(frameBuffer)
    frameTextures.push(frameTexture)
  }


  const bindFramebuffer = (fbo: WebGLFramebuffer | null, width: number, height: number) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
    gl.uniform2f(resolutionIndex, width, height)
    gl.viewport(0, 0, width, height)
  }
  
  const kernelList: number[][] = []
  watchEffect(() => {

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT)
    kernelList.push(kernel.value)

    // 先将数据写入缓冲区
    // 缓冲区无所谓正反向
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.uniform1f(flipYIndex, 1);

    // 一个缓冲区正在绑定时无法更换缓冲区绘画，只有解绑后才能更换贴图，所以需要两个缓冲区
    console.log(kernelList)
    for (let i = 1; i < kernelList.length; i++) {
      // 缓冲区像素为图片
      bindFramebuffer(frameBuffers[i % 2], image.width, image.height)
      // 更换使用贴图
      // 将数据绘入
      gl.uniform1fv(kernelIndex, kernel.value)
      gl.uniform1f(u_kernelWidthIndex, kernel.value.reduce((t, c) => t + c, 0))
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      gl.bindTexture(gl.TEXTURE_2D, frameTextures[i % 2])
    }

    // 正式绘入画布，正确化坐标系
    gl.uniform1f(flipYIndex, -1)
    // 当为null时会绑定到画布，而不是缓冲区
    bindFramebuffer(null, canvas.width, canvas.height)
    gl.uniform1fv(kernelIndex, kernelOptions.normal)
    gl.uniform1f(u_kernelWidthIndex, kernelOptions.normal.reduce((t, c) => t + c, 0))
    gl.drawArrays(gl.TRIANGLES, 0, 6)
  })
}
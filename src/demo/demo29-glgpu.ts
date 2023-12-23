// 在gpu中计算数组两两数据只和
import vertexSource from "../shader/vertex-shader-2d-18.vert?raw";
import fragmentSource from "../shader/fragment-shader-2d-13.frag?raw";
import { GLAttrib, GLObject, SceneNode, createProgramBySource } from "../util";

const createDataTexture = (gl: WebGLRenderingContext, data: Uint8Array) => {
  const offset = 0
  const texture = gl.createTexture()
  gl.activeTexture(gl.TEXTURE0 + offset)
  gl.bindTexture(gl.TEXTURE_2D, texture)

  const height = 2
  const width = Math.ceil(data.length / 2)

  let gpuData = data
  if (width * height !== data.length) {
    gpuData = new Uint8Array(width * height)
    gpuData.set(data, 0)
  }
    
  // 关闭通道对其，默认清空下是每次拿四个字节  而我们单通道不是四个字节对其的
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
  gl.texImage2D(
    gl.TEXTURE_2D, 
    0, 
    gl.LUMINANCE, 
    width, 
    height, 
    0, 
    gl.LUMINANCE, 
    gl.UNSIGNED_BYTE,
    gpuData
  )
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

  return {
    size: [width, height],
    offset
  }
}

const clipPosition = new Float32Array([
  -1, -1,
   1, -1,
  -1,  1,
  -1,  1,
   1, -1,
   1,  1,
])

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext('webgl')!;
  const program = createProgramBySource(gl, vertexSource, fragmentSource);
  const texture = createDataTexture(gl, new Uint8Array([
    1, 2, 3,
    4, 5, 6,
    1, 2, 3,
    4, 5, 6,
    1, 2, 3,
    4, 5, 6,
    1, 2, 3,
    4, 5, 6,
    1, 2, 3,
    4, 5, 6,
    250, 1
  ]))

  const dstSize = [(texture.size[0] * texture.size[1]) / 2, 1]

  const object = new GLObject({
    uniforms: { 
      u_texture: texture.offset,
      u_dstSize: dstSize,
      u_texSize: texture.size
    },
    sceneNode: new SceneNode(),
    attrib: new GLAttrib(
      { gl, program },
      { positions: clipPosition },
      { positions: { name: 'a_position', size: 2 } }
    ),
    map: { u_texture: 'uniform1i' }
  })

  // 两两计算最终生成3个结果，所以绘制三个像素点就可以了
  canvas.width = dstSize[0]
  canvas.height = dstSize[1]

  const readData = () => {
    // 读取像素，每一个像素有rgba四个UI8的值
    const store = new Uint8Array(dstSize[0] * dstSize[1] * 4)
    gl.clear(gl.COLOR_BUFFER_BIT)
    object.draw()
    gl.readPixels(0, 0, dstSize[0], dstSize[1], gl.RGBA, gl.UNSIGNED_BYTE, store)

    // console.log(store)
    const data: number[] = []
    for (let i = 0; i < store.length / 4; i++) {
      data.push(store[i * 4])
    }
    return data;
  }

  const data = readData()
  console.log(data)
}
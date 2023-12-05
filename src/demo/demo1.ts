import { createShader, createProgram } from './util'
import vertexSource from '../shader/vertex-shader-2d-1.vert?raw'
import fragmentSource from '../shader/fragment-shader-2d-1.frag?raw'

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext('webgl')!
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource)!;
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource)!
  const program = createProgram(gl, vertexShader, fragmentShader)

  // 获取变量，为了给它赋值数据
  const positionAttributeLocation = gl.getAttribLocation(program, 'a_position')
  const positionBuffer = gl.createBuffer()!
  // buffer 绑定到 shader 程序钟
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

  // 要绘画的数据
  const positions = [
    0, 0,
    0, 0.5,
    0.7, 0
  ]
  // 将 positions 数据拷贝到 buffer 中，因为 glsl 是强类型，需要转化类型
  // 数据不经常变所以是 STATIC_DRAW
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

  // gl的裁剪坐标系绑定到屏幕坐标系
  gl.viewport(0, 0, canvas.width, canvas.height)
  // 清除数据再渲染
  gl.clearColor(0,0,0,0)
  gl.clear(gl.COLOR_BUFFER_BIT)

  // 使用着色器
  gl.useProgram(program);

  // 开始启用数据
  // 启用定点数据
  gl.enableVertexAttribArray(positionAttributeLocation);

  // gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

  // 设置如何使用数据
  gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0)

  // 回执 buffer数据，从哪里开始绘制，绘制个数
  gl.drawArrays(gl.TRIANGLES, 0, 3)
}
import { createShader, createProgram } from './util'
import vertexSource from '../shader/vertex-shader-2d-2.vert?raw'
import fragmentSource from '../shader/fragment-shader-2d-1.frag?raw'

export const init = (canvas:HTMLCanvasElement) => {
  const gl = canvas.getContext('webgl')!;
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource)
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = createProgram(gl, vertexShader, fragmentShader);

  const positionLocation = gl.getAttribLocation(program, 'a_position');
  const resolutionLocation = gl.getUniformLocation(program, 'u_resolution')
  const positionBuffer = gl.createBuffer()

  const positions = [
    10, 20,
    80, 20,
    10, 30,
    10, 30,
    80, 20,
    80, 30,
  ]
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)


  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.clearColor(0,0,0,0)

  gl.useProgram(program);
  gl.enableVertexAttribArray(positionLocation)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  // 如何使用定点数据
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)
  gl.uniform2f(resolutionLocation, canvas.width, canvas.height)

  gl.drawArrays(gl.TRIANGLES, 0, 6)
}
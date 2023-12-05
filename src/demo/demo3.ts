import { createProgramBySource } from './util'
import vertexSource from '../shader/vertex-shader-2d-2.vert?raw'
import fragmentSource from '../shader/fragment-shader-2d-2.frag?raw'

const randomInt = (range: number) => Math.floor(Math.random() * range)
const randomColor = () => [Math.random(), Math.random(), Math.random(), 1] as const
const getRectangle = (x: number, y: number, width: number, height: number) => {
  const x1 = x
  const y1 = y
  const x2 = x + width
  const y2 = y + height

  return new Float32Array([
    x1, y1,
    x2, y1,
    x1, y2,
    x1, y2,
    x2, y1,
    x2, y2
  ])
}

export const init = (canvas:HTMLCanvasElement) => {
  const gl = canvas.getContext('webgl')!
  const program = createProgramBySource(gl, vertexSource, fragmentSource)

  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.clearColor(0,0,0,0)
  gl.viewport(0, 0, canvas.width, canvas.height)

  gl.useProgram(program)

  const positionIndex = gl.getAttribLocation(program, 'a_position');
  const resolutionIndex = gl.getUniformLocation(program, 'u_resolution')
  const colorIndex = gl.getUniformLocation(program, 'u_color')

  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  
  gl.enableVertexAttribArray(positionIndex);
  gl.vertexAttribPointer(positionIndex, 2, gl.FLOAT, false, 0, 0);
  gl.uniform2f(resolutionIndex, canvas.width, canvas.height)

  for (let i = 0; i < 10; i++) {
    const positions = getRectangle(randomInt(300), randomInt(300), randomInt(300), randomInt(300))
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

    gl.uniform4f(colorIndex, ...randomColor());
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}
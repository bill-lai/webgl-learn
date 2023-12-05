import { createProgramBySource } from './util'
import vertexSource from '../shader/vertex-shader-2d-3.vert?raw'
import fragmentSource from '../shader/fragment-shader-2d-3.frag?raw'
import { watchEffect } from 'vue'
import { moveX, moveY, rotate, scaleX, scaleY } from '../status'

const getGeometry = () => new Float32Array([
  0, -100,
  150,  125,
  -175,  100
])

export const init = (canvas:HTMLCanvasElement) => {
  const gl = canvas.getContext('webgl')!;
  const program = createProgramBySource(gl, vertexSource, fragmentSource)

  const positionIndex = gl.getAttribLocation(program, 'a_position')
  const matrixIndex = gl.getUniformLocation(program, 'u_matrix')
  const resolutionIndex = gl.getUniformLocation(program, 'u_resolution')

  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.useProgram(program)
  
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, getGeometry(), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(positionIndex)
  gl.vertexAttribPointer(positionIndex, 2, gl.FLOAT, false, 0, 0);

  gl.uniform2f(resolutionIndex, canvas.width, canvas.height)

  watchEffect(() => {
    gl.clear(gl.COLOR_BUFFER_BIT)

    let matrix = m3.projection(canvas.clientWidth, canvas.clientHeight);
    matrix = m3.translate(matrix, moveX.value, moveY.value)
    matrix = m3.rotate(matrix, rotate.value * Math.PI / 180)
    matrix = m3.scale(matrix, scaleX.value, scaleY.value)

    console.log(matrix)
    gl.uniformMatrix3fv(matrixIndex, false, matrix);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  })
  
}
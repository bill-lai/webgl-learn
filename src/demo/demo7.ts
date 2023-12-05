import { createProgramBySource, getFGeometry, getColor } from './util'
import vertexSource from '../shader/vertex-shader-2d-6.vert?raw'
import fragmentSource from '../shader/fragment-shader-2d-3.frag?raw'
import { watchEffect } from 'vue'
import { translate, scale, rotate, multiply, identity, projection } from './matrix'
import { moveX, moveY, rotate as angle, scaleX, scaleY } from '../status'


export const init = (canvas:HTMLCanvasElement) => {
  const gl = canvas.getContext('webgl')!
  const program = createProgramBySource(gl, vertexSource, fragmentSource);

  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.useProgram(program)

  const positionIndex = gl.getAttribLocation(program, 'a_position')
  const colorIndex = gl.getUniformLocation(program, 'u_color')
  const resolutionIndex = gl.getUniformLocation(program, 'u_resolution')
  const matrixIndex = gl.getUniformLocation(program, 'u_matrix')


  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, getFGeometry(), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(positionIndex)
  gl.vertexAttribPointer(positionIndex, 2, gl.FLOAT, false, 0, 0)

  gl.uniform2f(resolutionIndex, canvas.width, canvas.height)
  gl.uniform4fv(colorIndex, getColor())


  watchEffect(() => {
    gl.clear(gl.COLOR_BUFFER_BIT)

    let matrix = projection(canvas.width, canvas.height)

    for (let i = 0; i < 5; i++) {
      matrix = multiply(
        matrix,
        translate(moveX.value, moveY.value),
        rotate(angle.value * Math.PI / 180),
        scale(scaleX.value, scaleY.value),
        translate(-50, -75),
      )
      gl.uniformMatrix3fv(matrixIndex, false, matrix)
      gl.drawArrays(gl.TRIANGLES, 0, 18);
    }
  })
}
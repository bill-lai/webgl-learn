import { createProgramBySource, getFGeometry, getColor } from './util'
import vertexSource from '../shader/vertex-shader-2d-5.vert?raw'
import fragmentSource from '../shader/fragment-shader-2d-2.frag?raw'
import { watchEffect } from 'vue'
import { moveX, moveY, rotate, scaleX, scaleY } from '../status'


export const init = (canvas:HTMLCanvasElement) => {
  const gl = canvas.getContext('webgl')!
  const program = createProgramBySource(gl, vertexSource, fragmentSource);

  gl.viewport(0, 0, canvas.width, canvas.height);

  const positionIndex = gl.getAttribLocation(program, 'a_position');
  const translateIndex = gl.getUniformLocation(program, 'u_translate')
  const rotationIndex = gl.getUniformLocation(program, 'u_rotation')
  const resolutionIndex = gl.getUniformLocation(program, 'u_resolution')
  const scaleIndex = gl.getUniformLocation(program, 'u_scale')
  const colorIndex = gl.getUniformLocation(program, 'u_color')

  gl.useProgram(program);

  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, getFGeometry(), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(positionIndex)
  gl.vertexAttribPointer(positionIndex, 2, gl.FLOAT, false, 0, 0)

  gl.uniform2f(resolutionIndex, canvas.width, canvas.height)
  gl.uniform4fv(colorIndex, getColor())

  watchEffect(() => {
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.uniform2f(translateIndex, moveX.value, moveY.value)
    gl.uniform2f(scaleIndex, scaleX.value, scaleY.value)

    const rotateRadians = rotate.value * Math.PI / 180;
    gl.uniform2f(rotationIndex, Math.sin(rotateRadians), Math.cos(rotateRadians))

    gl.drawArrays(gl.TRIANGLES, 0, 18)
  })
}
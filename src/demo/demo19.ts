import vertexSource from "../shader/vertex-shader-2d-11.vert?raw";
import fragmentSource from "../shader/fragment-shader-2d-3.frag?raw";
import { createProgramBySource, edgToRad } from './util'
import { getF3DColorGeometry, getF3DGeometry } from "./geo";
import { multiply, rotateX, rotateY, rotateZ, straightPerspective1, translate } from "./matrix4";

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext('webgl')!
  const program = createProgramBySource(gl, vertexSource, fragmentSource);

  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.CULL_FACE)
  gl.useProgram(program)

  const positionIndex = gl.getAttribLocation(program, 'a_position')
  const colorIndex = gl.getAttribLocation(program, 'a_color')
  const matrixIndex = gl.getUniformLocation(program, 'u_matrix')

  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, getF3DGeometry(), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(positionIndex)
  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0)

  const colorBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, getF3DColorGeometry(), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(colorIndex)
  gl.vertexAttribPointer(colorIndex, 3, gl.UNSIGNED_BYTE, true, 0, 0)

  const translation = [0, 0, -360] as const;
  const rotate = [edgToRad(190), edgToRad(40), edgToRad(320)];
  const initMatrix = straightPerspective1(edgToRad(60), canvas.width / canvas.height, 1, 2000)
  let then = Date.now()

  const redraw = () => {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    const matrix = multiply(
      initMatrix,
      translate(...translation),
      rotateX(rotate[0]),
      rotateY(rotate[1]),
      rotateZ(rotate[2])
    )
    gl.uniformMatrix4fv(matrixIndex, false, matrix)
    gl.drawArrays(gl.TRIANGLES, 0, 16 * 6)
  }

// 每秒转动1.2弧度
  const speed = 1.6
  const animation = () => {
    requestAnimationFrame(now => {
      const diffs = (now - then) / 1000
      then = now;
      rotate[1] += diffs * speed
      redraw()
      animation()
    })
  };
  redraw()
  animation()
}
import vertexSource from "../shader/vertex-shader-2d-11.vert?raw";
import fragmentSource from "../shader/fragment-shader-2d-3.frag?raw";
import { getF3DColorGeometry, getF3DGeometry } from "../util/geo";
import { cameraAngle } from "../status";
import { watchEffect } from "vue";
import { straightPerspective1, rotateY, rotateX, translate, multiply, inverse, lookAt } from "./matrix4";

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext('webgl')!

  const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
  gl.shaderSource(vertexShader, vertexSource)
  gl.compileShader(vertexShader)
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    throw vertexSource + '编译失败'
  }

  const fragShader = gl.createShader(gl.FRAGMENT_SHADER)!;
  gl.shaderSource(fragShader, fragmentSource)
  gl.compileShader(fragShader)
  if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
    throw fragShader + '编译失败'
  }

  const program = gl.createProgram()!
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragShader)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw 'program链接失败'
  }

  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.useProgram(program)

  const positionIndex = gl.getAttribLocation(program, 'a_position')
  const colorIndex = gl.getAttribLocation(program, 'a_color')
  const matrixIndex = gl.getUniformLocation(program, 'u_matrix')

  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, getF3DGeometry(), gl.STATIC_DRAW)
  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(positionIndex)

  const colorBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, getF3DColorGeometry(), gl.STATIC_DRAW)
  gl.vertexAttribPointer(colorIndex, 3, gl.UNSIGNED_BYTE, true, 0, 0)
  gl.enableVertexAttribArray(colorIndex)

  gl.enable(gl.CULL_FACE)
  gl.enable(gl.DEPTH_TEST)

  const geoNum = 5
  const radius = 200
  const projectInitMartix = straightPerspective1(60 * Math.PI / 180, canvas.clientWidth / canvas.clientHeight, 1, 2000);
  

  watchEffect(() => {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    const cameraMatrix = multiply(
      rotateY(cameraAngle.value * Math.PI / 180),
      translate(0, -radius /3, radius * 2)
    )
    const lookMatrix = lookAt(
      [cameraMatrix[12], cameraMatrix[13], cameraMatrix[14]],
      // 看向第一个f
      [radius, 0, 0],
      [0, 1, 0]
    )

    const averageAngle = (Math.PI * 2) / geoNum
    for (let i = 0; i < geoNum; i++) {
      const angle = i * averageAngle;
      const tx = Math.cos(angle) * radius
      const tz = Math.sin(angle) * radius

      const matrix = multiply(
        projectInitMartix,
        inverse(lookMatrix),
        translate(tx, 0, tz),
        rotateX(Math.PI)
      )
      gl.uniformMatrix4fv(matrixIndex, false, matrix)
      gl.drawArrays(gl.TRIANGLES, 0, 6 * 16)
    }
  })
}
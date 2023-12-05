import vertexSource from "../shader/vertex-shader-2d-11.vert?raw";
import fragmentSource from "../shader/fragment-shader-2d-3.frag?raw";
import axios from 'axios';
import { ref, watchEffect } from "vue";
import { rotateY as angleY, moveY } from '../status'
import { multiply, positionTransform, scale, rotateY, straightPerspective1, translate, lookAt, inverse } from "./matrix4";

const bindModelBuffer = (gl: WebGLRenderingContext, positionIndex: number, colorIndex: number) => {
  const model = ref<Model | null>(null)
  axios.get<Model>('model/headdata.json', { responseType: 'json' })
    .then(res => res.status === 200 && (model.value = res.data))

  const bufferSize = ref(-1)
  const stopWatch = watchEffect(() => {
    if (!model.value) return;
    stopWatch()

    const positions = new Float32Array(model.value.positions)
    for (let i = 0; i < positions.length; i+= 3) {
      const vector = positionTransform(
        [positions[i], positions[i+1], positions[i+2]],
        multiply(
          scale(6, 6, 6),
          rotateY(Math.PI),
        )
      )
      positions[i] = vector[0]
      positions[i+1] = vector[1]
      positions[i+2] = vector[2]
    }

    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(positionIndex)
    gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0)


    // 模型的color 为 -1到1 要转化到255颜色系
    const normals = model.value.normals
    const colors = new Uint8Array(normals.length)
    for (let i = 0; i < normals.length; i++) {
      colors[i] = (normals[i] * 0.5 + 0.5) * 255
    }

    const colorBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(colorIndex)
    gl.vertexAttribPointer(colorIndex, 3, gl.UNSIGNED_BYTE, true, 0, 0)
    
    // 释放，方便回收
    model.value = null;
    bufferSize.value = positions.length
  })
  return bufferSize;
}

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext('webgl')!

  const vertexShader = gl.createShader(gl.VERTEX_SHADER)!
  gl.shaderSource(vertexShader, vertexSource);
  gl.compileShader(vertexShader)
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    throw vertexSource + ' 编译失败';
  }

  const fragShader = gl.createShader(gl.FRAGMENT_SHADER)!
  gl.shaderSource(fragShader, fragmentSource);
  gl.compileShader(fragShader)
  if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
    throw fragmentSource + ' 编译失败';
  }

  const program = gl.createProgram()!
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragShader)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw 'shader 链接失败';
  }

  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.useProgram(program)
  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.CULL_FACE)

  const matrixIndex = gl.getUniformLocation(program, 'u_matrix')

  const bufferSize = bindModelBuffer(
    gl, 
    gl.getAttribLocation(program, 'a_position'), 
    gl.getAttribLocation(program, 'a_color')
  )

  const cameraMatrix = lookAt(
    [500, 300, 500],
    [0, -100, 0],
    [0, 1, 0]
  )
  const projectInitMatrix = multiply(
    straightPerspective1(60 * Math.PI / 180, canvas.width / canvas.height, 1, 3000),
    inverse(cameraMatrix)
  )
  const size = 5
  const space = 150
  const center = size / 2
  const radius = 250

  moveY.value = 200
  watchEffect(() => {
    if (bufferSize.value === -1) return;
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    const leaderMatrix = multiply(
      rotateY(angleY.value * Math.PI / 180),
      translate(0, moveY.value, radius)
    )
    gl.uniformMatrix4fv(matrixIndex, false, multiply(projectInitMatrix, leaderMatrix))
    gl.drawArrays(gl.TRIANGLES, 0, bufferSize.value / 3)

    for (let i = 0; i < size; i++) {
      const tx = (i - center) * space
      for (let j = 0; j < size; j++) {
        const tz = (j - center) * space

        const followMatrix = multiply(
          projectInitMatrix,
          lookAt([tx, 0, tz], [leaderMatrix[12], leaderMatrix[13], leaderMatrix[14]], [0, 1, 0]),
        )
        gl.uniformMatrix4fv(matrixIndex, false, followMatrix)
        gl.drawArrays(gl.TRIANGLES, 0, bufferSize.value / 3)
      }
    }

  })
}
// 模拟方向光源
import vertexSource from "../shader/vertex-shader-2d-15.vert?raw";
import fragmentSource from "../shader/fragment-shader-2d-11.frag?raw";
import { bindModel, createProgramBySource, edgToRad } from "./util";
import { watchEffect } from "vue";
import { inverse, lookAt, multiply, normalVector, positionTransform, rotateX, rotateY, rotateZ, scale, straightPerspective1, subtractVectors, translate, transpose } from "./matrix4";
import { rotateY as angleY, rotateX as angleX, rotateZ as angleZ, shininess, scaleX, scaleY, scaleZ, moveX, moveY, moveZ, color, lightColor, specularColor, lightLimit,

  innerLightLimit,
  outLightLimit, } from "../status";



export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext('webgl')!
  const program = createProgramBySource(gl, vertexSource, fragmentSource);

  gl.useProgram(program)
  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.CULL_FACE)

  const positionIndex = gl.getAttribLocation(program, 'a_position')
  const normalIndex = gl.getAttribLocation(program, 'a_normal');
  const meshMatrixIndex = gl.getUniformLocation(program, 'u_meshMatrix')
  const normalMatrixIndex = gl.getUniformLocation(program, 'u_normalMatrix')
  const matrixIndex = gl.getUniformLocation(program, 'u_matrix')
  const lightPositionIndex = gl.getUniformLocation(program, 'u_lightPosition')
  const lightDirectionIndex = gl.getUniformLocation(program, 'u_lightDirection')
  const innerLightLimitIndex = gl.getUniformLocation(program, 'u_innerLightLimit')
  const outLightLimitIndex = gl.getUniformLocation(program, 'u_outputLightLimit')
  const cameraPositionIndex = gl.getUniformLocation(program, 'u_cameraPosition')
  const colorIndex = gl.getUniformLocation(program, 'u_color')
  const shininessIndex = gl.getUniformLocation(program, 'u_shininess')
  const lightColorIndex = gl.getUniformLocation(program, 'u_lightColor')

  const model = bindModel('/model/f.json')
  let vertexLength = 0
  const stopWatchModel = watchEffect(() => {
    if (!model.value) return;
    stopWatchModel()

    // 处理模型
    const positionMatrix = multiply(rotateX(Math.PI), translate( -50, -75, -15))
    const positions: number[] = []
    for (let i = 0; i < model.value.positions.length; i+=3) {
      const position = [model.value.positions[i], model.value.positions[i + 1], model.value.positions[i + 2]]
      positions.push(...positionTransform(position, positionMatrix))
    }

    const positionBuffer = gl.createBuffer()   
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(positionIndex)
    gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0)

    const normalBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.value.normals), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(normalIndex)
    gl.vertexAttribPointer(normalIndex, 3, gl.FLOAT, false, 0, 0)

    vertexLength = model.value.positions.length / 3;
    redraw()
  })
  // watch([lightLimit], () => redraw())


  const viewMatrix = straightPerspective1(edgToRad(60), canvas.width / canvas.height, 1, 2000)
  const cameraTarget = [0, 35, 0];
  const up = [0, 1, 0]
  const cameraMatrix = lookAt([100, 150, 200], cameraTarget, up)
  const initMatrix = multiply(viewMatrix, inverse(cameraMatrix))

  const initLightPosition = [40, 60, 120]
  let initLightVia = [...cameraTarget]
  let lightXRotate = 0
  let lightTargetXRotate = 0


  const redraw = (window as any).redraw = () => {
    gl.useProgram(program)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    
    const selfMatrix = multiply(
      translate(moveX.value, moveY.value, moveZ.value),
      rotateX((angleX.value * Math.PI) / 180),
      rotateY((angleY.value * Math.PI) / 180),
      rotateZ((angleZ.value * Math.PI) / 180),
      scale(scaleX.value, scaleY.value, scaleZ.value),
    );
    // 法向量的矩阵转换就是针对模型世界矩阵逆转后再转置
    const normalMatrix = transpose(inverse(selfMatrix))
    const matrix = multiply(initMatrix, selfMatrix)
    gl.uniformMatrix4fv(meshMatrixIndex, false, selfMatrix)
    gl.uniformMatrix4fv(matrixIndex, false, matrix)
    gl.uniformMatrix4fv(normalMatrixIndex, false, normalMatrix)

    const lightPosition = positionTransform(
      [0, 0, 0],
      multiply(
        rotateZ(lightXRotate * Math.PI / 180),
        translate(initLightPosition[0], initLightPosition[1], initLightPosition[2])
      )
    )

    // 因为模型的z轴与我们实际的世界坐标z轴 是相反的所以需要反转
    const lightDirection = normalVector(subtractVectors(initLightVia, lightPosition))

    gl.uniform3fv(lightDirectionIndex, lightDirection)
    gl.uniform1f(innerLightLimitIndex, Math.cos(innerLightLimit.value * Math.PI / 180))
    gl.uniform1f(outLightLimitIndex, Math.cos(outLightLimit.value * Math.PI / 180))
    gl.uniform3fv(lightPositionIndex, lightPosition)
    
    gl.uniform3fv(cameraPositionIndex, [100, 150, 200])
    gl.uniform1f(shininessIndex, shininess.value)
    gl.uniform4fv(colorIndex, color.value)
    gl.uniform3fv(lightColorIndex, lightColor.value.slice(0, 3))
    gl.drawArrays(gl.TRIANGLES, 0, vertexLength)
  }

  const radius = 0.005
  let then = Date.now();
  const animation = () => {
    requestAnimationFrame(() => {
      const now = Date.now();
      const diffMis = (Date.now() - then) / 1000
      then = now
      lightTargetXRotate += 90 * diffMis

      initLightVia = positionTransform(
        cameraTarget,
        multiply(
          translate(-(cameraTarget[0] - radius), -cameraTarget[1], -cameraTarget[2]),
          rotateZ(lightTargetXRotate * Math.PI / 180),
          translate(cameraTarget[0] - radius, cameraTarget[1], cameraTarget[2])
        )
      )
      redraw()
      animation()
    })
  }
  redraw()
  animation()
}
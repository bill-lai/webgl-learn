import { NumArr, bufferPush, createProgramBySource, lookAt, multiply, straightPerspective1, translate } from '../../util'
import { identity, inverse, rotateZ } from '../matrix4'
import { edgToRad } from '../util'
import { colors, positions } from './data'
import fragSource from './fragment-shader.frag?raw'
import vertSource from './vertex-shader.vert?raw'

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext('webgl')!
  const instanceExt = gl.getExtension('ANGLE_instanced_arrays')
  if (!instanceExt) {
    throw '当前浏览器不支持 ANGLE_instanced_arrays'
  }

  const program = createProgramBySource(gl, vertSource, fragSource)

  const projectionMatrixLoc = gl.getUniformLocation(program, 'projectionMatrix')
  const viewMatrixLoc = gl.getUniformLocation(program, 'viewMatrix')
  const worldMatrixLoc = gl.getAttribLocation(program, 'a_worldMatrix')
  const positionLoc = gl.getAttribLocation(program, 'a_position')
  const colorLoc = gl.getAttribLocation(program, 'a_color')

  gl.useProgram(program)

  gl.uniformMatrix4fv(projectionMatrixLoc, false, straightPerspective1(edgToRad(60), canvas.width / canvas.height, 1, 2000))
  
  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)
  gl.enableVertexAttribArray(positionLoc)
  gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

  const colorBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW)
  gl.enableVertexAttribArray(colorLoc)
  gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0)
  // 绘画下一个实例的时候才移动指针，如果需要恢复要置为0
  instanceExt.vertexAttribDivisorANGLE(colorLoc, 1)

  const instanceNum = colors.length / 4;

  const worldMatrixRaws = new Float32Array(instanceNum * 16)
  const worldMatrixBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, worldMatrixBuffer)
  // 经常变动,先申请空间，
  gl.bufferData(gl.ARRAY_BUFFER, worldMatrixRaws.byteLength, gl.DYNAMIC_DRAW)
  // 一个顶点属性最多开启4个值，mat4需要占用4个节点属性

  const singleGroupByte = 4 * 4;
  const singleMatrixByte = 4 * singleGroupByte
  for (let i = 0; i < 4; i++) {
    const loc = worldMatrixLoc + i
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, singleMatrixByte, i * singleGroupByte)
    // 切换实例的时候才移动指针
    instanceExt.vertexAttribDivisorANGLE(loc, 1)
  }

  // 原数据镜像
  const worldMatrixs: NumArr[] = []
  for (let i = 0; i < instanceNum; i++) {
    worldMatrixs.push(
      new Float32Array(worldMatrixRaws.buffer, singleMatrixByte * i , 16)
    )
    bufferPush(worldMatrixs[i], 0, translate(-0.5 + 0.25 * i, 0, 0))
  }

  let viewMatrix: NumArr = lookAt([0, 0, 3], [0, 0, 0], [0, 1, 0])

  console.log(gl.drawingBufferHeight, gl.drawingBufferWidth)
  gl.viewport(0, 0, canvas.width, canvas.height)
  console.log(gl.drawingBufferHeight, gl.drawingBufferWidth)
  const redraw = () => {
    // 将矩阵数据上传
    gl.bindBuffer(gl.ARRAY_BUFFER, worldMatrixBuffer)
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, worldMatrixRaws)
    gl.uniformMatrix4fv(viewMatrixLoc, false, inverse(viewMatrix))

    gl.clear(gl.COLOR_BUFFER_BIT)
    instanceExt.drawArraysInstancedANGLE(gl.TRIANGLES, 0, positions.length / 2, instanceNum);
  }

  // gl.lineWidth
  let then = 0
  const animation = (now = 0) => {
    const mis = (now - then) * 0.001;
    then = now
    for (let i = 0; i < instanceNum; i++) {
      bufferPush(worldMatrixs[i], 0, multiply(worldMatrixs[i], rotateZ(mis * edgToRad(10) * (i + 1))))
    }
    viewMatrix = multiply(viewMatrix, rotateZ(mis * edgToRad(50)))
    redraw()
    requestAnimationFrame(animation)
  }
  animation()
  // redraw()
}
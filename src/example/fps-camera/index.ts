import vertSource from './vertex-shader.vert?raw'
import fragSource from './fragment-shader.frag?raw'
import { NumArr, bindFPSCamera, createCube, createProgramBySource, identity, inverse, multiply, normalVector, randColor, scale, straightPerspective1, translate, transpose } from '../../util'
import { edgToRad } from '../util';
import { lookAt } from '../matrix4';
import { watchEffect } from 'vue';

const bindAttri = (gl: WebGLRenderingContext, program: WebGLProgram) => {
  const cube = createCube(1);
  const positionLoc = gl.getAttribLocation(program, 'position')
  const normalLoc = gl.getAttribLocation(program, 'normal')

  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, cube.positions, gl.STATIC_DRAW)

  const normalBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, cube.normals, gl.STATIC_DRAW)

  const includeBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, includeBuffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cube.includes, gl.STATIC_DRAW)

  return {
    useAttrib: () => {
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
      gl.enableVertexAttribArray(positionLoc)
      gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
      gl.enableVertexAttribArray(normalLoc)
      gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
    },
    numVertexs: cube.includes.length
  }
}

type UseUniformArgs = { 
  color: NumArr, 
  worldMatrix: NumArr, 
  normalMatrix: NumArr,
  viewMatrix: NumArr
}
const binUniform = (gl: WebGLRenderingContext, program: WebGLProgram) => {
  const lightDirectionLoc = gl.getUniformLocation(program, 'lightDirection')
  const colorLoc = gl.getUniformLocation(program, 'color')
  const projectionMatrixLoc = gl.getUniformLocation(program, 'projectionMatrix')
  const viewMatrixLoc = gl.getUniformLocation(program, 'viewMatrix')
  const worldMatrixLoc = gl.getUniformLocation(program, 'worldMatrix')
  const normalMatrixLoc = gl.getUniformLocation(program, 'normalMatrix')

  const projectionMatrix = straightPerspective1(
    edgToRad(60),
    gl.canvas.width / gl.canvas.height,
    1,
    2000
  )
  const lightDirection = normalVector([1, 2, 3])

  return {
    useUniform({color, viewMatrix, worldMatrix, normalMatrix}: UseUniformArgs) {
      gl.uniformMatrix4fv(projectionMatrixLoc, false, projectionMatrix)
      gl.uniform3fv(lightDirectionLoc, lightDirection)
      gl.uniform4fv(colorLoc, color)
      gl.uniformMatrix4fv(viewMatrixLoc, false, viewMatrix)
      gl.uniformMatrix4fv(worldMatrixLoc, false, worldMatrix)
      gl.uniformMatrix4fv(normalMatrixLoc, false, normalMatrix)
    }
  }
}

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext('webgl')!
  const program = createProgramBySource(gl, vertSource, fragSource);

  gl.useProgram(program)
  gl.enable(gl.DEPTH_TEST)
  gl.viewport(0, 0, canvas.width, canvas.height)

  const { useAttrib, numVertexs } = bindAttri(gl, program)
  const { useUniform } = binUniform(gl, program)

  const meshUniforms: Omit<UseUniformArgs, 'viewMatrix'>[] = []
  

  for (let x = -2; x < 3; x++) {
    for (let y = -2; y < 3; y++) {
      for (let z = -2; z < 3; z++) {
        const worldMatrix = multiply(
          translate(x * 2, y * 2, z * 2)
        )
        meshUniforms.push({
          color: randColor(), 
          worldMatrix, 
          normalMatrix: transpose(inverse(worldMatrix)),
        })
      }
    }
  }

  const redraw = (cameraMatrix: NumArr) => {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    useAttrib()

    const viewMatrix = inverse(cameraMatrix);
    meshUniforms.forEach(meshUniform => {
      useUniform({ ...meshUniform, viewMatrix });
      gl.drawElements(gl.TRIANGLES, numVertexs, gl.UNSIGNED_SHORT, 0);
    })
  }

  const cameraMatrix = bindFPSCamera(
    canvas, 
    lookAt([0, 0, 10], [0, 0, 0], [0, 1 ,0])
  )
  watchEffect(() => redraw(cameraMatrix.value))
}
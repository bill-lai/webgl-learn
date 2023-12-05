import { inverse, lookAt, multiply, rotateX, rotateY, straightPerspective1, translate } from '../matrix4'
import { createCube, createCone, createBall, randColorBuffer } from '../spheres'
import { createProgramBySource, edgToRad, rand } from '../util'
import fragSource from './fragment-shader.frag?raw'
import vertSource from './vertex-shader.vert?raw'

type Shape = {
  data: {
      positions: Float32Array;
      normals: Float32Array;
      texCoords: Float32Array;
      includes: Uint16Array;
  };
  uniforms: {
      colorMult: number[];
      initMatrix: number[];
  };
}

const shapes: Shape[] = [
  {
    data: createCube(20),
    uniforms: {
      colorMult: [0.5, 1, 0.5, 1],
      initMatrix: translate(-40, 0, 0)
    }
  },
  {
    data: createBall(10, 28),
    uniforms: {
      colorMult: [1, 0.5, 0.5, 1],
      initMatrix: translate(0, 0, 0)
    }
  },
  {
    data: createCone(10, 0, 20, 12, 1),
    uniforms: {
      colorMult: [0.5, 0.5, 1, 1],
      initMatrix: translate(40, 0, 0)
    }
  }
]

const useShapeHook = (gl: WebGLRenderingContext, program: WebGLProgram, shape: Shape) => {
  const positionIndex = gl.getAttribLocation(program, 'a_position')
  const positionBuffer = gl.createBuffer()

  const vColors = randColorBuffer(shape.data);
  const colorIndex = gl.getAttribLocation(program, 'a_color')
  const colorBuffer = gl.createBuffer()

  const includeBuffer = gl.createBuffer()

  const matrixIndex = gl.getUniformLocation(program, 'u_matrix')
  const colorMutIndex = gl.getUniformLocation(program, 'u_colorMut')
  let colorMult = shape.uniforms.colorMult

  const initMatrix = shape.uniforms.initMatrix
  const currentMatrixs: number[][] = [initMatrix]
  const initMatrixs: number[][] = [initMatrix]

  const hook = {
    activeBuffer() {
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, shape.data.positions, gl.STATIC_DRAW)
      gl.enableVertexAttribArray(positionIndex)
      gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, vColors, gl.STATIC_DRAW)
      gl.enableVertexAttribArray(colorIndex)
      gl.vertexAttribPointer(colorIndex, 4, gl.UNSIGNED_BYTE, true, 0, 0)

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, includeBuffer)
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, shape.data.includes, gl.STATIC_DRAW)
    },
    changeMatrix(afterMatrix: number[][], beforeMatrix: number[][] = [], init = false) {
      for (let i = 0; i < currentMatrixs.length; i++) {
        currentMatrixs[i] = multiply(
          ...afterMatrix, 
          init ? initMatrixs[i] : currentMatrixs[i],
          ...beforeMatrix
        )
      }
    },
    changeColorMult(color: number[]) {
      colorMult = color
    },
    clone(afterMatrix: number[][], beforeMatrix: number[][] = []) {
      const index = initMatrixs.length
      const matrix = multiply(...afterMatrix, initMatrix, ...beforeMatrix)
      initMatrixs[index] = matrix
      currentMatrixs[index] = matrix
    },
    draw() {
      hook.activeBuffer()
      gl.uniform4fv(colorMutIndex, colorMult)
      currentMatrixs.forEach(matrix => {
        gl.uniformMatrix4fv(matrixIndex, false, matrix)
        gl.drawElements(gl.TRIANGLES, shape.data.includes.length, gl.UNSIGNED_SHORT, 0);
      })
    }
  }

  return hook
}


export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext('webgl')!
  const program = createProgramBySource(gl, vertSource, fragSource)

  gl.useProgram(program)
  gl.enable(gl.DEPTH_TEST)
  // gl.enable(gl.CULL_FACE)
  gl.viewport(0, 0, canvas.width, canvas.height)

  const shapeHooks = shapes.map(shape => useShapeHook(gl, program, shape))
  for (let i = 0; i < 50; i++) {
    shapeHooks.forEach(hook => {
      hook.clone(
        [translate(rand(-100, 100), rand(-100, 100), rand(-150, -50))]
      )
    })
  }

  const viewMatrix = multiply(
    straightPerspective1(edgToRad(60), canvas.width / canvas.height, 1, 2000),
    inverse(lookAt([0, 0, 70], [0, 0, 0], [0, 1, 0]))
  )

  const redraw = () => {
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT)

    for (const hook of shapeHooks) {
      hook.changeMatrix([viewMatrix])
      hook.draw()
    }
  }
  
  const animation = () => {
    requestAnimationFrame(now => {
      const time = now * 0.001 + 5
      const shapeRotates = [
        multiply(rotateX(time) ,rotateY(time)),
        multiply(rotateX(-time) ,rotateY(time)),
        multiply(rotateX(time) ,rotateY(-time)),
      ]
      shapeHooks.forEach(hook => hook.changeMatrix([], shapeRotates, true))
      redraw()
      animation()
    })
  }
  redraw()
  animation()
}
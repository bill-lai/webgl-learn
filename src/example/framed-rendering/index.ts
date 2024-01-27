import { fps } from "../../append";
import { NumArr, createCube, createProgramBySource, multiply, rotateX, rotateY, rotateZ, scale, startAnimation, translate } from "../../util";
import { edgToRad, rand } from "../util";
import fragSource from "./shader-fragment.frag?raw";
import vertSource from "./shader-vertex.vert?raw";

const bindAttri = (gl: WebGLRenderingContext, program: WebGLProgram) => {
  const cube = createCube(1)

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData( gl.ARRAY_BUFFER, cube.positions, gl.STATIC_DRAW );

  const includeBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, includeBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cube.includes, gl.STATIC_DRAW)

  return {
    useAttrib: () => {
      const positionLoc = gl.getAttribLocation(program, "position");
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, includeBuffer);
    },
    numVertexs: cube.includes.length
  };
};

const bindUniform = (gl: WebGLRenderingContext, program: WebGLProgram) => {
  const colorLoc = gl.getUniformLocation(program, 'diffuse');
  const matrixLoc = gl.getUniformLocation(program, 'worldMatrix');

  return (color: number[], matrix: NumArr) => {
    gl.uniform4fv(colorLoc, color)
    gl.uniformMatrix4fv(matrixLoc, false, matrix);
  }
};

const getCubeUniform = () => {
  const initMatrix = multiply(
    translate(rand(-1, 1), rand(-1, 1), rand(-1, 1)),
    scale(0.1, 0.1, 0.1)
  )
  return {
    color: [rand(1), rand(1), rand(1), 1],
    initMatrix,
    matrix: initMatrix,
    rotateSpeed: [rand(-Math.PI, Math.PI), rand(-Math.PI, Math.PI), rand(-Math.PI, Math.PI)]
  }
}

const dymicResizeTask = (numTask: number, standardFps = 60, initNumFrameTask = numTask) => {
  standardFps = standardFps > 60 ? 60 : standardFps;
  let ndx = 0;
  let numFrameTask = initNumFrameTask
  let standardFpsCount = 0
  let continueCount = 0

  let currentVisibility = document.visibilityState;
  let timeout: number;
  document.addEventListener('visibilitychange', () => {
    clearTimeout(timeout)
    if (document.visibilityState === 'visible' && currentVisibility === 'hidden') {
      timeout = setTimeout(() => {
        currentVisibility = 'visible'
      }, 100)
    }
  })

  return (currentFps: number) => {
    if (currentVisibility === 'visible') {
      // 溢出多少
      const overflowProp = currentFps / standardFps
      if (overflowProp < 1) {
        numFrameTask = Math.floor(numFrameTask * overflowProp)
        standardFpsCount = 0
        continueCount = 0
        // numFrameTask = 2
      } else {
        standardFpsCount++
        if (standardFpsCount > 10 && numFrameTask < numTask) {
          continueCount++
          numFrameTask += Math.pow(2, continueCount + 3);
        }
      }
    }
    let start = ndx
    let end = ndx + numFrameTask
    let done = false
    ndx = end
    if (end >= numTask) {
      end = numTask;
      ndx = 0;
      done = true
    }

    return { start, end, done: done }
  }
}

export const init = (showCanvas: HTMLCanvasElement) => {
  const ctx = showCanvas.getContext('2d')!
  const canvas = document.createElement('canvas')
  canvas.width = showCanvas.width
  canvas.height = showCanvas.height
  const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true })!;
  const program = createProgramBySource(gl, vertSource, fragSource);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.useProgram(program)

  const { useAttrib, numVertexs } = bindAttri(gl, program)
  const useUniform = bindUniform(gl, program)
  useAttrib();

  const numCubes = 80000;
  const cubeUniforms = new Array(numCubes).fill(0).map(getCubeUniform)
  const getSliceNdx = dymicResizeTask(numCubes, 55, 4000)
  let sliceNdx = {
    start: 0,
    end: numCubes,
    done: true
  }
  // gl.colorMask()

  const redraw = () => {
    for (let i = sliceNdx.start; i < sliceNdx.end; i++) {
      const item = cubeUniforms[i]
      useUniform(item.color, item.matrix)
      gl.drawElements(gl.TRIANGLES, numVertexs, gl.UNSIGNED_SHORT, 0)
    }
  }

  let then = 0
  let i = 0
  startAnimation((time) => {
    if (sliceNdx.done) {
      ctx.drawImage(canvas, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
    }
    i++

    if (i >= 3 && time !== 0) {
      fps.value = Math.round(1000 / (time - then))
      sliceNdx = getSliceNdx(fps.value);
    }
    then = time;
    time *= 0.001
    for (let i = sliceNdx.start; i < sliceNdx.end; i++) {
      const item = cubeUniforms[i]
      item.matrix = multiply(
        item.initMatrix,
        rotateX(time * item.rotateSpeed[0]),
        rotateZ(time * item.rotateSpeed[1]),
        rotateY(time * item.rotateSpeed[2])
      )
    }
    redraw()
  })
}
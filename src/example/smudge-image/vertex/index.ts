import vertSource from "./vertex-shader.vert?raw";
import fragSource from "./fragment-shader.frag?raw";
import imageURI from '../cover.jpg'
import { isTwoPower, startAnimation, createProgramBySource, loadImage, bufferPush, getRealativeMosePosition  } from "../../../util";
import { edgToRad, rand } from "../../util";
import { multiply, positionTransform, rotateZ, scale, translate } from "../../matrix4";

const animationTime = 1
const createPositionGrid = (gridsNum: number) => {
  const linesNum = gridsNum + 1;
  const includes = new Uint16Array(gridsNum * gridsNum * 6)
  const positions = new Float32Array(linesNum * linesNum * 2)

  let ndx = 0
  for (let x = 0; x < linesNum; x++) {
    const cx = x / gridsNum * 2 - 1;
    for (let y = 0; y < linesNum; y++) {
      const cy = y / gridsNum * 2 - 1;
      bufferPush(positions, ndx++, [cx, cy]);
    }
  }

  ndx = 0
  for (let x = 0; x < gridsNum; x++) {
    let xNdx = x * linesNum 
    let xNextNdx = (x + 1) * linesNum
    for (let y = 0; y < gridsNum; y++) {
      bufferPush(includes, ndx++, [
        xNdx + y,
        xNextNdx + y,
        xNextNdx + y + 1,
        xNextNdx + y + 1,
        xNdx + y,
        xNdx + y + 1,
      ])
    }
  }

  const getNearVertexNdxs = (position: number[]) => {
    const targetGrid = [
      Math.floor(((position[0] + 1) / 2) * gridsNum),
      Math.floor(((position[1] + 1) / 2) * gridsNum),
    ]

    const ndx = (targetGrid[0] * gridsNum + targetGrid[1]) 
    return [...includes.slice(ndx * 6, ndx * 6 + 6)]
  }
  return {
    positions,
    includes,
    getNearVertexNdxs
  };
}


const bindAttri = (gl: WebGLRenderingContext, program: WebGLProgram) => {
  const numGrid = 200
  const { getNearVertexNdxs, positions, includes } = createPositionGrid(numGrid)
  const numVertexs = includes.length

  const positionLoc = gl.getAttribLocation(program, "position");
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData( gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW );

  const attrbNum = positions.length / 2
  const displacements = new Float32Array(attrbNum * 3)
  for (let i = 0; i < attrbNum; i++) {
    // const scaleBase = rand(2)
    // const [x, y] = positionTransform(
    //   [0.02, 0.02, 0], 
    //   scale(scaleBase, scaleBase, 1),
    //   // rotateZ(edgToRad(rand(360))),
    // )
    // displacements.set([x, y, 0], i * 3)
    const offset = 0.08
    displacements.set([rand(-offset, offset), rand(-offset, offset), 0], i * 3)
  }

  const displacementLoc = gl.getAttribLocation(program, "displacement");
  const displacementBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, displacementBuffer);
  gl.bufferData( gl.ARRAY_BUFFER, displacements, gl.DYNAMIC_DRAW );

  const includesBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, includesBuffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, includes, gl.STATIC_DRAW)

  const then = Date.now() * 0.001
  let oldNearNdxs: number[]
  document.body.addEventListener('mousemove', ev => {
    const canvas = gl.canvas as HTMLCanvasElement;
    const realPos = getRealativeMosePosition(canvas, [ev.offsetX, ev.offsetY])
    const pos = [
      2 / canvas.offsetWidth * realPos[0],
      2 / canvas.offsetHeight * realPos[1] * -1,
    ]
    if (oldNearNdxs) {
      const time = (Date.now() * 0.001 - then) + animationTime
      oldNearNdxs.forEach(ndx => {
        displacements[ndx * 3 + 2] = time;
      })
    }

    const nearNdxs = getNearVertexNdxs(pos)
    const time = Date.now()
    nearNdxs.forEach(ndx => {
      displacements[ndx * 3 + 2] = time;
    })
    oldNearNdxs = nearNdxs
    gl.bindBuffer(gl.ARRAY_BUFFER, displacementBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, displacements, gl.DYNAMIC_DRAW );
  })

  return {
    useAttrib: () => {
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, displacementBuffer);
      gl.enableVertexAttribArray(displacementLoc);
      gl.vertexAttribPointer(displacementLoc, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, includesBuffer)
    },
    numVertexs
  };
};


const bindUniform = (
  gl: WebGLRenderingContext,
  program: WebGLProgram,
) => {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.LUMINANCE,
    1,
    1,
    0,
    gl.LUMINANCE,
    gl.UNSIGNED_BYTE,
    new Uint8Array([256])
  );
  gl.generateMipmap(gl.TEXTURE_2D)

  loadImage(imageURI)
    .then(image => {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
      if (isTwoPower(image.width) && isTwoPower(image.height)) {
        gl.generateMipmap(gl.TEXTURE_2D)
      } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
      }
    })

  const timeLoc = gl.getUniformLocation(program, 'currentTime')
  const animationTimeLoc = gl.getUniformLocation(program, 'animationTime')

  return (time: number) => {
    gl.uniform1f(timeLoc, time)
    gl.uniform1f(animationTimeLoc, animationTime)
    
  }
};

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl")!;
  const program = createProgramBySource(gl, vertSource, fragSource);

  gl.useProgram(program);
  gl.viewport(0, 0, canvas.width, canvas.height);

  const { useAttrib, numVertexs } = bindAttri(gl, program);
  const useUniform = bindUniform(gl, program)
  
  const redraw = (time: number) => {
    gl.clear(gl.COLOR_BUFFER_BIT)
    useAttrib()
    useUniform(time)
    gl.drawElements(gl.TRIANGLES, numVertexs, gl.UNSIGNED_SHORT, 0)
  }
  startAnimation(time => {
    redraw(time * 0.001)
  })
};

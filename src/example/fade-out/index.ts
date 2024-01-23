import { NumArr, createPlaneVertices, createProgramBySource, createXYPlaneVertices, multiply, rotateZ, scale, startAnimation, translate } from "../../util";
import { edgToRad, rand } from "../util";
import drawFragSource from "./shader-draw-fragment.frag?raw";
import drawVertSource from "./shader-draw-vertex.vert?raw";
import faceOutFragSource from "./shader-fade-out-fragment.frag?raw";
import placeFragSource from "./shader-place-fragment.frag?raw";
import placeVertSource from "./shader-place-vertex.vert?raw";


const bindAttri = (gl: WebGLRenderingContext) => {
  const plane = createXYPlaneVertices(2, 2)

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData( gl.ARRAY_BUFFER, plane.positions, gl.STATIC_DRAW );

  const texcoordBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  gl.bufferData( gl.ARRAY_BUFFER, plane.texCoords, gl.STATIC_DRAW );

  const includeBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, includeBuffer);
  gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, plane.includes, gl.STATIC_DRAW );


  return {
    useAttrib: (program: WebGLProgram) => {
      const positionLoc = gl.getAttribLocation(program, "position");
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
      
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, includeBuffer);

      const texcoordLoc = gl.getAttribLocation(program, "texcoord");
      if (texcoordLoc >= 0) {
        gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
        gl.enableVertexAttribArray(texcoordLoc);
        gl.vertexAttribPointer(texcoordLoc, 2, gl.FLOAT, false, 0, 0);
      }
    },
    numVertexs: plane.includes.length
  };
};


const bindUniform = (
  gl: WebGLRenderingContext,
  
) => {
  const mixAmount = 0.06
  const faceOutColor = [0, 0, 0, 0];

  return (program: WebGLProgram, tex: WebGLTexture, color: number[], matrix: NumArr) => {
    const textureLoc = gl.getUniformLocation(program, 'texture');
    const mixAmountLoc = gl.getUniformLocation(program, 'mixAmount');
    const faceOutColorLoc = gl.getUniformLocation(program, 'faceOutColor');
    const colorLoc = gl.getUniformLocation(program, 'color');
    const matrixLoc = gl.getUniformLocation(program, 'matrix');

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, tex)

    gl.uniform1f(mixAmountLoc, mixAmount)
    gl.uniform1i(textureLoc, 0)
    gl.uniform4fv(faceOutColorLoc, faceOutColor)
    gl.uniform4fv(colorLoc, color)
    gl.uniformMatrix4fv(matrixLoc, false, matrix)

  }
};

const createFb = (gl: WebGLRenderingContext, size: number[]) => {
  const create = (initData: ArrayBufferView | null) => {
    const tex = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size[0], size[1], 0, gl.RGBA, gl.UNSIGNED_BYTE, initData)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

    const deptBuffer = gl.createRenderbuffer()
    gl.bindRenderbuffer(gl.RENDERBUFFER, deptBuffer)
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, size[0], size[1])

    const fb = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, deptBuffer)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
    
    return {tex, fb}
  }
  const initData = new Uint8Array(size[0] * size[1] * 4).fill(256);
  const ctxs = [create(initData), create(null)]
  let ndx = 0;

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  return () => {
    const useTex = ctxs[ndx].tex
    ndx = (ndx + 1) % 2

    return {
      fb: ctxs[ndx].fb,
      useTex,
      currentTex: ctxs[ndx].tex,
    }
  }
}

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl")!;
  const drawProgram = createProgramBySource(gl, drawVertSource, drawFragSource);
  const faceOutProgram = createProgramBySource(gl, drawVertSource, faceOutFragSource);
  const placeProgram = createProgramBySource(gl, placeVertSource, placeFragSource);

  const size = [canvas.width, canvas.height]
  gl.viewport(0, 0, size[0], size[1]);

  const { useAttrib, numVertexs } = bindAttri(gl);
  const useUniform = bindUniform(gl)
  const useFb = createFb(gl, size)
  const pixelNum = 1 / canvas.height * 100;
  const maxX = size[0] / size[1];

  // gl.enable(gl.DEPTH_TEST)
  const redraw = () => {
    const { fb, useTex, currentTex } = useFb()
    const color = [rand(1), rand(1), rand(1), 1]
    const matrix = multiply(
      scale(size[1] / size[0], 1, 1),
      rotateZ(edgToRad(rand(360))),
      translate(rand(-1, 1), rand(-maxX, maxX), rand(-1, 1)),
      scale(pixelNum, pixelNum, 1),
    )

    gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
    gl.useProgram(faceOutProgram)
    useAttrib(faceOutProgram)
    useUniform(faceOutProgram, useTex, color, matrix)
    gl.drawElements(gl.TRIANGLES, numVertexs, gl.UNSIGNED_SHORT, 0)

    gl.useProgram(placeProgram)
    useAttrib(placeProgram)
    useUniform(placeProgram, useTex, color, matrix)
    gl.drawElements(gl.TRIANGLES, numVertexs, gl.UNSIGNED_SHORT, 0)

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.useProgram(drawProgram)
    useAttrib(drawProgram)
    useUniform(drawProgram, currentTex, color, matrix)
    gl.drawElements(gl.TRIANGLES, numVertexs, gl.UNSIGNED_SHORT, 0)
  }

  startAnimation(redraw)
};

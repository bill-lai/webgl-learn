import { NumArr, createProgramBySource, createXYPlaneVertices, generateTexture, startAnimation } from "../../util";
import texURI from './f.jpeg'
import effectMapURI from './effectMap.jpeg'
import blurURI from './blur.jpeg'
import fragSource from "./shader-fragment.frag?raw";
import vertSource from "./shader-vertex.vert?raw";
import { bindFPSCamera } from '../../util/bind-fps-camera-2'
import { identity } from "../matrix4";

const bindAttri = (gl: WebGLRenderingContext, program: WebGLProgram) => {
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
    useAttrib: () => {
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

const bindUniform = (gl: WebGLRenderingContext, program: WebGLProgram) => {
  // time
  // texture
  const range = 100
  const mixAmount = 0.003
  const imageTex = generateTexture(gl, texURI, [1, 1, 1, 1])
  const effectMapTex = generateTexture(gl, effectMapURI, [0, 0, 0, 0])
  const blurTex = generateTexture(gl, blurURI, [1, 1, 1, 1])
  

  const textureLoc = gl.getUniformLocation(program, 'texture');
  const texEffectMapLoc = gl.getUniformLocation(program, 'texEffectMap');
  const mixAmountLoc = gl.getUniformLocation(program, 'mixAmount');
  const rangeLoc = gl.getUniformLocation(program, 'range');
  const timeLoc = gl.getUniformLocation(program, 'time');
  const mouseLoc = gl.getUniformLocation(program, 'mouse');
  const texBlurLoc = gl.getUniformLocation(program, 'texBlur');
  const viewMatrixLoc = gl.getUniformLocation(program, 'viewMatrix');

  gl.uniform1f(mixAmountLoc, mixAmount)
  gl.uniform1f(rangeLoc, range)
  gl.uniform1i(textureLoc, imageTex)
  gl.uniform1i(texBlurLoc, blurTex)
  gl.uniform1i(texEffectMapLoc, effectMapTex)

  return (time: number, mouse: number[], cameraMatrix: NumArr) => {
    gl.uniform1f(timeLoc, time * 10)
    gl.uniform2fv(mouseLoc, mouse)
    gl.uniformMatrix4fv(viewMatrixLoc, false, cameraMatrix)
  }
};

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl")!;
  const program = createProgramBySource(gl, vertSource, fragSource);
  gl.viewport(0, 0, canvas.width, canvas.height);

  gl.useProgram(program)
  const { useAttrib, numVertexs } = bindAttri(gl, program)
  const useUniform = bindUniform(gl, program)

  const cameraMatrix = bindFPSCamera(canvas, identity(), identity())
  let time: number
  let mouse: number[] = [0, 0]
  const redraw = () => {
    gl.clear(gl.COLOR_BUFFER_BIT)
    useAttrib()
    useUniform(time * 0.001, mouse, cameraMatrix.value)
    gl.drawElements(gl.TRIANGLES, numVertexs, gl.UNSIGNED_SHORT, 0)
  }


  document.documentElement.addEventListener('mousemove', ev => {
    mouse = [
      (ev.offsetX / canvas.width * 2 - 1) * 0.05,
      (ev.offsetY / canvas.height * 2 - 1) * 0.05,
    ]
  })
  startAnimation(t => {
    time = t
    redraw()
  })
}
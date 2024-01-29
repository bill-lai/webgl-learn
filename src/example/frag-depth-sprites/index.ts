import {
  NumArr,
  createProgramBySource,
  multiply,
  createXYPlaneVertices,
  orthogonal,
  translate,
  scale,
  startAnimation
} from "../../util";
import fragSource from "./shader-fragment.frag?raw";
import vertSource from "./shader-vertex.vert?raw";
import { getSprtiesTex } from './genTex'

const bindAttri = (
  gl: WebGLRenderingContext,
  program: WebGLProgram,
) => {
  const py = createXYPlaneVertices(1, 1)
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, py.positions, gl.STATIC_DRAW);

  const texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, py.texCoords, gl.STATIC_DRAW);

  const includeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, includeBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, py.includes, gl.STATIC_DRAW);

  return {
    useAttrib: () => {
      const positionLoc = gl.getAttribLocation(program, "position");
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);

      const texcoordLoc = gl.getAttribLocation(program, "texcoord");
      gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
      gl.enableVertexAttribArray(texcoordLoc);
      gl.vertexAttribPointer(texcoordLoc, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, includeBuffer);
    },
    numVertexs: py.includes.length,
  };
};

const bindUniform = (gl: WebGLRenderingContext, program: WebGLProgram) => {
  const matrixLoc = gl.getUniformLocation(program, "matrix");
  const deptTexLoc = gl.getUniformLocation(program, "deptTex");
  const colorTexLoc = gl.getUniformLocation(program, "colorTex");
  const depthOffsetLoc = gl.getUniformLocation(program, "depthOffset");
  const depthScaleLoc = gl.getUniformLocation(program, "depthScale");

  const { colorTex, deptTex } = getSprtiesTex(gl)
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, colorTex)
  gl.activeTexture(gl.TEXTURE1)
  gl.bindTexture(gl.TEXTURE_2D, deptTex)

  gl.uniform1i(deptTexLoc, 1)
  gl.uniform1i(colorTexLoc, 0)
  gl.uniform1f(depthScaleLoc, 256);

  const w = gl.canvas.width, h = gl.canvas.height
  const projectionMatrix = orthogonal(-w / 2, w / 2, -h / 2, h/ 2, -1, 1);

  return (worldMatrix: NumArr, depthOffset: number) => {
    gl.uniformMatrix4fv(matrixLoc, false, multiply(projectionMatrix, worldMatrix));
    gl.uniform1f(depthOffsetLoc, depthOffset);
  };
};

export const init = async (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true })!;
  const ext = gl.getExtension('EXT_frag_depth');
  if (!ext) {
    alert('不支持 EXT_frag_depth')
  }

  const w = canvas.width, h = canvas.height;
  const program = createProgramBySource(gl, vertSource, fragSource);
  gl.viewport(0, 0, w, h);
  gl.useProgram(program);
  gl.enable(gl.DEPTH_TEST);

  const { useAttrib, numVertexs } = bindAttri(gl, program);
  const useUniform = bindUniform(gl, program);

  const drawImage = (pos: number[], size: number[], depth: number) => {
    console.log(depth)
    useAttrib()
    useUniform(
      multiply(
        translate(pos[0], pos[1] + pos[2], 0),
        scale(size[0], size[1], 1)
      ),
      1 - depth / 65536
    )
    gl.drawElements(gl.TRIANGLES, numVertexs, gl.UNSIGNED_SHORT, 0);
  }
  const size = [64, 64]
  const arrPos = [
    [0, 0, 0],

    [100, 0, 0],
    [133, 0, 0],

    [200, 0, 0],
    [200, 8, 0],

    [0, 60, 0],
    [0, 60, 0],

    [100, 60, 0],
    [100, 60, 20],

    [200, 60, 20],
    [200, 60, 0],
  ]

  arrPos.forEach(pos => {
    drawImage([
      -w / 2 + size[0] / 2 + pos[0],
      -h / 2 + size[1] / 2 + pos[1],
      pos[2],
    ], size, pos[1])
  })

};

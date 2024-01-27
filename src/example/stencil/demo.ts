import { NumArr, createProgramBySource, multiply, rotateX, scale } from "../../util";
import fragSource from "./shader-fragment.frag?raw";
import vertSource from "./shader-vertex.vert?raw";
import { identity } from "../matrix4";
import { edgToRad } from "../util";

const bindAttri = (gl: WebGLRenderingContext, program: WebGLProgram) => {
  const positions = new Float32Array([
    -0.8, -0.8,
    0.8, -0.8,
    0,  0.8,
  ])

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData( gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW );

  return {
    useAttrib: () => {
      const positionLoc = gl.getAttribLocation(program, "position");
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
    },
    numVertexs: positions.length / 2
  };
};

const bindUniform = (gl: WebGLRenderingContext, program: WebGLProgram) => {
  const colorLoc = gl.getUniformLocation(program, 'color');
  const matrixLoc = gl.getUniformLocation(program, 'matrix');

  return (color: number[], matrix: NumArr) => {
    gl.uniform4fv(colorLoc, color)
    gl.uniformMatrix4fv(matrixLoc, false, matrix);
  }
};

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl", { stencil: true })!;
  const program = createProgramBySource(gl, vertSource, fragSource);
  gl.viewport(0, 0, canvas.width, canvas.height);

  gl.useProgram(program)
  const { useAttrib, numVertexs } = bindAttri(gl, program)
  const useUniform = bindUniform(gl, program)

  gl.enable(gl.BLEND)
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

  
  const borderWidth = 10 * 2 / canvas.width
  const redraw = () => {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.STENCIL_BUFFER_BIT)
    useAttrib()

    gl.enable(gl.STENCIL_TEST)  
    gl.stencilFunc(gl.NEVER, 1, 0xFF)
    gl.stencilOp(gl.REPLACE, gl.KEEP, gl.KEEP)

    useUniform([0.2, 0.2, 1, 1], multiply(scale(0.3, 0.3, 1), rotateX(edgToRad(180))))
    gl.drawArrays(gl.TRIANGLES, 0, numVertexs)

    gl.stencilFunc(gl.EQUAL, 0, 0xFF)
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.INCR)
    useUniform([0, 0, 0, 1], multiply(scale(0.3 + borderWidth, 0.3 + borderWidth, 1), rotateX(edgToRad(180))))
    gl.drawArrays(gl.TRIANGLES, 0, numVertexs)
    
    gl.stencilFunc(gl.NOTEQUAL, 1, 0xFF);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE)
    useUniform([0.2, 0.2, 1, 1], identity())
    gl.drawArrays(gl.TRIANGLES, 0, numVertexs)

    gl.stencilFunc(gl.EQUAL, 0, 0xFF)
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP)
    useUniform([0, 0, 0, 1], scale(1 + borderWidth, 1 + borderWidth, 1))
    gl.drawArrays(gl.TRIANGLES, 0, numVertexs)
  }

  redraw()
}
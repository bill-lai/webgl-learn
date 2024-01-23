import { NumArr, createProgramBySource, multiply, rotateZ, translate } from "../../util";
import fragSource from "./shader-fragment.frag?raw";
import vertSource from "./shader-vertex.vert?raw";
import { identity } from "../matrix4";

const bindAttri = (gl: WebGLRenderingContext, program: WebGLProgram) => {
  const positions = new Float32Array([
    -0.5, -0.2,
    0.5, -0.2,
    0.5,  0.2,
   -0.2, -0.5,
   -0.2,  0.5,
    0.2,  0.5,
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


  const redraw = () => {
    // 启用模板测试
    gl.enable(gl.STENCIL_TEST)

    // 模板函数，   模板缓冲里面值比对  0 === s & 0xFF 则通过测试
    gl.stencilFunc(gl.EQUAL, 0, 0xFF);
    gl.stencilOp(
      gl.KEEP,    // 不通过模板测试，则使用原有值
      gl.KEEP,    // 深度测试不通过，则使用原有值
      gl.INCR     // 都通过则+1， 下次找到相同位置则不会通过，实现单个地方绘制一次
    )

    // // 模板函数，   模板缓冲里面值比对  1 <= s & 0xFF 则通过测试
    // gl.stencilFunc(gl.LEQUAL, 1, 0xFF);
    // gl.stencilOp(
    //   gl.INCR,
    //   gl.KEEP,
    //   gl.KEEP
    // )
    
    gl.clear(gl.COLOR_BUFFER_BIT)
    useAttrib()
    useUniform([0.5, 0, 0, 0.5], identity())
    gl.drawArrays(gl.TRIANGLES, 0, numVertexs)

    gl.clear(gl.STENCIL_BUFFER_BIT)

    useUniform([0, 0.5, 0, 0.5], multiply(translate(-0.1, 0.2, 0), rotateZ(1.2 * Math.PI)))
    gl.drawArrays(gl.TRIANGLES, 0, numVertexs)
  }


  const redrawDiff = () => {
    // 启用模板测试
    gl.enable(gl.STENCIL_TEST)
    gl.stencilMask(0xff);
    gl.stencilFunc(gl.EQUAL, 100, 0xFF)
    gl.stencilOp(
      gl.INCR,
      gl.KEEP,
      gl.KEEP
    )
    
    gl.clear(gl.COLOR_BUFFER_BIT)
    useAttrib()

    useUniform([0.5, 0, 0, 0.5], identity())
    gl.drawArrays(gl.TRIANGLES, 0, numVertexs)

    gl.stencilFunc(gl.EQUAL, 1, 0xFF)
    gl.drawArrays(gl.TRIANGLES, 0, numVertexs)

  }
  // redraw()
  redrawDiff()
}
import vertSource from "./shader-base.vert?raw";
import fragSource from "./shader-base.frag?raw";
import { createShader, generateProgram } from "@/util/gl2/program";
import { generateVao } from "@/util/gl2/gl";

const getObject = (gl: WebGL2RenderingContext) => {
  const positions = new Float32Array([
    -0.5,
    0.5,
    1.0,
    0.0,
    0.0, // 左上
    0.5,
    0.5,
    0.0,
    1.0,
    0.0, // 右上
    0.5,
    -0.5,
    0.0,
    0.0,
    1.0, // 右下
    -0.5,
    -0.5,
    1.0,
    1.0,
    0.0, // 左下
  ]);

  const vao = generateVao(gl, { positions }, [
    {
      loc: 1,
      size: 3,
      stride: 0,
      offset: 0,
      key: "positions",
      type: gl.FLOAT,
    },
  ]);

  return {
    vao,
    numsVertex: positions.length / 3,
  };
};

// webgl2不支持几何着色器
export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl2")!;
  const { vao, numsVertex } = getObject(gl);
  const program = generateProgram(
    gl,
    createShader(gl, gl.VERTEX_SHADER, vertSource),
    createShader(gl, gl.FRAGMENT_SHADER, fragSource)
  );

  gl.useProgram(program);
  const redraw = () => {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.POINTS, 0, numsVertex);
  };

  redraw();
};

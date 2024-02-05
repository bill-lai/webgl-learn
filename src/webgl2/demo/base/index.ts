import { createProgramBySource, getRectTriangles } from "@/util";
import fragmentSource from "./shader-fragment.frag?raw";
import vertexSource from "./shader-vertex.vert?raw";
import { rand } from "@/example/util";
import { mat4, vec3 } from "gl-matrix";

const bindAttrib = (gl: WebGL2RenderingContext, program: WebGLProgram) => {
  const positionLoc = gl.getAttribLocation(program, "position");
  const positionBuffer = gl.createBuffer();

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.enableVertexAttribArray(positionLoc);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

  return {
    useAttrib(positions: Float32Array) {
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
      gl.bindVertexArray(vao);
    },
  };
};

const bindUniform = (gl: WebGL2RenderingContext, program: WebGLProgram) => {
  const colorLoc = gl.getUniformLocation(program, "color");
  const screenSizeLoc = gl.getUniformLocation(program, "screenSize");

  gl.uniform2fv(screenSizeLoc, [gl.canvas.width, gl.canvas.height]);

  return {
    useUniform: (color: number[]) => {
      gl.uniform4fv(colorLoc, color);
    },
  };
};

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl2")!;
  const program = createProgramBySource(gl, vertexSource, fragmentSource);
  const w = canvas.width,
    h = canvas.height;

  gl.useProgram(program);
  gl.viewport(0, 0, w, h);

  const { useAttrib } = bindAttrib(gl, program);
  const { useUniform } = bindUniform(gl, program);

  const rects = Array(100)
    .fill(0)
    .map((_) => ({
      positions: getRectTriangles([
        rand(w / 2),
        rand(h / 2),
        rand(w / 2),
        rand(h / 2),
      ]),
      color: [rand(1), rand(1), rand(1), 1],
    }));

  const cameraMatrix = mat4.create();

  mat4.invert(
    cameraMatrix,
    mat4.lookAt(cameraMatrix, [0, 0, 2], [0, 0, 0], [0, 1, 0])
  );
  const v3 = vec3.fromValues(0, 0, 0);
  vec3.transformMat4(v3, v3, cameraMatrix);
  console.log(v3);

  const redraw = () => {
    rects.forEach((rect) => {
      useAttrib(rect.positions);
      useUniform(rect.color);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    });
  };
  redraw();
};

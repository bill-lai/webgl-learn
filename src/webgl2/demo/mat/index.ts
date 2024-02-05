import { ExampleInit } from "@/status/example";
import Ctrl from "./ctrl.vue";
import { reactive, watchEffect } from "vue";

import {
  NumArr,
  createProgramBySource,
  getProjectionMatrix,
  multiply,
  rotateZ,
  scale,
  translate,
  edgToRad,
  randRange,
} from "@/util";
import fragmentSource from "./shader-fragment.frag?raw";
import vertexSource from "./shader-vertex.vert?raw";

const bindAttrib = (gl: WebGL2RenderingContext, program: WebGLProgram) => {
  const positions = new Float32Array([175, 100, 325, 225, 0, 200]);
  const colors = new Float32Array([
    randRange(),
    randRange(),
    randRange(),
    1,
    randRange(),
    randRange(),
    randRange(),
    1,
    randRange(),
    randRange(),
    randRange(),
    1,
  ]);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const positionLoc = gl.getAttribLocation(program, "position");
  const positionBuffer = gl.createBuffer();
  gl.enableVertexAttribArray(positionLoc);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

  const colorLoc = gl.getAttribLocation(program, "color");
  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(colorLoc);
  // normalFlag标志标识是否要将值转化到 [-1, 1]之间
  gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);

  return {
    useAttrib() {
      gl.bindVertexArray(vao);
    },
    center: [162, 162],
  };
};

const bindUniform = (gl: WebGL2RenderingContext, program: WebGLProgram) => {
  const matrixLoc = gl.getUniformLocation(program, "matrix");
  const projectionMatrix = getProjectionMatrix(
    gl.canvas.width,
    gl.canvas.height
  );

  return {
    useUniform: (mat: NumArr) => {
      gl.uniformMatrix4fv(matrixLoc, false, multiply(projectionMatrix, mat));
    },
  };
};

export const init: ExampleInit = (canvas, { setAppendComponent }) => {
  const props = reactive({ x: 0, y: 0, angle: 0, scale: [1, 1] });
  const seting = {
    x: { min: 0, max: canvas.width },
    y: { min: 0, max: canvas.width },
    angle: { min: 0, max: 360 },
    scale: { min: 0, max: 3 },
  };
  setAppendComponent(Ctrl, { data: props, seting });

  const gl = canvas.getContext("webgl2")!;
  const program = createProgramBySource(gl, vertexSource, fragmentSource);
  const w = canvas.width,
    h = canvas.height;

  gl.useProgram(program);
  gl.viewport(0, 0, w, h);

  const { useAttrib, center } = bindAttrib(gl, program);
  const { useUniform } = bindUniform(gl, program);
  gl.enable(gl.POLYGON_OFFSET_FILL);
  const redraw = () => {
    gl.clear(gl.COLOR_BUFFER_BIT);
    useAttrib();
    useUniform(
      multiply(
        translate(center[0], center[1], 0),
        translate(props.x, props.y, 0),
        rotateZ(edgToRad(props.angle)),
        scale(props.scale[0], props.scale[1], 1),
        translate(-center[0], -center[1], 0)
      )
    );
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  watchEffect(redraw);
};

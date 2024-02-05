import { cubePostions, cubeTexcoord, cubeTexcoord1 } from "./geo";
import { createProgramBySource, edgToRad } from "./util";
import vertexSource from "../shader/vertex-shader-2d-12.vert?raw";
import fragmentSource from "../shader/fragment-shader-2d-8.frag?raw";
import {
  multiply,
  rotateX,
  rotateY,
  rotateZ,
  straightPerspective1,
  translate,
} from "./matrix4";

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl")!;
  const program = createProgramBySource(gl, vertexSource, fragmentSource);

  gl.useProgram(program);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);

  const positionIndex = gl.getAttribLocation(program, "a_position");
  const texcoordIndex = gl.getAttribLocation(program, "a_texcoord");
  const matrixIndex = gl.getUniformLocation(program, "u_matrix");

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cubePostions(), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(positionIndex);
  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);

  const texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cubeTexcoord1(), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(texcoordIndex);
  gl.vertexAttribPointer(texcoordIndex, 2, gl.FLOAT, false, 0, 0);

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  // 默认情况下webgl每次拿取4个字节，下面height为2所以有两行webgl认为有7个数据，
  // 实际上只有6个， 常规做法是设置每次取1个字节 pixelStorei就是做这件事
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  // gl.LUMINANCE 3通道，1字节， 三色值共用数字
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.LUMINANCE,
    3,
    2,
    0,
    gl.LUMINANCE,
    gl.UNSIGNED_BYTE,
    new Uint8Array([128, 64, 128, 0, 192, 0])
  );

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const initMatrix = straightPerspective1(
    edgToRad(60),
    canvas.width / canvas.height,
    1,
    2000
  );
  // const initMatrix = identity()

  let then = Date.now();
  const rotate = [0, 0, 0];
  const redraw = (now: number) => {
    const diffMis = (now - then) / 1000;
    then = now;

    rotate[0] += diffMis * 1.2;
    rotate[1] += diffMis * 0.7;
    rotate[2] += diffMis * 0.5;

    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    const matrix = multiply(
      initMatrix,
      translate(0, 0, -3),
      rotateX(rotate[0]),
      rotateY(rotate[1]),
      rotateZ(rotate[2])
    );
    gl.uniformMatrix4fv(matrixIndex, false, matrix);
    gl.drawArrays(gl.TRIANGLES, 0, 6 * 6);
  };

  const animation = () => {
    requestAnimationFrame((now) => {
      redraw(now);
      animation();
    });
  };
  redraw(Date.now());
  animation();
};

import vertexSource from "../shader/vertex-shader-2d-10.vert?raw";
import fragmentSource from "../shader/fragment-shader-2d-3.frag?raw";
import { watchEffect } from "vue";
import {
  rotateY as angleY,
  rotateX as angleX,
  rotateZ as angleZ,
  moveX,
  moveY,
  moveZ,
  scaleX,
  scaleY,
  scaleZ,
} from "../status";
import {
  projection,
  multiply,
  rotateX,
  rotateZ,
  rotateY,
  translate,
  scale,
} from "./matrix4";
import { getF3DColorGeometry, getF3DGeometry } from "../util/geo";

export const init = async (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl")!;

  const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
  gl.shaderSource(vertexShader, vertexSource);
  gl.compileShader(vertexShader);
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    throw vertexSource + "编译失败";
  }

  const fragShader = gl.createShader(gl.FRAGMENT_SHADER)!;
  gl.shaderSource(fragShader, fragmentSource);
  gl.compileShader(fragShader);
  if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
    throw fragmentSource + "编译失败";
  }

  const program = gl.createProgram()!;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw "程序链接shader失败";
  }

  gl.useProgram(program);

  const positionIndex = gl.getAttribLocation(program, "a_position");
  const colorIndex = gl.getAttribLocation(program, "a_color");
  const martixIndex = gl.getUniformLocation(program, "u_martix");

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, getF3DGeometry(), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(positionIndex);
  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);

  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, getF3DColorGeometry(), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(colorIndex);
  gl.vertexAttribPointer(colorIndex, 3, gl.UNSIGNED_BYTE, true, 0, 0);

  gl.viewport(0, 0, canvas.width, canvas.height);
  // 剔除反方向形状（正方向为逆时针， 反方向为顺时针）剔除增加效率
  gl.enable(gl.CULL_FACE)
  // 开启深度信息，描绘，深度高的讲覆盖深度低的，深度低的遇到深度高的不绘制
  gl.enable(gl.DEPTH_TEST)


  const initMartix = projection(canvas.width, canvas.height, 400);
  watchEffect(() => {
    
    // 每次绘制需要清除深度信息，重新计算
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const martix = multiply(
      initMartix,
      translate(moveX.value, moveY.value, moveZ.value),
      scale(scaleX.value, scaleY.value, scaleZ.value),
      rotateX((angleX.value * Math.PI) / 180),
      rotateY((angleY.value * Math.PI) / 180),
      rotateZ((angleZ.value * Math.PI) / 180)
    );

    // gl.uniform4fv(colorIndex, color.value);
    gl.uniformMatrix4fv(martixIndex, false, martix);
    gl.drawArrays(gl.TRIANGLES, 0, 16 * 6);
  });
};

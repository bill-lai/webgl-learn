import { createProgramBySource, getFGeometry } from "./util";
import vertexSource from "../shader/vertex-shader-2d-6.vert?raw";
import fragmentSource from "../shader/fragment-shader-2d-4.frag?raw";
import { watchEffect } from "vue";
import {
  translate,
  scale,
  rotate,
  multiply,
  identity,
  projection,
} from "./matrix";
import { moveX, moveY, rotate as angle, scaleX, scaleY } from "../status";

const getTextureInfo = () => {
  const data = new Uint8Array([
    255,
    0,
    0,
    255, // 一个红色的像素
    0,
    255,
    0,
    255, // 一个绿色的像素
  ]);

  return {
    width: 2,
    height: 1,
    level: 0,
    data,
    type: WebGL2RenderingContext.RGBA,
    dataType: WebGL2RenderingContext.UNSIGNED_BYTE,
  };
};

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl")!;
  const program = createProgramBySource(gl, vertexSource, fragmentSource);

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.useProgram(program);

  const positionIndex = gl.getAttribLocation(program, "a_position");
  const matrixIndex = gl.getUniformLocation(program, "u_matrix");
  const textureIndex = gl.getUniformLocation(program, "u_texture");

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, getFGeometry(), gl.STATIC_DRAW);
  gl.vertexAttribPointer(positionIndex, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(positionIndex);

  // 贴图
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  // 绘入纹理数据
  const texInfo = getTextureInfo();
  // internal format
  gl.texImage2D(
    gl.TEXTURE_2D,
    texInfo.level,
    texInfo.type,
    texInfo.width,
    texInfo.height,
    0,
    texInfo.type,
    texInfo.dataType,
    texInfo.data
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // 激活纹理对立第五个位置
  gl.activeTexture(gl.TEXTURE0 + 5);
  // 绑定到第五个位置
  gl.bindTexture(gl.TEXTURE_2D, tex);
  // 告诉着色器纹理在哪个位置
  gl.uniform1i(textureIndex, 5);

  const initMatrix = projection(canvas.width, canvas.height);

  watchEffect(() => {
    gl.clear(gl.COLOR_BUFFER_BIT);

    const matrix = multiply(
      initMatrix,
      translate(moveX.value, moveY.value),
      scale(scaleX.value, scaleY.value),
      rotate((angle.value * Math.PI) / 180)
    );
    gl.uniformMatrix3fv(matrixIndex, false, matrix);
    gl.drawArrays(gl.TRIANGLES, 0, 18);
  });
};

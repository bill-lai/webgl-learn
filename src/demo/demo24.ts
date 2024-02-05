// 模拟方向光源
import vertexSource from "../shader/vertex-shader-2d-13.vert?raw";
import fragmentSource from "../shader/fragment-shader-2d-9.frag?raw";
import { bindModel, createProgramBySource, edgToRad } from "./util";
import { watch, watchEffect } from "vue";
import {
  inverse,
  lookAt,
  multiply,
  normalVector,
  positionTransform,
  rotateX,
  rotateY,
  rotateZ,
  scale,
  straightPerspective1,
  translate,
  transpose,
} from "./matrix4";
import {
  rotateY as angleY,
  rotateX as angleX,
  rotateZ as angleZ,
  scaleX,
  scaleY,
  scaleZ,
  moveX,
  moveY,
  moveZ,
} from "../status";

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl")!;
  const program = createProgramBySource(gl, vertexSource, fragmentSource);

  gl.useProgram(program);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);

  const positionIndex = gl.getAttribLocation(program, "a_position");
  const normalIndex = gl.getAttribLocation(program, "a_normal");
  const normalMatrixIndex = gl.getUniformLocation(program, "u_normalMatrix");
  const matrixIndex = gl.getUniformLocation(program, "u_matrix");
  const lightDirectionIndex = gl.getUniformLocation(
    program,
    "u_lightDirection"
  );
  const colorIndex = gl.getUniformLocation(program, "u_color");

  const model = bindModel("/model/f.json");
  let vertexLength = 0;
  const stopWatchModel = watchEffect(() => {
    if (!model.value) return;
    stopWatchModel();

    // 处理模型
    const positionMatrix = multiply(rotateX(Math.PI), translate(-50, -75, -15));
    const positions: number[] = [];
    for (let i = 0; i < model.value.positions.length; i += 3) {
      const position = [
        model.value.positions[i],
        model.value.positions[i + 1],
        model.value.positions[i + 2],
      ];
      positions.push(...positionTransform(position, positionMatrix));
    }

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionIndex);
    gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(model.value.normals),
      gl.STATIC_DRAW
    );
    gl.enableVertexAttribArray(normalIndex);
    gl.vertexAttribPointer(normalIndex, 3, gl.FLOAT, false, 0, 0);

    vertexLength = model.value.positions.length / 3;
    redraw();
  });
  watch(
    [angleY, angleX, angleZ, scaleX, scaleY, scaleZ, moveX, moveY, moveZ],
    () => redraw()
  );

  gl.uniform3fv(lightDirectionIndex, normalVector([-0.5, -0.7, -1]));
  gl.uniform4fv(colorIndex, [0.2, 1, 0.2, 1]);

  const viewMatrix = straightPerspective1(
    edgToRad(60),
    canvas.width / canvas.height,
    1,
    2000
  );
  const cameraMatrix = lookAt([100, 150, 200], [0, 35, 0], [0, 1, 0]);
  const initMatrix = multiply(viewMatrix, inverse(cameraMatrix));

  const redraw = () => {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const selfMatrix = multiply(
      translate(moveX.value, moveY.value, moveZ.value),
      rotateX((angleX.value * Math.PI) / 180),
      rotateY((angleY.value * Math.PI) / 180),
      rotateZ((angleZ.value * Math.PI) / 180),
      scale(scaleX.value, scaleY.value, scaleZ.value),

      rotateZ(edgToRad(30))
    );
    // 法向量的矩阵转换就是针对模型世界矩阵逆转后再转置
    const normalMatrix = transpose(inverse(selfMatrix));
    const matrix = multiply(initMatrix, selfMatrix);
    gl.uniformMatrix4fv(matrixIndex, false, matrix);
    gl.uniformMatrix4fv(normalMatrixIndex, false, normalMatrix);
    gl.drawArrays(gl.TRIANGLES, 0, vertexLength);
  };
};

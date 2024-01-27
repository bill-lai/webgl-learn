import {
  NumArr,
  ShapeAttrib,
  createHeightPlaneVertices,
  createProgramBySource,
  createXYPlaneVertices,
  inverse,
  lookAt,
  multiply,
  rotateY,
  startAnimation,
  straightPerspective1,
  translate,
} from "../../../util";
import { edgToRad } from "../../util";
import fragSource from "./shader-fragment.frag?raw";
import vertSource from "./shader-vertex.vert?raw";
import heightImage from "../heightmap-96x64.png";

const bindAttri = (
  py: ShapeAttrib,
  gl: WebGLRenderingContext,
  program: WebGLProgram
) => {
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, py.positions, gl.STATIC_DRAW);

  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, py.normals, gl.STATIC_DRAW);

  const includeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, includeBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, py.includes, gl.STATIC_DRAW);

  return {
    useAttrib: () => {
      const positionLoc = gl.getAttribLocation(program, "position");
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);

      const normalLoc = gl.getAttribLocation(program, "normal");
      gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
      gl.enableVertexAttribArray(normalLoc);
      gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, includeBuffer);
    },
    numVertexs: py.includes.length,
  };
};

const bindUniform = (gl: WebGLRenderingContext, program: WebGLProgram) => {
  const projectionMatrixLoc = gl.getUniformLocation(
    program,
    "projectionMatrix"
  );
  const viewMatrixLoc = gl.getUniformLocation(program, "viewMatrix");
  const worldMatrixLoc = gl.getUniformLocation(program, "worldMatrix");

  const projectionMatrix = straightPerspective1(
    edgToRad(60),
    gl.canvas.width / gl.canvas.height,
    0.1,
    1000
  );
  const cameraMatrix = lookAt([0, 10, 25], [0, 0, 0], [0, 1, 0]);
  gl.uniformMatrix4fv(projectionMatrixLoc, false, projectionMatrix);
  gl.uniformMatrix4fv(viewMatrixLoc, false, inverse(cameraMatrix));

  return (worldMatrix: NumArr) => {
    gl.uniformMatrix4fv(worldMatrixLoc, false, worldMatrix);
  };
};

export const init = async (canvas: HTMLCanvasElement) => {
  const py = await createHeightPlaneVertices(heightImage);
  const gl = canvas.getContext("webgl")!;
  const program = createProgramBySource(gl, vertSource, fragSource);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.useProgram(program);
  gl.enable(gl.DEPTH_TEST);

  const { useAttrib, numVertexs } = bindAttri(py, gl, program);
  const useUniform = bindUniform(gl, program);

  const redraw = (worldMatrix: NumArr) => {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    useAttrib();
    useUniform(worldMatrix);
    gl.drawElements(gl.TRIANGLES, numVertexs, gl.UNSIGNED_SHORT, 0);
  };

  startAnimation((time) => {
    redraw(
      multiply(
        rotateY(time * 0.001 * edgToRad(60)),
        translate(-py.height / 2, 0, -py.width / 2)
      )
    );
  });
};

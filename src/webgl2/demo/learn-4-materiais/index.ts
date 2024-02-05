import { createProgram, attribLocs } from "@/util/gl2/program";
import { createCube, startAnimation } from "@/util";
import { mat4, glMatrix, vec3 } from "gl-matrix";
import { createFPSCamera } from "@/util/gl2/fps-camera";
import { objectInitMatrixs, objectMaterials } from "./objects";

import vertexSource from "./shader-vert.vert?raw";
import cubeFragSource from "./shader-material.frag?raw";
import lightFragSource from "./shader-light-frag.frag?raw";
import { setUniforms } from "@/util/gl2/setUniform";

const getVao = (gl: WebGL2RenderingContext) => {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const cube = createCube(1);
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cube.positions, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(attribLocs.position);
  gl.vertexAttribPointer(attribLocs.position, 3, gl.FLOAT, false, 0, 0);

  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cube.normals, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(attribLocs.normal);
  gl.vertexAttribPointer(attribLocs.normal, 3, gl.FLOAT, false, 0, 0);

  const indiceBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indiceBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cube.includes, gl.STATIC_DRAW);

  return { vao, numVertexs: cube.includes.length };
};

const identity = mat4.identity(mat4.create());
export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl2");
  if (!gl) throw "无法获取gl上下文";
  const cubeProgram = createProgram(gl, vertexSource, cubeFragSource);
  const lightProgram = createProgram(gl, vertexSource, lightFragSource);
  const { vao, numVertexs } = getVao(gl);

  const projectionMat = mat4.perspective(
    mat4.create(),
    glMatrix.toRadian(45),
    gl.canvas.width / gl.canvas.height,
    0.1,
    100
  );
  const eysPosition = vec3.fromValues(0, 0, 12);
  const viewMat = mat4.copy(mat4.create(), identity);
  const light: Light = {
    position: vec3.fromValues(0, 0, 10),
    // ambient: [0.1, 0.1, 0.1],
    // diffuse: [0.5, 0.5, 0.5],
    // specluar: [1, 1, 1],
    ambient: [1, 1, 1],
    diffuse: [1, 1, 1],
    specluar: [1, 1, 1],
  };
  let worldMats = [...objectInitMatrixs];

  gl.enable(gl.DEPTH_TEST);
  const redraw = () => {
    gl.clearColor(0.5, 0.5, 0.5, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.bindVertexArray(vao);
    gl.useProgram(lightProgram);

    const lightWorldMat = mat4.translate(
      mat4.create(),
      identity,
      light.position as vec3
    );
    mat4.scale(lightWorldMat, lightWorldMat, [0.1, 0.1, 0.1]);

    setUniforms(gl, lightProgram, {
      projectionMat,
      viewMat,
      worldMat: lightWorldMat,
      norMat: mat4.transpose(
        mat4.create(),
        mat4.invert(mat4.create(), lightWorldMat)
      ),
    });
    gl.drawElements(gl.TRIANGLES, numVertexs, gl.UNSIGNED_SHORT, 0);

    gl.useProgram(cubeProgram);
    objectMaterials.forEach((material, ndx) => {
      setUniforms(gl, cubeProgram, {
        material,
        light,
        projectionMat,
        viewMat,
        eysPosition,
        worldMat: worldMats[ndx],
        norMat: mat4.transpose(
          mat4.create(),
          mat4.invert(mat4.create(), worldMats[ndx])
        ),
      });
      gl.drawElements(gl.TRIANGLES, numVertexs, gl.UNSIGNED_SHORT, 0);
    });
  };

  const fpsCameraDestory = createFPSCamera(
    canvas.parentElement!,
    (nViewMat, eys) => {
      mat4.copy(viewMat, nViewMat);
      redraw();
      vec3.copy(eysPosition, eys);
    },
    [0, 1, 0],
    eysPosition
  );

  const initLight = vec3.copy(vec3.create(), light.position as vec3);
  const animationDestory = startAnimation((now) => {
    vec3.transformMat4(
      light.position as vec3,
      initLight,
      mat4.rotateY(mat4.create(), identity, now * 0.001)
    );

    worldMats = objectInitMatrixs.map((initMat, ndx) => {
      const mat = mat4.create();
      mat4.multiply(
        mat,
        initMat,
        mat4.invert(
          mat,
          mat4.lookAt(mat, [0, 0, 0], light.position as vec3, [0, 1, 0])
        )
        // mat4.rotateY(mat, identity, ndx + now * 0.001)
      );
      return mat;
    });

    redraw();
  });

  return () => {
    fpsCameraDestory();
    animationDestory();
  };
};

import { createProgram, attribLocs } from "@/util/gl2/program";
import { createCube, startAnimation } from "@/util";
import { mat4, glMatrix, vec3 } from "gl-matrix";
import { createFPSCamera } from "@/util/gl2/fps-camera";

// import vertexSource from "./shader-vcalc-vert.vert?raw";
// import cubeFragSource from "./shader-vcalc-frag.frag?raw";
// import lightFragSource from "./shader-vcalc-light-frag.frag?raw";

import vertexSource from "./shader-vertex.vert?raw";
import cubeFragSource from "./shader-frag-cube.frag?raw";
import lightFragSource from "./shader-frag-light.frag?raw";

// import vertexSource from "./shader-observer-vertex.vert?raw";
// import cubeFragSource from "./shader-observer-cube-frag.frag?raw";
// import lightFragSource from "./shader-frag-light.frag?raw";

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

type Uniforms = {
  mats: { [key in string]: mat4 };
  material: { [key in string]: number | number[] };
};
const bindUniform = (gl: WebGL2RenderingContext) => {
  const projectionMat = mat4.perspective(
    mat4.create(),
    glMatrix.toRadian(45),
    gl.canvas.width / gl.canvas.height,
    0.1,
    100
  );

  return (program: WebGLProgram, setting: Uniforms) => {
    setting.mats.projectionMat = projectionMat;
    Object.entries(setting.mats).forEach(([name, val]) => {
      const loc = gl.getUniformLocation(program, name);
      gl.uniformMatrix4fv(loc, false, val);
    });
    Object.entries(setting.material).forEach(([name, val]) => {
      val = Array.isArray(val) ? val : [val];
      const loc = gl.getUniformLocation(program, name);
      (gl as any)[`uniform${val.length}fv`](loc, val);
    });
  };
};

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl2");
  if (!gl) throw "无法获取gl上下文";
  const cubeProgram = createProgram(gl, vertexSource, cubeFragSource);
  const lightProgram = createProgram(gl, vertexSource, lightFragSource);
  const useUniform = bindUniform(gl);
  const { vao, numVertexs } = getVao(gl);
  const mats = {
    viewMat: mat4.identity(mat4.create()),
    normalMat: mat4.identity(mat4.create()),
    worldMat: mat4.identity(mat4.create()),
  };
  const lightPos = vec3.fromValues(1.2, 0, 2);
  const material = {
    lightColor: [1, 1, 1],
    ambient: 0.2,
    objectColor: [1, 0.5, 0.31],
    // 反射强度， 反射强度越高反射越聚拢，漫射越少
    shininess: 32,
    // 反光强度
    specular: 1,
    eysPos: [0, 0, 6],
  };

  const cubeWorldMat = mat4.identity(mat4.create());

  gl.enable(gl.DEPTH_TEST);
  const redraw = () => {
    const lightWorldMat = mat4.identity(mat4.create());
    mat4.translate(lightWorldMat, cubeWorldMat, lightPos);
    mat4.scale(lightWorldMat, lightWorldMat, [0.1, 0.1, 0.1]);

    mat4.transpose(mats.normalMat, mat4.invert(mats.normalMat, cubeWorldMat));

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(lightProgram);
    gl.bindVertexArray(vao);
    useUniform(lightProgram, {
      mats: { ...mats, worldMat: lightWorldMat },
      material: { ...material, lightPos: [...lightPos] },
    });
    gl.drawElements(gl.TRIANGLES, numVertexs, gl.UNSIGNED_SHORT, 0);

    gl.useProgram(cubeProgram);
    gl.bindVertexArray(vao);
    useUniform(cubeProgram, {
      material: { ...material, lightPos: [...lightPos] },
      mats,
    });
    gl.drawElements(gl.TRIANGLES, numVertexs, gl.UNSIGNED_SHORT, 0);
  };

  const fpsCameraDestory = createFPSCamera(
    canvas.parentElement!,
    (nViewMat, eys) => {
      mat4.copy(mats.viewMat, nViewMat);
      redraw();
      material.eysPos = [eys[0], eys[1], eys[2]];
    },
    [0, 1, 0],
    material.eysPos as any
  );

  const ident = mat4.identity(mat4.create());
  const initLight = vec3.copy(vec3.create(), lightPos);
  const animationDestory = startAnimation((now) => {
    vec3.transformMat4(
      lightPos,
      initLight,
      mat4.rotateY(mat4.create(), ident, now * 0.001)
    );
    redraw();
  });

  return () => {
    fpsCameraDestory();
    animationDestory();
  };
};

import { createProgram, attribLocs } from "@/util/gl2/program";
import { createCube, generateTexture, startAnimation } from "@/util";
import { mat4, glMatrix, vec3 } from "gl-matrix";
import { createFPSCamera } from "@/util/gl2/fps-camera";
import diffuseTexURI from "./container2.png";
import specularTexURI from "./container2_specular.png";
import emissionURI from "./emission.jpeg";

import vertexSource from "./shader-vert.vert?raw";
import cubeFragSource from "./shader-material.frag?raw";
import lightFragSource from "./shader-light-frag.frag?raw";
import { setUniforms } from "@/util/gl2/setUniform";
import { createTransform } from "@/util/gl2/mat4-pack";

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

  const texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cube.texCoords, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(attribLocs.texcoord);
  gl.vertexAttribPointer(attribLocs.texcoord, 2, gl.FLOAT, false, 0, 0);

  const indiceBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indiceBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cube.includes, gl.STATIC_DRAW);

  return { vao, numVertexs: cube.includes.length };
};

const uniformsDataFactory = (gl: WebGL2RenderingContext) => {
  const projectionMat = mat4.perspective(
    mat4.create(),
    glMatrix.toRadian(45),
    gl.canvas.width / gl.canvas.height,
    0.1,
    100
  );
  const light: Light = {
    position: vec3.fromValues(0, 0, 10),
    ambient: [0.5, 0.5, 0.5],

    // diffuse: [0.5, 0.5, 0.5],
    // specluar: [0.5, 0.5, 0.5],
    // ambient: [1, 1, 1],
    diffuse: [1, 1, 1],
    specluar: [1, 1, 1],
  };

  const diffuseTex = generateTexture(gl, diffuseTexURI, [1, 1, 1, 1]);
  const specularTex = generateTexture(gl, specularTexURI, [1, 1, 1, 1]);
  const emissionTex = generateTexture(gl, emissionURI, [1, 1, 1, 1]);

  return (
    lightPosition: vec3,
    eysPosition: vec3,
    viewMat: mat4,
    worldMat: mat4
  ) => {
    light.position = lightPosition;
    return {
      material: {
        diffuseTex: diffuseTex,
        emissionTex: emissionTex,
        specluarTex: specularTex,
        shininess: 50,
      },
      light,
      projectionMat,
      viewMat,
      eysPosition,
      worldMat,
      norMat: mat4.transpose(
        mat4.create(),
        mat4.invert(mat4.create(), worldMat)
      ),
    };
  };
};

const identity = mat4.identity(mat4.create());
export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl2");
  if (!gl) throw "无法获取gl上下文";
  const cubeProgram = createProgram(gl, vertexSource, cubeFragSource);
  const lightProgram = createProgram(gl, vertexSource, lightFragSource);
  const { vao, numVertexs } = getVao(gl);

  const getUniformsData = uniformsDataFactory(gl);
  const eysPosition = vec3.fromValues(0, 0, 3);
  const viewMat = mat4.copy(mat4.create(), identity);
  const worldMat = mat4.identity(mat4.create());
  const lightPosition = vec3.fromValues(0, 0, 4);
  const lightCubeTransform = createTransform();

  gl.enable(gl.DEPTH_TEST);
  const redraw = () => {
    gl.clearColor(0.5, 0.5, 0.5, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.bindVertexArray(vao);
    gl.useProgram(lightProgram);

    setUniforms(
      gl,
      lightProgram,
      getUniformsData(
        lightPosition,
        eysPosition,
        viewMat,
        lightCubeTransform.translate(lightPosition).scale([0.1, 0.1, 0.1]).get()
      )
    );
    gl.drawElements(gl.TRIANGLES, numVertexs, gl.UNSIGNED_SHORT, 0);

    gl.useProgram(cubeProgram);
    setUniforms(
      gl,
      cubeProgram,
      getUniformsData(lightPosition, eysPosition, viewMat, worldMat)
    );
    gl.drawElements(gl.TRIANGLES, numVertexs, gl.UNSIGNED_SHORT, 0);
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

  const initLightPosition = vec3.copy(vec3.create(), lightPosition);
  const animationDestory = startAnimation((now) => {
    vec3.transformMat4(
      lightPosition,
      initLightPosition,
      mat4.rotateY(mat4.create(), identity, now * 0.001)
    );
    redraw();
  });

  return () => {
    fpsCameraDestory();
    animationDestory();
  };
};

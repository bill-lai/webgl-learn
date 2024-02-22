import skyBackURL from "./skybox/back.jpg";
import skyBottomURL from "./skybox/bottom.jpg";
import skyFrontURL from "./skybox/front.jpg";
import skyLeftURL from "./skybox/left.jpg";
import skyRightURL from "./skybox/right.jpg";
import skyTopURL from "./skybox/top.jpg";
import skyFragSource from "./shader-skybox.frag?raw";
import skyVertSource from "./shader-skybox.vert?raw";
import rawFragSource from "./shader-raw.frag?raw";
import rawVertSource from "./shader-raw.vert?raw";
import reflectionFragSource from "./shader-reflection.frag?raw";
import refractionFragSource from "./shader-refraction.frag?raw";
import refVertSource from "./shader-reflection-refraction.vert?raw";
import { generateCubeTex, generateVao, useTex } from "@/util/gl2/gl";
import { createProgram } from "@/util/gl2/program";
import {
  createCube,
  createSphereVertices,
  createXYPlaneVertices,
  frameRender,
  startAnimation,
} from "@/util";
import { setUniforms } from "@/util/gl2/setUniform";
import { createFPSCamera } from "@/util/gl2/fps-camera";
import { glMatrix, mat4, vec3 } from "gl-matrix";
import { createTransform } from "@/util/gl2/mat4-pack";

const pointerMap = {
  positions: {
    key: "positions",
    type: 5126, //gl.FLOAT
    size: 3,
    offset: 0,
    stride: 0,
    loc: 1,
  },
  texcoords: {
    key: "texCoords",
    type: 5126, //gl.FLOAT
    size: 2,
    offset: 0,
    stride: 0,
    loc: 3,
  },
  normals: {
    key: "normals",
    type: 5126, //gl.FLOAT
    size: 3,
    offset: 0,
    stride: 0,
    loc: 2,
  },
} as const;

const getSkyObject = (gl: WebGL2RenderingContext) => {
  const program = createProgram(gl, skyVertSource, skyFragSource);
  const modal = createXYPlaneVertices(2, 2);
  const vao = generateVao(gl, modal, [pointerMap.positions]);
  const { tex, loaded } = generateCubeTex(gl, [
    skyRightURL,
    skyLeftURL,
    skyTopURL,
    skyBottomURL,
    skyFrontURL,
    skyBackURL,
  ]);
  return {
    numElements: modal.includes.length,
    program,
    vao,
    tex,
    loaded,
    uniforms: {
      invMat: mat4.create(),
    },
  };
};

const generateEffectObject = (
  gl: WebGL2RenderingContext,
  redraw: () => void
) => {
  const modal = createSphereVertices(1, 24, 48);
  // const modal = createCube(2);

  const getRaw = () => {
    const program = createProgram(gl, rawVertSource, rawFragSource);
    const vao = generateVao(gl, modal, [pointerMap.positions]);
    const worldMat = mat4.identity(mat4.create());
    const transform = createTransform({ out: worldMat }).translate([-3, 0, 0]);

    startAnimation((now) => {
      now *= 0.001;
      transform
        .rotateX(now * 60)
        .rotateY(now * 60)
        .gen();
      redraw();
    });

    return {
      numElements: modal.includes.length,
      program,
      vao,
      uniforms: { worldMat },
    };
  };

  const getReflection = () => {
    const program = createProgram(gl, refVertSource, reflectionFragSource);
    const vao = generateVao(gl, modal, [
      pointerMap.positions,
      pointerMap.normals,
    ]);
    const worldMat = mat4.identity(mat4.create());
    const normalMat = mat4.copy(mat4.create(), worldMat);
    // const transform = createTransform({ out: worldMat });

    // startAnimation((now) => {
    //   now *= 0.001;
    //   transform
    //     .rotateX(now * 60)
    //     .rotateY(now * 60)
    //     .gen();

    //   mat4.invert(normalMat, worldMat);
    //   mat4.transpose(normalMat, normalMat);
    //   redraw();
    // });

    return {
      numElements: modal.includes.length,
      program,
      vao,
      uniforms: {
        worldMat,
        normalMat,
        eysPosition: vec3.create(),
      },
    };
  };

  const getRefraction = () => {
    const program = createProgram(gl, refVertSource, refractionFragSource);
    const vao = generateVao(gl, modal, [
      pointerMap.positions,
      pointerMap.normals,
    ]);
    const worldMat = mat4.identity(mat4.create());
    const normalMat = mat4.copy(mat4.create(), worldMat);
    const transform = createTransform({ out: worldMat }).translate([3, 0, 0]);

    transform.gen();
    // startAnimation((now) => {
    //   now *= 0.001;
    //   transform
    //     .rotateX(now * 60)
    //     .rotateY(now * 60)
    //     .gen();

    //   mat4.invert(normalMat, worldMat);
    //   mat4.transpose(normalMat, normalMat);
    //   redraw();
    // });

    return {
      numElements: modal.includes.length,
      program,
      vao,
      uniforms: {
        worldMat,
        // 折射率
        eta: 1 / 2.42,
        normalMat,
        eysPosition: vec3.create(),
      },
    };
  };

  return {
    raw: getRaw(),
    reflection: getReflection(),
    refraction: getRefraction(),
  };
};

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl2")!;
  const sky = getSkyObject(gl);
  const eObject = generateEffectObject(gl, () => redraw());
  const uniforms = {
    viewMat: mat4.create(),
    projectionMat: mat4.perspective(
      mat4.create(),
      glMatrix.toRadian(45),
      canvas.width / canvas.height,
      0.1,
      100
    ),
  };

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.enable(gl.DEPTH_TEST);

  const redraw = frameRender(() => {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const texNdx = useTex(gl, sky.tex!, gl.TEXTURE_CUBE_MAP);

    gl.enable(gl.CULL_FACE);

    // ------使用cube贴图效果-------
    gl.useProgram(eObject.raw.program);
    gl.bindVertexArray(eObject.raw.vao);
    setUniforms(gl, eObject.raw.program, {
      cubeTex: texNdx,
      ...uniforms,
      ...eObject.raw.uniforms,
    });
    gl.drawElements(
      gl.TRIANGLES,
      eObject.raw.numElements,
      gl.UNSIGNED_SHORT,
      0
    );

    // -------使用反射效果------
    gl.useProgram(eObject.reflection.program);
    gl.bindVertexArray(eObject.reflection.vao);
    setUniforms(gl, eObject.reflection.program, {
      envTex: texNdx,
      ...uniforms,
      ...eObject.reflection.uniforms,
    });
    gl.drawElements(
      gl.TRIANGLES,
      eObject.reflection.numElements,
      gl.UNSIGNED_SHORT,
      0
    );

    // -------使用折射效果------
    gl.useProgram(eObject.refraction.program);
    gl.bindVertexArray(eObject.refraction.vao);
    setUniforms(gl, eObject.refraction.program, {
      envTex: texNdx,
      ...uniforms,
      ...eObject.refraction.uniforms,
    });
    gl.drawElements(
      gl.TRIANGLES,
      eObject.refraction.numElements,
      gl.UNSIGNED_SHORT,
      0
    );

    gl.disable(gl.CULL_FACE);
    // -------天空盒--------
    gl.useProgram(sky.program);
    gl.depthFunc(gl.LEQUAL);
    gl.bindVertexArray(sky.vao);
    setUniforms(gl, sky.program, {
      skyTex: texNdx,
      ...sky.uniforms,
    });
    gl.drawElements(gl.TRIANGLES, sky.numElements, gl.UNSIGNED_SHORT, 0);
    gl.depthFunc(gl.LESS);
  });

  sky.loaded.then(redraw);
  const fpsDestory = createFPSCamera(
    canvas.parentElement!,
    (nViewMat, eysPosition) => {
      mat4.copy(uniforms.viewMat, nViewMat);
      mat4.multiply(sky.uniforms.invMat, uniforms.projectionMat, nViewMat);
      mat4.invert(sky.uniforms.invMat, sky.uniforms.invMat);
      vec3.copy(eObject.reflection.uniforms.eysPosition, eysPosition);
      vec3.copy(eObject.refraction.uniforms.eysPosition, eysPosition);
      redraw();
    },
    [0, 1, 0],
    [0, 0, 6]
  );

  return fpsDestory;
};

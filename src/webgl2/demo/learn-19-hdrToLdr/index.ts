import { createCube, createXYPlaneVertices, mergeFuns } from "@/util";
import sceneFragSource from "./shader-scene.frag?raw";
import sceneVertSource from "./shader-scene.vert?raw";
import hdrFragSource from "./shader-hdr.frag?raw";
import hdrVertSource from "./shader-hdr.vert?raw";
import { genModalsTangentAndBi } from "@/util/gl2/math";
import { generateTex, generateVao, useTex } from "@/util/gl2/gl";
import { glMatrix, mat3, mat4 } from "gl-matrix";
import { createFPSCamera } from "@/util/gl2/fps-camera";
import { createTransform } from "@/util/gl2/mat4-pack";
import { createProgram } from "@/util/gl2/program";
import { setUniforms } from "@/util/gl2/setUniform";
import { InitProps } from "@/status/example";
import Attach from "./attach.vue";
import { reactive, ref, watch } from "vue";

import usePipeNorURI from "./texture/brickwall_normal.jpg";
import usePipeDiffuseURI from "./texture/brickwall.jpg";
import pipeDiffuseURI from "./texture/wood.png";

const useNor = false;

const getObjects = (gl: WebGL2RenderingContext) => {
  const cubeGeo = createCube(2);
  const scale = 0.5;
  cubeGeo.texcoords = new Float32Array([
    // 右侧
    0,
    0,
    11 * scale,
    0,
    11 * scale,
    scale,
    0,
    scale,
    // 左侧
    0,
    0,
    11 * scale,
    0,
    11 * scale,
    scale,
    0,
    scale,
    // 顶部
    0,
    0,
    scale,
    0,
    scale,
    11 * scale,
    0,
    11 * scale,
    // 底部
    0,
    0,
    scale,
    0,
    scale,
    11 * scale,
    0,
    11 * scale,

    // 前面
    0,
    0,
    scale,
    0,
    scale,
    scale,
    0,
    scale,
    // 后面
    0,
    0,
    scale,
    0,
    scale,
    scale,
    0,
    scale,
  ]);
  const cube = genModalsTangentAndBi(cubeGeo);
  const plan = createXYPlaneVertices(2, 2);
  const basePointer = {
    size: 3,
    type: gl.FLOAT,
    stride: 0,
    offset: 0,
  };
  const pointers = [
    { ...basePointer, loc: 1, key: "positions" },
    { ...basePointer, loc: 2, key: "normals" },
    { ...basePointer, loc: 3, key: "texcoords", size: 2 },
    { ...basePointer, loc: 4, key: "tangents" },
  ];

  return {
    cube: {
      vao: generateVao(gl, cube, pointers),
      numElements: cube.includes.length,
    },
    plan: {
      vao: generateVao(gl, plan, [pointers[0], pointers[2]]),
      numElements: plan.includes.length,
    },
  };
};

const getProps = (gl: WebGL2RenderingContext) => {
  const { tex: pipeNorTex, loaded: pipeNorLoaded } = generateTex(
    gl,
    usePipeNorURI,
    gl.REPEAT,
    gl.RGBA,
    [gl.NEAREST, gl.NEAREST]
  );
  const { tex: pipeDiffuseTex, loaded: pipeDiffuseLoaded } = generateTex(
    gl,
    useNor ? usePipeDiffuseURI : pipeDiffuseURI,
    gl.REPEAT,
    gl.SRGB8_ALPHA8
  );

  const projectionMat = mat4.perspective(
    mat4.create(),
    glMatrix.toRadian(45),
    gl.canvas.width / gl.canvas.height,
    0.1,
    100
  );

  const lightPositions = [
    new Float32Array([0.0, 0.0, -27]),
    new Float32Array([-1.4, -1.9, 7.0]),
    new Float32Array([0.0, -1.8, 2.0]),
    new Float32Array([0.8, -1.7, 4.0]),
  ];
  const lightDiffuses = [
    new Float32Array([20, 20, 20]),
    new Float32Array([0.1, 0, 0]),
    new Float32Array([0, 0, 0.2]),
    new Float32Array([0, 0.1, 0]),
  ];
  const viewMat = mat4.lookAt(mat4.create(), [0, 0, 0], [0, 0, -1], [0, 1, 0]);
  const pipeModelMat = createTransform().scale([2.5, 2.5, 27.5]).get();
  const pipeNorMat = mat3.fromMat4(mat3.create(), pipeModelMat);
  mat3.transpose(pipeNorMat, mat3.invert(pipeNorMat, pipeNorMat));

  return {
    pipeDiffuseTex,
    pipeNorTex,
    pipeModelMat,
    pipeNorMat,
    texLoaded: Promise.all([pipeNorLoaded, pipeDiffuseLoaded]),
    uniforms: {
      projectionMat,
      lightPositions,
      lightDiffuses,
      viewMat,
    },
  };
};

const getSceneFB = (gl: WebGL2RenderingContext, size: number[]) => {
  const ext = gl.getExtension("EXT_color_buffer_float");
  if (!ext) {
    throw "不支持float纹理";
  }

  const colorTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, colorTex);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA16F,
    size[0],
    size[1],
    0,
    gl.RGBA,
    gl.FLOAT,
    null
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindTexture(gl.TEXTURE_2D, null);

  const rbDepth = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, rbDepth);
  gl.renderbufferStorage(
    gl.RENDERBUFFER,
    gl.DEPTH_COMPONENT32F,
    size[0],
    size[1]
  );
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);

  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    colorTex,
    0
  );
  gl.framebufferRenderbuffer(
    gl.FRAMEBUFFER,
    gl.DEPTH_ATTACHMENT,
    gl.RENDERBUFFER,
    rbDepth
  );
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    console.error("Framebuffer is incomplete:", status);
    throw "frame不完整";
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { colorTex, fb };
};

export const init = (canvas: HTMLCanvasElement, vmProps: InitProps) => {
  const exposure = ref(2);
  vmProps.setAppendComponent(
    Attach,
    reactive({
      exposure,
      updateExposure: (val: number) => (exposure.value = val),
    })
  );

  const gl = canvas.getContext("webgl2")!;
  const objects = getObjects(gl);
  const props = getProps(gl);
  const sceneProgram = createProgram(gl, sceneVertSource, sceneFragSource);
  const hdrProgram = createProgram(gl, hdrVertSource, hdrFragSource);
  const scene = getSceneFB(gl, [canvas.width, canvas.height]);

  const redraw = () => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, scene.fb);
    gl.useProgram(sceneProgram);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.enable(gl.DEPTH_TEST);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.bindVertexArray(objects.cube.vao);

    setUniforms(gl, sceneProgram, {
      ...props.uniforms,
      useNor: Number(useNor),
      modelMat: props.pipeModelMat,
      norMat: props.pipeNorMat,
      materialDiffuseTex: useTex(gl, props.pipeDiffuseTex!, gl.TEXTURE_2D, 0),
      materialNorTex: useTex(gl, props.pipeNorTex!, gl.TEXTURE_2D, 1),
    });
    gl.drawElements(
      gl.TRIANGLES,
      objects.cube.numElements,
      gl.UNSIGNED_SHORT,
      0
    );

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindVertexArray(objects.plan.vao);
    gl.useProgram(hdrProgram);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.disable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT);
    setUniforms(gl, hdrProgram, {
      exposure: exposure.value,
      colorTex: useTex(gl, scene.colorTex!),
    });
    gl.drawElements(
      gl.TRIANGLES,
      objects.plan.numElements,
      gl.UNSIGNED_SHORT,
      0
    );
  };

  redraw();
  props.texLoaded.then(redraw);

  return mergeFuns(
    watch(exposure, redraw),
    createFPSCamera(
      canvas.parentElement!,
      (nViewMat) => {
        mat4.copy(props.uniforms.viewMat, nViewMat);
        redraw();
      },
      [0, 1, 0],
      [0, 0, 20]
    )
  );
};

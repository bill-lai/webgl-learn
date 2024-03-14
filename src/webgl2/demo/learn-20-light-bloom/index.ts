import {
  createCube,
  createSphereVertices,
  createXYPlaneVertices,
  mergeFuns,
} from "@/util";
import sceneFragSource from "./shader-scene.frag?raw";
import sceneVertSource from "./shader-scene.vert?raw";
import hdrFragSource from "./shader-hdr.frag?raw";
import bloomFragSource from "./shader-bloom.frag?raw";
import imgVertSource from "./shader-img.vert?raw";
import posFragSource from "./shader-pos.frag?raw";
import posVertSource from "./shader-pos.vert?raw";
import { genModalsTangentAndBi } from "@/util/gl2/math";
import {
  AppendTexsProps,
  generateTex,
  generateVao,
  useTex,
  createFb,
  createIntervalFb,
} from "@/util/gl2/gl";
import { glMatrix, mat3, mat4 } from "gl-matrix";
import { createFPSCamera } from "@/util/gl2/fps-camera";
import { createTransform } from "@/util/gl2/mat4-pack";
import {
  createProgram,
  createShader,
  generateProgram,
} from "@/util/gl2/program";
import { setUniforms } from "@/util/gl2/setUniform";
import { InitProps } from "@/status/example";
import Attach from "./attach.vue";
import { reactive, ref, watch } from "vue";

import pipeDiffuseURI from "./texture/wood.png";

const getObjects = (gl: WebGL2RenderingContext) => {
  const cubeGeo = createCube(2);
  const scale = 1;
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
  const sphere = createSphereVertices(1, 24, 48);
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
  ];

  return {
    cube: {
      vao: generateVao(gl, cube, pointers),
      numElements: cube.includes.length,
    },
    sphere: {
      vao: generateVao(gl, sphere, pointers),
      numElements: sphere.includes.length,
    },
    plan: {
      vao: generateVao(gl, plan, [pointers[0], pointers[2]]),
      numElements: plan.includes.length,
    },
  };
};

const getProps = (gl: WebGL2RenderingContext, size: number[]) => {
  const { tex: pipeDiffuseTex, loaded: pipeDiffuseLoaded } = generateTex(
    gl,
    pipeDiffuseURI,
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

  const prop: AppendTexsProps[number] = {
    internalformat: gl.RGBA16F,
    format: gl.RGBA,
    type: gl.FLOAT,
  };

  const scene = createFb(gl, size, [prop, prop], true);
  const interval = createIntervalFb(gl, size, [prop], false);

  return {
    pipeDiffuseTex,
    pipeModelMat,
    pipeNorMat,
    texLoaded: pipeDiffuseLoaded,
    scene,
    interval,
    uniforms: {
      projectionMat,
      lightPositions,
      lightDiffuses,
      viewMat,
    },
  };
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
  const ext = gl.getExtension("EXT_color_buffer_float");
  if (!ext) {
    throw "不支持float纹理";
  }
  const objects = getObjects(gl);
  const sceneProgram = createProgram(gl, sceneVertSource, sceneFragSource);
  const imgShader = createShader(gl, gl.VERTEX_SHADER, imgVertSource);
  const hdrProgram = generateProgram(
    gl,
    imgShader,
    createShader(gl, gl.FRAGMENT_SHADER, hdrFragSource)
  );
  const bloomProgram = generateProgram(
    gl,
    imgShader,
    createShader(gl, gl.FRAGMENT_SHADER, bloomFragSource)
  );
  const posProgram = createProgram(gl, posVertSource, posFragSource);
  const props = getProps(gl, [canvas.width, canvas.height]);

  const lightMats = props.uniforms.lightPositions.map((pos) =>
    createTransform().translate(pos).scale([0.2, 0.2, 0.2]).get()
  );
  const lightColors = props.uniforms.lightDiffuses.map((color) =>
    color.map((c) => c * 255)
  );

  const redrawScene = () => {
    gl.useProgram(sceneProgram);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.enable(gl.DEPTH_TEST);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.bindVertexArray(objects.cube.vao);

    setUniforms(gl, sceneProgram, {
      ...props.uniforms,
      modelMat: props.pipeModelMat,
      norMat: props.pipeNorMat,
      materialDiffuseTex: useTex(gl, props.pipeDiffuseTex!, gl.TEXTURE_2D, 0),
    });
    gl.drawElements(
      gl.TRIANGLES,
      objects.cube.numElements,
      gl.UNSIGNED_SHORT,
      0
    );

    gl.useProgram(posProgram);
    gl.bindVertexArray(objects.sphere.vao);
    lightMats.forEach((mat, i) => {
      setUniforms(gl, posProgram, {
        modelMat: mat,
        projectionMat: props.uniforms.projectionMat,
        viewMat: props.uniforms.viewMat,
        color: lightColors[i],
      });
      gl.drawElements(
        gl.TRIANGLES,
        objects.sphere.numElements,
        gl.UNSIGNED_SHORT,
        0
      );
    });
  };

  const redrawHdr = (lightTex: WebGLTexture) => {
    gl.bindVertexArray(objects.plan.vao);
    gl.useProgram(hdrProgram);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.disable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT);
    setUniforms(gl, hdrProgram, {
      exposure: exposure.value,
      colorTex: useTex(gl, props.scene.texs[0], gl.TEXTURE_2D, 0),
      lightTex: useTex(gl, lightTex, gl.TEXTURE_2D, 1),
    });
    gl.drawElements(
      gl.TRIANGLES,
      objects.plan.numElements,
      gl.UNSIGNED_SHORT,
      0
    );
  };

  const redrawBloom = (tex: WebGLTexture, num: number) => {
    gl.bindVertexArray(objects.plan.vao);
    gl.useProgram(bloomProgram);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.disable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT);
    setUniforms(gl, bloomProgram, {
      hor: num % 2,
      colorTex: useTex(gl, tex, gl.TEXTURE_2D, 0),
    });
    gl.drawElements(
      gl.TRIANGLES,
      objects.plan.numElements,
      gl.UNSIGNED_SHORT,
      0
    );
  };

  const redraw = () => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, props.scene.fb);
    redrawScene();

    props.interval.use(
      props.scene.texs[1],
      (texs, count) => redrawBloom(texs[0], count),
      10
    );

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    redrawHdr(props.interval.getActiveTexs()[0]);
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

import {
  createCube,
  createPlaneVertices,
  createSphereVertices,
  createXYPlaneVertices,
  mergeFuns,
  startAnimation,
} from "@/util";
import { generateVao, useTex } from "@/util/gl2/gl";
import sceneVertexSource from "./shader-scene.vert?raw";
import sceneFragSource from "./shader-scene.frag?raw";
import shadowVertexSource from "./shader-shadow.vert?raw";
import shadowFragSource from "./shader-shadow.frag?raw";
import sunVertexSource from "./shader-sun.vert?raw";
import sunFragSource from "./shader-sun.frag?raw";
import postVertexSource from "./shader-post.vert?raw";
import postFragSource from "./shader-post.frag?raw";
import { createProgram } from "@/util/gl2/program";
import { Uniforms, setUniforms } from "@/util/gl2/setUniform";
import { glMatrix, mat4, vec3 } from "gl-matrix";
import { createTransform } from "@/util/gl2/mat4-pack";
import { createFPSCamera } from "@/util/gl2/fps-camera";
import { getSunAttri } from "@/util/sun";
import { InitProps } from "@/status/example";
import Attach from "./attach.vue";
import { Ref, reactive, ref, render, watchEffect } from "vue";

const getObjects = (gl: WebGL2RenderingContext) => {
  const cube = createCube(1);
  const plan = createPlaneVertices(1, 1);
  const sphere = createSphereVertices(1, 12, 24);
  const clip = createXYPlaneVertices(2, 2);
  const pointers = [
    {
      key: "positions",
      loc: 1,
      size: 3,
      type: gl.FLOAT,
      stride: 0,
      offset: 0,
    },
    {
      key: "normals",
      loc: 2,
      size: 3,
      type: gl.FLOAT,
      stride: 0,
      offset: 0,
    },
  ];

  return {
    cube: {
      vao: generateVao(gl, cube, pointers),
      numElements: cube.includes.length,
    },
    plan: {
      vao: generateVao(gl, plan, pointers),
      numElements: plan.includes.length,
    },
    sphere: {
      vao: generateVao(gl, sphere, pointers),
      numElements: sphere.includes.length,
    },
    clip: {
      vao: generateVao(gl, clip, [pointers[0]]),
      numElements: clip.includes.length,
    },
  };
};

const getNorMat = (worldMat: mat4) => {
  const norMat = mat4.invert(mat4.create(), worldMat);
  return mat4.transpose(norMat, norMat);
};

const getObjectsUniform = () => {
  const cubeInitTf = createTransform().scale([3, 5, 1]).translate([0, 0.1, 0]);
  const cubeWorldMats = [
    cubeInitTf.translate([0, 0, 0]).get(),
    cubeInitTf.translate([1.8, 0, 0]).scale([1, 0.8, 1]).get(),
    cubeInitTf.translate([-1.8, 0, 0]).get(),
    cubeInitTf.translate([0, 0, 3]).get(),
    // cubeInitTf.translate([-1.8, 0, 3]).scale([1, 0.8, 1]).get(),
    // cubeInitTf.translate([1.8, 0, 3]).get(),
  ];
  const cubeNorMats = cubeWorldMats.map(getNorMat);
  const planWorldMat = createTransform()
    .scale([1000, 1, 1000])
    .translate([0, -0.05, 0])
    .get();
  const planNorMat = getNorMat(planWorldMat);

  return {
    cubeWorldMats,
    cubeNorMats,
    cubeColor: [1, 1, 1],
    sphereWorldMat: mat4.identity(mat4.create()),
    sphereColor: [1, 0, 0],
    planWorldMat,
    planNorMat,
    planColor: [0.51, 0.57, 0.7] as [number, number, number],
  };
};

const createDepthFb = (gl: WebGL2RenderingContext, size: number[]) => {
  const depthTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, depthTex);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.DEPTH_COMPONENT32F,
    size[0],
    size[1],
    0,
    gl.DEPTH_COMPONENT,
    gl.FLOAT,
    null
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const writeFb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, writeFb);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.DEPTH_ATTACHMENT,
    gl.TEXTURE_2D,
    depthTex,
    0
  );

  const renderBuffer = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
  gl.renderbufferStorageMultisample(
    gl.RENDERBUFFER,
    4,
    gl.DEPTH_COMPONENT32F,
    size[0],
    size[1]
  );

  gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  const readFb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, readFb);
  gl.framebufferRenderbuffer(
    gl.FRAMEBUFFER,
    gl.DEPTH_ATTACHMENT,
    gl.RENDERBUFFER,
    renderBuffer
  );
  // 告诉gl不关心颜色,
  gl.drawBuffers([gl.NONE]);
  gl.readBuffer(gl.NONE);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  return {
    fb: readFb,
    generDepthDate() {
      // 将读取帧放到真使用帧
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, readFb);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, writeFb);
      gl.blitFramebuffer(
        0,
        0,
        size[0],
        size[1],
        0,
        0,
        size[0],
        size[1],
        gl.DEPTH_BUFFER_BIT,
        gl.NEAREST
      );
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    },
    depthTex,
  };
};

const createBlurFb = (gl: WebGL2RenderingContext, size: number[]) => {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    size[0],
    size[1],
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const renderBuffer = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
  gl.renderbufferStorage(
    gl.RENDERBUFFER,
    gl.DEPTH_COMPONENT16,
    size[0],
    size[1]
  );

  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    tex,
    0
  );
  gl.framebufferRenderbuffer(
    gl.FRAMEBUFFER,
    gl.DEPTH_ATTACHMENT,
    gl.RENDERBUFFER,
    renderBuffer
  );

  return { fb, colorTex: tex };
};

const getSunViewMat = (direction: vec3, out: mat4) => {
  const position = vec3.multiply(vec3.create(), direction, [50, 50, 50]);
  return mat4.lookAt(out, position, [0, 0, 0], [0, 1, 0]);
};

const initScene = (canvas: HTMLCanvasElement, date: Ref<Date>) => {
  const gl = canvas.getContext("webgl2", { antialias: true })!;
  const sceneProgram = createProgram(gl, sceneVertexSource, sceneFragSource);
  const shadowProgram = createProgram(gl, shadowVertexSource, shadowFragSource);
  const sunProgram = createProgram(gl, sunVertexSource, sunFragSource);
  const postProgram = createProgram(gl, postVertexSource, postFragSource);
  const size = [canvas.width, canvas.height];
  const { fb, depthTex, generDepthDate } = createDepthFb(gl, size);
  const { fb: colorFb, colorTex } = createBlurFb(gl, size);
  const objects = getObjects(gl);
  const objectsUniform = getObjectsUniform();
  const cameraViewMat = mat4.create();
  const sunViewMat = mat4.create();
  const sunProjectionMat = mat4.create();
  const sunInitProjectionMat = mat4.ortho(
    mat4.create(),
    -10,
    10,
    -10,
    10,
    -0.1,
    200
  );
  const uniforms = {
    ligntWeight: 0,
    lightDirection: vec3.create(),
    projectionMat: mat4.perspective(
      mat4.create(),
      glMatrix.toRadian(45),
      size[0] / size[1],
      0.1,
      1000
    ),
  };

  const redrawScene = (uniforms: Uniforms, program: WebGLProgram) => {
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.viewport(0, 0, size[0], size[1]);
    gl.clearColor(...objectsUniform.planColor, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(program);
    setUniforms(gl, program, uniforms);
    gl.bindVertexArray(objects.cube.vao);
    objectsUniform.cubeWorldMats.forEach((worldMat, i) => {
      setUniforms(gl, program, {
        worldMat,
        norMat: objectsUniform.cubeNorMats[i],
        color: objectsUniform.cubeColor,
      });
      gl.drawElements(
        gl.TRIANGLES,
        objects.cube.numElements,
        gl.UNSIGNED_SHORT,
        0
      );
    });

    if (program === sceneProgram) {
      // gl.disable(gl.DEPTH_TEST);
    }
    gl.disable(gl.CULL_FACE);
    gl.useProgram(program);
    setUniforms(gl, program, uniforms);
    gl.bindVertexArray(objects.plan.vao);
    setUniforms(gl, program, {
      worldMat: objectsUniform.planWorldMat,
      norMat: objectsUniform.planNorMat,
      color: objectsUniform.planColor,
    });
    gl.drawElements(
      gl.TRIANGLES,
      objects.plan.numElements,
      gl.UNSIGNED_SHORT,
      0
    );
    gl.enable(gl.DEPTH_TEST);
  };
  const redrawSun = () => {
    gl.bindVertexArray(objects.sphere.vao);
    gl.useProgram(sunProgram);
    setUniforms(gl, sunProgram, {
      ...uniforms,
      viewMat: cameraViewMat,
      worldMat: objectsUniform.sphereWorldMat,
    });
    gl.drawElements(
      gl.TRIANGLES,
      objects.sphere.numElements,
      gl.UNSIGNED_SHORT,
      0
    );
  };
  const redrawPostClip = (uniforms: Uniforms) => {
    gl.viewport(0, 0, size[0], size[1]);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.bindVertexArray(objects.clip.vao);
    gl.useProgram(postProgram);
    setUniforms(gl, postProgram, uniforms);
    gl.drawElements(
      gl.TRIANGLES,
      objects.clip.numElements,
      gl.UNSIGNED_SHORT,
      0
    );
  };

  const redraw = () => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    // gl.cullFace(gl.FRONT);
    redrawScene({ ...uniforms, sunProjectionMat }, shadowProgram);
    gl.cullFace(gl.BACK);
    generDepthDate();

    // return;
    gl.bindFramebuffer(gl.FRAMEBUFFER, colorFb);
    redrawScene(
      {
        ...uniforms,
        viewMat: cameraViewMat,
        sunProjectionMat,
        depthTex: useTex(gl, depthTex!),
      },
      sceneProgram
    );
    redrawSun();

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    redrawPostClip({ tex: useTex(gl, colorTex!) });
  };

  startAnimation(redraw);
  const maxCosAngle = Math.abs(Math.cos(glMatrix.toRadian(90)));
  return mergeFuns(
    createFPSCamera(
      canvas.parentElement!,
      (nViewMat) => {
        mat4.copy(cameraViewMat, nViewMat);
        redraw();
      },
      [0, 1, 0],
      // [0, 1, 3]
      [-11, 7.6, 16],
      { yaw: -1.12, pitch: -0.4 }
    ),
    watchEffect(() => {
      let { direction, weight } = getSunAttri(22.37, 113.6, date.value);
      // 如果太阳光接近水平面，就认为已经下山
      if (vec3.dot(direction, [0, 1, 0]) < maxCosAngle) {
        direction = [0, -1, 0];
      }
      vec3.copy(uniforms.lightDirection, direction);

      getSunViewMat(direction, sunViewMat);
      mat4.multiply(sunProjectionMat, sunInitProjectionMat, sunViewMat);
      mat4.translate(
        objectsUniform.sphereWorldMat,
        mat4.identity(mat4.create()),
        vec3.multiply(vec3.create(), direction, [30, 30, 30])
      );
      uniforms.ligntWeight = weight;
      redraw();
    })
    // (() => {
    //   const initMat = mat4.translate(mat4.create(), objectsUniform.sphereWorldMat, [0, 0, 8]);
    //   const sphereTf = createTransform({ out: objectsUniform.sphereWorldMat });
    //   return startAnimation((now) => {
    //     sphereTf
    //       // .translate([0, 20, 0])
    //       .rotateX(now * 0.01 * 5)
    //       .multiply(initMat)
    //       .gen();
    //     vec3.normalize(
    //       uniforms.lightDirection,
    //       objectsUniform.sphereWorldMat.slice(12, 15) as vec3
    //     );

    //     getSunViewMat(uniforms.lightDirection, sunViewMat);
    //     mat4.multiply(sunProjectionMat, sunInitProjectionMat, sunViewMat);
    //     redraw();
    //   });
    // })()
  );
};

export const init = (canvas: HTMLCanvasElement, props: InitProps) => {
  const initDate = new Date();
  const date = ref(initDate);
  props.setAppendComponent(
    Attach,
    reactive({
      date,
      updateDate: (nDate: Date) => (date.value = nDate),
    })
  );
  return mergeFuns(
    initScene(canvas, date)
    // 模拟一天
    // startAnimation((now) => {
    //   // 0.1秒走10分钟
    //   const nDate = new Date(initDate);
    //   nDate.setMinutes(initDate.getMinutes() + now * 0.5);
    //   date.value = nDate;
    // })
  );
};

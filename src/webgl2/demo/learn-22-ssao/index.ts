import {
  createCube,
  createPlaneVertices,
  mergeFuns,
  startAnimation,
} from "@/util";
import { blitBuffer, createFb, generateVao, useTex } from "@/util/gl2/gl";
import sceneVertexSource from "./shader-scene.vert?raw";
import sceneFragSource from "./shader-scene.frag?raw";
import lightFragSource from "./shader-light.frag?raw";
import ssaoFragSource from "./shader-ssao.frag?raw";
// import ssaoFragSource from "./shader-ssao1.frag?raw";
import { createProgram } from "@/util/gl2/program";
import { setUniforms } from "@/util/gl2/setUniform";
import { glMatrix, mat4, vec3 } from "gl-matrix";
import { createTransform } from "@/util/gl2/mat4-pack";
import { createFPSCamera } from "@/util/gl2/fps-camera";
import { getNorMat } from "@/util/gl2/math";
import { drawPos, posUseAttrib } from "@/webgl2/utils/position";
import { drawKernel, kernelUseAttrib } from "@/webgl2/utils/kernel";
import { clipUseAttrib, drawClip } from "@/webgl2/utils/clip";
import { getSsaoKernel, getSsaoNoiseTex } from "@/util/gl2/ssao";
import { drawShadow, shadowUseAttrib } from "@/webgl2/utils/shadow";
import { drawGamma, gammaUseAttrib } from "@/webgl2/utils/gamma";

const getObjects = (gl: WebGL2RenderingContext) => {
  const cube = createCube(1);
  const plan = createPlaneVertices(1, 1);
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
  };
};

const getProps = (gl: WebGL2RenderingContext, size: number[]) => {
  const cubeInitTf = createTransform().scale([3, 5, 1]).translate([0, 0.5, 0]);
  const cubeWorldMats = [
    cubeInitTf.translate([0, 0, 0]).get(),
    cubeInitTf.translate([1.8, 0, 0]).scale([1, 0.8, 1]).get(),
    cubeInitTf.translate([-1.8, 0, 0]).get(),
    cubeInitTf.translate([0, 0, 3]).get(),
  ];
  const cubeNorMats = cubeWorldMats.map(getNorMat);
  const planWorldMat = createTransform()
    .scale([1000, 1, 1000])
    .translate([0, -0.02, 0])
    .get();
  const planNorMat = getNorMat(planWorldMat);

  const baseTexProp = {
    internalformat: gl.RGBA16F,
    format: gl.RGBA,
    type: gl.FLOAT,
    start: 0,
    filter: [gl.NEAREST, gl.NEAREST],
    wrap: [gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE],
  };
  const texProps = [
    { ...baseTexProp, start: 0 },
    { ...baseTexProp, start: 1 },
    {
      ...baseTexProp,
      start: 1,
      internalformat: gl.RGBA,
      type: gl.UNSIGNED_BYTE,
    },
  ];
  const near = 0.1;
  const far = 100;

  return {
    noise: {
      noiseTex: getSsaoNoiseTex(gl),
      buffer: createFb(gl, size, [{ ...baseTexProp }], false),
      uniforms: {
        ssaoRadius: 1,
        screenSize: size,
        kernels: getSsaoKernel(),
      },
    },
    gammaBuffer: createFb(gl, size, [baseTexProp], true),
    kernelBuffer: createFb(gl, size, [baseTexProp], false),
    gBuffer: createFb(gl, size, texProps, true),
    sunViewProjectionMat: mat4.create(),
    sunProjectionMat: mat4.ortho(mat4.create(), -10, 10, -10, 10, -0.1, 200),
    cubeWorldMats,
    cubeNorMats,
    cubeColor: [1, 1, 1],
    sphereWorldMat: mat4.identity(mat4.create()),
    kernels: [
      1.0 / 16,
      2.0 / 16,
      1.0 / 16,
      2.0 / 16,
      4.0 / 16,
      2.0 / 16,
      1.0 / 16,
      2.0 / 16,
      1.0 / 16,
    ],
    sphereColor: [1, 0, 0],
    planWorldMat,
    planNorMat,
    planColor: [0.51, 0.57, 0.7] as [number, number, number],
    // planColor: [1, 1, 1] as [number, number, number],
    unfiroms: {
      lightDiffuse: [1, 1, 1],
      lightEmission: [0.4, 0.4, 0.4],
      ligntWeight: 1,
      viewMat: mat4.create(),
      far,
      near,
      lightDirection: vec3.create(),
      projectionMat: mat4.perspective(
        mat4.create(),
        glMatrix.toRadian(45),
        size[0] / size[1],
        near,
        far
      ),
    },
  };
};

const getSunViewMat = (direction: vec3, out: mat4) => {
  const position = vec3.multiply(vec3.create(), direction, [50, 50, 50]);
  return mat4.lookAt(out, position, [0, 0, 0], [0, 1, 0]);
};

// // 模糊
// float kernel[9] = float[](
//   1.0 / 16., 2.0 / 16., 1.0 / 16.,
//   2.0 / 16., 4.0 / 16., 2.0 / 16.,
//   1.0 / 16., 2.0 / 16., 1.0 / 16.
// );
export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl2", {
    antialias: false,
    // antialiasSamples: 3,
  })! as WebGL2RenderingContext;
  if (!gl.getExtension("EXT_color_buffer_float")) {
    throw "当前浏览器不支持float buffer";
  }
  const size = [canvas.width, canvas.height];
  const sceneProgram = createProgram(gl, sceneVertexSource, sceneFragSource);
  const posAttrib = posUseAttrib(gl);
  const lightAttrib = clipUseAttrib(gl, lightFragSource);
  const kernelAttrib = kernelUseAttrib(gl);
  const gammaAttrib = gammaUseAttrib(gl);
  const shadowAttrib = shadowUseAttrib(gl, size);
  const ssaoAttrib = clipUseAttrib(gl, ssaoFragSource);
  const objects = getObjects(gl);
  const props = getProps(gl, size);

  const redrawScene = (program: WebGLProgram) => {
    gl.useProgram(program);
    setUniforms(gl, program, props.unfiroms);

    gl.bindVertexArray(objects.plan.vao);
    setUniforms(gl, program, {
      color: props.planColor,
      worldMat: props.planWorldMat,
      norMat: props.planNorMat,
    });
    gl.drawElements(
      gl.TRIANGLES,
      objects.plan.numElements,
      gl.UNSIGNED_SHORT,
      0
    );

    gl.bindVertexArray(objects.cube.vao);
    props.cubeWorldMats.forEach((worldMat, i) => {
      setUniforms(gl, program, {
        worldMat,
        norMat: props.cubeNorMats[i],
        color: props.cubeColor,
      });
      gl.drawElements(
        gl.TRIANGLES,
        objects.cube.numElements,
        gl.UNSIGNED_SHORT,
        0
      );
    });
  };

  const getShadowTex = () => {
    drawShadow(
      { ...shadowAttrib, attrib: objects.plan },
      {
        shadowViewProjectionMat: props.sunViewProjectionMat,
        modelMat: props.planWorldMat,
      }
    );
    props.cubeWorldMats.forEach((worldMat) => {
      drawShadow(
        { ...shadowAttrib, attrib: objects.cube },
        {
          shadowViewProjectionMat: props.sunViewProjectionMat,
          modelMat: worldMat,
        }
      );
    });
    return shadowAttrib.buffer.tex;
  };

  const redraw = () => {
    // 渲染几何数据
    gl.bindFramebuffer(gl.FRAMEBUFFER, props.gBuffer.fb);
    gl.viewport(0, 0, size[0], size[1]);
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    redrawScene(sceneProgram);

    // 渲染ssao贴图
    gl.bindFramebuffer(gl.FRAMEBUFFER, props.noise.buffer.fb);
    gl.viewport(0, 0, size[0], size[1]);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    drawClip(ssaoAttrib, {
      ...props.unfiroms,
      ...props.noise.uniforms,
      fragPositionTex: useTex(gl, props.gBuffer.texs[0], gl.TEXTURE_2D, 0),
      normalTex: useTex(gl, props.gBuffer.texs[1], gl.TEXTURE_2D, 1),
      noiseTex: useTex(gl, props.noise.noiseTex!, gl.TEXTURE_2D, 3),
    });

    // 模糊ssao贴图
    gl.bindFramebuffer(gl.FRAMEBUFFER, props.kernelBuffer.fb);
    gl.viewport(0, 0, size[0], size[1]);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    drawKernel(kernelAttrib, {
      colorTex: useTex(gl, props.noise.buffer.texs[0]),
      kernels: props.kernels,
    });

    // 获取阴影贴图
    const invViewMat = mat4.invert(mat4.create(), props.unfiroms.viewMat);
    gl.bindFramebuffer(gl.FRAMEBUFFER, shadowAttrib.buffer.fb);
    gl.viewport(0, 0, size[0], size[1]);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    const shadowTex = getShadowTex();

    // 根据几何信息渲染画面
    gl.bindFramebuffer(gl.FRAMEBUFFER, props.gammaBuffer.fb);
    gl.viewport(0, 0, size[0], size[1]);
    gl.clearColor(...props.planColor, 1);
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    drawClip(lightAttrib, {
      ...props.unfiroms,
      fragPositionTex: useTex(gl, props.gBuffer.texs[0], gl.TEXTURE_2D, 0),
      normalTex: useTex(gl, props.gBuffer.texs[1], gl.TEXTURE_2D, 1),
      colorTex: useTex(gl, props.gBuffer.texs[2], gl.TEXTURE_2D, 2),
      ssaoTex: useTex(gl, props.kernelBuffer.texs[0], gl.TEXTURE_2D, 3),
      shadowTex: useTex(gl, shadowTex, gl.TEXTURE_2D, 4),
      sunViewProjectionMat: mat4.multiply(
        invViewMat,
        props.sunViewProjectionMat,
        invViewMat
      ),
    });

    blitBuffer(
      gl,
      props.gBuffer.fb,
      props.gammaBuffer.fb,
      gl.DEPTH_BUFFER_BIT,
      size
    );
    gl.enable(gl.DEPTH_TEST);
    drawPos(posAttrib, {
      ...props.unfiroms,
      viewMat: props.unfiroms.viewMat,
      color: [1, 0, 0],
      modelMat: props.sphereWorldMat,
    });

    drawGamma(gammaAttrib, { colorTex: useTex(gl, props.gammaBuffer.texs[0]) });
  };

  return mergeFuns(
    createFPSCamera(
      canvas.parentElement!,
      (nViewMat) => {
        mat4.copy(props.unfiroms.viewMat, nViewMat);
        redraw();
      },
      [0, 1, 0],
      [-11, 7.6, 16],
      { yaw: -1.12, pitch: -0.4 }
    ),
    (() => {
      const initMat = mat4.translate(
        mat4.create(),
        props.sphereWorldMat,
        [0, 0, 20]
      );
      const sphereTf = createTransform({ out: props.sphereWorldMat });
      const updateRotate = (angle: number) => {
        sphereTf.rotateX(angle).multiply(initMat).gen();
        vec3.normalize(
          props.unfiroms.lightDirection,
          props.sphereWorldMat.slice(12, 15) as vec3
        );
        mat4.multiply(
          props.sunViewProjectionMat,
          props.sunProjectionMat,
          getSunViewMat(props.unfiroms.lightDirection, mat4.create())
        );
        redraw();
      };
      updateRotate(330);
      // return () => {};
      return startAnimation((now) => updateRotate(now * 0.01 * 5));
    })()
  );
};

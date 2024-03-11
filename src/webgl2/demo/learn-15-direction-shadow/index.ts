import { createCube, createPlaneVertices, multiply } from "@/util";
import sceneFragSource from "./shader-scene.frag?raw";
import sceneVertSource from "./shader-scene.vert?raw";
import shadowFragSource from "./shader-shadow.frag?raw";
import shadowVertSource from "./shader-shadow.vert?raw";
import { glMatrix, mat2, mat4, vec2, vec3 } from "gl-matrix";
import { createTransform } from "@/util/gl2/mat4-pack";
import { generateTex, generateVao, useTex } from "@/util/gl2/gl";
import { createProgram } from "@/util/gl2/program";
import planDiffuseURI from "./plan-diffuse.png";
import cubeDiffuseURI from "./cube-diffuse.png";
import { Uniforms, setUniforms } from "@/util/gl2/setUniform";
import { createFPSCamera } from "@/util/gl2/fps-camera";

const texCoordTransform = (texcoords: Float32Array, worldMat: mat4) => {
  const texMat = mat2.create();
  texMat[0] = worldMat[0];
  texMat[1] = worldMat[2];
  texMat[2] = worldMat[8];
  texMat[3] = worldMat[10];

  for (let i = 0; i < texcoords.length; i += 2) {
    const texCoord = vec2.transformMat2(
      vec2.create(),
      [texcoords[i], texcoords[i + 1]],
      texMat
    );
    texcoords[i] = texCoord[0];
    texcoords[i + 1] = texCoord[1];
  }
};

const getObjects = (gl: WebGL2RenderingContext) => {
  const plan = createPlaneVertices();
  const cube = createCube(1);

  const planMat = createTransform().scale([1000, 1, 1000]).get();
  texCoordTransform(plan.texCoords, planMat);

  const pointers = [
    {
      loc: 1,
      key: "positions",
      size: 3,
      type: gl.FLOAT,
      stride: 0,
      offset: 0,
    },
    {
      loc: 2,
      key: "texCoords",
      size: 2,
      type: gl.FLOAT,
      stride: 0,
      offset: 0,
    },
    {
      loc: 3,
      key: "normals",
      size: 2,
      type: gl.FLOAT,
      stride: 0,
      offset: 0,
    },
  ];

  return {
    plan: {
      worldMat: planMat,
      vao: generateVao(gl, plan, pointers),
      numElements: plan.includes.length,
    },
    cube: {
      vao: generateVao(gl, cube, pointers),
      numElements: cube.includes.length,
    },
  };
};

const createUniforms = (gl: WebGL2RenderingContext, sceneSize: number[]) => {
  const { tex: planDiffuseTex, loaded: planDiffuseLoaded } = generateTex(
    gl,
    planDiffuseURI,
    gl.REPEAT
  );
  const { tex: cubeDiffuseTex, loaded: cubeDiffuseLoaded } = generateTex(
    gl,
    cubeDiffuseURI,
    gl.REPEAT
  );

  const diffuseLoaded = Promise.all([planDiffuseLoaded, cubeDiffuseLoaded]);
  const lightDirection = vec3.normalize(vec3.create(), [0.8, 3, 3]);
  const lightProjMat = mat4.ortho(mat4.create(), -5, 5, -5, 5, 0.1, 30);
  const lightViewMat = mat4.lookAt(
    mat4.create(),
    vec3.mul(vec3.create(), lightDirection, [10, 10, 10]),
    [0, 0, 0],
    [0, 1, 0]
  );
  const lightSpaceMat = mat4.mul(mat4.create(), lightProjMat, lightViewMat);

  return {
    planDiffuseTex,
    cubeDiffuseTex,
    diffuseLoaded,
    lightSpaceMat,
    scene: {
      lightDirection,
      viewMat: mat4.create(),
      projectionMat: mat4.perspective(
        mat4.create(),
        glMatrix.toRadian(45),
        sceneSize[0] / sceneSize[1],
        0.1,
        100
      ),
    },
  };
};

const createDepthFb = (gl: WebGL2RenderingContext, shadowSize: number[]) => {
  const depthTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, depthTex);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.DEPTH_COMPONENT32F,
    shadowSize[0],
    shadowSize[1],
    0,
    gl.DEPTH_COMPONENT,
    gl.FLOAT,
    null
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.DEPTH_ATTACHMENT,
    gl.TEXTURE_2D,
    depthTex,
    0
  );
  // 不关心颜色;
  gl.drawBuffers([gl.NONE]);
  gl.readBuffer(gl.NONE);
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    throw "Framebuffer not complete";
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  return { fb, tex: depthTex };
};

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl2")!;
  const sceneProgram = createProgram(gl, sceneVertSource, sceneFragSource);
  const shadowProgram = createProgram(gl, shadowVertSource, shadowFragSource);
  const objects = getObjects(gl);
  const cubeMats = [
    createTransform().translate([0, 1.5, 3]).get(),
    createTransform().translate([2.5, 1.5, 1]).get(),
    createTransform().translate([4.5, 0.5, 1]).get(),
  ];
  const sceneSize = [canvas.width, canvas.height];
  const shadowSize = sceneSize;
  const { fb, tex: depthTex } = createDepthFb(gl, shadowSize);
  const uniforms = createUniforms(gl, sceneSize);

  const drawScene = (
    program: WebGLProgram,
    uniforms: Uniforms,
    planTex?: WebGLTexture,
    cubeTex?: WebGLTexture
  ) => {
    gl.useProgram(program);
    setUniforms(gl, program, uniforms);

    gl.bindVertexArray(objects.plan.vao);
    planTex && setUniforms(gl, program, { tex: useTex(gl, planTex) });
    setUniforms(gl, program, { worldMat: objects.plan.worldMat });
    gl.drawElements(
      gl.TRIANGLES,
      objects.plan.numElements,
      gl.UNSIGNED_SHORT,
      0
    );

    gl.bindVertexArray(objects.cube.vao);
    cubeTex && setUniforms(gl, program, { tex: useTex(gl, cubeTex) });
    cubeMats.forEach((cubeMat) => {
      setUniforms(gl, program, { worldMat: cubeMat });
      gl.drawElements(
        gl.TRIANGLES,
        objects.cube.numElements,
        gl.UNSIGNED_SHORT,
        0
      );
    });
  };

  const redraw = () => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.viewport(0, 0, shadowSize[0], shadowSize[1]);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
    drawScene(shadowProgram, { lightSpaceMat: uniforms.lightSpaceMat });

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, sceneSize[0], sceneSize[1]);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
    drawScene(
      sceneProgram,
      {
        ...uniforms.scene,
        depthTex: useTex(gl, depthTex!, gl.TEXTURE_2D, 2),
        lightSpaceMat: uniforms.lightSpaceMat,
      },
      uniforms.planDiffuseTex!,
      uniforms.cubeDiffuseTex!
    );
  };

  uniforms.diffuseLoaded.then(redraw);
  return createFPSCamera(
    canvas.parentElement!,
    (nView) => {
      mat4.copy(uniforms.scene.viewMat, nView);
      redraw();
    },
    [0, 1, 0],
    [0, 5.5, 6],
    { pitch: glMatrix.toRadian(-45), yaw: -glMatrix.toRadian(80) }
  );
};

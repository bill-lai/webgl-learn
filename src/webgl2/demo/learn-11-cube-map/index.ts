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
  createXYPlaneVertices,
  frameRender,
  startAnimation,
} from "@/util";
import { Uniforms, setUniforms } from "@/util/gl2/setUniform";
import { createFPSCamera } from "@/util/gl2/fps-camera";
import { glMatrix, mat4, vec3 } from "gl-matrix";
import { createTransform } from "@/util/gl2/mat4-pack";
import { assimpLoad } from "@/util/gl2/assimp-load";
import { generateAssimpModal } from "@/util/gl2/assimp-modal";
import { Mesh, getMeshUniforms, traverseMesh } from "@/util/gl2/assimp-mesh";

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
    redraw: (outUniforms: Uniforms) => {
      gl.disable(gl.CULL_FACE);
      // -------天空盒--------
      gl.useProgram(program);
      gl.depthFunc(gl.LEQUAL);
      gl.bindVertexArray(vao);
      setUniforms(gl, program, outUniforms);
      gl.drawElements(
        gl.TRIANGLES,
        modal.includes.length,
        gl.UNSIGNED_SHORT,
        0
      );
      gl.depthFunc(gl.LESS);
      gl.enable(gl.CULL_FACE);
    },
    tex,
    loaded,
  };
};

const generateEffectObject = async (
  gl: WebGL2RenderingContext,
  redraw: () => void
) => {
  const basePath = "/model/nanosuit/";
  const modalURL = ["nanosuit.obj", "nanosuit.mtl"];
  const result = await assimpLoad(modalURL.map((name) => basePath + name));
  const assimpModal = generateAssimpModal(result, basePath);

  const getAssimpModalRenderer = (
    initPos: vec3,
    program: WebGLProgram,
    getMeshUniforms: (mesh: Mesh, worldMat: mat4) => Uniforms
  ) => {
    const worldMat = mat4.identity(mat4.create());
    const transform = createTransform({ out: worldMat }).translate(initPos);

    startAnimation((now) => {
      now *= 0.001;
      transform.rotateY(now * 60).gen();
      redraw();
    });

    return (uniforms: Uniforms) => {
      assimpModal.init(gl, program);
      gl.useProgram(program);
      setUniforms(gl, program, uniforms);

      traverseMesh(assimpModal.root, (mesh) => {
        if (!(mesh instanceof Mesh)) return;
        gl.bindVertexArray(assimpModal.getVao(mesh)!);
        setUniforms(gl, program, getMeshUniforms(mesh, worldMat));
        gl.drawElements(gl.TRIANGLES, mesh.faces.length, gl.UNSIGNED_SHORT, 0);
      });
    };
  };

  const getRaw = () => {
    const program = createProgram(gl, rawVertSource, rawFragSource);

    return getAssimpModalRenderer([-14, 0, 0], program, (mesh, vWorldMat) => {
      const meshUniforms = getMeshUniforms(
        gl,
        mesh,
        assimpModal.getTexs(mesh)!
      );
      const worldMat = mat4.multiply(mat4.create(), vWorldMat, mesh.getMat());
      const normalMat = mat4.create();
      mat4.transpose(normalMat, mat4.invert(normalMat, worldMat));

      return {
        ...meshUniforms,
        dl: {
          position: [-3, 18, 0],
          ambient: [0, 0, 0],
          diffuse: [0.3, 0.3, 0.3],
          specluar: [1, 1, 1],
        },
        worldMat,
        normalMat,
      };
    });
  };

  const getReflection = () => {
    const program = createProgram(gl, refVertSource, reflectionFragSource);
    return getAssimpModalRenderer([0, 0, 0], program, (mesh, vWorldMat) => {
      const worldMat = mat4.multiply(mat4.create(), vWorldMat, mesh.getMat());
      const normalMat = mat4.create();
      mat4.transpose(normalMat, mat4.invert(normalMat, worldMat));

      return { worldMat, normalMat };
    });
  };

  const getRefraction = () => {
    const program = createProgram(gl, refVertSource, refractionFragSource);
    return getAssimpModalRenderer([14, 0, 0], program, (mesh, vWorldMat) => {
      const worldMat = mat4.multiply(mat4.create(), vWorldMat, mesh.getMat());
      const normalMat = mat4.create();
      mat4.transpose(normalMat, mat4.invert(normalMat, normalMat));
      return {
        eta: 1 / 2.42,
        worldMat,
        normalMat,
      };
    });
  };

  return {
    raw: getRaw(),
    reflection: getReflection(),
    refraction: getRefraction(),
  };
};

const getEnvObject = (gl: WebGL2RenderingContext) => {
  const object = createCube(1);
  const vao = generateVao(gl, object, [
    pointerMap.positions,
    pointerMap.normals,
  ]);
  const size = [gl.canvas.width, gl.canvas.width];
  const program = createProgram(gl, refVertSource, reflectionFragSource);

  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

  const rdBuffer = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, rdBuffer);
  gl.renderbufferStorage(
    gl.RENDERBUFFER,
    gl.DEPTH24_STENCIL8,
    size[0],
    size[1]
  );
  gl.framebufferRenderbuffer(
    gl.FRAMEBUFFER,
    gl.DEPTH_STENCIL_ATTACHMENT,
    gl.RENDERBUFFER,
    rdBuffer
  );
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  const cubeFronts = [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
  ] as const;
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex);
  for (let i = 0; i < cubeFronts.length; i++) {
    gl.texImage2D(
      gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
      0,
      gl.RGB,
      size[0],
      size[1],
      0,
      gl.RGB,
      gl.UNSIGNED_BYTE,
      null
    );
  }
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

  const projectionMat = mat4.perspective(
    mat4.create(),
    glMatrix.toRadian(90),
    1,
    0.1,
    100
  );
  const updateUniforms = (position: vec3) =>
    cubeFronts.map((front) => {
      const viewMat = mat4.lookAt(
        mat4.create(),
        position,
        vec3.add(vec3.create(), position, front),
        [0, -1, 0]
      );
      const invMat = mat4.create();
      mat4.multiply(invMat, projectionMat, viewMat);
      mat4.invert(invMat, invMat);
      return { viewMat, invMat };
    });

  const worldMat = mat4.create();
  const eysPosition = vec3.fromValues(0, 10, -58);
  const normalMat = mat4.create();
  const worldTransform = createTransform({ out: worldMat })
    .translate(eysPosition)
    .scale([75, 35, 1]);

  worldTransform.gen();

  let uniformsGroup = updateUniforms(eysPosition);

  return {
    renderTex(renderEnv: (uniforms: SceneUniforms) => void, eysPosition: vec3) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.viewport(0, 0, size[0], size[1]);
      uniformsGroup.forEach((uniforms, i) => {
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
          tex,
          0
        );
        gl.clear(
          gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT
        );
        renderEnv({
          ...uniforms,
          eysPosition,
          projectionMat,
        });
      });
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    },
    render(uniforms: Uniforms) {
      gl.useProgram(program);
      gl.bindVertexArray(vao);
      setUniforms(gl, program, {
        ...uniforms,
        envTex: useTex(gl, tex!, gl.TEXTURE_CUBE_MAP, 9),
        worldMat,
        normalMat: mat4.transpose(normalMat, mat4.invert(normalMat, worldMat)),
      });

      gl.drawElements(
        gl.TRIANGLES,
        object.includes.length,
        gl.UNSIGNED_SHORT,
        0
      );
    },
  };
};

type SceneUniforms = {
  viewMat: mat4;
  projectionMat: mat4;
  eysPosition: vec3;
  invMat: mat4;
};
export const init = async (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl2")!;
  const sky = getSkyObject(gl);
  const object = await generateEffectObject(gl, () => redraw());
  const envObject = getEnvObject(gl);
  const uniforms: SceneUniforms = {
    viewMat: mat4.create(),
    eysPosition: vec3.create(),
    invMat: mat4.create(),
    projectionMat: mat4.perspective(
      mat4.create(),
      glMatrix.toRadian(45),
      canvas.width / canvas.height,
      0.1,
      100
    ),
  };

  const redrawScene = (uniforms: SceneUniforms) => {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const envTex = useTex(gl, sky.tex!, gl.TEXTURE_CUBE_MAP, 8);
    const outUniforms = { ...uniforms, envTex };

    gl.enable(gl.CULL_FACE);
    // // ------使用cube贴图效果-------
    object.raw(outUniforms);
    // -------使用反射效果------
    object.reflection(outUniforms);
    // -------使用折射效果------
    object.refraction(outUniforms);
    // -------天空盒--------
    sky.redraw(outUniforms);
  };

  gl.enable(gl.DEPTH_TEST);
  const redraw = frameRender(() => {
    envObject.renderTex(redrawScene, uniforms.eysPosition);

    gl.viewport(0, 0, canvas.width, canvas.height);
    redrawScene(uniforms);
    envObject.render(uniforms);
  });

  sky.loaded.then(redraw);
  const fpsDestory = createFPSCamera(
    canvas.parentElement!,
    (nViewMat, eysPosition) => {
      mat4.copy(uniforms.viewMat, nViewMat);
      mat4.multiply(uniforms.invMat, uniforms.projectionMat, nViewMat);
      mat4.invert(uniforms.invMat, uniforms.invMat);
      vec3.copy(uniforms.eysPosition, eysPosition);
      redraw();
    },
    [0, 1, 0],
    [0, 8, 26]
  );

  return fpsDestory;
};

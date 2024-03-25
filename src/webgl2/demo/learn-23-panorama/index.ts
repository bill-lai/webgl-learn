import { createSphereVertices, createXYPlaneVertices, mergeFuns } from "@/util";
import { createEnvCubeFb, generateVao, useTex } from "@/util/gl2/gl";
import envFragSource from "./shader-env.frag?raw";
import envVertexSource from "./shader-env.vert?raw";
import testFragSource from "./shader-test.frag?raw";
import testVertexSource from "./shader-test.vert?raw";
import { createProgram } from "@/util/gl2/program";
import { setUniforms } from "@/util/gl2/setUniform";
import { glMatrix, mat4, vec3 } from "gl-matrix";
import { createTransform } from "@/util/gl2/mat4-pack";
import { createFPSCamera } from "@/util/gl2/fps-camera";
import { genModalsTangentAndBi } from "@/util/gl2/math";
import { generateHDRTex } from "@/util/loadHDR";
import loftURI from "./texture/newport_loft.hdr?url";

const getObjects = (gl: WebGL2RenderingContext) => {
  const clip = createXYPlaneVertices(2, 2);
  const sphere = genModalsTangentAndBi(createSphereVertices(1, 48, 96));
  const basePointer = {
    size: 3,
    type: gl.FLOAT,
    stride: 0,
    offset: 0,
  };
  const pointers = [
    { ...basePointer, key: "positions", loc: 1 },
    { ...basePointer, key: "texcoords", loc: 4, size: 2 },
  ];

  return {
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

const getProps = (gl: WebGL2RenderingContext, size: number[]) => {
  return {
    envPlan: generateHDRTex(gl, loftURI),
    unfiroms: {
      viewMat: mat4.create(),
      invViewProjectionMat: mat4.create(),
      projectionMat: mat4.perspective(
        mat4.create(),
        glMatrix.toRadian(45),
        size[0] / size[1],
        0.1,
        100
      ),
    },
  };
};

export const init = async (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl2", { antialias: true })!;
  if (!gl.getExtension("EXT_color_buffer_float")) {
    throw "不支持floatBuffer";
  }
  const size = [canvas.width, canvas.height];
  const envProgram = createProgram(gl, envVertexSource, envFragSource);
  const testProgram = createProgram(gl, testVertexSource, testFragSource);
  const objects = getObjects(gl);
  const props = getProps(gl, size);
  const lighEnvCube = createEnvCubeFb(gl, 0.1, 100, [size[0], size[0]]);

  const redrawEnv = (program: WebGLProgram, invViewProjectionMat: mat4) => {
    gl.useProgram(program);
    gl.bindVertexArray(objects.clip.vao);
    setUniforms(gl, program, {
      invViewProjectionMat,
      envTex: useTex(gl, props.envPlan.tex!),
    });
    gl.drawElements(
      gl.TRIANGLES,
      objects.clip.numElements,
      gl.UNSIGNED_SHORT,
      0
    );
  };

  const redrawTestCubeTex = (
    cubeTex: WebGLTexture,
    pos: vec3 = [0, 0, -15]
  ) => {
    gl.useProgram(testProgram);
    gl.bindVertexArray(objects.sphere.vao);
    setUniforms(gl, testProgram, {
      ...props.unfiroms,
      envTex: useTex(gl, cubeTex, gl.TEXTURE_CUBE_MAP, 0),
      modelMat: createTransform().translate(pos).scale([10, 10, 10]).get(),
    });
    gl.drawElements(
      gl.TRIANGLES,
      objects.sphere.numElements,
      gl.UNSIGNED_SHORT,
      0
    );
  };

  const redraw = () => {
    // 环境全景图渲染
    gl.viewport(0, 0, size[0], size[1]);
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.depthFunc(gl.LEQUAL);
    redrawEnv(envProgram, props.unfiroms.invViewProjectionMat);

    redrawTestCubeTex(lighEnvCube.tex!, [5, 0, 0]);
  };

  redraw();
  props.envPlan.loaded.then(() => {
    // 渲染环境图
    gl.disable(gl.CULL_FACE);
    gl.depthFunc(gl.LEQUAL);
    lighEnvCube.generateTex((mat) =>
      redrawEnv(envProgram, mat4.invert(mat4.create(), mat))
    );
    redraw();
  });

  return mergeFuns(
    createFPSCamera(
      canvas.parentElement!,
      (nViewMat) => {
        mat4.copy(props.unfiroms.viewMat, nViewMat);
        mat4.multiply(
          props.unfiroms.invViewProjectionMat,
          props.unfiroms.projectionMat,
          props.unfiroms.viewMat
        );
        mat4.invert(
          props.unfiroms.invViewProjectionMat,
          props.unfiroms.invViewProjectionMat
        );
        redraw();
      },
      [0, 1, 0],
      [-11, 7.6, 38],
      { yaw: -1.25, pitch: -0.2 }
    )
  );
};

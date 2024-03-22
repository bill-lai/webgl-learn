import {
  createCube,
  createSphereVertices,
  createXYPlaneVertices,
  mergeFuns,
  startAnimation,
} from "@/util";
import { createEnvCubeFb, generateVao, useTex } from "@/util/gl2/gl";
import sceneVertexSource from "./shader-pbr.vert?raw";
import sceneFragSource from "./shader-pbr.frag?raw";
import envFragSource from "./shader-env.frag?raw";
import envVertexSource from "./shader-env.vert?raw";
import envLightFragSource from "./shader-env-light.frag?raw";
// import envLightFragSource from "./shader-env-light1.frag?raw";
import testFragSource from "./shader-test.frag?raw";
import testVertexSource from "./shader-test.vert?raw";
import {
  createProgram,
  createShader,
  generateProgram,
} from "@/util/gl2/program";
import { setUniforms } from "@/util/gl2/setUniform";
import { glMatrix, mat4, vec3 } from "gl-matrix";
import { createTransform } from "@/util/gl2/mat4-pack";
import { createFPSCamera } from "@/util/gl2/fps-camera";
import { genModalsTangentAndBi, getNorMat } from "@/util/gl2/math";
import { generateHDRTex } from "@/util/loadHDR";
import loftURI from "./texture/newport_loft.hdr?url";
import { drawPos, posUseAttrib } from "@/webgl2/utils/position";

const getObjects = (gl: WebGL2RenderingContext) => {
  const clip = createXYPlaneVertices(2, 2);
  const cube = createCube(1);
  const sphere = genModalsTangentAndBi(createSphereVertices(1, 48, 96));
  const basePointer = {
    size: 3,
    type: gl.FLOAT,
    stride: 0,
    offset: 0,
  };
  const pointers = [
    { ...basePointer, key: "positions", loc: 1 },
    { ...basePointer, key: "normals", loc: 2 },
    { ...basePointer, key: "tangents", loc: 3 },
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
    cube: {
      vao: generateVao(gl, cube, [pointers[0]]),
      numElements: cube.includes.length,
    },
  };
};

const getProps = (gl: WebGL2RenderingContext, size: number[]) => {
  const numSphere = 10;
  const numSplic = numSphere / 2;
  const sphereInitTf = createTransform().translate([-50, 0, 20]).rotateY(-90);
  const modelMats: mat4[] = [];
  const norMats: mat4[] = [];
  const metallics: number[] = [];
  const roughnesss: number[] = [];
  for (let i = 0; i < numSphere; i++) {
    const x = (i - numSplic) * 2.5;
    for (let j = 0; j < numSphere; j++) {
      const y = (j - numSplic) * 2.5;
      const modelMat = sphereInitTf.translate([x, y, 0]).get();
      modelMats.push(modelMat);
      norMats.push(getNorMat(modelMat));
      metallics.push((i + 1) / numSphere);
      roughnesss.push((j + 1) / numSphere);
    }
  }

  const lightTfs = [
    vec3.fromValues(-60.0, 10.0, 20.0),
    vec3.fromValues(-40.0, 10.0, 20.0),
    vec3.fromValues(-60.0, -10.0, 20.0),
    vec3.fromValues(-40.0, -10.0, 20.0),
  ].map((pos) => createTransform({ reverse: true }).translate(pos));

  return {
    modelMats,
    norMats,
    metallics,
    roughnesss,
    envPlan: generateHDRTex(gl, loftURI),
    lightTfs,
    unfiroms: {
      ao: 1,
      albedo: [0.3, 0, 0],
      lightPositions: lightTfs.map((t) => t.transform([0, 0, 0])),
      lightColors: [
        vec3.fromValues(300.0, 300.0, 300.0),
        vec3.fromValues(300.0, 300.0, 300.0),
        vec3.fromValues(300.0, 300.0, 300.0),
        vec3.fromValues(300.0, 300.0, 300.0),
      ],
      viewMat: mat4.create(),
      viewPos: vec3.fromValues(0, 0, 0),
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
  const sceneProgram = createProgram(gl, sceneVertexSource, sceneFragSource);
  const envVertex = createShader(gl, gl.VERTEX_SHADER, envVertexSource);
  const envProgram = generateProgram(
    gl,
    envVertex,
    createShader(gl, gl.FRAGMENT_SHADER, envFragSource)
  );
  const lightEnvProgram = generateProgram(
    gl,
    envVertex,
    createShader(gl, gl.FRAGMENT_SHADER, envLightFragSource)
  );
  const testProgram = createProgram(gl, testVertexSource, testFragSource);
  const objects = getObjects(gl);
  const props = getProps(gl, size);
  const posAttrib = posUseAttrib(gl);
  const envCube = createEnvCubeFb(gl, 0.1, 100, [size[0], size[0]]);
  const lighEnvCube = createEnvCubeFb(gl, 0.1, 100, [32, 32]);

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

  const redrawScene = () => {
    gl.useProgram(sceneProgram);
    gl.bindVertexArray(objects.sphere.vao);
    setUniforms(gl, sceneProgram, {
      ...props.unfiroms,
    });

    for (let i = 0; i < props.modelMats.length; i++) {
      setUniforms(gl, sceneProgram, {
        modelMat: props.modelMats[i],
        norMat: props.norMats[i],
        metallic: props.metallics[i],
        roughness: props.roughnesss[i],
      });

      gl.drawElements(
        gl.TRIANGLES,
        objects.sphere.numElements,
        gl.UNSIGNED_SHORT,
        0
      );
    }
  };

  const redrawTestCubeTex = (cubeTex: WebGLTexture, pos: vec3 = [0, 0, 0]) => {
    gl.useProgram(testProgram);
    gl.bindVertexArray(objects.cube.vao);
    setUniforms(gl, testProgram, {
      ...props.unfiroms,
      envTex: useTex(gl, cubeTex, gl.TEXTURE_CUBE_MAP, 0),
      modelMat: createTransform().translate(pos).scale([5, 5, 5]).get(),
    });
    gl.drawElements(
      gl.TRIANGLES,
      objects.cube.numElements,
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

    // 渲染几何数据
    gl.viewport(0, 0, size[0], size[1]);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    redrawScene();

    props.unfiroms.lightPositions.forEach((position) => {
      const modelMat = mat4.identity(mat4.create());
      mat4.translate(modelMat, modelMat, position);
      drawPos(posAttrib, {
        ...props.unfiroms,
        color: [1, 0, 0],
        modelMat,
      });
    });
  };

  redraw();
  props.envPlan.loaded.then(() => {
    // 渲染环境图
    gl.disable(gl.CULL_FACE);
    gl.depthFunc(gl.LEQUAL);
    lighEnvCube.generateTex((mat) =>
      redrawEnv(lightEnvProgram, mat4.invert(mat4.create(), mat))
    );
    redraw();
  });

  return mergeFuns(
    createFPSCamera(
      canvas.parentElement!,
      (nViewMat, nViewPos) => {
        mat4.copy(props.unfiroms.viewMat, nViewMat);
        vec3.copy(props.unfiroms.viewPos, nViewPos);
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
      [-11, 7.6, 16],
      { yaw: 3, pitch: -0.25 }
    ),
    startAnimation((now) => {
      props.lightTfs.map((tf, i) => {
        tf.rotateY(Math.sin(now * 0.001) * 5).transform(
          [0, 0, 0],
          props.unfiroms.lightPositions[i]
        );
      });
      redraw();
    })
  );
};

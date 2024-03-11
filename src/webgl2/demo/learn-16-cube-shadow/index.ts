import {
  createCube,
  createPlaneVertices,
  createXYPlaneVertices,
  multiply,
} from "@/util";
import sceneFragSource from "./shader-scene.frag?raw";
import sceneVertSource from "./shader-scene.vert?raw";
import shadowFragSource from "./shader-shadow.frag?raw";
import shadowVertSource from "./shader-shadow.vert?raw";
import testFragSource from "./shader-test.frag?raw";
import testVertSource from "./shader-test.vert?raw";
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

  const outTexcoords = new Float32Array(texcoords.length);
  for (let i = 0; i < texcoords.length; i += 2) {
    const texCoord = vec2.transformMat2(
      vec2.create(),
      [texcoords[i], texcoords[i + 1]],
      texMat
    );
    outTexcoords[i] = texCoord[0];
    outTexcoords[i + 1] = texCoord[1];
  }

  return outTexcoords;
};

const getObjects = (gl: WebGL2RenderingContext) => {
  const cube = createCube(1);
  const scale = 20;
  const plan = createXYPlaneVertices(2, 2);
  const roomMat = createTransform().scale([scale, scale, scale]).get();
  const room = {
    ...cube,
    texCoords: texCoordTransform(cube.texCoords, roomMat),
  };

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
    cube: {
      vao: generateVao(gl, cube, pointers),
      numElements: cube.includes.length,
    },
    room: {
      worldMat: roomMat,
      vao: generateVao(gl, room, pointers),
      numElements: room.includes.length,
    },
    test: {
      vao: generateVao(gl, plan, [pointers[0]]),
      numElements: plan.includes.length,
    },
  };
};

const createUniforms = (gl: WebGL2RenderingContext, sceneSize: number[]) => {
  const { tex: roomDiffuseTex, loaded: roomDiffuseLoaded } = generateTex(
    gl,
    planDiffuseURI,
    gl.REPEAT
  );
  const { tex: cubeDiffuseTex, loaded: cubeDiffuseLoaded } = generateTex(
    gl,
    cubeDiffuseURI,
    gl.REPEAT
  );

  const diffuseLoaded = Promise.all([roomDiffuseLoaded, cubeDiffuseLoaded]);

  return {
    roomDiffuseTex,
    cubeDiffuseTex,
    diffuseLoaded,
    scene: {
      lightPosition: vec3.fromValues(0, 0, 0),
      viewMat: mat4.create(),
      far: 100,
      projectionMat: mat4.perspective(
        mat4.create(),
        glMatrix.toRadian(45),
        sceneSize[0] / sceneSize[1],
        0.1,
        100
      ),
    },
    test: {
      front: vec3.fromValues(0, 5.5, 6),
    },
  };
};

const createCubeDepthFb = (
  gl: WebGL2RenderingContext,
  lightPosition: vec3,
  far: number,
  shadowSize: number[]
) => {
  const projectionMat = mat4.perspective(
    mat4.create(),
    glMatrix.toRadian(90),
    shadowSize[0] / shadowSize[1],
    0.1,
    far
  );
  const viewDirections = [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
  ] as vec3[];
  const direProjViewMats = viewDirections.map((dire, index) => {
    const projViewMat = mat4.create();
    const up: vec3 = [2, 3].includes(index) ? [0, 0, 1] : [0, 1, 0];
    const viewMat = mat4.lookAt(
      projViewMat,
      lightPosition,
      vec3.add(vec3.create(), lightPosition, dire),
      up
    );
    return mat4.multiply(projViewMat, projectionMat, viewMat);
  });

  const depthTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, depthTex);
  viewDirections.forEach((_, i) => {
    gl.texImage2D(
      gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
      0,
      gl.DEPTH_COMPONENT32F,
      shadowSize[0],
      shadowSize[1],
      0,
      gl.DEPTH_COMPONENT,
      gl.FLOAT,
      null
    );
  });
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  // // 不关心颜色;
  // gl.drawBuffers([gl.NONE]);
  // gl.readBuffer(gl.NONE);

  gl.bindRenderbuffer(gl.RENDERBUFFER, null);

  return {
    fb,
    tex: depthTex,
    // 生成深度贴图
    generateTex(redraw: (projMat: mat4) => void) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.viewport(0, 0, shadowSize[0], shadowSize[1]);
      gl.enable(gl.DEPTH_TEST);
      direProjViewMats.forEach((mat, i) => {
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.DEPTH_ATTACHMENT,
          gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
          depthTex,
          0
        );
        gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
        redraw(mat);
      });
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    },
  };
};

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl2")!;
  const sceneProgram = createProgram(gl, sceneVertSource, sceneFragSource);
  const shadowProgram = createProgram(gl, shadowVertSource, shadowFragSource);
  const testProgram = createProgram(gl, testVertSource, testFragSource);
  const objects = getObjects(gl);
  const cubeMats = [
    createTransform().translate([0, 1.5, 3]).get(),
    createTransform().translate([2.5, 1.5, 1]).get(),
    createTransform().translate([4.5, 0.5, 1]).get(),
  ];
  const sceneSize = [canvas.width, canvas.height];
  const shadowSize = [canvas.width, canvas.width];
  const uniforms = createUniforms(gl, sceneSize);
  const { tex: depthTex, generateTex } = createCubeDepthFb(
    gl,
    uniforms.scene.lightPosition,
    100,
    shadowSize
  );

  const drawScene = (
    program: WebGLProgram,
    uniforms: Uniforms,
    roomTex?: WebGLTexture,
    cubeTex?: WebGLTexture
  ) => {
    gl.useProgram(program);
    setUniforms(gl, program, uniforms);

    gl.bindVertexArray(objects.room.vao);
    roomTex && setUniforms(gl, program, { tex: useTex(gl, roomTex) });
    setUniforms(gl, program, { worldMat: objects.room.worldMat });
    gl.drawElements(
      gl.TRIANGLES,
      objects.room.numElements,
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
    gl.enable(gl.DEPTH_TEST);
    generateTex((mat) => {
      gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
      drawScene(shadowProgram, {
        projViewMat: mat,
        farPlane: uniforms.scene.far,
      });
    });

    // gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    // gl.viewport(0, 0, shadowSize[0], shadowSize[1]);
    // gl.enable(gl.DEPTH_TEST);
    // gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
    // gl.useProgram(testProgram);
    // gl.bindVertexArray(objects.test.vao);
    // setUniforms(gl, testProgram, {
    //   // front: [1, 0, 0],
    //   tex: useTex(gl, depthTex!, gl.TEXTURE_CUBE_MAP, 6),
    // });
    // gl.drawElements(
    //   gl.TRIANGLES,
    //   objects.test.numElements,
    //   gl.UNSIGNED_SHORT,
    //   0
    // );
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, sceneSize[0], sceneSize[1]);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
    drawScene(
      sceneProgram,
      {
        ...uniforms.scene,
        farPlane: uniforms.scene.far,
        depthTex: useTex(gl, depthTex!, gl.TEXTURE_CUBE_MAP, 3),
      },
      uniforms.roomDiffuseTex!,
      uniforms.cubeDiffuseTex!
    );
  };

  uniforms.diffuseLoaded.then(redraw);
  return createFPSCamera(
    canvas.parentElement!,
    (nView, _, nFront) => {
      vec3.copy(uniforms.test.front, nFront);
      mat4.copy(uniforms.scene.viewMat, nView);
      redraw();
    },
    [0, 1, 0],
    [0, 5.5, 6],
    { pitch: glMatrix.toRadian(-45), yaw: -glMatrix.toRadian(80) }
  );
};

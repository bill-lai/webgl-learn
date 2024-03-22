import { createSphereVertices, mergeFuns, startAnimation } from "@/util";
import { generateTex, generateVao, useTex } from "@/util/gl2/gl";
import sceneVertexSource from "./shader-pbr.vert?raw";
import sceneFragSource from "./shader-pbr.frag?raw";
import { createProgram } from "@/util/gl2/program";
import { setUniforms } from "@/util/gl2/setUniform";
import { glMatrix, mat4, vec3 } from "gl-matrix";
import { createTransform } from "@/util/gl2/mat4-pack";
import { createFPSCamera } from "@/util/gl2/fps-camera";
import { genModalsTangentAndBi, getNorMat } from "@/util/gl2/math";
import albedoURI from "./texture/albedo.png";
import aoURI from "./texture/ao.png";
import normalURI from "./texture/normal.png";
import metallicURI from "./texture/metallic.png";
import roughnessURI from "./texture/roughness.png";

const getObjects = (gl: WebGL2RenderingContext) => {
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
    vao: generateVao(gl, sphere, pointers),
    numElements: sphere.includes.length,
  };
};

const getProps = (gl: WebGL2RenderingContext, size: number[]) => {
  const numSphere = 10;
  const numSplic = numSphere / 2;
  const sphereInitTf = createTransform();
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
  const texs = [
    generateTex(gl, albedoURI, gl.CLAMP_TO_EDGE, gl.SRGB8_ALPHA8),
    generateTex(gl, aoURI),
    generateTex(gl, normalURI),
    generateTex(gl, metallicURI),
    generateTex(gl, roughnessURI),
  ];

  return {
    modelMats,
    norMats,
    metallics,
    roughnesss,
    texsLoaded: Promise.all(texs.map((t) => t.loaded)),
    albedoTex: texs[0].tex,
    aoTex: texs[1].tex,
    normalTex: texs[2].tex,
    metallicTex: texs[3].tex,
    roughnessTex: texs[4].tex,
    unfiroms: {
      ao: 1,
      albedo: [0.5, 0, 0],
      lightPositions: [
        vec3.fromValues(-10.0, 10.0, 10.0),
        vec3.fromValues(10.0, 10.0, 10.0),
        vec3.fromValues(-10.0, -10.0, 10.0),
        vec3.fromValues(10.0, -10.0, 10.0),
      ],
      lightColors: [
        vec3.fromValues(300.0, 300.0, 300.0),
        vec3.fromValues(300.0, 300.0, 300.0),
        vec3.fromValues(300.0, 300.0, 300.0),
        vec3.fromValues(300.0, 300.0, 300.0),
      ],
      viewMat: mat4.create(),
      viewPos: vec3.fromValues(0, 0, 0),
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

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl2", { antialias: true })!;
  const size = [canvas.width, canvas.height];
  const sceneProgram = createProgram(gl, sceneVertexSource, sceneFragSource);
  const objects = getObjects(gl);
  const props = getProps(gl, size);

  const redrawScene = () => {
    gl.useProgram(sceneProgram);
    gl.bindVertexArray(objects.vao);
    setUniforms(gl, sceneProgram, {
      ...props.unfiroms,
      normalTex: useTex(gl, props.normalTex!, gl.TEXTURE_2D, 0),
      albedoTex: useTex(gl, props.albedoTex!, gl.TEXTURE_2D, 1),
      metallicTex: useTex(gl, props.metallicTex!, gl.TEXTURE_2D, 2),
      roughnessTex: useTex(gl, props.roughnessTex!, gl.TEXTURE_2D, 3),
      aoTex: useTex(gl, props.aoTex!, gl.TEXTURE_2D, 4),
    });

    for (let i = 0; i < props.modelMats.length; i++) {
      setUniforms(gl, sceneProgram, {
        modelMat: props.modelMats[i],
        norMat: props.norMats[i],
        metallic: props.metallics[i],
        roughness: props.roughnesss[i],
      });

      gl.drawElements(gl.TRIANGLES, objects.numElements, gl.UNSIGNED_SHORT, 0);
    }
  };

  const redraw = () => {
    // 渲染几何数据
    gl.viewport(0, 0, size[0], size[1]);
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    redrawScene();
  };

  props.texsLoaded.then(redraw);

  return mergeFuns(
    createFPSCamera(
      canvas.parentElement!,
      (nViewMat, nViewPos) => {
        mat4.copy(props.unfiroms.viewMat, nViewMat);
        vec3.copy(props.unfiroms.viewPos, nViewPos);
        redraw();
      },
      [0, 1, 0],
      [-11, 7.6, 16],
      { yaw: -1.12, pitch: -0.4 }
    ),
    startAnimation((now) => {
      props.unfiroms.lightPositions.forEach((pos) => {
        pos[0] = Math.sin(now * 0.001) * 5;
      });
      redraw();
    })
  );
};

import { createProgram, attribLocs } from "@/util/gl2/program";
import { createCube, generateTexture, startAnimation } from "@/util";
import { glMatrix, mat4, vec3 } from "gl-matrix";
import { createFPSCamera } from "@/util/gl2/fps-camera";
import { setUniforms } from "@/util/gl2/setUniform";
import { createTransform } from "@/util/gl2/mat4-pack";
import specularTexURI from "./container2_specular.png";
import diffuseSpotTexURI from "./uv-grid.png";
import diffuseTexURI from "./container2.png";
import { directionLight, dotLights, spotlight } from "./lightConfig";

import vertexSource from "./shader-vert.vert?raw";
import lightsFragSource from "./shader-lights-frag.frag?raw";
import lightPosFragSource from "./shader-light-pos-frag.frag?raw";

const getVao = (gl: WebGL2RenderingContext) => {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const cube = createCube(1);
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cube.positions, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(attribLocs.position);
  gl.vertexAttribPointer(attribLocs.position, 3, gl.FLOAT, false, 0, 0);

  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cube.normals, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(attribLocs.normal);
  gl.vertexAttribPointer(attribLocs.normal, 3, gl.FLOAT, false, 0, 0);

  const texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cube.texCoords, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(attribLocs.texcoord);
  gl.vertexAttribPointer(attribLocs.texcoord, 2, gl.FLOAT, false, 0, 0);

  const indiceBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indiceBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cube.includes, gl.STATIC_DRAW);

  return { vao, numVertexs: cube.includes.length };
};

const constantVariables = (gl: WebGL2RenderingContext, cb?: () => void) => ({
  positions: [
    vec3.fromValues(0.0, 0.0, 0.0),
    vec3.fromValues(2.0, 5.0, -15.0),
    vec3.fromValues(-1.5, -2.2, -2.5),
    vec3.fromValues(-3.8, -2.0, -12.3),
    vec3.fromValues(2.4, -0.4, -3.5),
    vec3.fromValues(-1.7, 3.0, -7.5),
    vec3.fromValues(1.3, -2.0, -2.5),
    vec3.fromValues(1.5, 2.0, -2.5),
    vec3.fromValues(1.5, 0.2, -1.5),
    vec3.fromValues(-1.3, 1.0, -1.5),
  ],
  projectionMat: mat4.perspective(
    mat4.create(),
    glMatrix.toRadian(45),
    gl.canvas.width / gl.canvas.height,
    0.1,
    100
  ),
  texs: {
    diffuseTex: generateTexture(gl, diffuseTexURI, [1, 1, 1, 1], cb),
    specularTex: generateTexture(gl, specularTexURI, [1, 1, 1, 1], cb),
  },
  diffuseSpotTex: generateTexture(gl, diffuseSpotTexURI, [1, 1, 1, 1], cb),
});

const createMutable = (gl: WebGL2RenderingContext, onChange: () => void) => {
  const constant = constantVariables(gl, onChange);
  const worldTransforms = constant.positions.map((pos) =>
    createTransform().translate(pos)
  );
  const worldMatrixs = worldTransforms.map((t) => t.getOut());
  const eysPosition = vec3.fromValues(0, 0, 3);
  const viewMat = mat4.identity(mat4.create());
  const material = { ...constant.texs, shininess: 1 };

  const light = {
    spotLight: spotlight.uniforms,
    directionLight: directionLight.uniforms,
    dotLights: dotLights.map((d) => d.uniforms),
  };
  const lightCubeMats = [
    directionLight.lightCubeMat,
    ...dotLights.map((d) => d.lightCubeMat),
  ];

  const fpsCameraDestory = createFPSCamera(
    (gl.canvas as HTMLCanvasElement).parentElement!,
    (nViewMat, eys) => {
      mat4.copy(viewMat, nViewMat);
      vec3.copy(eysPosition, eys);
      spotlight.update(viewMat, constant.projectionMat, 45);
      onChange();
    },
    [0, 1, 0],
    eysPosition
  );

  const animationDestory = startAnimation((now) => {
    now *= 0.001;
    worldTransforms.forEach((t, i) =>
      t
        .rotateZ(i * 30 + now * 30)
        .rotateY(i * 10 + now * 20)
        .gen()
    );
    onChange();
  });

  return {
    mutable: {
      uniforms: {
        diffuseSpotTex: constant.diffuseSpotTex,
        spotTexMat: spotlight.texMat,
        projectionMat: constant.projectionMat,
        eysPosition,
        viewMat,
        material,
        light,
      },
      worldMats: worldMatrixs,
      lightCubeMats,
    },
    destory: () => {
      fpsCameraDestory();
      animationDestory();
    },
  };
};

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl2");
  if (!gl) throw "无法获取gl上下文";
  const cubeProgram = createProgram(gl, vertexSource, lightsFragSource);
  const lightProgram = createProgram(gl, vertexSource, lightPosFragSource);
  const { vao, numVertexs } = getVao(gl);

  gl.enable(gl.DEPTH_TEST);
  const redraw = () => {
    gl.clearColor(0.5, 0.5, 0.5, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.bindVertexArray(vao);
    gl.useProgram(lightProgram);

    mutable.lightCubeMats.forEach((cubeMat) => {
      setUniforms(gl, lightProgram, {
        ...mutable.uniforms,
        worldMat: cubeMat,
      });
      gl.drawElements(gl.TRIANGLES, numVertexs, gl.UNSIGNED_SHORT, 0);
    });

    gl.bindVertexArray(vao);
    gl.useProgram(cubeProgram);
    const norMat = mat4.create();
    mutable.worldMats.forEach((worldMat) => {
      setUniforms(gl, cubeProgram, {
        ...mutable.uniforms,
        worldMat,
        norMat: mat4.transpose(norMat, mat4.invert(norMat, worldMat)),
      });
      gl.drawElements(gl.TRIANGLES, numVertexs, gl.UNSIGNED_SHORT, 0);
    });
  };

  const { mutable, destory } = createMutable(gl, redraw);
  return destory;
};

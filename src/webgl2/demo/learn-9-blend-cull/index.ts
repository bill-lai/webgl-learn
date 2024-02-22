import { createProgram } from "@/util/gl2/program";
import fragSource from "./shader.frag?raw";
import vertexSource from "./shader.vert?raw";
import { ShapeAttrib, createCube, createPlaneVertices } from "@/util";
import { setUniforms } from "@/util/gl2/setUniform";
import { createFPSCamera } from "@/util/gl2/fps-camera";
import { glMatrix, mat4 } from "gl-matrix";
import caoURI from "./cao.png";
import chuanhuURI from "./chuanhu.png";
import cubeURI from "./cube.png";
import planeURI from "./plane.jpeg";
import woodURI from "./wood.png";
import { generateTex } from "@/util/gl2/gl";
import { createTransform } from "@/util/gl2/mat4-pack";

const generateVao = (gl: WebGL2RenderingContext, modal: ShapeAttrib) => {
  const pointers = [
    { loc: 1, key: "positions", size: 3, type: gl.FLOAT, stride: 0, offset: 0 },
    { loc: 3, key: "texCoords", size: 2, type: gl.FLOAT, stride: 0, offset: 0 },
  ] as const;

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  for (const pointer of pointers) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, modal[pointer.key], gl.STATIC_DRAW);
    gl.enableVertexAttribArray(pointer.loc);
    gl.vertexAttribPointer(
      pointer.loc,
      pointer.size,
      pointer.type,
      false,
      pointer.stride,
      pointer.offset
    );
  }

  const eleBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, eleBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, modal.includes, gl.STATIC_DRAW);

  return vao;
};

const getDyAttri = (gl: WebGL2RenderingContext) => {
  const modals = {
    plan: createPlaneVertices(1, 1),
    cube: createCube(1),
  };
  const vaos = {
    plan: generateVao(gl, modals.plan),
    cube: generateVao(gl, modals.cube),
  };
  const texMaps = Object.entries({
    cao: generateTex(gl, caoURI),
    chuanhu: generateTex(gl, chuanhuURI),
    cube: generateTex(gl, cubeURI),
    wood: generateTex(gl, woodURI),
    plane: generateTex(gl, planeURI),
  });
  const texs = Object.fromEntries(texMaps.map(([k, v]) => [k, v.tex!]));

  const objects = [
    {
      transform: createTransform().translate([0, -0.51, 0]).scale([50, 1, 50]),
      colorTex: texs.plane,
      cull: false,
      vao: vaos.plan,
      numElements: modals.plan.includes.length,
    },
    {
      transform: createTransform().translate([1, 0, -0.5]),
      colorTex: texs.cube,
      vao: vaos.cube,
      cull: true,
      numElements: modals.cube.includes.length,
    },
    {
      transform: createTransform().translate([-1, 0, 0.5]),
      colorTex: texs.cube,
      cull: true,
      vao: vaos.cube,
      numElements: modals.cube.includes.length,
    },

    {
      transform: createTransform().rotateX(90),
      colorTex: texs.chuanhu,
      cull: false,
      vao: vaos.plan,
      numElements: modals.plan.includes.length,
    },
    {
      transform: createTransform().translate([1, 0, 0.01]).rotateX(90),
      colorTex: texs.cao,
      vao: vaos.plan,
      cull: false,
      numElements: modals.plan.includes.length,
    },
    {
      transform: createTransform().translate([-1, 0, 1.01]).rotateX(90),
      colorTex: texs.chuanhu,
      vao: vaos.plan,
      cull: false,
      numElements: modals.plan.includes.length,
    },
    {
      transform: createTransform().translate([0, 0, 2]).rotateX(90),
      colorTex: texs.chuanhu,
      vao: vaos.plan,
      cull: false,
      numElements: modals.plan.includes.length,
    },
    {
      transform: createTransform().translate([1, 2, -0.5]).scale([2, 2, 2]),
      colorTex: texs.wood,
      vao: vaos.cube,
      cull: true,
      numElements: modals.cube.includes.length,
    },
  ];

  return {
    objects,
    loaded: Promise.all(texMaps.map(([_, v]) => v.loaded)),
  };
};

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl2")!;
  const program = createProgram(gl, vertexSource, fragSource);
  const uniforms = {
    viewMat: mat4.create(),
    projectionMat: mat4.perspective(
      mat4.create(),
      glMatrix.toRadian(45),
      canvas.width / canvas.height,
      0.1,
      100
    ),
  };
  const { loaded, objects } = getDyAttri(gl);

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.enable(gl.CULL_FACE);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  gl.useProgram(program);
  gl.viewport(0, 0, canvas.width, canvas.height);
  // gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

  const redraw = () => {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    setUniforms(gl, program, uniforms);
    objects.forEach((object) => {
      object.cull ? gl.enable(gl.CULL_FACE) : gl.disable(gl.CULL_FACE);
      // gl.frontFace(gl.CW);
      gl.bindVertexArray(object.vao);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, object.colorTex);
      setUniforms(gl, program, {
        colorTex: 0,
        worldMat: object.transform.get(),
      });
      gl.drawElements(gl.TRIANGLES, object.numElements, gl.UNSIGNED_SHORT, 0);
    });
  };

  loaded.then(redraw);
  return createFPSCamera(
    canvas.parentElement!,
    (v) => {
      uniforms.viewMat = v;
      redraw();
    },
    [0, 1, 0],
    [0, 0, 6]
  );
};

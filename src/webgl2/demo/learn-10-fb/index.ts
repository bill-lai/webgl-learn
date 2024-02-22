import { createProgram } from "@/util/gl2/program";
import offlineFragSource from "./shader-offline.frag?raw";
import offlineVertexSource from "./shader-offline.vert?raw";
import drawFragSource from "./shader-draw.frag?raw";
import drawVertexSource from "./shader-draw.vert?raw";
import {
  ShapeAttrib,
  createCube,
  createPlaneVertices,
  createXYPlaneVertices,
} from "@/util";
import { setUniforms } from "@/util/gl2/setUniform";
import { createFPSCamera } from "@/util/gl2/fps-camera";
import { glMatrix, mat2, mat4 } from "gl-matrix";
import planURI from "./plane.jpeg";
import cubeURI from "./container2.png";
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
    plan: generateTex(gl, planURI, gl.REPEAT),
    cube: generateTex(gl, cubeURI),
  });
  const texs = Object.fromEntries(texMaps.map(([k, v]) => [k, v.tex!]));

  const planTexMat = mat2.identity(mat2.create());
  const objects = [
    {
      transform: createTransform()
        .translate([0, -0.51, 0])
        .scale([150, 1, 150]),
      colorTex: texs.plan,
      cull: false,
      texMat: mat2.scale(mat2.create(), planTexMat, [150, 150]),
      vao: vaos.plan,
      numElements: modals.plan.includes.length,
    },
    {
      transform: createTransform().translate([1, 0, -0.5]),
      colorTex: texs.cube,
      vao: vaos.cube,
      texMat: planTexMat,
      cull: true,
      numElements: modals.cube.includes.length,
    },
    {
      transform: createTransform().translate([-1, 0, 0.5]),
      colorTex: texs.cube,
      cull: true,
      texMat: planTexMat,
      vao: vaos.cube,
      numElements: modals.cube.includes.length,
    },
    {
      transform: createTransform().translate([1, 2, -0.5]).scale([2, 2, 2]),
      colorTex: texs.cube,
      vao: vaos.cube,
      texMat: planTexMat,
      cull: true,
      numElements: modals.cube.includes.length,
    },
  ];

  return {
    objects,
    loaded: Promise.all(texMaps.map(([_, v]) => v.loaded)),
  };
};

const getOfflineFB = (gl: WebGL2RenderingContext, size: number[]) => {
  const colorTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, colorTex);
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
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.bindTexture(gl.TEXTURE_2D, null);

  const renderBuffer = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
  gl.renderbufferStorage(
    gl.RENDERBUFFER,
    gl.DEPTH24_STENCIL8,
    size[0],
    size[1]
  );
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);

  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    colorTex,
    0
  );
  gl.framebufferRenderbuffer(
    gl.FRAMEBUFFER,
    gl.DEPTH_STENCIL_ATTACHMENT,
    gl.RENDERBUFFER,
    renderBuffer
  );

  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    throw "frameBuffer创建失败";
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  return { fb, colorTex };
};

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl2")!;
  const offlineProgram = createProgram(
    gl,
    offlineVertexSource,
    offlineFragSource
  );
  const drawProgram = createProgram(gl, drawVertexSource, drawFragSource);
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
  const drawPlan = createXYPlaneVertices(2, 2);
  const drawVAO = generateVao(gl, drawPlan);
  const { loaded, objects } = getDyAttri(gl);
  const { fb, colorTex } = getOfflineFB(gl, [canvas.width, canvas.height]);

  const redraw = () => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.useProgram(offlineProgram);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    setUniforms(gl, offlineProgram, uniforms);
    objects.forEach((object) => {
      object.cull ? gl.enable(gl.CULL_FACE) : gl.disable(gl.CULL_FACE);
      gl.bindVertexArray(object.vao);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, object.colorTex);
      setUniforms(gl, offlineProgram, {
        colorTex: 0,
        worldMat: object.transform.get(),
        texMat: object.texMat,
      });
      gl.drawElements(gl.TRIANGLES, object.numElements, gl.UNSIGNED_SHORT, 0);
    });

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(drawProgram);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.bindVertexArray(drawVAO);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, colorTex);
    setUniforms(gl, drawProgram, {
      colorTex: 0,
    });
    gl.drawElements(
      gl.TRIANGLES,
      drawPlan.includes.length,
      gl.UNSIGNED_SHORT,
      0
    );
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

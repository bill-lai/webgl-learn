import { createXYPlaneVertices } from "@/util";
import vertexSource from "./shader-clip.vert?raw";
import { createProgram } from "@/util/gl2/program";
import { generateVao, useTex } from "@/util/gl2/gl";
import { UseAttrib } from "../type";
import { Uniforms, setUniforms } from "@/util/gl2/setUniform";

export const createClipProgram = (
  gl: WebGL2RenderingContext,
  fragSource: string
) => {
  return createProgram(gl, vertexSource, fragSource);
};

const clip = createXYPlaneVertices(2, 2);
export const getClipAttrib = (gl: WebGL2RenderingContext) => {
  const pointers = [
    {
      key: "positions",
      loc: 1,
      size: 3,
      type: gl.FLOAT,
      stride: 0,
      offset: 0,
    },
  ];

  return {
    vao: generateVao(gl, clip, [pointers[0]]),
    numElements: clip.includes.length,
  };
};

export const clipUseAttrib = (
  gl: WebGL2RenderingContext,
  fragSource: string
): UseAttrib => {
  return {
    gl,
    attrib: getClipAttrib(gl),
    program: createClipProgram(gl, fragSource),
  };
};

export const drawClip = (
  { gl, program, attrib }: UseAttrib,
  uniforms: Uniforms
) => {
  gl.useProgram(program);
  gl.bindVertexArray(attrib.vao);

  setUniforms(gl, program, uniforms);
  gl.drawElements(gl.TRIANGLES, attrib.numElements, gl.UNSIGNED_SHORT, 0);
};

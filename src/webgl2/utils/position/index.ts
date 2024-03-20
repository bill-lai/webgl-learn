import { createSphereVertices } from "@/util";
import vertexSource from "./shader-position.vert?raw";
import fragSource from "./shader-position.frag?raw";
import { createProgram } from "@/util/gl2/program";
import { generateVao } from "@/util/gl2/gl";
import { BaseDrawUniforms, UseAttrib } from "../type";
import { mat4, vec3 } from "gl-matrix";
import { setUniforms } from "@/util/gl2/setUniform";

export const createPosProgram = (gl: WebGL2RenderingContext) =>
  createProgram(gl, vertexSource, fragSource);

const sphere = createSphereVertices(1, 12, 24);
export const getPosAttrib = (gl: WebGL2RenderingContext) => {
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
    vao: generateVao(gl, sphere, [pointers[0]]),
    numElements: sphere.includes.length,
  };
};

export const posUseAttrib = (gl: WebGL2RenderingContext): UseAttrib => {
  return {
    gl,
    attrib: getPosAttrib(gl),
    program: createPosProgram(gl),
  };
};

export type DrawPosUniforms = BaseDrawUniforms & {
  color: number[];
};
export const drawPos = (
  { gl, program, attrib }: UseAttrib,
  uniforms: DrawPosUniforms
) => {
  gl.useProgram(program);
  gl.bindVertexArray(attrib.vao);

  setUniforms(gl, program, uniforms);
  gl.drawElements(gl.TRIANGLES, attrib.numElements, gl.UNSIGNED_SHORT, 0);
};

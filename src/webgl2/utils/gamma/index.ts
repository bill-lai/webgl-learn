import fragSource from "./shader-gamma.frag?raw";
import { UseAttrib } from "../type";
import { setUniforms } from "@/util/gl2/setUniform";
import { createClipProgram, getClipAttrib } from "../clip";

export const createGammaProgram = (gl: WebGL2RenderingContext) => {
  return createClipProgram(gl, fragSource);
};

export const gammaUseAttrib = (gl: WebGL2RenderingContext): UseAttrib => {
  return {
    gl,
    attrib: getClipAttrib(gl),
    program: createGammaProgram(gl),
  };
};

export type KernelUniforms = {
  colorTex: number;
};
export const drawGamma = (
  { gl, program, attrib }: UseAttrib,
  uniforms: KernelUniforms
) => {
  gl.useProgram(program);
  gl.bindVertexArray(attrib.vao);

  setUniforms(gl, program, uniforms);
  gl.drawElements(gl.TRIANGLES, attrib.numElements, gl.UNSIGNED_SHORT, 0);
};

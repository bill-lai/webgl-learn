import fragSource from "./shader-kernel.frag?raw";
import { UseAttrib } from "../type";
import { setUniforms } from "@/util/gl2/setUniform";
import { createClipProgram, getClipAttrib } from "../clip";

export const createKernelProgram = (gl: WebGL2RenderingContext) => {
  return createClipProgram(gl, fragSource);
};

export const kernelUseAttrib = (gl: WebGL2RenderingContext): UseAttrib => {
  return {
    gl,
    attrib: getClipAttrib(gl),
    program: createKernelProgram(gl),
  };
};

export type KernelUniforms = {
  colorTex: number;
  kernels: number[];
};
export const drawKernel = (
  { gl, program, attrib }: UseAttrib,
  uniforms: KernelUniforms
) => {
  gl.useProgram(program);
  gl.bindVertexArray(attrib.vao);

  setUniforms(gl, program, uniforms);
  gl.drawElements(gl.TRIANGLES, attrib.numElements, gl.UNSIGNED_SHORT, 0);
};

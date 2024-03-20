import vertexSource from "./shader-shadow.vert?raw";
import fragSource from "./shader-shadow.frag?raw";
import { createProgram } from "@/util/gl2/program";
import { UseAttrib } from "../type";
import { setUniforms } from "@/util/gl2/setUniform";
import { mat4 } from "gl-matrix";
import { createFb } from "@/util/gl2/gl";

export const createShadowProgram = (gl: WebGL2RenderingContext) =>
  createProgram(gl, vertexSource, fragSource);

export type ShadowUseAttrib = Omit<UseAttrib, "attrib"> & {
  buffer: { fb: WebGLFramebuffer; tex: WebGLTexture };
  size: number[];
};

export const shadowUseAttrib = (
  gl: WebGL2RenderingContext,
  size: number[]
): ShadowUseAttrib => {
  const buffer = createFb(
    gl,
    size,
    {
      textarget: gl.DEPTH_ATTACHMENT,
      internalformat: gl.DEPTH_COMPONENT32F,
      format: gl.DEPTH_COMPONENT,
      type: gl.FLOAT,
    },
    false
  );
  gl.bindFramebuffer(gl.FRAMEBUFFER, buffer.fb);
  gl.readBuffer(gl.NONE);
  gl.drawBuffers([gl.NONE]);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  const tex = buffer.texs[0]!;

  return {
    buffer: { fb: buffer.fb!, tex },
    size,
    gl,
    program: createShadowProgram(gl),
  };
};

export type DrawShadowUniforms = {
  shadowViewProjectionMat: mat4;
  modelMat: mat4;
};
export const drawShadow = (
  { gl, program, attrib, buffer }: ShadowUseAttrib & Pick<UseAttrib, "attrib">,
  uniforms: DrawShadowUniforms
) => {
  gl.useProgram(program);
  gl.bindFramebuffer(gl.FRAMEBUFFER, buffer.fb);
  gl.bindVertexArray(attrib.vao);

  setUniforms(gl, program, uniforms);
  gl.drawElements(gl.TRIANGLES, attrib.numElements, gl.UNSIGNED_SHORT, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};

import { mat4 } from "gl-matrix";

export type UseAttrib = {
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  attrib: {
    vao: WebGLVertexArrayObject;
    numElements: number;
  };
};

export type BaseDrawUniforms = {
  projectionMat: mat4;
  viewMat: mat4;
  modelMat: mat4;
};

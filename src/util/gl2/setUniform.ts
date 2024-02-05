export type Uniforms = {
  [key in string]: number | number[] | Float32Array | Uniforms;
};

const setUniform = (
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  key: string,
  val: number | number[] | Float32Array
) => {
  val = (
    val instanceof Float32Array || Array.isArray(val) ? val : [val]
  ) as number[];

  const loc = gl.getUniformLocation(program, key);
  if (loc) {
    try {
      if (val.length > 4) {
        (gl as any)[`uniformMatrix${Math.sqrt(val.length)}fv`](loc, false, val);
      } else {
        if (key.includes("Tex")) {
          gl.uniform1iv(loc, val);
        } else {
          (gl as any)[`uniform${val.length}fv`](loc, val);
        }
      }
    } catch (e) {
      console.error(`key in ${key} val in`, val);
      throw e;
    }
  }
};

export const setUniforms = (
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  data: Uniforms,
  prefix = ""
) => {
  Object.entries(data).forEach(([k, v]) => {
    if (
      v instanceof Float32Array ||
      Array.isArray(v) ||
      typeof v !== "object"
    ) {
      setUniform(gl, program, prefix + k, v);
    } else {
      setUniforms(gl, program, v as Uniforms, k + ".");
    }
  });
};

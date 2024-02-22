export type Uniforms = {
  [key in string]: number | number[] | Float32Array | Uniforms | Uniforms[];
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
      if (key.includes("mat") || (key.includes("Mat") && val.length)) {
        (gl as any)[`uniformMatrix${Math.sqrt(val.length)}fv`](loc, false, val);
      } else if (key.includes("Tex") || key.includes("tex")) {
        gl.uniform1iv(loc, val);
      } else {
        (gl as any)[`uniform${val.length}fv`](loc, val);
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
      if (Array.isArray(v) && typeof v[0] === "object") {
        v.forEach((vi, ndx) => {
          setUniforms(gl, program, vi as Uniforms, k + `[${ndx}].`);
        });
      } else {
        setUniform(gl, program, prefix + k, v as number);
      }
    } else {
      setUniforms(gl, program, v as Uniforms, k + ".");
    }
  });
};

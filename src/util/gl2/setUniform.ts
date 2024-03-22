import { mat4, vec3 } from "gl-matrix";

export type Uniforms = {
  [key in string]:
    | number
    | number[]
    | vec3[]
    | number[][]
    | Float32Array
    | Float32Array[]
    | Uniforms
    | Uniforms[]
    | mat4[];
};

const setUniform = (
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  key: string,
  valR: number | number[] | Float32Array
) => {
  const val = (
    valR instanceof Float32Array || Array.isArray(valR) ? valR : [valR]
  ) as number[];

  const loc = gl.getUniformLocation(program, key);

  if (loc) {
    try {
      if (/(mat$)|(mats\[\d+\])/gi.test(key) && (valR as any).length) {
        (gl as any)[`uniformMatrix${Math.sqrt(val.length)}fv`](loc, false, val);
      } else if (key.includes("Tex") || key.includes("tex")) {
        gl.uniform1iv(loc, val);
      } else if (val.length > 4) {
        for (let i = 0; i < val.length; i++) {
          setUniform(gl, program, `${key}[${i}]`, val[i]);
        }
      } else {
        (gl as any)[`uniform${val.length}fv`](loc, val);
      }
    } catch (e) {
      console.error(`key in ${key} val in`, val);
      throw e;
    }
  } else {
    // console.log(key, loc);
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
          if (vi instanceof Float32Array) {
            setUniform(gl, program, prefix + k + `[${ndx}]`, vi);
          } else {
            setUniforms(gl, program, vi as Uniforms, prefix + k + `[${ndx}].`);
          }
        });
      } else {
        setUniform(gl, program, prefix + k, v as number);
      }
    } else {
      setUniforms(gl, program, v as Uniforms, k + ".");
    }
  });
};

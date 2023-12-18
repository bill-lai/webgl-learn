import { NumArr } from ".";

export type GLCtx = {
  gl: WebGLRenderingContext;
  program?: WebGLProgram;
};

export type JSGlMap = { name: string };

type GLAttribData = {
  [key in string]:
    | Float32Array
    | Uint8Array
    | Uint16Array
    | Uint32Array
    | number[]
    | { value: NumArr };
};

type GLAttribVal = JSGlMap & {
  size?: number;
  normalized?: boolean;
  stride?: number;
  offset?: number;
};

type GLUnNormalAttribMap = { [key in string]: string | GLAttribVal };

export type GLAttribMap = { [key in string]: GLAttribVal };

export const normalAttribMap = (map: GLUnNormalAttribMap): GLAttribMap => {
  const normalMap = {} as any;
  for (const key in map) {
    normalMap[key] =
      typeof map[key] === "string"
        ? { name: map[key], type: Float32Array }
        : map[key];
  }
  return normalMap;
};

export const getGlType = (
  gl: WebGLRenderingContext,
  type: GLAttribData[string]
) => {
  if (type instanceof Array) {
    return gl.FLOAT;
  } else if (type instanceof Uint16Array) {
    return gl.UNSIGNED_SHORT;
  }
  if (type instanceof Uint8Array) {
    return gl.UNSIGNED_BYTE;
  } else {
    return gl.FLOAT;
  }
};

export class GLAttrib {
  private buffers: { [key in string]: WebGLBuffer } = {};
  private indexs: { [key in string]: number } = {};
  data: GLAttribData;
  map: GLAttribMap;
  ctx: GLCtx;

  constructor(
    ctx: GLCtx,
    data: GLAttribData,
    map: GLUnNormalAttribMap = { positions: "a_position" }
  ) {
    this.ctx = ctx;
    this.data = data;
    this.map = normalAttribMap(map);
  }

  private init(program: WebGLProgram, debug: boolean) {
    const { gl } = this.ctx;
    for (const key in this.data) {
      if (this.map[key]) {
        if (!this.buffers[key]) {
          const items = this.data[key]
          if (!('value' in items)) {
            const buffer =
              this.data[key] instanceof Array
                ? new Float32Array(items)
                : (this.data[key] as Float32Array);
            this.buffers[key] = gl.createBuffer()!;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers[key]);
            gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.STATIC_DRAW);
          }
        }
        this.indexs[key] = gl.getAttribLocation(program, this.map[key].name);
      }
    }
    if (this.data.includes) {
      const buffer =
        this.data.includes instanceof Array
          ? new Float32Array(this.data.includes)
          : (this.data.includes as Float32Array);
      const includeBuffer = gl.createBuffer()!;
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, includeBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, buffer, gl.STATIC_DRAW);
      this.buffers.includes = includeBuffer;
    }
  }

  active(program: WebGLProgram, debug = false) {
    this.init(program, debug)
    const { gl } = this.ctx;
    for (const key in this.data) {
      const buffer = this.buffers[key];
      const map = this.map[key];
      const items = this.data[key]
      const type = getGlType(gl, this.data[key]);
      const index = this.indexs[key];

      if (key !== "includes") {
        if (!map) continue;

        if (index !== -1) {
          if ('value' in items) {
            gl.disableVertexAttribArray(index)
            gl.vertexAttrib4fv(index, items.value)
          } else {
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.enableVertexAttribArray(index);
            gl.vertexAttribPointer(
              index,
              map.size || 3,
              type,
              map.normalized || false,
              map.stride || 0,
              map.offset || 0
            );
          }
        }
      } else {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
      }
    }
  }
}

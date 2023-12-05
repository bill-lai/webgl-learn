export type GLCtx = {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
}

export type JSGlMap = { name: string }

type GLAttribData = { [key in string]: Float32Array | Uint8Array | Uint16Array | Uint32Array | number[] };

type GLAttribVal = JSGlMap & { 
  size?: number, 
  normalized?: boolean, 
  stride?: number, 
  offset?: number
}

type GLUnNormalAttribMap = { [key in string]: string | GLAttribVal }

export type GLAttribMap = { [key in string]: GLAttribVal }

export const normalAttribMap = (map: GLUnNormalAttribMap): GLAttribMap => {
  const normalMap = {} as any
  for (const key in map) {
    normalMap[key] = typeof map[key] === 'string' 
      ? { name: map[key], type: Float32Array } 
      : map[key];
  }
  return normalMap
}

export const getGlType = (gl: WebGLRenderingContext, type: GLAttribData[string]) => {
  if (type instanceof Array) {
    return gl.FLOAT
  } else if (type instanceof Uint16Array) {
    return gl.UNSIGNED_SHORT;
  } if (type instanceof Uint8Array) {
    return gl.UNSIGNED_BYTE;
  } else {
    return gl.FLOAT
  }
}

export class GLAttrib {
  private buffers: {[key in string]: WebGLBuffer} = {}
  private indexs: {[key in string]: number} = {}
  data: GLAttribData
  map: GLAttribMap
  ctx: GLCtx

  constructor(ctx: GLCtx, data: GLAttribData, map: GLUnNormalAttribMap = {positions: 'a_position'}) {
    this.ctx = ctx
    this.data = data
    this.map = normalAttribMap(map)
    this.init()
  }

  private init() {
    const { gl, program } = this.ctx
    
    for (const key in this.data) {

      if (this.map[key] && !this.buffers[key]) {
        const buffer = this.data[key] instanceof Array
          ? new Float32Array(this.data[key]) 
          : this.data[key] as Float32Array
        this.buffers[key] = gl.createBuffer()!
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers[key])
        gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.STATIC_DRAW);

        this.indexs[key] = gl.getAttribLocation(program, this.map[key].name)
      }
    }
    if (this.data.includes) {
      const buffer = this.data.includes instanceof Array
        ? new Float32Array(this.data.includes) 
        : this.data.includes as Float32Array
      const includeBuffer = gl.createBuffer()!
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, includeBuffer)
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, buffer, gl.STATIC_DRAW)
      this.buffers.includes = includeBuffer
    }
  }

  active() {
    const { gl } = this.ctx
    for (const key in this.buffers) {
      
      const buffer = this.buffers[key]
      const map = this.map[key]
      const type = getGlType(gl, this.data[key])
      const index = this.indexs[key]
      

      if (key !== 'includes') {
        if (index !== -1) {
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
          gl.enableVertexAttribArray(index)
          gl.vertexAttribPointer(index, map.size || 3, type, map.normalized || false, map.stride || 0, map.offset || 0)
        }
      } else {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer)
      }
    }
  }
}
export type JSGlType = Float32ArrayConstructor | Uint8ArrayConstructor
export type JSGlMapItem = {
  name: string, 
  type: JSGlType
}
export type JSGlUnNormalMapItem = string | JSGlMapItem

export type JSGlMap = {
  [key in string]: JSGlMapItem
}

export type JSUnNormalGlMap = {
  [key in string]: JSGlUnNormalMapItem
}

export const normalJsMap = (map: JSUnNormalGlMap): JSGlMap => {
  const normalMap = {} as any
  for (const key in map) {
    normalMap[key] = typeof map[key] === 'string' 
      ? { name: map[key], type: Float32Array } 
      : map[key];
  }
  return normalMap
}

export const getGlType = (gl: WebGLRenderingContext, type: JSGlType) => {
  if (type === Uint8Array) {
    return gl.UNSIGNED_BYTE;
  } else {
    return gl.FLOAT
  }
}

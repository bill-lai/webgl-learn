import { ShapeAttrib, loadImage } from "..";

export const generateTex = (
  gl: WebGL2RenderingContext,
  texURI: string,
  wrapType: number = gl.CLAMP_TO_EDGE,
  internalformat: number = gl.RGBA,
  filters: number[] = [gl.LINEAR, gl.LINEAR_MIPMAP_LINEAR]
) => {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([255, 255, 255, 255])
  );

  const loaded = new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.src = texURI;
    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        internalformat,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image
      );
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapType);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapType);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filters[0]);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filters[1]);
      resolve();
    };
    image.onerror = reject;
  });
  return { tex, loaded };
};

export const generateCubeTex = (
  gl: WebGL2RenderingContext,
  boxURL: string[]
) => {
  const startEnum = gl.TEXTURE_CUBE_MAP_POSITIVE_X;

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex);
  for (let i = 0; i < boxURL.length; i++) {
    gl.texImage2D(
      startEnum + i,
      0,
      gl.RGB,
      1,
      1,
      0,
      gl.RGB,
      gl.UNSIGNED_BYTE,
      new Uint8Array([255, 255, 255])
    );
  }

  const loaded = Promise.all(boxURL.map(loadImage)).then((images) => {
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex);
    for (let i = 0; i < images.length; i++) {
      gl.texImage2D(
        startEnum + i,
        0,
        gl.RGB,
        gl.RGB,
        gl.UNSIGNED_BYTE,
        images[i]
      );
    }
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  });

  return { tex, loaded };
};

export type VaoBuffers<T extends string> = { [key in T]: WebGLBuffer };
export const updateVao = <T extends string>(
  gl: WebGL2RenderingContext,
  modal: { [key in T]: ArrayBufferView },
  pointers: Pointer<T>[],
  vao: WebGLVertexArrayObject
) => {
  gl.bindVertexArray(vao);

  const keys = pointers.map((p) => p.key);
  const buffers = Object.fromEntries(
    Object.entries(modal)
      .filter(([k]) => keys.includes(k as T))
      .map(([key, val]) => {
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, val as ArrayBufferView, gl.STATIC_DRAW);
        return [key, buffer];
      })
  ) as VaoBuffers<T>;

  for (const pointer of pointers) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers[pointer.key]);
    gl.enableVertexAttribArray(pointer.loc);
    gl.vertexAttribPointer(
      pointer.loc,
      pointer.size,
      pointer.type,
      false,
      pointer.stride,
      pointer.offset
    );

    if (pointer.divisor && "divisor" in pointer) {
      gl.vertexAttribDivisor(pointer.loc, pointer.divisor!);
    }
  }
  return buffers;
};

export type Pointer<T = string> = {
  loc: number;
  key: T;
  size: number;
  type: number;
  stride: number;
  offset: number;
  divisor?: number;
};
export const generateVao = <T extends string>(
  gl: WebGL2RenderingContext,
  modal: { [key in T]: ArrayBufferView },
  pointers: Pointer<T>[]
) => {
  const vao = gl.createVertexArray()!;
  updateVao(gl, modal, pointers, vao);

  if ("includes" in modal) {
    const eleBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, eleBuffer);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      (modal as any).includes,
      gl.STATIC_DRAW
    );
  }

  return vao;
};

export const useTex = (
  gl: WebGL2RenderingContext,
  tex: WebGLTexture,
  target: number = gl.TEXTURE_2D,
  offset = 0
) => {
  gl.activeTexture(gl.TEXTURE0 + offset);
  gl.bindTexture(target, tex);
  return offset;
};

export const bindUniformBlock = (
  gl: WebGL2RenderingContext,
  bindPrograms: WebGLProgram[],
  blockName: string,
  banding: number
) => {
  // program固定uniform块绑定点
  for (const program of bindPrograms) {
    const index = gl.getUniformBlockIndex(program, blockName);
    gl.uniformBlockBinding(program, index, banding);
  }
};

export const setUniformBlockFactory = (
  gl: WebGL2RenderingContext,
  bindPrograms: WebGLProgram[],
  blockName: string,
  banding: number,
  dataByteSize: number,
  ...items: { data: BufferSource; byteOffset: number }[]
) => {
  bindUniformBlock(gl, bindPrograms, blockName, banding);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.UNIFORM_BUFFER, buffer);
  gl.bufferData(gl.UNIFORM_BUFFER, dataByteSize, gl.STATIC_DRAW);
  // 把buffer设置到绑定点
  gl.bindBufferRange(gl.UNIFORM_BUFFER, banding, buffer, 0, dataByteSize);
  gl.bindBuffer(gl.UNIFORM_BUFFER, null);

  const setData = (...items: { data: BufferSource; byteOffset: number }[]) => {
    gl.bindBuffer(gl.UNIFORM_BUFFER, buffer);
    for (const { data, byteOffset } of items) {
      gl.bufferSubData(gl.UNIFORM_BUFFER, byteOffset, data);
    }
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);
  };

  if (items.length) {
    setData(...items);
  }

  return setData;
};

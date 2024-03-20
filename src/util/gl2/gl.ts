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

export const createTex = (
  gl: WebGL2RenderingContext,
  props: Pick<
    AppendTexProps,
    "internalformat" | "filter" | "size" | "format" | "type" | "wrap"
  >,
  data?: ArrayBufferView
) => {
  const filters = props.filter || [gl.NEAREST, gl.NEAREST];
  const wrap = props.wrap || [gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE];

  const colorTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, colorTex);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    props.internalformat,
    props.size[0],
    props.size[1],
    0,
    props.format,
    props.type,
    data || null
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filters[0]);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filters[1]);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap[0]);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap[1]);
  gl.bindTexture(gl.TEXTURE_2D, null);

  return colorTex;
};

export type AppendTexProps = {
  size: number[];
  internalformat: number;
  format: number;
  type: number;
  start?: number;
  filter?: number[];
  wrap?: number[];
  textarget?: number;
};
export const fbAppendTex = (
  gl: WebGL2RenderingContext,
  props: AppendTexProps
) => {
  const textarget = props.textarget || gl.COLOR_ATTACHMENT0;
  const colorTex = createTex(gl, props)!;
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    textarget + (props.start || 0),
    gl.TEXTURE_2D,
    colorTex,
    0
  );
  return colorTex;
};

export type AppendTexsProps = Omit<AppendTexProps, "size" | "start">[];

export const fbAppendTexs = (
  gl: WebGL2RenderingContext,
  props: AppendTexsProps,
  size: number[],
  start = 0
) => {
  const texs = props.map((props, i) =>
    fbAppendTex(gl, {
      ...props,
      start: start + i,
      size,
    })
  );
  gl.drawBuffers(props.map((_, i) => gl.COLOR_ATTACHMENT0 + start + i));
  return texs;
};

export const createFb = (
  gl: WebGL2RenderingContext,
  size: number[],
  texProps: AppendTexsProps | AppendTexsProps[number],
  appendDepth: boolean
) => {
  texProps = Array.isArray(texProps) ? texProps : [texProps];
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

  if (appendDepth) {
    const rbDepth = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, rbDepth);
    gl.renderbufferStorage(
      gl.RENDERBUFFER,
      gl.DEPTH24_STENCIL8,
      size[0],
      size[1]
    );
    // gl.renderbufferStorageMultisample(
    //   gl.FRAMEBUFFER,
    //   3,
    //   gl.DEPTH24_STENCIL8,
    //   size[0],
    //   size[1]
    // );
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

    gl.framebufferRenderbuffer(
      gl.FRAMEBUFFER,
      gl.DEPTH_STENCIL_ATTACHMENT,
      gl.RENDERBUFFER,
      rbDepth
    );
  }
  const texs = fbAppendTexs(gl, texProps, size, 0);

  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    console.error("Framebuffer is incomplete:", status);
    throw "frame不完整";
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { texs, fb };
};

export const createIntervalFb = (
  gl: WebGL2RenderingContext,
  size: number[],
  texProps: AppendTexsProps | AppendTexsProps[number],
  appendDepth: boolean = false
) => {
  const fbs = [
    createFb(gl, size, texProps, appendDepth),
    createFb(gl, size, texProps, appendDepth),
  ];
  let i = 0;

  return {
    fbs,
    getActiveTexs: () => fbs[i].texs,
    use: (
      initTexs: WebGLTexture | WebGLTexture[],
      redraw: (texs: WebGLTexture[], intervalCount: number) => void,
      count?: number
    ) => {
      let intervalCount = 0;
      let start = true;
      let texs = Array.isArray(initTexs) ? initTexs : [initTexs];

      const fbRedraw = () => {
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbs[i].fb);
        let next = (i + 1) % 2;
        if (start) {
          redraw(texs, intervalCount++);
          start = false;
        } else {
          redraw(fbs[next].texs, intervalCount++);
        }
        i = next;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      };

      if (count) {
        for (let i = 0; i < count; i++) {
          fbRedraw();
        }
      }
      return fbRedraw;
    },
  };
};

export const blitBuffer = (
  gl: WebGL2RenderingContext,
  readFb: WebGLFramebuffer | null,
  drawFb: WebGLFramebuffer | null,
  bits: number,
  size: number[]
) => {
  // 拷贝深度缓存
  gl.bindFramebuffer(gl.READ_FRAMEBUFFER, readFb);
  gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, drawFb);
  gl.blitFramebuffer(
    0,
    0,
    size[0],
    size[1],
    0,
    0,
    size[0],
    size[1],
    bits,
    gl.NEAREST
  );
  gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
  gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
};

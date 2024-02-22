import { ShapeAttrib, loadImage } from "..";

export const generateTex = (
  gl: WebGL2RenderingContext,
  texURI: string,
  wrapType: number = gl.CLAMP_TO_EDGE
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
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image
      );
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapType);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapType);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MIN_FILTER,
        gl.LINEAR_MIPMAP_LINEAR
      );
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

type Pointer = {
  loc: number;
  key: keyof ShapeAttrib;
  size: number;
  type: number;
  stride: number;
  offset: number;
};
export const generateVao = (
  gl: WebGL2RenderingContext,
  modal: ShapeAttrib,
  pointers: Pointer[]
) => {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  for (const pointer of pointers) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, modal[pointer.key]!, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(pointer.loc);
    gl.vertexAttribPointer(
      pointer.loc,
      pointer.size,
      pointer.type,
      false,
      pointer.stride,
      pointer.offset
    );
  }

  const eleBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, eleBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, modal.includes, gl.STATIC_DRAW);

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
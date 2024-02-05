import { NumArr, loadImage } from ".";

// 创建定点着色器和片段着色器
export const createShader = (
  gl: WebGLRenderingContext,
  type: number,
  source: string
) => {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
  }
  return shader;
};

// 创建着色程序，连接着色器
export const createProgram = (
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
) => {
  const program = gl.createProgram()!;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
  }
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  return program;
};

export const createProgramBySource = (
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string
) =>
  createProgram(
    gl,
    createShader(gl, gl.VERTEX_SHADER, vertexSource),
    createShader(gl, gl.FRAGMENT_SHADER, fragmentSource)
  );

export const isTwoPower = (val: number) => (val & (val - 1)) === 0;

let texOffset = 0;
export const generateTexture = (
  gl: WebGLRenderingContext,
  url: string,
  initColor: NumArr,
  redraw?: (image: HTMLImageElement) => void,
  test = false
) => {
  texOffset++;
  const currentOffset = texOffset;
  const color = [...initColor];
  if (color.every((c) => c <= 1)) {
    color.forEach((c, i) => (color[i] = c * 255));
  }
  if (color.length === 3) {
    color[3] = 255;
  }

  gl.activeTexture(gl.TEXTURE0 + currentOffset);
  const texture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array(color)
  );

  const loaded = loadImage(url).then((image) => {
    if (test) return;
    gl.activeTexture(gl.TEXTURE0 + currentOffset);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    if (isTwoPower(image.width) && isTwoPower(image.height)) {
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    return image;
  });

  loaded.then((image) => redraw && redraw(image!));

  return currentOffset;
};

export const createMatrixTexture = (
  gl: WebGLRenderingContext,
  mat4: Float32Array
) => {
  const count = mat4.length / 16;
  gl.getExtension("OES_texture_float");

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    4,
    count,
    0,
    gl.RGBA,
    gl.FLOAT,
    mat4
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  return texture;
};

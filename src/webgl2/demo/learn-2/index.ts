import { loadImage } from "@/util";
import fragmentSource from "./shader-fragment.frag?raw";
import vertexSource from "./shader-vertex.vert?raw";
import awesomeface from "./awesomeface.png";
import container from "./container.jpg";

const createProgram = (gl: WebGL2RenderingContext) => {
  const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
  gl.shaderSource(vertexShader, vertexSource);
  gl.compileShader(vertexShader);

  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    throw gl.getShaderInfoLog(vertexShader);
  }

  const fragShader = gl.createShader(gl.FRAGMENT_SHADER)!;
  gl.shaderSource(fragShader, fragmentSource);
  gl.compileShader(fragShader);

  if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
    throw gl.getShaderInfoLog(fragShader);
  }

  const program = gl.createProgram()!;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw gl.getProgramInfoLog(program);
  }

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragShader);

  return program;
};

const vertexs = new Float32Array([
  0.5,
  0.5,
  0.0,
  1.0,
  0.0,
  0.0,
  1.0,
  1.0, // 右上
  0.5,
  -0.5,
  0.0,
  0.0,
  1.0,
  0.0,
  1.0,
  0.0, // 右下
  -0.5,
  -0.5,
  0.0,
  0.0,
  0.0,
  1.0,
  0.0,
  0.0, // 左下
  -0.5,
  0.5,
  0.0,
  1.0,
  1.0,
  0.0,
  0.0,
  1.0, // 左上
]);
const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

const getVAO = (
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  scale = 1
) => {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const texcoordScale = [scale, scale];
  // const texcoordScale = [
  //   (100 * 1) / gl.canvas.width / 2,
  //   (100 * 1) / gl.canvas.height / 2,
  // ];

  const offset = 0;
  const stride = 8;
  for (let i = 0; i < 4; i++) {
    vertexs[offset + stride * i] *= texcoordScale[0];
    vertexs[offset + stride * i + 1] *= texcoordScale[1];
    vertexs[offset + stride * i + 2] = scale;
  }

  const vertexsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertexs, gl.STATIC_DRAW);

  const positionLoc = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(positionLoc);
  gl.vertexAttribPointer(
    positionLoc,
    3,
    gl.FLOAT,
    false,
    8 * Float32Array.BYTES_PER_ELEMENT,
    0
  );

  const colorLoc = gl.getAttribLocation(program, "color");
  gl.enableVertexAttribArray(colorLoc);
  gl.vertexAttribPointer(
    colorLoc,
    3,
    gl.FLOAT,
    false,
    8 * Float32Array.BYTES_PER_ELEMENT,
    3 * Float32Array.BYTES_PER_ELEMENT
  );

  const texcoordLoc = gl.getAttribLocation(program, "texcoord");
  gl.enableVertexAttribArray(texcoordLoc);
  gl.vertexAttribPointer(
    texcoordLoc,
    2,
    gl.FLOAT,
    false,
    8 * Float32Array.BYTES_PER_ELEMENT,
    6 * Float32Array.BYTES_PER_ELEMENT
  );

  const indiceBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indiceBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  gl.bindVertexArray(null);
  return vao;
};

export const init = async (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl2")!;
  const program = createProgram(gl);

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.useProgram(program);

  const vao1 = getVAO(gl, program, 0.99);
  const vao2 = getVAO(gl, program, 0.8);

  // await loadImage(awesomeface)
  const containerImage = await loadImage(container);
  const containerTex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, containerTex);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGB,
    gl.RGB,
    gl.UNSIGNED_BYTE,
    containerImage
  );
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  const awesomefaceImage = await loadImage(awesomeface);
  const awesomefaceTex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, awesomefaceTex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    awesomefaceImage
  );
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

  // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL)
  gl.enable(gl.DEPTH_TEST);
  const redraw = () => {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.bindVertexArray(vao1);
    gl.uniform1i(gl.getUniformLocation(program, "tex1"), 0);
    gl.uniform1i(gl.getUniformLocation(program, "tex2"), 1);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

    gl.bindVertexArray(vao2);
    gl.uniform1i(gl.getUniformLocation(program, "tex1"), 0);
    gl.uniform1i(gl.getUniformLocation(program, "tex2"), 1);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
  };
  redraw();
};

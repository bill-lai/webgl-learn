import fragmentSource from "./shader-fragment.frag?raw";
import vertexSource from "./shader-vertex.vert?raw";

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
  0.5, 0.5, 1, 0, 0, 0.5, -0.5, 0, 1, 0, -0.5, -0.5, 0, 0, 1,
]);
const indices = new Uint16Array([0, 1, 2]);

const getVAO = (gl: WebGL2RenderingContext, program: WebGLProgram) => {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const vertexsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertexs, gl.STATIC_DRAW);

  const positionLoc = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(positionLoc);
  gl.vertexAttribPointer(
    positionLoc,
    2,
    gl.FLOAT,
    false,
    5 * Float32Array.BYTES_PER_ELEMENT,
    0
  );

  const colorLoc = gl.getAttribLocation(program, "color");
  gl.enableVertexAttribArray(colorLoc);
  gl.vertexAttribPointer(
    colorLoc,
    3,
    gl.FLOAT,
    false,
    5 * Float32Array.BYTES_PER_ELEMENT,
    2 * Float32Array.BYTES_PER_ELEMENT
  );

  const indiceBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indiceBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  gl.bindVertexArray(null);
  return vao;
};

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl2")!;
  const program = createProgram(gl);

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.useProgram(program);

  console.log(gl.MAX_VERTEX_ATTRIBS);
  const vao = getVAO(gl, program);

  const redraw = () => {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindVertexArray(vao);
    // gl.drawElements(gl.LINE_LOOP, indices.length, gl.UNSIGNED_SHORT, 0);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
  };
  redraw();
};

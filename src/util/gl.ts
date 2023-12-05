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
  gl: WebGLRenderingContext,
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
  return program;
};

export const createProgramBySource = (
  gl: WebGLRenderingContext,
  vertexSource: string,
  fragmentSource: string
) =>
  createProgram(
    gl,
    createShader(gl, gl.VERTEX_SHADER, vertexSource),
    createShader(gl, gl.FRAGMENT_SHADER, fragmentSource)
  );

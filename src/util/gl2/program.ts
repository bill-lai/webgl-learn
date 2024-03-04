import attribLocs from "./attribLocation.json";

const typeNameMap: { [key in string]: string } = {
  35633: "顶点着色器",
  35632: "片段着色器",
};
export const createShader = (
  gl: WebGL2RenderingContext,
  type: number,
  source: string
) => {
  const shader = gl.createShader(type);
  if (!shader) throw `gl 无法创建${typeNameMap[type]}着色器`;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    throw `${typeNameMap[type]}着色器编译失败`;
  }

  return shader;
};

export const generateProgram = (
  gl: WebGL2RenderingContext,
  ...shaders: WebGLShader[]
) => {
  const program = gl.createProgram();
  if (!program) throw "gl 无法创建程序";
  for (const shader of shaders) {
    gl.attachShader(program, shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    throw "程序链接失败";
  }
  return program;
};

export { attribLocs };
export const createProgram = (
  gl: WebGL2RenderingContext,
  vSource: string,
  fSource: string
) => {
  const program = generateProgram(
    gl,
    createShader(gl, gl.VERTEX_SHADER, vSource),
    createShader(gl, gl.FRAGMENT_SHADER, fSource)
  );
  Object.entries(attribLocs).forEach(([name, loc]) => {
    gl.bindAttribLocation(program, loc, name);
  });
  return program;
};

import attribLocs from "./attribLocation.json";

export { attribLocs };
export const createProgram = (
  gl: WebGL2RenderingContext,
  vSource: string,
  fSource: string
) => {
  const vShader = gl.createShader(gl.VERTEX_SHADER);
  if (!vShader) throw "gl 无法创建顶点着色器";
  gl.shaderSource(vShader, vSource);
  gl.compileShader(vShader);

  if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(vShader));
    throw "顶点着色器编译失败";
  }

  const fShader = gl.createShader(gl.FRAGMENT_SHADER);
  if (!fShader) throw "gl 无法创建片段着色器";
  gl.shaderSource(fShader, fSource);
  gl.compileShader(fShader);
  if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(fShader));
    throw "片段着色器编译失败";
  }

  const program = gl.createProgram();
  if (!program) throw "gl 无法创建程序";
  gl.attachShader(program, vShader);
  gl.attachShader(program, fShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    throw "程序链接失败";
  }

  Object.entries(attribLocs).forEach(([name, loc]) => {
    gl.bindAttribLocation(program, loc, name);
  });

  return program;
};

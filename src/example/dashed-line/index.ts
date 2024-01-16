import vertSource from "./vertex-shader.vert?raw";
import fragSource from "./fragment-shader.frag?raw";
import { createProgramBySource } from "../util";
import { bufferPush, subtractVectors } from "../../util";

const bindAttri = (gl: WebGLRenderingContext, program: WebGLProgram) => {
  const positions = new Float32Array([
    0.900, 0.000, 0,
    0.405, 0.294, 0,
    0.278, 0.856, 0,
    -0.155, 0.476, 0,
    -0.728, 0.529, 0,
    -0.500, 0.000, 0,
    -0.728, -0.529, 0,
    -0.155, -0.476, 0,
    0.278, -0.856, 0,
    0.405, -0.294, 0,
    0.900, -0.000, 0,
  ])

  const numVertexs = positions.length / 3
  const distances = new Float32Array(numVertexs)
  let total = 0
  let prevPosition;
  for (let i = 0; i < numVertexs; i++) {
    const position = positions.slice(i * 3, (i + 1) * 3)
    if (prevPosition) {
      const a = subtractVectors(prevPosition, position)
      total += Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2])
    }
    bufferPush(distances, i, total)
    prevPosition = position
  }
  console.log(distances)

  const positionLoc = gl.getAttribLocation(program, "position");
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData( gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW );


  const distanceLoc = gl.getAttribLocation(program, "distance");
  const distanceBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, distanceBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, distances, gl.STATIC_DRAW)

  return {
    useAttrib: () => {
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, distanceBuffer);
      gl.enableVertexAttribArray(distanceLoc);
      gl.vertexAttribPointer(distanceLoc, 1, gl.FLOAT, false, 0, 0);

    },
    numVertexs
  };
};

const bindUniform = (
  gl: WebGLRenderingContext,
  program: WebGLProgram,
) => {
  const colors = new Uint8Array([
    0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 0,
    0, 0, 0, 0, 0, 255, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 255, 0,
    0, 0, 0, 0, 0, 0, 0,
  ])

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    12,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    colors
  );

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);

  const textureSizeLoc = gl.getUniformLocation(program, 'textureSize')

  return () => {
    gl.uniform1f(textureSizeLoc, 0.1)
  }
};

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl")!;
  const program = createProgramBySource(gl, vertSource, fragSource);

  gl.useProgram(program);
  gl.viewport(0, 0, canvas.width, canvas.height);

  const { useAttrib, numVertexs } = bindAttri(gl, program);
  const useUniform = bindUniform(gl, program)
  
  const redraw = () => {
    console.log(numVertexs)
    gl.clear(gl.COLOR_BUFFER_BIT)
    useAttrib()
    useUniform()
    gl.drawArrays(gl.LINE_STRIP, 0, numVertexs)
  }
  redraw()
};

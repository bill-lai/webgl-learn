import { createProgramBySource } from "../../../util";
import fragSource from "./fragment-shader.frag?raw";
import vertSource from "./vertex-shader.vert?raw";

export const drawCircle = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext('webgl')!
  const program = createProgramBySource(gl, vertSource, fragSource)

  const sliceSubVerts = 8 * 3;
  const numVerts = 10 * sliceSubVerts;
  const verteIds = new Array(numVerts).fill(0).map((_, i) => i);

  const vertexIdIndex = gl.getAttribLocation(program, 'a_vertexId')
  const sumVertsIndex = gl.getUniformLocation(program, 'u_sumVerts');
  const sliceSubVertsIndex = gl.getUniformLocation(program, 'u_sliceSubVerts');
  const resolutionIndex = gl.getUniformLocation(program, 'u_resolution')
  

  gl.useProgram(program);


  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verteIds), gl.STATIC_DRAW);

  gl.enableVertexAttribArray(vertexIdIndex);
  gl.vertexAttribPointer(vertexIdIndex, 1, gl.FLOAT, false, 0, 0);

  gl.uniform1f(sumVertsIndex, numVerts)
  gl.uniform1f(sliceSubVertsIndex, sliceSubVerts)
  gl.uniform2f(resolutionIndex, canvas.width, canvas.height)

  gl.drawArrays(gl.TRIANGLES, 0, numVerts);

}
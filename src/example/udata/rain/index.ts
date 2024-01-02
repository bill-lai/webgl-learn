import { createProgramBySource } from "../../../util";
import fragSource from "./fragment-shader.frag?raw";
import vertSource from "./vertex-shader.vert?raw";

export const drawRain = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext('webgl')!
  const program = createProgramBySource(gl, vertSource, fragSource)

  const numVerts = 500;
  const verteIds = new Array(numVerts).fill(0).map((_, i) => i);

  const vertexIdIndex = gl.getAttribLocation(program, 'vertexId')
  const sumVertsIndex = gl.getUniformLocation(program, 'sumVerts');
  const dateTimeIndex = gl.getUniformLocation(program, 'dateTime');

  gl.useProgram(program);


  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verteIds), gl.STATIC_DRAW);

  gl.enableVertexAttribArray(vertexIdIndex);
  gl.vertexAttribPointer(vertexIdIndex, 1, gl.FLOAT, false, 0, 0);

  gl.uniform1f(sumVertsIndex, numVerts)

  const redraw = (dateTime = 0) => {
    gl.uniform1f(dateTimeIndex, dateTime)
    gl.drawArrays(gl.POINTS, 0, numVerts);
  }

  const animation = (time = 0) => {
    redraw(time / 1000),
    requestAnimationFrame(animation)
  }
  redraw()
  animation()
}
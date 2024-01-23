import { createProgramBySource, generateTexture, startAnimation } from "../../util";
import fragSource from "./shader-fragment.frag?raw";
import vertSource from "./shader-vertex.vert?raw";

const bindAttri = (gl: WebGLRenderingContext, program: WebGLProgram) => {
  const positions = new Float32Array([
    -.5, -.5, 
     .7, -.3,
     .7, -.3,
    -.1,  .8,
    -.1,  .8,
    -.8,  .2,
  ])
  const travels = new Float32Array([
    0, 1, 
    0, 2,
    0, 3, 
  ])

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData( gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW );

  const travelBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, travelBuffer);
  gl.bufferData( gl.ARRAY_BUFFER, travels, gl.STATIC_DRAW );

  return {
    useAttrib: () => {
      const positionLoc = gl.getAttribLocation(program, "position");
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
      
      const travelLoc = gl.getAttribLocation(program, "travel");
      gl.bindBuffer(gl.ARRAY_BUFFER, travelBuffer);
      gl.enableVertexAttribArray(travelLoc);
      gl.vertexAttribPointer(travelLoc, 1, gl.FLOAT, false, 0, 0);
    },
    numVertexs: positions.length / 2
  };
};

const bindUniform = (gl: WebGLRenderingContext, program: WebGLProgram) => {
  const timeLoc = gl.getUniformLocation(program, 'time');

  return (time: number) => {
    gl.uniform1f(timeLoc, -time)
  }
};

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl")!;
  const program = createProgramBySource(gl, vertSource, fragSource);
  gl.viewport(0, 0, canvas.width, canvas.height);

  gl.useProgram(program)
  const { useAttrib, numVertexs } = bindAttri(gl, program)
  const useUniform = bindUniform(gl, program)

  const redraw = (time: number) => {
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)
    useAttrib()
    useUniform(time * 0.001)
    gl.drawArrays(gl.LINES, 0, numVertexs)
  }

  startAnimation(redraw)
}
import { createProgramBySource, createXYPlaneVertices, startAnimation, } from "../../util";
import fragSource from "./shader-fragment.frag?raw";
import vertSource from "./shader-vertex.vert?raw";

const bindAttri = (gl: WebGLRenderingContext, numCount: number, program: WebGLProgram) => {
  const et = gl.getExtension('ANGLE_instanced_arrays');
  if (!et) {
    throw '当前浏览器不支持ANGLE_instanced_arrays扩展';
  }
  const ids = new Float32Array(new Array(numCount).fill(0).map((_, i) => i));
  const plane = createXYPlaneVertices(0.2, 0.2)

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData( gl.ARRAY_BUFFER, plane.positions, gl.STATIC_DRAW );


  const texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  gl.bufferData( gl.ARRAY_BUFFER, plane.texCoords, gl.STATIC_DRAW );

  const includeBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, includeBuffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, plane.includes, gl.STATIC_DRAW)

  const idBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, idBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, ids, gl.STATIC_DRAW);

  return {
    useAttrib: () => {
      const positionLoc = gl.getAttribLocation(program, "position");
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);

      const texcoordLoc = gl.getAttribLocation(program, "texcoord");
      gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
      gl.enableVertexAttribArray(texcoordLoc);
      gl.vertexAttribPointer(texcoordLoc, 2, gl.FLOAT, false, 0, 0);

      const idLoc = gl.getAttribLocation(program, "id");
      gl.bindBuffer(gl.ARRAY_BUFFER, idBuffer)
      gl.enableVertexAttribArray(idLoc)
      gl.vertexAttribPointer(idLoc, 1, gl.FLOAT, false, 0, 0)
      et.vertexAttribDivisorANGLE(idLoc, 1);

      
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, includeBuffer)
    },
    numVertexs: plane.includes.length,
    et,
  };
};

const bindUniform = (gl: WebGLRenderingContext, program: WebGLProgram) => {
  const timeLoc = gl.getUniformLocation(program, 'time');
  
  return (time: number) => {
    gl.uniform1f(timeLoc, time)
  }
};

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl")!;
  const program = createProgramBySource(gl, vertSource, fragSource);
  gl.viewport(0, 0, canvas.height, canvas.height);
  gl.useProgram(program)

  const numCount = 25000
  const { useAttrib, numVertexs, et } = bindAttri(gl, numCount, program)
  const useUniform = bindUniform(gl, program)

  const redraw = (time: number) => {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    useAttrib()
    useUniform(time)
    et.drawElementsInstancedANGLE(gl.TRIANGLES, numVertexs, gl.UNSIGNED_SHORT, 0, numCount)
  }

  startAnimation((time) => {
    redraw(time * 0.0001)
  })
}
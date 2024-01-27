import { NumArr, createProgramBySource, createSphereVertices, generateTexture, identity, multiply, rotateX, rotateY, rotateZ, scale, startAnimation, straightPerspective1, translate } from "../../util";
import { inverse, lookAt } from "../matrix4";
import { edgToRad } from "../util";
import fragSource from "./shader-fragment.frag?raw";
import vertSource from "./shader-vertex.vert?raw";

const bindAttri = (gl: WebGLRenderingContext, program: WebGLProgram) => {
  const sphere = createSphereVertices(1, 8, 8)

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData( gl.ARRAY_BUFFER, sphere.positions, gl.STATIC_DRAW );

  const includeBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, includeBuffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphere.includes, gl.STATIC_DRAW)

  return {
    useAttrib: () => {
      const positionLoc = gl.getAttribLocation(program, "position");
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
      
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, includeBuffer)
    },
    numVertexs: sphere.includes.length
  };
};

const bindUniform = (gl: WebGLRenderingContext, program: WebGLProgram) => {
  const matrixLoc = gl.getUniformLocation(program, 'matrix');
  
  return (worldMatrix: NumArr) => {
    gl.uniformMatrix4fv(matrixLoc, false, worldMatrix)
  }
};

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl")!;
  const program = createProgramBySource(gl, vertSource, fragSource);
  gl.viewport(0, 0, canvas.width, canvas.height);

  gl.useProgram(program)
  gl.enable(gl.DEPTH_TEST)
  const { useAttrib, numVertexs } = bindAttri(gl, program)
  const useUniform = bindUniform(gl, program)
  const projectionMatrix = straightPerspective1(edgToRad(60), canvas.width / canvas.height, 1, 2000);

  const redraw = (worldMatrix: NumArr) => {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    useAttrib()
    useUniform(multiply(projectionMatrix, worldMatrix))
    gl.drawElements(gl.TRIANGLES, numVertexs, gl.UNSIGNED_SHORT, 0)
  }


  startAnimation((time) => {
    redraw(multiply(
      translate(
        Math.sin(time / 1200),
        Math.sin(time / 1300),
        Math.sin(time / 1400) - 1.8,
      ),
      rotateX(time / 1000),
      rotateY(time / 1100),
      // scale(0.5, 0.5, 0.5)
    ))
  })
}
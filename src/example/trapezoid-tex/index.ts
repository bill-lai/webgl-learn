import { NumArr, createProgramBySource, generateTexture, identity, rotateZ, startAnimation, straightPerspective1 } from "../../util";
import { inverse, lookAt } from "../matrix4";
import { edgToRad } from "../util";
import fragSource from "./shader-fragment.frag?raw";
import vertSource from "./shader-vertex.vert?raw";

const bindAttri = (gl: WebGLRenderingContext, program: WebGLProgram) => {
  const positions = new Float32Array([
    -1.5, -0.5, 0.5, 
    1.5, -0.5, 0.5,
    -0.5, 0.5, 0.5, 
    -0.5, 0.5, 0.5, 
    1.5, -0.5, 0.5, 
    0.5, 0.5, 0.5
  ])
  const texcoords = new Float32Array([
    0,  0,  
    1,  0,
    0,  1,

    0,  1,
    1,  0,
    1,  1,
  ])

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData( gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW );

  const texcoordBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  gl.bufferData( gl.ARRAY_BUFFER, texcoords, gl.STATIC_DRAW );

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
    },
    numVertexs: positions.length / 3
  };
};

const bindUniform = (gl: WebGLRenderingContext, program: WebGLProgram) => {
  const texImage = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texImage)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 4, 4, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, new Uint8Array([
    0xC0, 0x80, 0xC0, 0x80,
    0x80, 0xC0, 0x80, 0xC0,
    0xC0, 0x80, 0xC0, 0x80,
    0x80, 0xC0, 0x80, 0xC0,
  ]))
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

  const prejectionMatrixLoc = gl.getUniformLocation(program, 'prejectionMatrix');
  const viewMatrixLoc = gl.getUniformLocation(program, 'viewMatrix');
  const worldMatrixLoc = gl.getUniformLocation(program, 'worldMatrix');

  gl.uniformMatrix4fv(prejectionMatrixLoc, false, straightPerspective1(edgToRad(60), gl.canvas.width / gl.canvas.height, 1, 2000))
  gl.uniformMatrix4fv(viewMatrixLoc, false, inverse(lookAt([0, 0, 4], [0, 0, 0], [0, 1, 0])))

  return (worldMatrix: NumArr) => {
    gl.uniformMatrix4fv(worldMatrixLoc, false, worldMatrix)
  }
};

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl")!;
  const program = createProgramBySource(gl, vertSource, fragSource);
  gl.viewport(0, 0, canvas.width, canvas.height);

  gl.useProgram(program)
  const { useAttrib, numVertexs } = bindAttri(gl, program)
  const useUniform = bindUniform(gl, program)

  const redraw = (worldMatrix: NumArr) => {
    gl.clear(gl.COLOR_BUFFER_BIT)
    useAttrib()
    useUniform(worldMatrix)
    gl.drawArrays(gl.TRIANGLES, 0, numVertexs)
  }

  redraw(identity())
  // startAnimation((time) => {
  //   redraw(rotateZ(time * 0.001))
  // })
}
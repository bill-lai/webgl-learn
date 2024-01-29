import vertSource from "./vertex-shader.vert?raw";
import fragSource from "./fragment-shader.frag?raw";
import { createProgramBySource, loadImage } from "../util";
import imageURI from './v38pV.jpeg'
import { isTwoPower, startAnimation } from "../../util";

const bindAttri = (gl: WebGLRenderingContext, program: WebGLProgram) => {
  const positions = new Float32Array([
    -1, 1, -1,
    1, 1, -1,
    -1, -1, -1,
    -1, -1, -1,
    1, 1, -1,
    1, -1, -1
  ])

  const numVertexs = positions.length / 3
  const positionLoc = gl.getAttribLocation(program, "position");
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData( gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW );

  return {
    useAttrib: () => {
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
    },
    numVertexs
  };
};


const bindUniform = (
  gl: WebGLRenderingContext,
  program: WebGLProgram,
) => {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.LUMINANCE,
    1,
    1,
    0,
    gl.LUMINANCE,
    gl.UNSIGNED_BYTE,
    new Uint8Array([256])
  );
  gl.generateMipmap(gl.TEXTURE_2D)

  loadImage(imageURI)
    .then(image => {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
      if (isTwoPower(image.width) && isTwoPower(image.height)) {
        gl.generateMipmap(gl.TEXTURE_2D)
      } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
      }
    })

  const timeLoc = gl.getUniformLocation(program, 'time')

  return (time: number) => {
    gl.uniform1f(timeLoc, time)
  }
};

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl")!;
  const program = createProgramBySource(gl, vertSource, fragSource);

  gl.useProgram(program);
  gl.viewport(0, 0, canvas.width, canvas.height);

  const { useAttrib, numVertexs } = bindAttri(gl, program);
  const useUniform = bindUniform(gl, program)
  
  const redraw = (time: number) => {
    gl.clear(gl.COLOR_BUFFER_BIT)
    useAttrib()
    useUniform(time)
    gl.drawArrays(gl.TRIANGLES, 0, numVertexs)
  }

  return startAnimation(time => {
    redraw(time * 0.001)
  })
};

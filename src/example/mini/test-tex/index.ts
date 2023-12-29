import { createProgramBySource } from '../../util'
import fragSource from './fragment-shader.frag?raw'
import vertSource from './vertex-shader.vert?raw'

export const testTex = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext('webgl')!
  const program = createProgramBySource(gl, vertSource, fragSource)
  
  gl.useProgram(program);

  const pixels = new Uint8Array([
    0xFF, 0x00, 0x00, 0xFF,  // 红
    0x00, 0xFF, 0x00, 0xFF,  // 绿
    0x00, 0x00, 0xFF, 0xFF,  // 蓝
    0xFF, 0x00, 0xFF, 0xFF,  // 品红
  ]);
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)

  const positionIndex = gl.getAttribLocation(program, 'a_position')

  const count = 5
  for (let i = 0; i < count; i++) {
    const u = i / (count - 1);
    const clipu = u * 1.6 - 0.8;
    gl.vertexAttrib2f(positionIndex, clipu, clipu)
    gl.drawArrays(gl.POINTS, 0, 1);
  }
}
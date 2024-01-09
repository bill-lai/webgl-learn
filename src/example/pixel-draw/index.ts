import vertSource from './vertex-shader.vert?raw'
import fragSource from './fragment-shader.frag?raw'
import { bufferPush, createProgramBySource, startAnimation } from '../../util'

const bindAttrib = (gl: WebGLRenderingContext, program: WebGLProgram) => {
  const positionLoc = gl.getAttribLocation(program, 'position')
  const data = new Float32Array([
    1,  1,  
    -1,  1,  
    -1, -1,  
    1,  1,  
    -1, -1,  
    1, -1, 
  ])
  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)

  return {
    useAttrib: () => {
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
      gl.enableVertexAttribArray(positionLoc)
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0)
    },
    numVertexs: data.length / 2
  }
}

const bindUniform = (gl: WebGLRenderingContext, program: WebGLProgram) => {
  const pixelIndexLoc = gl.getUniformLocation(program, 'pixelIndex')
  const pixelColorLoc = gl.getUniformLocation(program, 'pixelColor')

  const pixelIndexData = new Uint8Array([
    0,0,1,1,1,1,0,0,
    0,1,0,0,0,0,1,0,
    1,0,0,0,0,0,0,1,
    1,0,2,0,0,2,0,1,
    1,0,0,0,0,0,0,1,
    1,0,3,3,3,3,0,1,
    0,1,0,0,0,0,1,0,
    0,0,1,1,1,1,0,0,
  ])
  const pixelIndexTex = gl.createTexture()
  const indexWidth = 8
  const indexHeight = 8
  gl.bindTexture(gl.TEXTURE_2D, pixelIndexTex)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA, indexWidth, indexHeight, 0, gl.ALPHA, gl.UNSIGNED_BYTE, pixelIndexData)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

  
  const pixelColorData = new Uint8Array(256 * 4)
  bufferPush(pixelColorData, 0, [
    255, 255, 255, 255,
    255, 0, 0, 255,
    0, 255, 0, 255,
    0, 0, 255, 255,
  ])
  const pixelColorTex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, pixelColorTex)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixelColorData)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

  return {
    useUniform: () => {
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, pixelIndexTex)
      gl.uniform1i(pixelIndexLoc, 0)

      gl.activeTexture(gl.TEXTURE0 + 1)
      gl.bindTexture(gl.TEXTURE_2D, pixelColorTex)
      gl.uniform1i(pixelColorLoc, 1)
    },
    animation(callback: () => void) {
      let then = 0
      return startAnimation((now) => {
        const diffMis = (now - then) * 0.001
        if (diffMis < 0.05) return;
        then = now

        for (let y = 0; y < indexHeight; y++) {
          const start = y * indexWidth
          const temp = pixelIndexData[start]
          for (let x = 0; x < indexWidth - 1; x++) {
            pixelIndexData[start + x] = pixelIndexData[start + x + 1]
          }
          pixelIndexData[start + indexWidth - 1] = temp;
        }
        gl.bindTexture(gl.TEXTURE_2D, pixelIndexTex)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA, indexWidth, indexHeight, 0, gl.ALPHA, gl.UNSIGNED_BYTE, pixelIndexData)


        for (let i = 0; i < 3; i++) {
          const repNdx = (i + 1) % 3 + 1
          const ndx = i + 1
          const currentColor = pixelColorData.slice(ndx * 4, (ndx + 1) * 4)
          const replaceColor = pixelColorData.slice(repNdx * 4, (repNdx + 1) * 4)

          bufferPush(pixelColorData, ndx, replaceColor)
          bufferPush(pixelColorData, repNdx, currentColor)
        }
        gl.bindTexture(gl.TEXTURE_2D, pixelColorTex)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixelColorData)

        callback()
      })
    }
  }
}

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext('webgl')!
  const program = createProgramBySource(gl, vertSource, fragSource)

  gl.useProgram(program)
  gl.viewport(0, 0, canvas.width, canvas.height)

  const { useAttrib, numVertexs } = bindAttrib(gl, program)
  const { useUniform, animation } = bindUniform(gl, program)


  const redraw = () => {
    gl.clear(gl.COLOR_BUFFER_BIT)
    useAttrib()
    useUniform()
    gl.drawArrays(gl.TRIANGLES, 0, numVertexs)
  }
  redraw()
  // animation(redraw)
}
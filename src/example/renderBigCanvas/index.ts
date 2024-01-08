import vertSource from './vertex-shader.vert?raw'
import fragSource from './fragment-shader.frag?raw'
import { NumArr, ShapeAttrib, createCube, createProgramBySource, frustum, inverse, isTwoPower, multiply, orthographic, rotateX, rotateZ, scale, startAnimation, straightPerspective1 } from '../../util'
import { edgToRad } from '../util'
import texUrl from './f-texture.png'
import { identity, lookAt, rotateY } from '../matrix4'
import { setAppendComponent } from '../../append'
import Show from './show.vue'
import { reactive } from 'vue'

const bindAttrib = (
  gl: WebGLRenderingContext, 
  program: WebGLProgram, 
  attrib: Pick<ShapeAttrib, 'texcoords' | 'positions' | 'includes'>
) => {
  const positionLoc = gl.getAttribLocation(program, 'position')  
  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, attrib.positions, gl.STATIC_DRAW)


  const texcoordLoc = gl.getAttribLocation(program, 'texcoord')
  const texcoordBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, attrib.texcoords!, gl.STATIC_DRAW)

  const includeBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, includeBuffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, attrib.includes, gl.STATIC_DRAW)

  return () => {
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.enableVertexAttribArray(positionLoc)
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0)

    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer)
    gl.enableVertexAttribArray(texcoordLoc)
    gl.vertexAttribPointer(texcoordLoc, 2, gl.FLOAT, false, 0, 0)
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, includeBuffer)

    gl.drawElements(gl.TRIANGLES, attrib.includes.length, gl.UNSIGNED_SHORT, 0);
  }
}
const createTexture = (gl: WebGLRenderingContext, url: string) => {
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 0, 255]))

  const image = new Image()
  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)

    if (isTwoPower(image.width) && isTwoPower(image.height)) {
      gl.generateMipmap(gl.TEXTURE_2D)
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    }
  }
  image.src = url

  return texture
}


const bindUniform = (gl: WebGLRenderingContext, program: WebGLProgram) => {
  const projectionMatrixLoc = gl.getUniformLocation(program, 'projectionMatrix')
  const viewMatrixLoc = gl.getUniformLocation(program, 'viewMatrix')
  const worldMatrixLoc = gl.getUniformLocation(program, 'worldMatrix')

  return (projectionMatrix: NumArr, viewMatrix: NumArr, worldMatrix: NumArr, texture: WebGLTexture | null) => {
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.uniformMatrix4fv(projectionMatrixLoc, false, projectionMatrix)
    gl.uniformMatrix4fv(viewMatrixLoc, false, viewMatrix)
    gl.uniformMatrix4fv(worldMatrixLoc, false, worldMatrix)
  }
}

export const init = (canvas: HTMLCanvasElement) => {

  const width = 2000
  const height = 2000
  const partWidth = 500
  const partHeight = 500

  const props: {imageRows: string[][]} = reactive({ imageRows: [], width, height })
  setAppendComponent(Show, props)

  canvas.width = partWidth
  canvas.height = partHeight

  const gl = canvas.getContext('webgl')!
  const program = createProgramBySource(gl, vertSource, fragSource)

  gl.useProgram(program)
  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.CULL_FACE)
  
  const useCubeAttrib = bindAttrib(gl, program, createCube(1))
  const useUniform = bindUniform(gl, program)
  const imageTexture = createTexture(gl, texUrl)

  const fov = edgToRad(60)
  const aspect = width / height
  const near = 1;
  const far = 2000;
  const viewProjectionMatrix = inverse(lookAt([0, 0, 3], [0, 0, 0], [0, 1, 0]))

  const redrawPart = (box: number[]) => {
    gl.clearColor(0, 0, 0.2, 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    useUniform(
      frustum(box[0], box[2], box[1], box[3], near, far),
      viewProjectionMatrix,
      worldMatrix, 
      imageTexture
    )
    useCubeAttrib()
  }

  const redraw = () => {
    const nearTop = Math.tan(fov) * 0.5 * near
    const nearBottom = -nearTop
    const nearLeft = aspect * nearBottom
    const nearRight = aspect * nearTop
    const nearWidth = nearRight - nearLeft
    const nearHeight = nearTop - nearBottom

    const imageRows: string[][] = []
    for (let y = 0; y < height; y += partHeight) {
      const row: string[] = []
      for (let x = 0; x < width; x += partWidth) {
        const partBound = [
          nearLeft + x / width * nearWidth,
          nearBottom + y / height * nearHeight,
          nearLeft + (x + partWidth) / width * nearWidth,
          nearBottom + (y + partHeight) / height * nearHeight,
        ]
        gl.viewport(0, 0, partWidth, partHeight)
        redrawPart(partBound)

        row.push(canvas.toDataURL())
      }
      imageRows.push(row)
    }
    props.imageRows = imageRows.reverse()
  }

  let worldMatrix: NumArr = identity()
  const stop = startAnimation(now => {
    const angle = now * 0.001 * edgToRad(30)
    worldMatrix = multiply(
      rotateY(angle),
      rotateZ(angle)
    )
    redraw()
  })
  setTimeout(stop, 1000)
}
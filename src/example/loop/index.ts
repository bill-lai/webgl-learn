import vertSource from './vertex-shader.vert?raw'
import fragSource from './fragment-shader.frag?raw'
import { NumArr, ShapeAttrib, createCube, createPlaneVertices, createProgramBySource, inverse, isTwoPower, multiply, orthographic, rotateX, rotateZ, scale, startAnimation, straightPerspective1 } from '../../util'
import { edgToRad } from '../util'
import texUrl from './f-texture.png'
import { identity, lookAt, rotateY } from '../matrix4'

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

const createFrameBuffer = (gl: WebGLRenderingContext, w: number, h: number) => {
  const fb = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb)

  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)

  return {
    texture,
    use() {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
      gl.viewport(0, 0, w, h)
    }
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
  const gl = canvas.getContext('webgl')!
  const program = createProgramBySource(gl, vertSource, fragSource)

  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.useProgram(program)
  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.CULL_FACE)
  

  const useCubeAttrib = bindAttrib(gl, program, createCube(1))
  const usePlaneAttrib = bindAttrib(gl, program, createPlaneVertices(1, 1))
  const useUniform = bindUniform(gl, program)

  const width = 600
  const height = 600
  const cubeFb = createFrameBuffer(gl, width, height)
  const planeFb = createFrameBuffer(gl, width, height)

  const imageTexture = createTexture(gl, texUrl)

  // 绘画立方体的贴图
  const redrawPlaneFb = () => {
    // 绘画外框
    planeFb.use()
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    const projectionMatrix = orthographic(-width / 2, width / 2, -height / 2, height / 2, 1, -1);
    const viewMatrix = identity()
    const worldMatrix = multiply(scale(width, height, 1), rotateX(edgToRad(90)))

    useUniform(projectionMatrix, viewMatrix, worldMatrix, imageTexture)
    usePlaneAttrib()

    // 将上次cube贴图绘画到内部， 这样就形成循环
    useUniform(
      projectionMatrix, 
      viewMatrix, 
      multiply(scale(0.9, 0.9, 1), worldMatrix),
      cubeFb.texture
    )
    usePlaneAttrib()
  }

  // 将循环图作为贴图
  const redrawCubeFb = (worldMatrix: NumArr) => {
    cubeFb.use()
    // gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    useUniform(
      straightPerspective1(edgToRad(60), width / height, 1, 2000),
      inverse(lookAt([0, 0, 2], [0, 0, 0], [0, 1, 0])),
      worldMatrix, 
      planeFb.texture
    )
    useCubeAttrib()
  }


  let worldMatrix: NumArr = identity()
  const redraw = () => {
    redrawPlaneFb()
    redrawCubeFb(worldMatrix)

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    useUniform(
      straightPerspective1(edgToRad(60), canvas.width / canvas.height, 1, 2000),
      inverse(lookAt([0, 0, 2], [0, 0, 0], [0, 1, 0])),
      multiply(rotateX(edgToRad(90))), 
      cubeFb.texture
    )
    usePlaneAttrib()
  }

  startAnimation(now => {
    const angle = now * 0.001 * edgToRad(30)
    worldMatrix = multiply(
      rotateY(angle),
      rotateZ(angle)
    )
    redraw()
  })
}
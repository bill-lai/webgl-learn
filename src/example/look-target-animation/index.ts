import vertSource from './vertex-shader.vert?raw'
import fragSource from './fragment-shader.frag?raw'
import { createProgramBySource, edgToRad, rand } from '../util';
import { createCone, createCube } from '../spheres';
import { NumArr, createPlaneVertices, createSphereVertices, easeInOut, inverse, learV3, lerp, rotateX, scale, startAnimation, straightPerspective1, translate, transpose } from '../../util';
import { hsv } from 'chroma-js';
import { identity, lookAt, multiply, rotateZ } from '../matrix4';


const bindAttri = (gl: WebGLRenderingContext, program: WebGLProgram) => {
  const attribs = [
    createPlaneVertices(1),
    createCube(1),
    createSphereVertices(1, 48, 24),
    createCone(0.5, 0, 1, 24, 12)
  ]
  const positionLoc = gl.getAttribLocation(program, 'position')
  const normalLoc = gl.getAttribLocation(program, 'normal')
  const texcoordLoc = gl.getAttribLocation(program, 'texcoord')

  const buffers = attribs.map(attrib => {
    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, attrib.positions, gl.STATIC_DRAW)

    const normalBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, attrib.normals!, gl.STATIC_DRAW)

    const texcoordBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, attrib.texCoords!, gl.STATIC_DRAW)

    const includeBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, includeBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, attrib.includes!, gl.STATIC_DRAW)
    
    return {
      positionBuffer,
      normalBuffer,
      includeBuffer,
      texcoordBuffer
    }
  })

  const useAttrib = (index: number) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers[index].positionBuffer)
    gl.enableVertexAttribArray(positionLoc)
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers[index].normalBuffer)
    gl.enableVertexAttribArray(normalLoc)
    gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers[index].texcoordBuffer)
    gl.enableVertexAttribArray(texcoordLoc)
    gl.vertexAttribPointer(texcoordLoc, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers[index].includeBuffer)

    return attribs[index].includes!.length
  }

  return {useAttrib, numAttrib: attribs.length}
}

type UniformConfig = {
  mutColor: number[],
  shininess: number,
  specular: number[],
  specularFactor: number,
  cameraMatrix: NumArr,
  worldMatrix: NumArr,
}
const bindUniform = (gl: WebGLRenderingContext, program: WebGLProgram, filedToView: number) => {
  const textureLoc = gl.getUniformLocation(program, 'texture')
  const mutColorLoc = gl.getUniformLocation(program, 'mutColor')
  const shininessLoc = gl.getUniformLocation(program, 'shininess')
  const specularLoc = gl.getUniformLocation(program, 'specular')
  const specularFactorLoc = gl.getUniformLocation(program, 'specularFactor')
  const projectionMatrixLoc = gl.getUniformLocation(program, 'projectionMatrix')
  const viewMatrixLoc = gl.getUniformLocation(program, 'viewMatrix')
  const worldMatrixLoc = gl.getUniformLocation(program, 'worldMatrix')
  const normalMatrixLoc = gl.getUniformLocation(program, 'normalMatrix')
  const lightPositionLoc = gl.getUniformLocation(program, 'lightPosition')
  const lightColorLoc = gl.getUniformLocation(program, 'lightColor')
  const cameraPositionLoc = gl.getUniformLocation(program, 'cameraPosition')


  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([
    255,255,255,255,
    192,192,192,255,
    192,192,192,255,
    255,255,255,255]));
    
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  gl.uniform1i(textureLoc, 0)
  gl.uniformMatrix4fv(projectionMatrixLoc, false, straightPerspective1(filedToView, gl.canvas.width / gl.canvas.height, 1, 200));
  gl.uniform3fv(lightPositionLoc, [1, 8, -10])
  gl.uniform4fv(lightColorLoc, [1, 1, 1, 1])
  
  return (config: UniformConfig) => {
    gl.uniform4fv(mutColorLoc, config.mutColor)
    gl.uniform1f(shininessLoc, config.shininess)
    gl.uniform4fv(specularLoc, config.specular)
    gl.uniform1f(specularFactorLoc, config.specularFactor)
    gl.uniformMatrix4fv(viewMatrixLoc, false, inverse(config.cameraMatrix))
    gl.uniformMatrix4fv(normalMatrixLoc, false, transpose(inverse(config.worldMatrix)))
    gl.uniformMatrix4fv(worldMatrixLoc, false, config.worldMatrix)
    gl.uniform3fv(cameraPositionLoc, config.cameraMatrix.slice(12, 15))
  }
}

const getMeshConfig = (numAttrib: number) => {
  const baseHue = rand(360);
  const scale = rand(1, 5)
  const offset = 20
  return {
    index: rand(numAttrib) | 0,
    mutColor: hsv((baseHue + rand(60)) % 360, 0.4, 0.8).gl(),
    shininess: 50,
    specular: [1, 1, 1, 1],
    specularFactor: 1,
    scale: scale,
    xSpeed: rand(0.2, 0.7),
    zSpeed: rand(0.2, 0.7),
    translation: [rand(-offset, offset), rand(-offset, offset), rand(-offset, offset)] as [number, number, number],
    size: 2
  }
}


export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext('webgl')!
  const program = createProgramBySource(gl, vertSource, fragSource);

  gl.useProgram(program)
  gl.enable(gl.DEPTH_TEST)
  gl.viewport(0, 0, canvas.width, canvas.height)
  
  const filedToView = edgToRad(60)
  const { useAttrib, numAttrib } = bindAttri(gl, program)
  const useUniform = bindUniform(gl, program, filedToView)
  const configs = new Array(40).fill(0).map(() => ({
    ...getMeshConfig(numAttrib),
    worldMatrix: identity() as NumArr
  }))

  const redraw = () => {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    configs.forEach(config => {
      const numVertex = useAttrib(config.index)
      useUniform({ ...config, cameraMatrix })
      gl.drawElements(gl.TRIANGLES, numVertex, gl.UNSIGNED_SHORT, 0)
    })
  }

  const getLookDataByIndex = (index: number) => {
    const target = configs[index].translation as number[]
    const size = configs[index].size * configs[index].scale * 1.4 * 0.5;
    const disance = size / Math.tan(filedToView / 2)
    const position = [target[0], target[1], target[2] + disance] as number[]
    return { position, target }
  }

  // 3秒切换
  let changeTime = 4, animationTime = 2;
  let lookIndex = 0
  let oldPosition: number[], oldTarget: number[]
  let { 
    position: nowPosition, 
    target: nowTarget 
  } = getLookDataByIndex(lookIndex)
  let cameraMatrix: NumArr = lookAt(nowPosition, nowTarget, [0, 1, 0])

  let then = -animationTime;
  const updateLookIndex = (now: number) => {
    const diffMis = now - then
    if (diffMis >= changeTime) {
      const lookData = getLookDataByIndex(++lookIndex % configs.length)
      oldPosition = nowPosition
      oldTarget = nowTarget
      nowPosition = lookData.position
      nowTarget = lookData.target
      then = now;
    } else if (diffMis < animationTime) {
      const t = easeInOut(Math.min(1, diffMis / animationTime), 0, 1)
      cameraMatrix = lookAt(
        learV3(oldPosition, nowPosition, t), 
        learV3(oldTarget, nowTarget, t), 
        [0, 1, 0]
      )
    }
  }


  startAnimation((now) => {
    now *= 0.001;
    configs.forEach(item => {
      item.worldMatrix = multiply(
        translate(...item.translation),
        rotateZ(now * item.zSpeed),
        rotateX(now * item.xSpeed),
        scale(item.scale, item.scale, item.scale)
      )
    })
    updateLookIndex(now)
    redraw()
  })

}
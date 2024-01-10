
import { NumArr, bindFPSCamera, bindKeyboard, bufferPush, canvasBindMouse, createPlaneVertices, createProgramBySource, edgToRad, identity, multiply, orthographic, rotateX, scale, translate } from '../../util'
import fragSource from './fragment-shader.frag?raw'
import { getTile, getTilesData, tileSize } from './tileManage'
import vertSource from './vertex-shader.vert?raw'


const bindAttrib = (gl: WebGLRenderingContext, program: WebGLProgram) => {
  const plan = createPlaneVertices(1, 1)
  const positionLoc = gl.getAttribLocation(program, 'position')
  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, plan.positions, gl.STATIC_DRAW)

  const texcoordLoc = gl.getAttribLocation(program, 'texcoord')
  const texcoordBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, plan.texcoords, gl.STATIC_DRAW)

  const includeBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, includeBuffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, plan.includes, gl.STATIC_DRAW)

  return {
    numVertexs: plan.includes.length,
    useAttrib() {
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
      gl.enableVertexAttribArray(positionLoc)
      gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0)

      gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer)
      gl.enableVertexAttribArray(texcoordLoc)
      gl.vertexAttribPointer(texcoordLoc, 2, gl.FLOAT, false, 0, 0)

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, includeBuffer)
    }
  }
}

const bindTileTexture = (gl: WebGLRenderingContext, w: number, h: number) => {
  const data = new Uint32Array(w * h).fill(0xFFF7F7F7)
  const data8 = new Uint8Array(data.buffer)
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  
  const updateData = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data8)
  }
  updateData()

  const num = [
    Math.ceil(w / tileSize[0]),
    Math.ceil(h / tileSize[1]),
  ];

  const updateTile = (nx: number, ny: number, tileData: Uint8Array) => {
    const offset = [
      Math.ceil(nx / num[0] * w),
      Math.ceil(ny / num[1] * h),
    ]
    for (let x = 0; x < tileSize[0]; x++) {
      for (let y = 0; y < tileSize[1]; y++) {
        const index = (offset[1] + y) * w + offset[0] + x
        const tileIndex = y * tileSize[0] + x
        const value = tileData.slice(tileIndex * 4, (tileIndex + 1) * 4)
        bufferPush(data8, index, value)
      }
    }
    updateData()
  }

  const updateMap = (center: [number, number], leave: number, redraw: () => void) => {
    const tilesData = getTilesData(leave, center, [w, h])
    let needRedraw = false
    for (let i = 0; i < tilesData.length; i++) {
      const item = getTile(tilesData[i])
      if (item.type === 0) {
        item.data.then(data => {
          updateTile(tilesData[i].nx, tilesData[i].ny, data)
          redraw()
        })
      } else {
        updateTile(tilesData[i].nx, tilesData[i].ny, item.data)
        redraw()
        needRedraw = true
      }
    }
    needRedraw && redraw
  }
  
  return {
    texture,
    updateMap
  }
}

const bindUniform = (gl: WebGLRenderingContext, program: WebGLProgram) => {
  const w = gl.canvas.width, h = gl.canvas.height;
  const projectionMatrixLoc = gl.getUniformLocation(program, 'projectionMatrix')
  const worldMatrixLoc = gl.getUniformLocation(program, 'worldMatrix')
  const mapTexLoc = gl.getUniformLocation(program, 'mapTex')
  const texMatrixLoc = gl.getUniformLocation(program, 'texMatrix')
  
  const projectionMatrix = orthographic(-w / 2, w / 2, h / 2, -h / 2, -1, 1)
  const initWorldMatrix = multiply(
    scale(w, h, 1),
    rotateX(-edgToRad(90)), 
  )
  const texW = Math.ceil(w / tileSize[0]) * tileSize[0]
  const texH = Math.ceil(h / tileSize[1]) * tileSize[1]

  const { updateMap } = bindTileTexture(gl, texW, texH)

  const texMatrix = multiply(
    scale(1 / texW, 1 / texH, 1),
    scale(w / texW, h / texH, 1),
    translate((texW - w) / 2, (texH - h) / 2, 0),
    scale(texW, texH, 1),
  ) 
    
  gl.uniform1i(mapTexLoc, 0)
  gl.uniformMatrix4fv(projectionMatrixLoc, false, projectionMatrix)
  gl.uniformMatrix4fv(texMatrixLoc, false, texMatrix)

  return {
    useUniform: (worldMatrix: NumArr) => {
      gl.uniformMatrix4fv(worldMatrixLoc, false, multiply(worldMatrix, initWorldMatrix))
    },
    updateMap
  }
}

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext('webgl')!
  const program = createProgramBySource(gl, vertSource, fragSource);

  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.useProgram(program)

  const { numVertexs, useAttrib } = bindAttrib(gl, program)
  const { useUniform, updateMap } = bindUniform(gl, program)


  let worldMatrix: NumArr = identity()
  const redraw = () => {
    gl.clear(gl.COLOR_BUFFER_BIT)
    useAttrib()
    useUniform(worldMatrix)
    gl.drawElements(gl.TRIANGLES, numVertexs, gl.UNSIGNED_SHORT, 0)
  }
  // redraw()
  let coord: [number, number] = [0, 0];
  let level = 10
  bindKeyboard(document.documentElement, 'wsadqr', (keys) => {
    if (keys.includes('w')) {
      coord[1] += 1
    } else if (keys.includes('s')) {
      coord[1] -= 1
    } else if (keys.includes('a')) {
      coord[0] += 1
    } else if (keys.includes('d')) {
      coord[0] -= 1
    } else if (keys.includes('q')) {
      level = level + 1 > 10 ? 10 : level + 1
    } else if (keys.includes('r')) {
      level = level - 1 < 3 ? 3 : level - 1
    }
    updateMap(coord, level, redraw)
  })
  updateMap(coord, level, redraw)
}
import { NumArr, bufferPush, createPlaneVertices, createProgramBySource, identity, multiply, orthographic, rotateY, rotateZ, scale, startAnimation, translate } from '../../util'
import { rotateX } from '../matrix4';
import { edgToRad, rand } from '../util';
import fragSource from './fragment-shader.frag?raw'
import vertSource from './vertex-shader.vert?raw'

const generateTiles = (tileWidth: number, tileHeight: number, tilesAcross: number, tilesDown: number) => {
  const ctx = document.createElement('canvas').getContext('2d')!;
  ctx.canvas.width = tileWidth * tilesAcross;
  ctx.canvas.height = tileHeight * tilesDown;
  
  ctx.font = `bold ${0.75 * tileWidth}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const f = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ~';
  for (let y = 0; y < tilesDown; ++y) {
    for (let x = 0; x < tilesAcross; ++x) {
      const color = `hsl(${rand(360) | 0},${rand(50,100)}%,50%)`;
      ctx.fillStyle = color;
      const tx = x * tileWidth;
      const ty = y * tileHeight;
      ctx.fillRect(tx, ty, tileWidth, tileHeight);
      ctx.fillStyle = "#FFF";
      ctx.fillText(f.substr(y * 8 + x, 1), tx + tileWidth * .5, ty + tileHeight * .5); 
    }
  }

  return ctx.canvas;
}

const getTileData = () => {
  const tileConfig = {
    simpleSize: [32, 32] as const,
    num: [8, 4] as const
  }
  const tileSize = tileConfig.simpleSize.map((s, ndx) => s * tileConfig.num[ndx]);
  const tileImage = generateTiles(...tileConfig.simpleSize, ...tileConfig.num)

  const tilemapSize = [40, 40] as const
  const tilemapData = new Uint8Array(tilemapSize[0] * tilemapSize[1] * 4)
  for (let i = 0; i < tileSize[0] * tileSize[1]; i++) {
    // const tileId = rand(10) < 1 
    //     ? (rand(tileConfig.num[0] * tileConfig.num[1]) | 0)
    //     : 9;
    const tileId = rand(tileConfig.num[0] * tileConfig.num[1]) 
    bufferPush(tilemapData, i, [
      tileId % tileConfig.num[0],
      (tileId / tileConfig.num[0]) | 0,
      0,
      (rand(2) | 0 ? 0b1 : 0b0) |
      (rand(2) | 0 ? 0b10 : 0b00) |
      (rand(2) | 0 ? 0b100 : 0b000)
    ])
  }

  return {
    tilemapData,
    tileImage,
    tileSimpleSize: tileConfig.simpleSize,
    tileSize,
    tilemapSize
  }
}

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

const bindUniform = (gl: WebGLRenderingContext, program: WebGLProgram) => {
  const projectionMatrixLoc = gl.getUniformLocation(program, 'projectionMatrix')
  const worldMatrixLoc = gl.getUniformLocation(program, 'worldMatrix')
  const tilemapLoc = gl.getUniformLocation(program, 'tilemap')
  const tileLoc = gl.getUniformLocation(program, 'tile')
  const tilemapSizeLoc = gl.getUniformLocation(program, 'tilemapSize')
  const tileSizeLoc = gl.getUniformLocation(program, 'tileSize')
  const tileSimpleSizeLoc = gl.getUniformLocation(program, 'tileSimpleSize')
  
  const tileData = getTileData()

  const tileTex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, tileTex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tileData.tileImage)
  gl.generateMipmap(gl.TEXTURE_2D)

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)


  const tilemapTex = gl.createTexture()
  gl.activeTexture(gl.TEXTURE0 + 1)
  gl.bindTexture(gl.TEXTURE_2D, tilemapTex);
  gl.texImage2D(
    gl.TEXTURE_2D, 
    0, 
    gl.RGBA, 
    tileData.tilemapSize[0], 
    tileData.tilemapSize[1], 
    0, 
    gl.RGBA, 
    gl.UNSIGNED_BYTE, 
    tileData.tilemapData
  )
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)

  const projectionMatrix = orthographic(-gl.canvas.width / 2, gl.canvas.width / 2, gl.canvas.height / 2, -gl.canvas.height / 2, -1, 1)


  return {
    useUniform: (worldMatrix: NumArr) => {
      gl.uniform1i(tilemapLoc, 1)
      gl.uniform1i(tileLoc, 0)
      gl.uniform2fv(tilemapSizeLoc, tileData.tilemapSize)
      gl.uniform2fv(tileSizeLoc, tileData.tileSize)
      gl.uniform2fv(tileSimpleSizeLoc, tileData.tileSimpleSize)
      gl.uniformMatrix4fv(projectionMatrixLoc, false, projectionMatrix)

      gl.uniformMatrix4fv(worldMatrixLoc, false, 
        multiply(
          worldMatrix,
          scale(gl.canvas.height, gl.canvas.height, 1),
          rotateX(-edgToRad(90)), 
        )
      )
    }
  }
}

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext('webgl')!
  const program = createProgramBySource(gl, vertSource, fragSource);

  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.useProgram(program)

  const { numVertexs, useAttrib } = bindAttrib(gl, program)
  const { useUniform } = bindUniform(gl, program)

  let worldMatrix: NumArr = identity()
  const redraw = () => {
    gl.clear(gl.COLOR_BUFFER_BIT)
    useAttrib()
    useUniform(worldMatrix)
    gl.drawElements(gl.TRIANGLES, numVertexs, gl.UNSIGNED_SHORT, 0)
  }


  startAnimation((now) => {
    now = now * 0.001
    const s = 1.7 + (Math.cos(now) + 1) * 4.5;
    const t = 100 + Math.cos(now) * 100;

    worldMatrix = multiply(
      scale(s, s, 1),
      rotateZ(now),
      translate(t, t, 0)
    )
    redraw()
  })
}
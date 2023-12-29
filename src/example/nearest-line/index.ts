import { GLAttrib, GLObject, SceneNode, createProgramBySource, orthographic } from '../../util'
import { createPoints } from './data'
import nearestFragSource from './shader/nearest-line-fragment.frag?raw'
import nearestVertSource from './shader/nearest-line-vertex.vert?raw'
import pointFragSource from './shader/point-fragment.frag?raw'
import pointVertSource from './shader/point-vertex.vert?raw'
import lineFragSource from './shader/line-fragment.frag?raw'
import lineVertSource from './shader/line-vertex.vert?raw'
import nearlineFragSource from './shader/nearline-fragment.frag?raw'
import nearlineVertSource from './shader/nearline-vertex.vert?raw'
import dataFragSource from './shader/data-fragment.frag?raw'
import dataVertSource from './shader/data-vertex.vert?raw'


const clipPositions = new Float32Array([
 -1, -1,
  1, -1,
 -1,  1,
 -1,  1,
  1, -1,
  1,  1,
])

let offset = 1
const createDataTexture = (gl: WebGLRenderingContext, data: any) => {
  const currentOffset = offset++;
  const numComponents = data.length / 4;
  const width = Math.ceil(Math.sqrt(numComponents))
  const height = Math.ceil(numComponents / width)


  const type = data instanceof Uint8Array ? gl.UNSIGNED_BYTE : gl.FLOAT;
  if (!gl.getExtension('OES_texture_float')) {
    throw '当前浏览器不支持float类型的colorBuffer'
  }

  const bin = type === gl.FLOAT
    ? new Float32Array(width * height * 4)
    : new Uint8Array(width * height * 4)
  bin.set(data)

  const texture = gl.createTexture()
  gl.activeTexture(gl.TEXTURE0 + currentOffset)
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, type, bin)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

  return {
    size: [width, height],
    position: currentOffset,
    texture
  }
}

const clipPosition = new Float32Array([
  -1, -1,
   1, -1,
  -1,  1,
  -1,  1,
   1, -1,
   1,  1,
])

const pointsUpdatersFactory  = (gl: WebGLRenderingContext, box: number[], points: Float32Array | number[]) => {
    const program = createProgramBySource(gl, dataVertSource, dataFragSource);
    const fbs = [createFb(gl, points), createFb(gl, points)]
    const object = new GLObject({
      uniforms: {
        u_texSize: fbs[0].texSize,
        u_boxSize: box
      },
      attrib: new GLAttrib(
        { gl, program },
        { positions: clipPosition },
        { positions: { name: 'a_position', size: 2 } }
      ),
      sceneNode: new SceneNode(),
      map: { u_tex: 'uniform1i' }
    })

    let index = 0;
    const updateData = (deltaTime: number) => {
      const nextIndex = (index + 1) % 2;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbs[index].fb);
      gl.viewport(0, 0, fbs[index].texSize[0], fbs[index].texSize[1])
      gl.clear(gl.COLOR_BUFFER_BIT)
      object.uniforms.u_tex = fbs[nextIndex].texPosition
      object.uniforms.u_deltaTime = deltaTime
      object.draw(gl.TRIANGLES)
      
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)

      const fb = fbs[index];
      index = nextIndex;
      return fb.texPosition
    }
    return { updateData, texSize: fbs[index].texSize, texPosition: fbs[index].texPosition };
}

const createFb = (gl: WebGLRenderingContext, data: null | any, size: number[] = [1, 1]) => {
  const fbTexture = createDataTexture(gl, data ? data : new Uint8Array(size[0] * size[1] * 4))
  const fb = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fbTexture.texture, 0)

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return {fb, texPosition: fbTexture.position, texSize: fbTexture.size };
}

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext('webgl')!;
  const nearstProgram = createProgramBySource(gl, nearestVertSource, nearestFragSource);
  const pointProgram = createProgramBySource(gl, pointVertSource, pointFragSource);
  const lineProgram = createProgramBySource(gl, lineVertSource, lineFragSource);
  const nearlineProgram = createProgramBySource(gl, nearlineVertSource, nearlineFragSource);

  const pointIds = new Array(8).fill(0).map((_, i) => i);
  const { 
    updateData: updatePoints, 
    texSize: pointsTexSize,
    texPosition: initPointsTexPosition
  } = pointsUpdatersFactory(
    gl,
    [canvas.width, canvas.height],
    createPoints([canvas.width, canvas.height], [20, 20], pointIds.length)
  )

  const lineIds = new Array(200).fill(0).map((_, i) => i);
  const { 
    updateData: updateLines, 
    texSize: linesTexSize ,
    texPosition: initLinesTexPosition
  } = pointsUpdatersFactory(
    gl,
    [canvas.width, canvas.height],
    createPoints([canvas.width, canvas.height], [20, 20], lineIds.length)
  )

  const nearestObject = new GLObject({
    uniforms: {
      u_pointsTexSize: pointsTexSize,
      u_linesTexSize: linesTexSize
    },
    sceneNode: new SceneNode(),
    attrib: new GLAttrib(
      { gl, program: nearstProgram },
      { positions: clipPositions },
      { positions: { name: 'a_position', size: 2 } }
    ),
    map: { u_pointsTex: 'uniform1i', u_linesTex: 'uniform1i' }
  })

  const { 
    fb: nearLineFB, 
    texPosition: nearLineTexPosition, 
    texSize: nearLineTexSize 
  } = createFb(gl, null, pointsTexSize)

  const object = new GLObject({
    uniforms: {
      u_projectionMatrix: orthographic(0, canvas.width, canvas.height, 0, -1, 1),
      u_pointsTexSize: pointsTexSize,
      u_linesTexSize: linesTexSize,
      u_nearLineTex: nearLineTexPosition,
      u_nearLineSize: nearLineTexSize
    },
    sceneNode: new SceneNode(),
    attrib: new GLAttrib(
      { gl },
      { 
        pids: new Float32Array(pointIds), 
        lids: new Float32Array(lineIds),
        nlids: new Float32Array(pointIds.map(i => [i * 2, i * 2 + 1]).flat()),
      },
      { 
        pids: { name: 'a_pid', size: 1 }, 
        lids: { name: 'a_lid', size: 1 },
        nlids: { name: 'a_nlid', size: 1 },
      }
    ),
    map: { 
      u_pointsTex: 'uniform1i', 
      u_linesTex: 'uniform1i',
      u_nearLineTex: 'uniform1i',
    }
  })

  let pointsTex = initPointsTexPosition
  let linesTex = initLinesTexPosition
  const redraw = () => {
    object.uniforms.u_pointsTex = nearestObject.uniforms.u_pointsTex = pointsTex
    object.uniforms.u_linesTex = nearestObject.uniforms.u_linesTex = linesTex

    gl.bindFramebuffer(gl.FRAMEBUFFER, nearLineFB)
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0, 0, pointsTexSize[0], pointsTexSize[1]);
    nearestObject.draw();
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0, 0, canvas.width, canvas.height);
    object.draw(gl.POINTS, pointProgram, 1, pointIds.length);
    object.draw(gl.LINES, lineProgram, 1, lineIds.length);
    object.draw(gl.LINES, lineProgram, 1, lineIds.length);
    object.draw(gl.LINES, nearlineProgram, 1, pointIds.length * 2);
  }

  let then = 0
  const animation = (time: number = 0) => {
    const deltaTime = (time - then) / 500
    pointsTex = updatePoints(deltaTime)
    linesTex = updateLines(deltaTime)
    redraw()
    then = time;
    requestAnimationFrame(animation)
  }
  animation(0)
}
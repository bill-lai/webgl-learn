import { setAppendComponent } from "../../append";
import { NumArr, ShapeAttrib, createProgramBySource, edgToRad, multiply, rotateX, rotateZ, straightPerspective1 } from "../../util";
import fragSource from "./fragment-shader.frag?raw";
import vertSource from "./vertex-shader.vert?raw";
import Append from './append.vue'
import { getItem } from "./data";
import { ref, watch } from "vue";
import { identity, inverse, lookAt } from "../matrix4";
import { rand } from "../util";

export type BoundInfo = {
  left: number,
  top: number,
  width: number,
  height: number,
  include: boolean,
}

type Attrib = Pick<ShapeAttrib, 'positions' | 'normals' | 'includes'>
const cache = new WeakMap<WebGLProgram, WeakMap<Attrib, () => void>>()
const useItemBufferFactory = (gl: WebGLRenderingContext, program: WebGLProgram, attribs: Attrib) => {
  if (cache.get(program)?.get(attribs)) {
    return cache.get(program)!.get(attribs)!
  }

  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, attribs.positions, gl.STATIC_DRAW)

  const normalBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, attribs.normals, gl.STATIC_DRAW)

  const includeBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, includeBuffer),
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, attribs.includes, gl.STATIC_DRAW)

  const positionLoc = gl.getAttribLocation(program, 'a_position')
  const normalLoc = gl.getAttribLocation(program, 'a_normal')

  const use = () => {
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.enableVertexAttribArray(positionLoc)
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0)

    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
    gl.enableVertexAttribArray(normalLoc)
    gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0)

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, includeBuffer)
  }
  if (!cache.get(program)) {
    cache.set(program, new WeakMap())
  }
  cache.get(program)!.set(attribs, use);
  return use;
}

const count = 1000;
export const init = (canvas: HTMLCanvasElement) => {
  const bounds = ref<BoundInfo[]>()
  setAppendComponent(
    Append, 
    { 
      count, 
      target: canvas, 
      onBoundChange: (d: BoundInfo[]) => bounds.value = d,
      save: () => new Promise<Blob>(
        (resolve, reject) => {
          redraw()
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject('截图失败')
            }
          })
        }
    )
      
    }
  )  

  // 设置浏览器不清除缓存
  // const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true })!;
  const gl = canvas.getContext('webgl')!;
  const program = createProgramBySource(gl, vertSource, fragSource);

  const prejectionMatrixLoc = gl.getUniformLocation(program, 'prejectionMatrix')
  const viewMatrixLoc = gl.getUniformLocation(program, 'viewMatrix')
  const worldMatrixLoc = gl.getUniformLocation(program, 'worldMatrix')

  const itemAttribs = new Array(count).fill(null)
    .map(() => {
      const item = getItem()
      return {
        color: item.color,
        use: useItemBufferFactory(gl, program, item.shpere),
        numElements: item.shpere.includes.length
      }
    })
  const worldMatrixs: NumArr[] = itemAttribs.map(() => identity())

  gl.useProgram(program)
  gl.enable(gl.SCISSOR_TEST)
  gl.enable(gl.DEPTH_TEST)

  gl.uniformMatrix4fv(viewMatrixLoc, false, inverse(lookAt([0, 0, 2], [0, 0, 0], [0, 1, 0])))

  const redraw = () => {
    if (!bounds.value?.length) return;
    bounds.value
      .forEach((bound, ndx) => {
        if (!bound.include) {
          return;
        }
        const itemAttrib = itemAttribs[ndx];
        const worldMatrix = worldMatrixs[ndx]
        const top = canvas.height - bound.top - bound.height
        const box: [number, number, number, number] = [
          bound.left, 
          top, 
          bound.width, 
          bound.height
        ]
        gl.scissor(...box)
        gl.viewport(...box)
        gl.clearColor(...itemAttrib.color)
        gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT)
        // gl.clear(gl.DEPTH_BUFFER_BIT)

        gl.uniformMatrix4fv(
          prejectionMatrixLoc, 
          false, 
          straightPerspective1(edgToRad(60), bound.width / bound.height, 1, 2000)
        )
        gl.uniformMatrix4fv(worldMatrixLoc, false, worldMatrix)
        itemAttrib.use()
        gl.drawElements(gl.TRIANGLES, itemAttrib.numElements, gl.UNSIGNED_SHORT, 0);
      })
  }

  const rotateSpeeds = worldMatrixs.map(() => rand(edgToRad(30)));
  const animation = (now = 0) => {
    const mis = now * 0.001;
    worldMatrixs.forEach((_, ndx) => {
      const angle = mis * (edgToRad(10) + rotateSpeeds[ndx])
      worldMatrixs[ndx] = multiply(
        rotateZ(angle),
        rotateX(angle),
      )
    })
    redraw()
    requestAnimationFrame(animation)
  }

  watch(bounds, redraw, {flush: 'sync'})
  animation(0)
}
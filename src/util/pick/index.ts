import { Ref, computed, ref, watch } from "vue"
import { NumArr, createProgramBySource, frameRender, frustum, getFrustumArgumentsOnMatrix, getRealativeMosePosition } from "../"
import pickFragSource from './fragment-pick-shader.frag?raw'
import pickVertSource from './vertex-pick-shader.vert?raw'

const createWithDepthTextureFb = (gl: WebGLRenderingContext, w: number, h: number) => {
  const fbTexture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, fbTexture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)

  const depthBuffer = gl.createRenderbuffer()
  gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer)
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h)

  const fb = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fbTexture, 0)
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
  
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  return fb;
}

const idToColor = (id: number) => [
  ((id >> 0) & 0xFF) / 0xFF,
  ((id >> 8) & 0xFF) / 0xFF,
  ((id >> 16) & 0xFF) / 0xFF,
  ((id >> 24) & 0xFF) / 0xFF,
]
const colorToId = (color: NumArr) => color[0] + (color[1] << 8) + (color[2] << 16) + (color[2] << 24);

const bindMousePosition = (gl: WebGLRenderingContext) => {
  const mousePosition = ref<number[] | null>(null)
  const canvas = gl.canvas as HTMLCanvasElement
  canvas.addEventListener('mouseleave', ev => {
    mousePosition.value = null
  })
  canvas.addEventListener('mousemove', ev => {
    mousePosition.value = getRealativeMosePosition(canvas, [ev.offsetX, ev.offsetY], [0, 0])
  })
  return mousePosition
}

export const generateFullPickTarget = <T>(
  gl: WebGLRenderingContext, 
  nodes: T[], 
  renderNode: (program: WebGLProgram, node: T, colorMult: NumArr, index: number) => void,
  lazy = true
) => {
  const pickProgram = createProgramBySource(gl, pickVertSource, pickFragSource)
  const w = gl.canvas.width
  const h = gl.canvas.height
  const fb = createWithDepthTextureFb(gl, w, h)
  const mousePosition = bindMousePosition(gl)
  const nodeColos = nodes.map((_, i) => idToColor(i + 1))
  let needUpdate = !lazy

  let imageData: Uint8Array;
  const updateImageData = () => {
    if (!imageData) {
      imageData = new Uint8Array(w * h * 4)
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
    gl.enable(gl.DEPTH_TEST)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.viewport(0, 0, w, h)
    nodes.forEach((node, i) => {
      renderNode(pickProgram, node, nodeColos[i], i)
    })
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, imageData);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }

  const getMouseIndex = () => {
    if (!mousePosition.value) {
      return -1;
    } else if (!imageData || needUpdate) {
      updateImageData()
    }
    const [cw, ch] = mousePosition.value;
    const offset = ((h - ch) * w + cw) * 4
    const data = imageData.slice(offset, offset + 4)
    const index = colorToId(data) - 1
    return index;
  }

  const activeNode = ref<T | null>()
  const updateActiveNode = () => {
    const index = getMouseIndex()
    activeNode.value = index === -1 ? null : nodes[index];
    needUpdate = !lazy
  }
  watch(mousePosition, frameRender(updateActiveNode))
  
  return {
    updateData: () => {
      needUpdate = true
      if (mousePosition.value) {
        updateActiveNode()
      }
    },
    activeNode: activeNode
  }
}


export const generatePickTarget = <T>(
  gl: WebGLRenderingContext, 
  nodes: T[], 
  renderNode: (program: WebGLProgram, node: T, colorMult: NumArr, index: number, projectionMatrix: NumArr,) => void,
  projectionMatrix: NumArr,
) => {
  const pickProgram = createProgramBySource(gl, pickVertSource, pickFragSource)
  const w = gl.canvas.width
  const h = gl.canvas.height
  const fb = createWithDepthTextureFb(gl, 1, 1)
  const nodeColos = nodes.map((_, i) => idToColor(i + 1))
  // 获取近面的l r w h
  let {
    left, right, top, bottom, near, far
  } = getFrustumArgumentsOnMatrix(projectionMatrix)
  near = -near
  far = -far

  // 一个像素对于真实的长度
  const pixelX = (right - left) / w 
  const pixelY = (top - bottom) / h

  const mousePosition = bindMousePosition(gl)
  const pickProjectionMatrix = computed(() => {
    if (!mousePosition.value) return;
    const [mx, my] = mousePosition.value
    const cleft = left + mx * pixelX
    const cbottom = bottom + (h - my) * pixelY
    return frustum(
      cleft, cleft + pixelX,
      cbottom, cbottom + pixelY,
      near, far
    )
  })

  const getImageData = () => {
    if (!pickProjectionMatrix.value) {
      return
    }
    const imageData: Uint8Array = new Uint8Array(4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
    gl.enable(gl.DEPTH_TEST)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.viewport(0, 0, 1, 1)
    nodes.forEach((node, i) => {
      renderNode(pickProgram, node, nodeColos[i], i, pickProjectionMatrix.value!)
    })
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, imageData);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    return imageData;
  }

  const activeNode: Ref<T | null> = ref(null)
  const updateActiveNode = () => {
    const imageData = getImageData()
    const index = imageData ? (colorToId(imageData) - 1) : -1
    activeNode.value = index === -1 ? null : nodes[index];
  }
  watch(mousePosition, frameRender(updateActiveNode));

  return {
    updateData: updateActiveNode,
    activeNode: activeNode
  }
}
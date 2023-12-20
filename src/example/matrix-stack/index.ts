import { GLAttrib, GLObject, NumArr, SceneNode, createProgramBySource, generateTexture, orthogonal, orthographic } from "../../util";
import fragSource from "./fragment-shader.frag?raw";
import vertSource from "./vertex-shader.vert?raw";
import { MatrixStack } from "../../util/matrix-stack";
import { edgToRad } from "../util";
import { positionTransform } from "../matrix4";
import { setAppendComponent } from "../../append";
import Texts from '../../component/texts.vue'
import { texts } from "../../status";

setAppendComponent(Texts);

const positions = new Float32Array([
  0, 0, 0,
  0, 1, 0,
  1, 0, 0,
  1, 0, 0,
  0, 1, 0,
  1, 1, 0,
]);

const getScreenPosition = (width: number, height: number, matrix: NumArr, pos: number[]) => {
  const clipPosition = positionTransform(pos, matrix)
  return {
    left: (clipPosition[0] * 0.5 + 0.5) * width,
    top: (clipPosition[1] * -0.5 + 0.5) * height,
  }
}

export const init = (canvas: HTMLCanvasElement) => {
  

  const gl = canvas.getContext('webgl')!;
  const program = createProgramBySource(gl, vertSource, fragSource);
  const texture = generateTexture(gl, '/star.jpg', [1, 0, 0], () => animation());

  const object = new GLObject({
    uniforms: { u_texture: texture },
    sceneNode: new SceneNode(),
    attrib: new GLAttrib(
      { gl, program },
      { positions },
      { positions: 'a_position' }
    ),
    map: { u_texture: 'uniform1i' }
  })

  const mStack = new MatrixStack()
  mStack.setCurrentMatrix(orthographic(0, canvas.width, canvas.height, 0, -1, 1));
  mStack.translate(canvas.width / 2, canvas.height / 2)
  mStack.save()
  
  gl.viewport(0, 0, canvas.width, canvas.height)
  
  const redraw = (clear = true) => {
    if (clear) {
      texts.value = []
      clear && gl.clear(gl.COLOR_BUFFER_BIT)
    }

    object.uniforms.u_matrix = mStack.getCurrentMatrix()
    texts.value.push({
      ...getScreenPosition(canvas.width, canvas.height, object.uniforms.u_matrix, [0, 1, 0]),
      content: '0, 1'
    })
    
    object.draw()
  }

  const width = 240
  const height = 180
  const animation = (now = 0) => {
    const time = now * 0.001
    mStack.save()
    mStack.rotate(edgToRad(time * 60))
    mStack.translate(-width / 2, -width / 2)
    
    {
      mStack.save()
      mStack.scale(width, height)
      redraw()
      mStack.restore()
    }
    {
      mStack.save()
      mStack
        .translate(width, 0)
        .rotate(Math.cos(time * 2.3) - 1.2)
        .scale(width / 4, height / 4)
      redraw(false)
      mStack.restore()
    }
    {
      mStack.save()
      mStack
        .rotate(Math.cos(time * 2.2) + 1.2)
        .translate(-width / 4, 0)
        .scale(width / 4, height / 4)
      redraw(false)
      mStack.restore()
    }

    {
      mStack.save()
      mStack
        .translate(0, height)
        .rotate(Math.cos(time * 2.1) + 0.1)
        .translate(-width / 4, 0)
        .scale(width / 4, height / 4)
      redraw(false)
      mStack.restore()
    }
    {
      mStack.save()
      mStack
        .translate(width, height)
        .rotate(Math.cos(time * 2.0) + 0.1)
        .scale(width / 4, height / 4)
      redraw(false)
      mStack.restore()
    }

    mStack.restore()
    requestAnimationFrame(animation);
  }
  animation();
}
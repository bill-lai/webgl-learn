import vertSource from './vertex-shader.vert?raw'
import fragSource from './fragment-shader.frag?raw'
import { GLAttrib, GLObject, SceneNode, canvasMouseRotate, createProgramBySource, enableCameraDebugger, frameRender, getCameraConfigOnBox, getPositionsBox, rotateX, rotateY, straightPerspective1 } from '../../util'
import { getF3DColorGeometry, getF3DGeometry } from '../../demo/geo';
import { inverse, lookAt, multiply, positionTransform } from '../matrix4';
import { watchEffect } from 'vue';


const getAttrib = (gl: WebGLRenderingContext, program: WebGLProgram) => {
  const fModal = {
    positions: getF3DGeometry(),
    colors: getF3DColorGeometry(),
  }

  return {
    attrib: new GLAttrib({ gl, program}, fModal, {
      positions: {name: 'a_position'},
      colors: {name: 'a_color', normalized: true}
    }),
    box: getPositionsBox(fModal.positions)
  }
}

const dev = true;
export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext('webgl')!;
  const program = createProgramBySource(gl, vertSource, fragSource)

  gl.useProgram(program)
  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.enable(gl.DEPTH_TEST)

  const attribs = getAttrib(gl, program);

  const fieldOnView = 90
  const near = 1
  const far = 150
  const padding = 0.6
  const perspectiveMatrix = straightPerspective1(fieldOnView, canvas.width / canvas.height, near, far)
  const sceneNode = new SceneNode()
  const object = new GLObject({
    uniforms: {},
    sceneNode: sceneNode,
    attrib: attribs.attrib,
    perspectiveMatrix
  })

  let redraw = () => {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    object.draw()
  }
  if (dev) {
    redraw = frameRender(enableCameraDebugger([object], fieldOnView, near, far, redraw))
  } else {
    redraw = frameRender(redraw)
  }


  const cameraConfig = getCameraConfigOnBox(attribs.box, fieldOnView, padding);
  let cameraPosition = cameraConfig.position
  object.cameraMatrix = inverse(lookAt(cameraPosition, cameraConfig.target, cameraConfig.up))

  const moseRotate = canvasMouseRotate(canvas)
  watchEffect(() => {
    // object.sceneNode.rotate(
    //   -moseRotate.value[1],
    //   -moseRotate.value[0]
    // )

    cameraPosition = positionTransform(
      cameraPosition,
      multiply(
        rotateX(moseRotate.value[1]),
        rotateY(moseRotate.value[0]),
      )
    )
    object.cameraMatrix = inverse(lookAt(cameraPosition, cameraConfig.target, cameraConfig.up))
    // object.uniforms.u_matrix = multiply(perspectiveMatrix, object.cameraMatrix)
    redraw()
  })
}
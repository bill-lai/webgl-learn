import { watchEffect } from 'vue'
import { 
  loadObj,
  createProgramBySource,
  GLAttrib,
  SceneNode,
  GLObject,
  straightPerspective1,
  multiply,
  edgToRad,
  lookAt,
  canvasMouseRotate,
  identity,
  normalVector,
  inverse,
  transpose,
  getPositionsBox,
  getCameraConfigOnBox,
  frameRender
} from '../../util'
import fragSource from './fragment-shader.frag?raw'
import vertSource from './vertex-shader.vert?raw'

export const init = async (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext('webgl')!
  const program = createProgramBySource(gl, vertSource, fragSource);

  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.enable(gl.DEPTH_TEST)
  // gl.enable(gl.CULL_FACE)
  gl.useProgram(program)

  // const obj = await loadObj('/objs/chair.obj')
  const obj = await loadObj('/objs/book.obj')
  console.log(obj)
  const attribs = obj.models.map(model => new GLAttrib(
    { gl, program }, 
    { positions: model.positions, normals: model.normals, includes: model.includes },
    { positions: 'a_position', normals: 'a_normal' }
  ))

  const node = new SceneNode();
  const fieldOnView = edgToRad(60)
  const cameraConfig = getCameraConfigOnBox(
    getPositionsBox(obj.models.map(item => item.positions)), 
    fieldOnView, 
    0.3
  )
  const viewMatrix = multiply(
    straightPerspective1(edgToRad(60), canvas.width / canvas.height, 0.1, 50),
    inverse(lookAt(cameraConfig.position, cameraConfig.target, cameraConfig.up))
  );
  
  const objects = attribs.map(attrib => new GLObject({
    uniforms: {
      u_normalMatrix: identity(),
      u_lightDirection: normalVector([1, -3, -5]),
      u_diffuse: [Math.random(), Math.random(), Math.random(), 1]
    },
    sceneNode: node,
    attrib,
    viewMatrix
  }))

  const redraw = frameRender(() => {
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
    const normalMatrix = transpose(inverse(node.worldMatrix.value))
    objects.forEach(object => {
      object.uniforms.u_normalMatrix = normalMatrix
      object.draw()
    })
  })

  const moseRotate = canvasMouseRotate(canvas, Math.PI)
  watchEffect(() => {
    node.rotate(
      -moseRotate.value[1], 
      -moseRotate.value[0]
    )
    redraw()
  })
}
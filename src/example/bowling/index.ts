// import fragSource from './fragment-shader.frag?raw'
// import vertSource from './vertex-shader.vert?raw'
import fragSource from './fragment-light-shader.frag?raw'
import vertSource from './vertex-light-shader.vert?raw'
import { bcPoints, bcOffset, dtOffset, dtPoints, bcForward, dtForward } from './bazierCurver'
import { 
  createProgramBySource,  
  SceneNode,
  loadImage,
  getPointsOnBazierCurvers,
  getModelByPlanPoints,
  GLAttrib,
  GLObject,
  multiply,
  lookAt,
  edgToRad,
  straightPerspective1,
  simplifyPoints,
  getPositionsBox,
  getCameraConfigOnBox,
  canvasMouseRotate,
  generateNormals,
} from '../../util'
import { identity, inverse, transpose, translate } from '../matrix4'
import { watchEffect } from 'vue'

export const getModal = () => {
  const isBc = false
  const curverPoints = isBc ? bcPoints : dtPoints
  const curverOffset = isBc ? bcOffset : dtOffset
  const curverForward = isBc ? bcForward : dtForward
  const tempPoints = getPointsOnBazierCurvers(curverPoints, .15, curverOffset)
  const points = simplifyPoints(tempPoints, .4)
  const modal = getModelByPlanPoints(points, 0, 2 * Math.PI , 16, true, true, curverForward)
  const nmodal = generateNormals(modal, edgToRad(30), curverForward)
  return nmodal;
}

export const init = async (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext('webgl')!
  const program = createProgramBySource(gl, vertSource, fragSource)

  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.enable(gl.CULL_FACE)
  gl.enable(gl.DEPTH_TEST)
  gl.useProgram(program)

  const texImage = await loadImage('/texure/uv-grid.png')
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texImage)
  gl.generateMipmap(gl.TEXTURE_2D)

  const modal = getModal()
  const fieldOnView = edgToRad(45)
  const box = getPositionsBox(modal.positions)
  const cameraConfig = getCameraConfigOnBox(box, fieldOnView, 0.2)
  
  const viewMatrix = multiply(
    straightPerspective1(fieldOnView, canvas.clientWidth / canvas.clientHeight, 1, 2000),
    inverse(lookAt(cameraConfig.position, cameraConfig.target, [0, -1, 0]))
  )

  const sceneNode = new SceneNode()
  const attrib = new GLAttrib(
    { gl, program },
    modal,
    { 
      normals: 'a_normal',
      positions: 'a_position', 
      texcoords: { name: 'a_texcoord', size: 2 }
    }
  )
  const midY = cameraConfig.position[1]
  const distance = cameraConfig.position[2]

  const object = new GLObject({
    uniforms: {
      u_lightColor: [1, 1, 1],
      u_lightPosition:  [midY * 1.5, midY * 2, distance * 1.5],
      u_cameraPosition: cameraConfig.position,
      u_normalMatrix: identity(),
      u_modalMatrix: identity()
    }, 
    sceneNode, 
    attrib, 
    viewMatrix
  })

  const redraw = () => {
    console.log("??")
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    object.uniforms.u_modalMatrix = sceneNode.worldMatrix.value
    object.uniforms.u_normalMatrix = transpose(inverse(sceneNode.worldMatrix.value))
    object.draw(gl.TRIANGLES)
  }

  const moseRotate = canvasMouseRotate(canvas, Math.PI)
  watchEffect(() => {
    sceneNode.rotate(
      moseRotate.value[1], 
      moseRotate.value[0]
    )
    redraw()
  })


  // const animation = () => {
  //   requestAnimationFrame(now => {
  //     redraw()
  //     animation()
  //   })
  // }
  // animation()

}
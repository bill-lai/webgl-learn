import { watchEffect } from 'vue'
import fragSource from './fragment-shader.frag?raw'
import vertSource from './vertex-shader.vert?raw'
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
  frameRender,
  generateTexture,
  MaterialMapKey,
  Material,
} from '../../util'

export const init = async (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext('webgl')!
  const program = createProgramBySource(gl, vertSource, fragSource);

  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.enable(gl.DEPTH_TEST)
  // gl.enable(gl.CULL_FACE)
  gl.useProgram(program)

  // const models = await loadObj('/objs/chair.obj')
  const modelsRaw = await loadObj('/objs/windmill.obj')
  // const models = await loadObj('/objs/book.obj')

  const models = modelsRaw.map((model) => {
    const material = model.material
    const mapsTexture: {[key in MaterialMapKey]?: number} = {}
    if (material.diffuseMap) {
      mapsTexture.diffuseMap = generateTexture(gl, material.diffuseMap, material.diffuse, () => redraw())
    }
    if (material.normalMap) {
      console.log(material.normalMap)
      mapsTexture.normalMap = generateTexture(gl, material.normalMap, [0, 0, 0, 0], () => {
        redraw()
      })
    }
    if (material.specularMap) {
      mapsTexture.specularMap = generateTexture(gl, material.specularMap, material.specular, () => redraw())
    }
    return {
      ...model,
      material: {
        ...(material as Omit<Material, MaterialMapKey>),
        ...mapsTexture
      }
    }
  })

  const attribs = models.map(model => new GLAttrib(
    { gl, program }, 
    { 
      texcoords: model.texcoords,
      positions: model.positions, 
      normals: model.normals, 
      includes: model.includes,
      tangents: model.tangents!,
      colors: model.colors.length > 0 ? model.colors : {value: [1, 1, 1, 1]}
    },
    { 
      positions: 'a_position', 
      normals: 'a_normal', 
      colors: 'a_color', 
      tangents: 'a_tangent',
      texcoords: {name: 'a_texcoord', size: 2}
    }
  ))

  const node = new SceneNode();
  const fieldOnView = edgToRad(60)
  const cameraConfig = getCameraConfigOnBox(
    getPositionsBox(models.map(item => item.positions)), 
    fieldOnView, 
    0.3
  )

  const cameraMatrix = lookAt(cameraConfig.position, cameraConfig.target, cameraConfig.up)
  const viewMatrix = multiply(
    straightPerspective1(edgToRad(60), canvas.width / canvas.height, 0.1, 50),
    inverse(cameraMatrix)
  );
  
  const objects = attribs.map((attrib, index) => new GLObject({
    uniforms: {
      ...models[index].material,
      specular: [3, 2, 1],
      shininess: 25,
      u_meshMatrix: identity(),
      u_normalMatrix: identity(),
      u_cameraPosition: cameraConfig.position,
      u_lightDirection: normalVector([1, -3, -5]),
      // u_ambientLight: [],
    },
    map: {
      diffuseMap: 'uniform1i',
      normalMap: 'uniform1i',
      specularMap: 'uniform1i',
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
      object.uniforms.u_meshMatrix = node.worldMatrix.value
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
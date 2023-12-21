import { cubePostions, cubeTexcoord1 } from '../../demo/geo'
import { GLAttrib, GLObject, SceneNode, createProgramBySource, generateTexture, inverse, straightPerspective1 } from '../../util'
import { lookAt } from '../matrix4'
import { edgToRad } from '../util'

// // 使用z深度测量生成雾
// import fragSource from './fragment-shader-1.frag?raw'
// import vertSource from './vertex-shader-1.vert?raw'

// // 使用眼睛距离物体的距离生成雾气
// import fragSource from './fragment-shader-1.frag?raw'
// import vertSource from './vertex-shader-2.vert?raw'


// // 模拟真实根据雾密度生成，无法控制雾的远近
// import fragSource from './fragment-shader-2.frag?raw'
// import vertSource from './vertex-shader-2.vert?raw'

// 低算法，直接根据片段着色器的FragCoord来生成雾， FragCoord是当前正在绘制的坐标  z范围从0-1
import fragSource from './fragment-shader-3.frag?raw'
import vertSource from './vertex-shader-2.vert?raw'


const mesh = {
  texcoords: cubeTexcoord1(),
  positions: cubePostions()
}

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext('webgl')!
  const program = createProgramBySource(gl, vertSource, fragSource)
  const fogColor: [number, number, number, number] = [0.8, 0.9, 1, 1]
  const cameraMatrix = lookAt([2, 0, -1.5], [-9, 0, -12], [0, 1, 0])

  const object = new GLObject({
    uniforms: { 
      u_fogNear: 0.5,
      u_fogFar: 1.1,
      u_fogDensity: 0.08,
      u_fogColor: fogColor,
      u_projectionMatrix: straightPerspective1(edgToRad(60), canvas.width / canvas.height, 1, 2000),
      u_viewMatrix: inverse(cameraMatrix),
      u_texture: generateTexture(gl, '/texure/f-texture.png', [1, 1, 1, 1], () => redraw())
    },
    sceneNode: new SceneNode(),
    map: { u_texture: 'uniform1i' },
    attrib: new GLAttrib(
      { gl, program },
      mesh,
      { positions: 'a_position', texcoords: { name: 'a_texcoord', size: 2 } }
    )
  })

  const nodes: SceneNode[] = []
  const count = 200
  for (let i = 0; i < count; i++) {
    nodes.push(new SceneNode()) 
  }

  gl.enable(gl.DEPTH_TEST)
  // gl.enable(gl.CULL_FACE)
  const redraw = () => {
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT)
    gl.clearColor(...fogColor)
    nodes.forEach(node => {
      object.uniforms.u_worldMatrix = node.worldMatrix.value
      object.draw()
    })
  }

  const cameraPosition = cameraMatrix.slice(12, 15);
  const animation = (now = 0) => {
    const angle = (now / 1000) * edgToRad(40)
    nodes.forEach((node, i) => {
      node
        .reRotate(angle, -angle, 0)
        .translate(0, 0, -2 * i)

      // 绕着相机旋转
      // node
      //   .reTranslate(0, 0, -5)
      //   .rotate(0, Math.PI * 2 / count * i + angle, 0)
      //   .translate(...(cameraPosition as [number]))
    })
    redraw()
    requestAnimationFrame(animation)
  }
  animation()
}
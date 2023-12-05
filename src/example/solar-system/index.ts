import { inverse, lookAt, multiply, straightPerspective1 } from '../matrix4'
import { SceneNode } from '../scene-graph'
import { createBall, createCube, randColorBuffer } from '../spheres'
import { createProgramBySource, edgToRad } from '../util'
import fragSource from './fragment-shader.frag?raw'
import vertSource from './vertex-shader.vert?raw'
import { GLAttrib } from './gl-attrib'
import { GLObject } from './gl-object'

/**
 *  solarSystem
    |    |
    |   sun
    |
  earthOrbit
    |    |
    |  earth
    |
    moonOrbit
        |
      moon
 */

const solarSystemNode = new SceneNode()
const sunNode = new SceneNode({ 
  trs: { scale: 4 },
  parent: solarSystemNode
})
const earthOrbit = new SceneNode({
  trs: { translate: [100, 0] },
  parent: solarSystemNode
})
const eathNode = new SceneNode({ 
  trs: { scale: 2 },
  parent: earthOrbit
})
const moonOrbit = new SceneNode({ 
  trs: { translate: [10, 0] },
  parent: earthOrbit
})
const moonNode = new SceneNode({ 
  trs: { translate: [30, 0], scale: 0.5 },
  parent: moonOrbit
})

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext('webgl')!
  const program = createProgramBySource(gl, vertSource, fragSource)
  
  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.CULL_FACE)
  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.useProgram(program)

  const ctx = { gl, program }
  const ball = createBall(10, 48);
  
  const attrib = new GLAttrib(
    ctx, 
    { ...ball, colors: randColorBuffer(ball) }, 
    { 
      positions: 'a_position',
      colors: {
        name: 'a_color',
        size: 4
      }
    }
  )
  const viewMatrix = multiply(
    straightPerspective1(edgToRad(60), canvas.width / canvas.height, 1, 2000),
    inverse(lookAt([0, -220, 0], [0, 0, 0], [0, 0, 1]))
  )

// 太阳节点，在中心
  const sunObject = new GLObject({
    uniforms: {
      u_colorOffset: [0.6, 0.6, 0, 1], // yellow
      u_colorMult:   [0.4, 0.4, 0, 1],
    },
    sceneNode: sunNode,
    attrib,
    viewMatrix
  })

  // 地球节点，距离太阳100个单位距离
  const eathObject = new GLObject({
    uniforms: {
      u_colorOffset: [0.2, 0.5, 0.8, 1],  // blue-green
      u_colorMult:   [0.8, 0.5, 0.2, 1],
    },
    sceneNode: eathNode,
    attrib,
    viewMatrix
  })
  // 月球节点，距离地球20个单位距离
  const moonObject = new GLObject({
    uniforms: {
      u_colorOffset: [0.6, 0.6, 0.6, 1],  // gray
      u_colorMult:   [0.1, 0.1, 0.1, 1],
    },
    sceneNode: moonNode,
    attrib,
    viewMatrix
  })

  const redraw = () => {
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT)

    sunObject.draw()
    eathObject.draw()
    moonObject.draw()
  }
  const animation = () => {
    requestAnimationFrame(() => {
      earthOrbit.rotate(0, 0.01)
      eathNode.beRotate(0, 0.05)
      moonOrbit.rotate(0, 0.01)
      moonNode.beRotate(0, 0.01)

      redraw()
      animation()
    })
  }
  redraw()
  animation()
}
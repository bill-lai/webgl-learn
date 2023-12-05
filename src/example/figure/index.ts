import { identity, inverse, lookAt, multiply, straightPerspective1, transpose } from '../matrix4'
import { createCube } from '../spheres'
import { createProgramBySource, edgToRad } from '../util'
import fragSource from './fragment-shader.frag?raw'
import { GLAttrib } from '../solar-system//gl-attrib'
import { GLObject } from '../solar-system/gl-object'
import vertSource from './vertex-shader.vert?raw'
import {boxSize, figureNodes} from './figureNodes'


export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext('webgl')!
  const program = createProgramBySource(gl, vertSource, fragSource);
  
  gl.useProgram(program)
  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.CULL_FACE)

  const cube = createCube(boxSize)
  const attrib = new GLAttrib(
    { gl, program }, 
    cube, 
    { 
      positions: 'a_position',
      normals: 'a_normal'
    }
  )
  const objects: GLObject[] = []

  const viewMatrix = multiply(
    straightPerspective1(edgToRad(60), canvas.width / canvas.height, 1, 2000),
    inverse(lookAt([40, 60, 120], [0, 0, 0], [0, 1, 0]))
  )

  for (const key in figureNodes) {
    objects.push(new GLObject({
      uniforms: {
        u_matrix: identity(),
        u_meshMatrix: identity(),
        u_normalMatrix: identity(),
        u_lightPosition: [100, 100, 200]
      },
      sceneNode: figureNodes[key as 'waist'],
      attrib,
      viewMatrix,
      
    }))
  }

  const redraw = () => {
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT)
    objects.forEach(obj => {
      obj.uniforms.u_matrix = multiply(viewMatrix, obj.sceneNode.worldMatrix.value)
      obj.uniforms.u_meshMatrix = obj.sceneNode.worldMatrix.value
      obj.uniforms.u_normalMatrix = transpose(inverse(obj.sceneNode.worldMatrix.value))
      obj.draw()
    })
  }

  const rang = {
    height: 10,
    rotate: 0.43,
    inc: [0, 0.1, -0.1]
  }

  let then = Date.now()
  const animation = () => {
    requestAnimationFrame((now) => {
      const mis = (now - then) * 0.005
      const step = mis % (2 * Math.PI)
      const r = rang.rotate
      const h = rang.height
      const ic = rang.inc

      figureNodes.waist.reSetTRS({
        translate: [0, h * Math.abs(Math.cos(step))],
        rotation: [0, r * Math.cos(step)]
      })
      figureNodes.head.reRotate(r * Math.cos(step * 2), r * Math.sin(step + 0.6))
      figureNodes.neck.reRotate(0, r * Math.cos(step + 0.25))

      const aTrees = [...figureNodes.leftArm.getTreeNodes(), ...figureNodes.rightArm.getTreeNodes()]
      aTrees.forEach((node, i) => {
        node.reRotate(Math.cos(step + ic[i % ic.length]) * r)
      })
      const fTrees = [...figureNodes.leftLeg.getTreeNodes(), ...figureNodes.rightLeg.getTreeNodes()]
      fTrees.forEach((node, i) => {
        const frag = i >= fTrees.length / 2 ? -1 : 1
        node.reRotate(Math.cos(step + ic[ i % ic.length]) * r * frag, 0)
      })
      redraw()
      animation()
    })    
  }
  redraw()
  animation()
}
import { GLAttrib, GLObject, SceneNode, canvasMouseRotate, createProgramBySource, inverse, normalVector, straightPerspective1 } from '../../util'
import mesh from './headdata.json'
import fragSource from "./fragment-shader.frag?raw";
import vertSource from "./vertex-shader.vert?raw";
import { edgToRad } from '../util';
import { lookAt } from '../matrix4';
import { watchEffect } from 'vue';

const createTexture = (gl: WebGLRenderingContext, offset = 0) => {
  const texture = gl.createTexture()
  gl.activeTexture(gl.TEXTURE0 + offset)
  gl.bindTexture(gl.TEXTURE_2D, texture)
  const data = new Uint8Array([90, 255])
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 2, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)

  return offset;
}

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext('webgl')!;
  const program = createProgramBySource(gl, vertSource, fragSource)

  const object = new GLObject({
    uniforms: {
      u_color: [0, 1, 0, 1],
      u_rampSize: [2, 1],
      u_ramp: createTexture(gl),
      u_lightDirection:  normalVector([1.75, -0.7, -1]),
      u_projectionMatrix: straightPerspective1(edgToRad(60), canvas.width / canvas.height, 1, 2000),
      u_viewMatrix: inverse(lookAt([0, 0, 50], [0, 0, 0], [0, 1, 0])),
    },
    attrib: new GLAttrib(
      { gl, program },
      mesh,
      { positions: 'a_position', normals: 'a_normal' }
    ),
    sceneNode: new SceneNode(),
    map: { u_ramp: 'uniform1i' }
  })
  
  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.enable(gl.DEPTH_TEST)
  // gl.enable(gl.CULL_FACE)

  const redraw = () => {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    object.uniforms.u_worldMatrix = object.sceneNode.worldMatrix.value;
    object.draw()
  }

  const rotateAngle = canvasMouseRotate(canvas, Math.PI)
  watchEffect(() => {
    object.sceneNode.rotate(-rotateAngle.value[1], -rotateAngle.value[0], 0)
    redraw()
  })
}
// 模拟方向光源
import vertexSource from "../shader/vertex-shader-2d-17.vert?raw";
import fragmentSource from "../shader/fragment-shader-2d-12.frag?raw";
import { GLAttrib, GLObject, SceneNode, createCube, createProgramBySource, edgToRad, inverse, lookAt, multiply, straightPerspective1 } from "../util";

const ctx = document.createElement('canvas').getContext('2d')!
ctx.canvas.width = 256
ctx.canvas.height = 256
const generateFace = (faceColor: string, textColor: string, text: string) => {
  const { width, height } = ctx.canvas
  ctx.fillStyle = faceColor
  ctx.fillRect(0, 0, width, height)
  ctx.font = `${width * 0.7}px sans-serif`;
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = textColor
  ctx.fillText(text, width / 2, height / 2)

  return ctx.canvas
}

const generateCubeTexture = (gl: WebGLRenderingContext) => {
  const offset = 4
  const faceInfos = [
    { faceColor: '#F00', textColor: '#0FF', text: '+x', target: gl.TEXTURE_CUBE_MAP_POSITIVE_X },
    { faceColor: '#FF0', textColor: '#00F', text: '+y', target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y },
    { faceColor: '#0F0', textColor: '#F0F', text: '+z', target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z },
    { faceColor: '#0FF', textColor: '#F00', text: '-x', target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X },
    { faceColor: '#00F', textColor: '#FF0', text: '-y', target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y },
    { faceColor: '#F0F', textColor: '#0F0', text: '-z', target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z },
  ]

  const texture = gl.createTexture()
  gl.activeTexture(gl.TEXTURE0 + offset)
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture)

  faceInfos.forEach(({ faceColor, textColor, text, target }) => {
    const faceOrigin = generateFace(faceColor, textColor, text)
    gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, faceOrigin)
  })

  gl.generateMipmap(gl.TEXTURE_CUBE_MAP)
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

  return offset;
}

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext('webgl')!
  const program = createProgramBySource(gl, vertexSource, fragmentSource)

  const projectionMatrix = straightPerspective1(edgToRad(60), canvas.width / canvas.height, 1, 1000);
  const viewMatrix = inverse(lookAt([0, 0, 10], [0, 0, 0], [0, 1, 0]))
  const worldMatrix = multiply(projectionMatrix, viewMatrix)
  const cubeNode = new SceneNode();

  const object = new GLObject({
    uniforms: {
      u_texture: generateCubeTexture(gl)
    },
    sceneNode: new SceneNode(),
    attrib: new GLAttrib(
      { gl, program },
      createCube(4)
    ),
    map: { u_texture: 'uniform1i' }
  })

  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.enable(gl.DEPTH_TEST)

  const redraw = () => {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    object.uniforms.u_matrix = multiply(
      worldMatrix, 
      cubeNode.worldMatrix.value
    );
    object.draw()
  }

  const animation = (now = 0) => {
    now /= 1000
    cubeNode.reRotate(now * edgToRad(40), now * edgToRad(20), 0);
    redraw()
    requestAnimationFrame(animation)
  }
  animation()
}
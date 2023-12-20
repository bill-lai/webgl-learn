// 使用裁剪最远端矩形，创建天空正方体贴图，把贴图映射到裁剪矩形中来实现
// 使用普通正方体实现会有诸多限制，比如正视锥在矩形边角初会遮挡其他物体
import { GLAttrib, GLObject, SceneNode, canvasMouseRotate, createCube, createProgramBySource, loadImage, rotateY, straightPerspective1 } from '../../util';
import { inverse, lookAt, multiply } from '../matrix4';
import { edgToRad } from '../util';
import theSkyFragSource from './fragment-the-sky-shader.frag?raw'
import theSkyVertSource from './vertex-the-sky-shader.vert?raw'
import cubeFragSource from './fragment-cube-shader.frag?raw'
import cubeVertSource from './vertex-cube-shader.vert?raw'

const clipRect = new Float32Array([
  -1, -1,
   1, -1,
  -1,  1,
  -1,  1,
   1, -1,
   1,  1
])

const getTheSkyTexture = (gl: WebGLRenderingContext) => {
  const faceInfos = [
    { url: '/texure/pos-x.jpg', target: gl.TEXTURE_CUBE_MAP_POSITIVE_X },
    { url: '/texure/neg-x.jpg', target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X },
    { url: '/texure/pos-y.jpg', target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y },
    { url: '/texure/neg-y.jpg', target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y },
    { url: '/texure/pos-z.jpg', target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z },
    { url: '/texure/neg-z.jpg', target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z },
  ];
  const offset = 2;
  const texture = gl.createTexture()
  gl.activeTexture(gl.TEXTURE0 + offset)
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture)

  faceInfos.forEach(async ({url, target}) => {
    gl.texImage2D(target, 0, gl.RGBA, 512, 512, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)

    const image = await loadImage(url)
    gl.activeTexture(gl.TEXTURE0 + offset)
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture)
    gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP)
  })
  gl.generateMipmap(gl.TEXTURE_CUBE_MAP)
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  return offset;
}

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext('webgl')!;
  const theSkyProgram = createProgramBySource(gl, theSkyVertSource, theSkyFragSource);
  const cubeProgram = createProgramBySource(gl, cubeVertSource, cubeFragSource);

  const theSkyTexture = getTheSkyTexture(gl)
  const projectionMatrix = straightPerspective1(edgToRad(60), canvas.width / canvas.height, 1, 2000);
  let cameraMatrix: number[]

  const object = new GLObject({
    uniforms: { u_texture: theSkyTexture },
    sceneNode: new SceneNode(),
    attrib: new GLAttrib(
      { gl, program: theSkyProgram },
      { positions: clipRect },
      { positions: { name: 'a_position', size: 2 } }
    ),
    map: { u_texture: 'uniform1i' }
  })

  const cubeObject = new GLObject({
    uniforms: { u_texture: theSkyTexture },
    sceneNode: new SceneNode(),
    attrib: new GLAttrib(
      { gl, program: cubeProgram },
      createCube(1),
      { positions: 'a_position', normals: 'a_normal' }
    ),
    map: { u_texture: 'uniform1i' }

  })

  // gl.enable(gl.DEPTH_TEST)

  const redraw = () => {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    gl.disable(gl.DEPTH_TEST)
    
    const theSkyCameraMatrix = [...cameraMatrix]
    // 只改变朝向不改变位置
    theSkyCameraMatrix[12] = 0
    theSkyCameraMatrix[13] = 0
    theSkyCameraMatrix[14] = 0
    object.uniforms.projectionInverseMatrix = inverse(
      multiply(
        projectionMatrix,
        inverse(theSkyCameraMatrix)
      )
    )
    object.draw()

    gl.enable(gl.DEPTH_TEST)
    cubeObject.uniforms.u_cameraPosition = [
      cameraMatrix[12],
      cameraMatrix[13],
      cameraMatrix[14],
    ]
    cubeObject.uniforms.u_projectionMatrix = projectionMatrix
    cubeObject.uniforms.u_viewMatrix = inverse(cameraMatrix)
    cubeObject.uniforms.u_woldMatrix = cubeObject.sceneNode.worldMatrix.value
    cubeObject.draw()
  }

  const animation = (now = 0) => {
    now /= 1000

    const angle = now * edgToRad(10)
    const radius = 3
    const cameraPosition = [
      Math.cos(angle) * radius,
      0,
      Math.sin(angle) * radius
    ]
    cameraMatrix = lookAt(cameraPosition, [0, 0, 0], [0, 1, 0])
    redraw()

    cubeObject.sceneNode.reRotate(now * edgToRad(40), now * edgToRad(20), 0);
    requestAnimationFrame(animation)
  }
  animation()
}
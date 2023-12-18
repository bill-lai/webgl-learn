import { watch, watchEffect } from "vue";
import { GLAttrib, GLObject, inverse, lookAt, multiply, rotateX, edgToRad, canvasMouseRotate, createPlaneVertices, createProgramBySource, createSphereVertices, getSceneNodeByConfig, rotateY, straightPerspective1, SceneNode, canvasMouseTranslate, translate, scale, frameRender, normalVector, subtractVectors } from "../../util";
import fragSource from "./fragment-shader.frag?raw";
import vertSource from "./vertex-shader.vert?raw";
import fragLightSource from "./fragment-light-shader.frag?raw";
import vertLightSource from "./vertex-light-shader.vert?raw";
import { positionTransform } from "../matrix4";
import { clipPositions } from "../../demo/geo";

const nodes = getSceneNodeByConfig({
  name: "world",
  children: [
    { name: "plane" },
    { name: "sphere", trs: { translate: [2, 3, 3] } },
  ],
});

const getModels = () => {
  return {
    plane: createPlaneVertices(20, 20, 1, 1),
    sphere: createSphereVertices(1, 48, 24),
    lightClip: clipPositions(),
  }
}

const getTexture = (gl: WebGLRenderingContext) => {
  const offset = 2;
  const texture = gl.createTexture()
  gl.activeTexture(gl.TEXTURE0 + offset)
  gl.bindTexture(gl.TEXTURE_2D, texture);
  const texData = new Uint8Array([
    0xff, 0xcc, 0xff, 0xcc, 0xff, 0xcc, 0xff, 0xcc, 0xcc, 0xff, 0xcc, 0xff,
    0xcc, 0xff, 0xcc, 0xff, 0xff, 0xcc, 0xff, 0xcc, 0xff, 0xcc, 0xff, 0xcc,
    0xcc, 0xff, 0xcc, 0xff, 0xcc, 0xff, 0xcc, 0xff, 0xff, 0xcc, 0xff, 0xcc,
    0xff, 0xcc, 0xff, 0xcc, 0xcc, 0xff, 0xcc, 0xff, 0xcc, 0xff, 0xcc, 0xff,
    0xff, 0xcc, 0xff, 0xcc, 0xff, 0xcc, 0xff, 0xcc, 0xcc, 0xff, 0xcc, 0xff,
    0xcc, 0xff, 0xcc, 0xff,
  ])
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 8, 8, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, texData);
  gl.generateMipmap(gl.TEXTURE_2D)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  return { offset, texture };
}

const getDepthTexture = (gl: WebGLRenderingContext, w = 256, h = 256, offset = 3)  => {
  // 开启深度贴图扩展
  gl.getExtension('WEBGL_depth_texture')

  const depthTexture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + offset)
  gl.bindTexture(gl.TEXTURE_2D, depthTexture)
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.DEPTH_COMPONENT,
    w,
    h,
    0,
    gl.DEPTH_COMPONENT,
    gl.UNSIGNED_INT,
    null
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

  // webgl限制，就算要使用深度贴图frane必须得配合COLOR_ATTACHMENT0
  const unusedTexture = gl.createTexture()
  gl.activeTexture(gl.TEXTURE0 + offset + 3)
  gl.bindTexture(gl.TEXTURE_2D, unusedTexture)
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    w,
    h,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null
  )
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

  const depthBuffer = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, depthBuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.DEPTH_ATTACHMENT,
    gl.TEXTURE_2D,
    depthTexture,
    0
  );

  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    unusedTexture,
    0
  )

  return {
    depthBuffer,
    depthTexture
  }
}

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext('webgl')!
  const program = createProgramBySource(gl, vertSource, fragSource)
  const lightProgram = createProgramBySource(gl, vertLightSource, fragLightSource)

  gl.enable(gl.DEPTH_TEST)

  const models = getModels()
  const worlds = {
    sphere: {
      mesh: models.sphere,
      mutColor: [1, 0.5, 0.5, 1]
    },
    plane: {
      mesh: models.plane,
      mutColor: [0.5, 0.5, 1, 1],
    }
  }

  const { offset } = getTexture(gl)
  console.log(worlds)
  const worldObjects = Object.entries(worlds)
    .map(([name, data]) => {
      const attrib = new GLAttrib(
        { gl },
        data.mesh,
        { 
          positions: 'a_position', 
          texcoords: { name: 'a_texcoord', size: 2 },
          normals: { name: 'a_normal' }
        }
      )
      return new GLObject({
        uniforms: { 
          u_texture: offset,
          u_mutColor: data.mutColor,
          u_ambient: 0.7,
          u_shininess: 150
        },
        sceneNode: nodes[name as 'plane'],
        attrib,
        map: { u_texture: 'uniform1i', u_lightDepthTexture: 'uniform1i' }
      })
    })
  
  const lightClipObject = new GLObject({
    uniforms: { },
    attrib: new GLAttrib(
      { gl },
      models.lightClip,
      { positions: 'a_position' }
    ),
    sceneNode: new SceneNode()
  })

  // 创建深度贴图
  const depthTexturePosition = 4;
  const depthTextureWidth = 512 * 2
  const depthTextureHeight = 512 * 2
  const { depthBuffer, depthTexture } = getDepthTexture(gl, depthTextureWidth, depthTextureHeight, depthTexturePosition)
  
  const initLightPosition = [2.5, 4.8, 4.3]
  let lightPosition = initLightPosition
  const lightViewRad = edgToRad(120)
  const lightPrejectionMartix = straightPerspective1(lightViewRad, 1 / 1, 0.5, 200);
  
  const prejectionMatrix = straightPerspective1(edgToRad(60), canvas.width / canvas.height, 1, 200);
  let cameraPosition = [6, 5, 7];
  let cameraTarget = [0, 0, 0]
  let cameraMatrix = lookAt(cameraPosition, [0, 0, 0], [0, 1, 0])

  const redraw = () => {
    const lightViewMatrix = lookAt(lightPosition, [2.5, 0, 3.5], [0, 1, 0])
    const lightMatrix = multiply(
      lightPrejectionMartix,
      inverse(lightViewMatrix)
    )

    // gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.bindFramebuffer(gl.FRAMEBUFFER, depthBuffer)
    gl.viewport(0, 0, depthTextureWidth, depthTextureHeight)
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT)
    worldObjects.forEach(object => {
      object.uniforms.u_matrix = multiply(lightMatrix, object.sceneNode.worldMatrix.value)
      object.draw(gl.TRIANGLES, lightProgram)
    })
    // return;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT)
    const viewMatrix = inverse(cameraMatrix)

    worldObjects.forEach(object => {
      object.uniforms.u_projectionMatrix = prejectionMatrix
      object.uniforms.u_viewMatrix = viewMatrix
      object.uniforms.u_lightAngleOuter = Math.cos(lightViewRad / 2)
      object.uniforms.u_lightAngleInner = Math.cos(lightViewRad / 2 - edgToRad(10))
      object.uniforms.u_worldMatrix = object.sceneNode.worldMatrix.value
      object.uniforms.u_lightPosition = lightPosition
      object.uniforms.u_cameraPosition = cameraPosition
      object.uniforms.u_lightDirection = normalVector(subtractVectors([0, 0, 0], lightPosition))
      // 代入光照矩阵算出在光照内的坐标，为了配合纹理坐标系，需要将投影转到[0, 1]区间
      object.uniforms.u_lightMatrix = multiply(
        scale(0.5, 0.5, 0.5),
        translate(1, 1, 1),
        lightMatrix
      )
      // 光照的深度贴图信息
      object.uniforms.u_lightDepthTexture = depthTexturePosition;
      object.draw(gl.TRIANGLES, program)
    })

    lightClipObject.uniforms.u_matrix = multiply(
      prejectionMatrix,
      viewMatrix, 
      lightClipObject.sceneNode.worldMatrix.value,
      inverse(lightMatrix)
    )
    lightClipObject.draw(gl.LINES, lightProgram)
  }

  // const cameraRotate = canvasMouseRotate(canvas, Math.PI)
  const cameraTranslate = canvasMouseTranslate(canvas, false, [0, 0, 0], 20)
  watchEffect(() => {
    cameraTarget = positionTransform(
      cameraTarget,
      translate(cameraTranslate.value[0], cameraTranslate.value[1], 0)
    )
    cameraPosition = cameraMatrix.slice(8, 11)
      .map(p => p * cameraTranslate.value[2])
      .map((diff, i) => cameraPosition[i] + diff)

    cameraMatrix = lookAt(cameraPosition, cameraTarget, [0, 1, 0])
    redraw()
  })

  

  let then = Date.now()
  function animation(now = Date.now()) {
    const rad = (now - then) / 1000 * Math.PI / 4;
    then = now;
    lightPosition = positionTransform(lightPosition, rotateY(rad))
    redraw()
    requestAnimationFrame(animation);
  };
  animation()
}
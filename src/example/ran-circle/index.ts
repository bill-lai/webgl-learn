import { createProgramBySource, edgToRad, rand, randInt } from '../util'
import { createBall, createCone, createCube, createRectangle, createTriangle } from '../spheres'
import { makeCheckerTexture, makeCircleTexture, makeStripeTexture } from '../texture'
import fragSource from './fragment-shader.frag?raw'
import vertSource from './vertex-shader.vert?raw'
import { inverse, lookAt, multiply, rotateX, rotateY, straightPerspective1, translate, transpose } from '../matrix4'
import chroma from 'chroma-js'
import { watchEffect } from 'vue'


type Ball = {
  radius: number,
  xRotation: number,
  yRotation: number,
  uniforms: {
    colorMult: number[],
    texture: WebGLTexture,
    shininess: number,
    specularFactor: number
  } 
}

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext('webgl')!
  const program = createProgramBySource(gl, vertSource, fragSource);

  gl.enable(gl.DEPTH_TEST)
  // gl.enable(gl.CULL_FACE)
  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.useProgram(program)

  const positionIndex = gl.getAttribLocation(program, 'a_position')
  const normalIndex = gl.getAttribLocation(program, 'a_normal')
  const texcoordIndex = gl.getAttribLocation(program, 'a_texcoord')
  const matrixIndex = gl.getUniformLocation(program, 'u_matrix');
  const meshMatrixIndex = gl.getUniformLocation(program, 'u_meshMatrix');
  const normalMatrixIndex = gl.getUniformLocation(program, 'u_normalMatrix');
  const lightPositionIndex = gl.getUniformLocation(program, 'u_lightPosition');
  const cameraPositionIndex = gl.getUniformLocation(program, 'u_cameraPosition');
  const lightColorIndex = gl.getUniformLocation(program, 'u_lightColor');
  const shininessIndex = gl.getUniformLocation(program, 'u_shininess');
  const colorMultIndex = gl.getUniformLocation(program, 'u_colorMult');
  const ambientColorIndex = gl.getUniformLocation(program, 'u_ambientColor');
  
  const specularFactorIndex = gl.getUniformLocation(program, 'u_specularFactor');

  const { positions, normals, texCoords, includes } = createBall(5, 48)
  // const { positions, normals, texCoords, includes } = createCube(10)
  // const { positions, normals, texCoords, includes } = createCone(10, 0, 20, 12, 1)
  // const { positions, normals, texCoords, includes } = createTriangle()
  // const { positions, normals, texCoords, includes } = createRectangle()
  
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)
  gl.enableVertexAttribArray(positionIndex)
  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0)

  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW)
  gl.enableVertexAttribArray(normalIndex)
  gl.vertexAttribPointer(normalIndex, 3, gl.FLOAT, false, 0, 0)

  const texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW)
  gl.enableVertexAttribArray(texcoordIndex)
  gl.vertexAttribPointer(texcoordIndex, 2, gl.FLOAT, false, 0, 0)

  const includeBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, includeBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, includes, gl.STATIC_DRAW)

  const textures = [
    makeStripeTexture(gl, { color1: "#FFF", color2: "#CCC", })!,
    makeCheckerTexture(gl, { color1: "#FFF", color2: "#CCC", })!,
    makeCircleTexture(gl, { color1: "#FFF", color2: "#CCC", })!,
  ]
  const lightColor = [1, 1, 1]
  const lightPosition = [-50, 30, 100]
  const cameraPosition = [0, 0, 100]
  const cameraTarget = [0, 0, 0]
  const up = [0, 1, 0]
  const cameraMatrix = lookAt(cameraPosition, cameraTarget, up)
  const viewMatrix = multiply(
    straightPerspective1(edgToRad(60), canvas.width / canvas.height, 1, 2000),
    inverse(cameraMatrix)
  )
  
  const balls: Ball[] = []
  for (let i = 0; i < 300; i++) {
    balls.push({
      radius: rand(150),
      xRotation: rand(2*Math.PI),
      yRotation: rand(Math.PI),
      uniforms: {
        colorMult: chroma.hsv(rand(240, 360), 0.5, 1).gl(),
        texture: textures[randInt(textures.length)],
        shininess: rand(500),
        specularFactor: rand(1)
      } 
    })
  }

  const getTime = (now: number = Date.now()) => now * 0.0001 + 5
  let time = getTime();
  
  const redraw = () => {
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT)

    for (const ball of balls) {
      const meshMatrix = multiply(
        rotateX(ball.xRotation * time),
        rotateY(ball.yRotation * time),
        translate(0, 0, ball.radius)
      );
      gl.bindTexture(gl.TEXTURE_2D, ball.uniforms.texture);
      gl.uniformMatrix4fv(matrixIndex, false, multiply(viewMatrix, meshMatrix))
      gl.uniformMatrix4fv(meshMatrixIndex, false, meshMatrix)
      gl.uniformMatrix4fv(normalMatrixIndex, false, transpose(inverse(meshMatrix)))
      gl.uniform3fv(lightPositionIndex, lightPosition)
      gl.uniform3fv(cameraPositionIndex, cameraPosition)
      gl.uniform3fv(lightColorIndex, lightColor)
      gl.uniform1f(shininessIndex, ball.uniforms.shininess)
      gl.uniform3fv(colorMultIndex, ball.uniforms.colorMult.slice(0, 3))
      gl.uniform1f(specularFactorIndex, ball.uniforms.specularFactor)
      gl.uniform3fv(ambientColorIndex, [0.3, 0.3, 0.3])
      

      gl.drawElements(gl.TRIANGLES, includes.length , gl.UNSIGNED_SHORT, 0); 
    }
  }
  

  const animation = () => {
    let stop = false;
    requestAnimationFrame(now => {
      time = getTime(now)
      redraw()
      stop || animation()
    })
    return () => stop = true
  }
  watchEffect((onCleanup) => {
    redraw()
    onCleanup(animation())
  })
}
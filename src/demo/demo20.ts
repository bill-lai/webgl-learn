import vertexSource from "../shader/vertex-shader-2d-12.vert?raw";
import fragmentSource from "../shader/fragment-shader-2d-8.frag?raw";
import { ref, watchEffect } from "vue";
import { createProgramBySource, edgToRad, isTwoPower, loadImage } from "./util";
import { getF3DGeometry, getF3DTexcoordGeometry1 } from "./geo";
import { identity, inverse, lookAt, multiply, rotateX, rotateY, rotateZ, straightPerspective1, translate } from "./matrix4";

const image = ref<HTMLImageElement | null>(null)
loadImage('/texure/f-texture.png')
loadImage('/texure/keyboard.jpg')
  .then((img) => image.value = img)

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext('webgl')!
  const program = createProgramBySource(gl, vertexSource, fragmentSource)

  gl.useProgram(program);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.enable(gl.DEPTH_TEST)
  // gl.enable(gl.CULL_FACE)

  const texture = gl.createTexture()!
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]))

  watchEffect(() => {
    if (image.value) {
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image.value)
      if (isTwoPower(image.value.width) && isTwoPower(image.value.width)) {
        // 生成多尺寸贴图 ,只有w h是2的指数宽高才可使用
        gl.generateMipmap(gl.TEXTURE_2D)
      } else {
        // 不是指数只能用单张贴图
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      }
      redraw()
    }
  })
  const projectionMatrix = straightPerspective1(edgToRad(60), gl.canvas.width / gl.canvas.height, 1, 3000)
  const redraw = test1(gl, program, projectionMatrix)
}

const test2 = (gl: WebGLRenderingContext, program: WebGLProgram, projectionMatrix: number[], texture: WebGLTexture) => {
  const positionIndex = gl.getAttribLocation(program, 'a_position');
  const texcoordIndex = gl.getAttribLocation(program, 'a_texcoord');
  const matrixIndex = gl.getUniformLocation(program, 'u_matrix')
  // projectionMatrix = orthographic(0, gl.canvas.clientWidth, gl.canvas.clientHeight, 0, -1, 1)

  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  // gl.bufferData(gl.ARRAY_BUFFER, getF3DGeometry(), gl.STATIC_DRAW)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -0.5,  0.5,  0.5,
     0.5,  0.5,  0.5,
    -0.5, -0.5,  0.5,
    -0.5, -0.5,  0.5,
     0.5,  0.5,  0.5,
     0.5, -0.5,  0.5,
  ]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(positionIndex)
  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0)


  const texcoordBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -3, -1, 
     2, -1,
    -3,  4,
    -3,  4,
     2, -1,
     2,  4
  ]), gl.STATIC_DRAW)  
  gl.enableVertexAttribArray(texcoordIndex)
  gl.vertexAttribPointer(texcoordIndex, 2, gl.FLOAT, false, 0, 0)

  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

  const redraw = () => {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.uniformMatrix4fv(matrixIndex, false, identity())
    gl.drawArrays(gl.TRIANGLES, 0, 1 * 6);
  }
  redraw()
  return redraw
}

const test1 = (gl: WebGLRenderingContext, program: WebGLProgram, projectionMatrix: number[]) => {
  const positionIndex = gl.getAttribLocation(program, 'a_position');
  const texcoordIndex = gl.getAttribLocation(program, 'a_texcoord');

  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, getF3DGeometry(), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(positionIndex)
  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0)

  const texcoordBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, getF3DTexcoordGeometry1(), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(texcoordIndex)
  gl.vertexAttribPointer(texcoordIndex, 2, gl.FLOAT, false, 0, 0)


  const matrixIndex = gl.getUniformLocation(program, 'u_matrix')
  const initMatrix = multiply(
    projectionMatrix,
    inverse(lookAt([0, 0, 200], [0, 0, 0], [0, 1, 0])),
  )
  const translateMatrix = translate(0, 0, -360)
  const rotate = [edgToRad(190), edgToRad(40), 0];

  const redraw = () => {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    
    const matrix = multiply(
      initMatrix,
      translateMatrix,
      rotateX(rotate[0]),
      rotateY(rotate[1]),
      rotateZ(rotate[2]),
    )
    gl.uniformMatrix4fv(matrixIndex, false, matrix)
    gl.drawArrays(gl.TRIANGLES, 0, 16 * 6)
  }

  let then = Date.now()
  const animation = () => {
    requestAnimationFrame((now) => {
      const diffTime = (now - then) / 1000
      rotate[1] += diffTime * 1.2
      rotate[0] += diffTime * 0.7
      then = now
      redraw()
      animation()
    })
  }
  redraw();
  animation()

  return redraw
}
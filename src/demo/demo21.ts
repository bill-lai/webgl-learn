import vertexSource from "../shader/vertex-shader-2d-12.vert?raw";
import fragmentSource from "../shader/fragment-shader-2d-8.frag?raw";
import { ref, watchEffect } from "vue";
import { createProgramBySource, edgToRad, loadImage } from "./util";
import {  multiply, scale, straightPerspective1, translate } from "./matrix4";

const image = ref<HTMLImageElement | null>(null)
loadImage('/texure/mip-low-res-example.png')
  .then((img) => image.value = img)

const geo = new Float32Array([
  -0.5,  0.5,  0.5,
  0.5,  0.5,  0.5,
 -0.5, -0.5,  0.5,
 -0.5, -0.5,  0.5,
  0.5,  0.5,  0.5,
  0.5, -0.5,  0.5,
])
const tcoord = new Float32Array([
  0, 0,
  1, 0,
  0, 1,
  0, 1,
  1, 0,
  1, 1,
])

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext('webgl')!
  const program = createProgramBySource(gl, vertexSource, fragmentSource)

  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.enable(gl.DEPTH_TEST)
  gl.useProgram(program)

  const positionIndex = gl.getAttribLocation(program, 'a_position')
  const texcoordIndex = gl.getAttribLocation(program, 'a_texcoord')
  const matrixIndex = gl.getUniformLocation(program, 'u_matrix')

  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, geo, gl.STATIC_DRAW)
  gl.enableVertexAttribArray(positionIndex)
  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0)

  const texcoordBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, tcoord, gl.STATIC_DRAW)
  gl.enableVertexAttribArray(texcoordIndex)
  gl.vertexAttribPointer(texcoordIndex, 2, gl.FLOAT, false, 0, 0)

  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]))

  const fbTexture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, fbTexture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

  const fbBuffer = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbBuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fbTexture, 0)

  watchEffect(() => {
    if (image.value) {
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image.value)
      gl.generateMipmap(gl.TEXTURE_2D)
      redraw()
    }
  })

  const settings = [
    { x: -1, y: -3, z: -30, filter: gl.NEAREST,               },
    { x:  0, y: -3, z: -30, filter: gl.LINEAR,                },
    { x:  1, y: -3, z: -30, filter: gl.NEAREST_MIPMAP_LINEAR, },
    { x: -1, y: -1, z: -10, filter: gl.NEAREST,               },
    { x:  0, y: -1, z: -10, filter: gl.LINEAR,                },
    { x:  1, y: -1, z: -10, filter: gl.NEAREST_MIPMAP_LINEAR, },
    { x: -1, y:  1, z:   0, filter: gl.NEAREST,               },
    { x:  0, y:  1, z:   0, filter: gl.LINEAR,                },
    { x:  1, y:  1, z:   0, filter: gl.LINEAR_MIPMAP_NEAREST, },
  ];
  const xSpacing = 1.2
  const ySpacing = 0.7

  const fieldOfViewInRadians = edgToRad(60)
  const intiMatrix = multiply(
    straightPerspective1(fieldOfViewInRadians, canvas.width / canvas.height, 1, 2000),
    // inverse(lookAt([0, 0, 3], [0, 0, 0], [0, 1, 0]))
  )

  
  const redraw = () => {
    const time = Date.now() * 0.001

    // 清空帧缓冲区旧数据
    gl.bindTexture(gl.TEXTURE_2D, fbTexture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width / 4, canvas.height / 4, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    // 绘画到帧缓冲区
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.viewport(0, 0,canvas.width / 4, canvas.height / 4)
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbBuffer)

    for (const setting of settings) {
      var z = -5 + setting.z; // Math.cos(time * 0.3) * zDistance - zDistance;
      var r = Math.abs(z) * Math.sin(fieldOfViewInRadians * 0.5);
      var x = Math.sin(time * 0.2) * r;
      var y = Math.cos(time * 0.2) * r * 0.5;
      var r2 = 1 + r * 0.2;

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, setting.filter);
      const matrix = multiply(intiMatrix, translate(x + setting.x * xSpacing * r2, y + setting.y * ySpacing * r2, z))
      gl.uniformMatrix4fv(matrixIndex, false, matrix)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }

    gl.viewport(0, 0,canvas.width, canvas.height)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.bindTexture(gl.TEXTURE_2D, fbTexture)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.uniformMatrix4fv(matrixIndex, false, scale(2, 2, 1))
    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }
  const animation = () => {
    requestAnimationFrame(() => {
      redraw();
      animation()
    })
  }
  redraw()
  animation()
}
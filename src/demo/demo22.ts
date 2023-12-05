import vertexSource from "../shader/vertex-shader-2d-12.vert?raw";
import fragmentSource from "../shader/fragment-shader-2d-8.frag?raw";
import { createProgramBySource, edgToRad, loadImage } from "./util";
import { ref, watchEffect } from "vue";
import { inverse, lookAt, multiply, rotateZ, scale, straightPerspective1, translate } from "./matrix4";

const texType = ref(0)
const image = ref<HTMLImageElement | null>(null)
loadImage('/texure/mip-low-res-example.png')
  .then((img) => image.value = img)

const zDepth = 50;
const geo = new Float32Array([
  -0.5,  0.5, -0.5,
   0.5,  0.5, -0.5,
  -0.5,  0.5,  0.5,
  -0.5,  0.5,  0.5,
   0.5,  0.5, -0.5,
   0.5,  0.5,  0.5,
])
const tcoord = new Float32Array([
  0, 0,
  1, 0,
  0, zDepth,
  0, zDepth,
  1, 0,
  1, zDepth,
])

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext('webgl')!
  const program = createProgramBySource(gl, vertexSource, fragmentSource)

  canvas.addEventListener('click', () => texType.value = (texType.value + 1) % 2)

  gl.useProgram(program)
  gl.enable(gl.DEPTH_TEST)

  const positionIndex = gl.getAttribLocation(program, 'a_position')
  const texcoordIndex = gl.getAttribLocation(program, 'a_texcoord');
  const matrixIndex = gl.getUniformLocation(program, 'u_matrix')

  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, geo, gl.STATIC_DRAW)
  gl.enableVertexAttribArray(positionIndex)
  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0)

  const texcoordBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, tcoord, gl.STATIC_DRAW)
  gl.enableVertexAttribArray(texcoordIndex)
  gl.vertexAttribPointer(texcoordIndex, 2, gl.FLOAT, false, 0, 0)

  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0,0,255,255]))
  
  watchEffect(() => {
    if (texType.value === 0) {
      if (image.value) {
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image.value)
        gl.generateMipmap(gl.TEXTURE_2D);
        redraw()
      }
    } else {
      gl.bindTexture(gl.TEXTURE_2D, texture)

      const c = document.createElement("canvas");
      const ctx = c.getContext("2d")!;
      const mips = [
        { size: 64, color: "rgb(128,0,255)", },
        { size: 32, color: "rgb(0,0,255)", },
        { size: 16, color: "rgb(255,0,0)", },
        { size:  8, color: "rgb(255,255,0)", },
        { size:  4, color: "rgb(0,255,0)", },
        { size:  2, color: "rgb(0,255,255)", },
        { size:  1, color: "rgb(255,0,255)", },
      ];
      mips.forEach(function(s, level) {
        var size = s.size;
        c.width = size;
        c.height = size;
        ctx.fillStyle = "rgb(255,255,255)";
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = s.color;
        ctx.fillRect(0, 0, size / 2, size / 2);
        ctx.fillRect(size / 2, size / 2, size / 2, size / 2);
        gl.texImage2D(gl.TEXTURE_2D, level, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
        redraw()
      });
    }
  })

  const settings = [
    { x: -1, y:  1, zRot: 0, magFilter: gl.NEAREST, minFilter: gl.NEAREST,                 },
    { x:  0, y:  1, zRot: 0, magFilter: gl.LINEAR,  minFilter: gl.LINEAR,                  },
    { x:  1, y:  1, zRot: 0, magFilter: gl.LINEAR,  minFilter: gl.NEAREST_MIPMAP_NEAREST,  },
    { x: -1, y: -1, zRot: 1, magFilter: gl.LINEAR,  minFilter: gl.LINEAR_MIPMAP_NEAREST,   },
    { x:  0, y: -1, zRot: 1, magFilter: gl.LINEAR,  minFilter: gl.NEAREST_MIPMAP_LINEAR,   },
    { x:  1, y: -1, zRot: 1, magFilter: gl.LINEAR,  minFilter: gl.LINEAR_MIPMAP_LINEAR,    },
  ];
  const xSpacing = 1.2;
  const ySpacing = 0.7;

  const initMatrix = straightPerspective1(edgToRad(60), canvas.width / canvas.height, 1, 2000)
  const cameraMatrix = lookAt([0, 0, 2], [0, 0, 0], [0, 1, 0])
  const viewMatrix = multiply(initMatrix, inverse(cameraMatrix))
  const redraw = () => {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    for (const setting of settings) {
      const matrix = multiply(
        viewMatrix,
        translate(setting.x * xSpacing, setting.y * ySpacing, -0.5 * zDepth),
        rotateZ(setting.zRot * Math.PI),
        scale(1, 1, zDepth),
      )
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, setting.minFilter)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, setting.magFilter)
      gl.uniformMatrix4fv(matrixIndex, false, matrix)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }
  }
  redraw()
}
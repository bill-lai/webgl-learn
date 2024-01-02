import { ref, watch } from "vue";
import { NumArr, createProgramBySource, inverse, multiply, straightPerspective1 } from "../../util";
import { identity, lookAt, rotateX, rotateZ } from "../matrix4";
import { edgToRad } from "../util";
import { indexs, positions, puindexs, uv } from "./data";
import fragSource from "./fragment-shader.frag?raw";
import vertSource from "./vertex-shader.vert?raw";

let offset = 0
const getOffset = () => offset++;

const createDataTexture = (gl: WebGLRenderingContext, data: Float32Array, numComponents: number) => {
  if (!gl.getExtension('OES_texture_float')) {
    throw 'dataTexture不支持float32'
  }
  const numElements = data.length / numComponents
  const texData = new Float32Array(numElements * 4)
  for (let i = 0; i < numElements; i++) {
    for (let j = 0; j < numComponents; j++) {
      texData[i * 4 + j] = data[i * numComponents + j]
    }
  }

  const offset = getOffset();
  const texNumElements = texData.length / 4;
  const width = Math.floor(Math.sqrt(texNumElements))
  const height = Math.ceil(texNumElements / width)

  const texture = gl.createTexture()
  gl.activeTexture(gl.TEXTURE0 + offset);
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, texData)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

  return { position: offset, size: [width, height] }
}

const createCubeTexture = (gl: WebGLRenderingContext) => {
  const offset = getOffset()
  const texture = gl.createTexture()
  gl.activeTexture(gl.TEXTURE0 + offset)
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.LUMINANCE,
    4,
    4,0,
    gl.LUMINANCE,
    gl.UNSIGNED_BYTE,
    new Uint8Array([
      0xDD, 0x99, 0xDD, 0xAA,
      0x88, 0xCC, 0x88, 0xDD,
      0xCC, 0x88, 0xCC, 0xAA,
      0x88, 0xCC, 0x88, 0xCC,
    ])
  )
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

  return offset
}

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext('webgl')!
  const program = createProgramBySource(gl, vertSource, fragSource);
  
  const meshMatrixLoc = gl.getUniformLocation(program, 'meshMatrix')
  const viewMatrixLoc = gl.getUniformLocation(program, 'viewMatrix')
  const projectionMatrixLoc = gl.getUniformLocation(program, 'projectionMatrix')
  const positionTexLoc = gl.getUniformLocation(program, 'positionTex')
  const positionTexSizeLoc = gl.getUniformLocation(program, 'positionTexSize')
  const uvTexLoc = gl.getUniformLocation(program, 'uvTex')
  const uvTexSizeLoc = gl.getUniformLocation(program, 'uvTexSize')
  const cubeTexLoc = gl.getUniformLocation(program, 'cubeTex')
  const indexLoc = gl.getAttribLocation(program, 'a_index')
  
  const { position: positionTex, size: positionTexSize } = createDataTexture(gl, positions, 3)
  const { position: uvTex, size: uvTexSize } = createDataTexture(gl, uv, 2)
  const cubeTex = createCubeTexture(gl)

  console.log(positionTex, uvTex, cubeTex)
  gl.useProgram(program)
  gl.enable(gl.DEPTH_TEST)
  gl.viewport(0, 0, canvas.width, canvas.height)

  gl.uniform1i(positionTexLoc, positionTex)
  gl.uniform2fv(positionTexSizeLoc, positionTexSize)
  gl.uniform1i(uvTexLoc, uvTex)
  gl.uniform2fv(uvTexSizeLoc, uvTexSize)
  gl.uniform1i(cubeTexLoc, cubeTex)

  gl.uniformMatrix4fv(projectionMatrixLoc, false, straightPerspective1(edgToRad(60), canvas.width / canvas.height, 1, 2000))
  gl.uniformMatrix4fv(viewMatrixLoc, false, inverse(lookAt([0, 0.5, 6], [0, 0, 0], [0, 1, 0])))

  const puindexBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, puindexBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, puindexs, gl.STATIC_DRAW)
  gl.enableVertexAttribArray(indexLoc)
  gl.vertexAttribPointer(indexLoc, 2, gl.FLOAT, false, 0, 0)

  const indexBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexs, gl.STATIC_DRAW)


  const redraw = () => {
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT)
    gl.uniformMatrix4fv(meshMatrixLoc, false, meshMatrix.value)
    gl.drawElements(gl.TRIANGLES, indexs.length, gl.UNSIGNED_SHORT, 0)
  }
  const meshMatrix = ref<NumArr>(identity())
  watch(meshMatrix, redraw)

  const animation = (now = 0) => {
    const rotate = (now / 1000) * edgToRad(80)
    meshMatrix.value = multiply(
      rotateX(rotate),
      rotateZ(rotate)
    )
    requestAnimationFrame(animation)
  }
  animation();
}
import { ref, watchEffect } from "vue";
import axios from 'axios'

// 创建定点着色器和片段着色器
export const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader)
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
  }
  return shader
}

// 创建着色程序，连接着色器
export const createProgram = (gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) => {
  const program = gl.createProgram()!
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program))
    gl.deleteProgram(program);
  }
  return program
}

export const createProgramBySource = (gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string) => 
  createProgram(
    gl, 
    createShader(gl, gl.VERTEX_SHADER, vertexSource),
    createShader(gl, gl.FRAGMENT_SHADER, fragmentSource)
  )


export const getColor = () => {
  var r1 = Math.random();
  var b1 = Math.random();
  var g1 = Math.random();

  return new Float32Array([ 
    r1, b1, g1, 1
  ])
}


export const getImage = (src: string): Promise<HTMLImageElement> => {
  const img = new Image()
  img.src = src
  return new Promise<HTMLImageElement>(resolve => {
    img.onload = () => resolve(img)
  })
}


export const getFGeometry = () => new Float32Array([
  // left column
  0, 0,
  30, 0,
  0, 150,
  0, 150,
  30, 0,
  30, 150,

  // top rung
  30, 0,
  100, 0,
  30, 30,
  30, 30,
  100, 0,
  100, 30,

  // middle rung
  30, 60,
  67, 60,
  30, 90,
  30, 90,
  67, 60,
  67, 90,
])

export const edgToRad = (d: number) => d * Math.PI / 180

export const loadImage = (src: string): Promise<HTMLImageElement> => {
  const img = new Image()
  return new Promise((resolve, reject) => {
    img.src = src
    img.onload = () => resolve(img)
    img.onerror = reject
  })
}

export const isTwoPower = (val: number) => (val & (val - 1)) === 0


export const bindModel = (url: string) => {
  const model = ref<Model | null>(null)
  axios.get<Model>(url, { responseType: 'json' })
    .then(res => res.status === 200 && (model.value = res.data))
  return model
}


export const rand = (min: number, max?: number) => {
  if (max === undefined) {
    max = min
    min = 0
  }
  return min + Math.random() * (max - min)
}

export const randInt = (rang: number) => {
  return Math.floor(Math.random() * rang);
}

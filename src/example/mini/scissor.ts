import { rand } from "../util"

export const draw = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext('webgl')!

  gl.enable(gl.SCISSOR_TEST)

  const drawRect = (rect: [number, number, number, number], color: [number, number, number, number]) => {
    gl.scissor(...rect)
    gl.clearColor(...color)
    gl.clear(gl.COLOR_BUFFER_BIT)
  }

  for (let i = 0; i < 3; i++) {
    const x = rand(canvas.width)
    const y = rand(canvas.width)
    const w = rand(canvas.width - x)
    const h = rand(canvas.width - y)
    drawRect([x, y, w, h], [rand(1), rand(1), rand(1), 1])
  }
}

import { init } from './nearest-line/index.ts'
// import { init } from '../demo/demo29-glgpu'

export const initCanvas = (canvas: HTMLCanvasElement) => {
  init(canvas)
}
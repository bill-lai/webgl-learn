
import { init } from './tile-draw/index.ts'
// import { init } from '../demo/demo27-frame-render'


export const initCanvas = (canvas: HTMLCanvasElement) => {
  init(canvas)
}
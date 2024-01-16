// export { init } from './canvas2d'
export { init } from './webgl'

export const upDown = (v: number) => Math.sin(v) * 0.5 + 0.5
export const mix = (min: number, max: number, t: number) => min + (min - max) * t

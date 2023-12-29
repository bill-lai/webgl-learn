import { rand } from "../util"

export const points = new Float32Array([
  100, 100, 0, 0,
  200, 100, 0, 0,
])

export const lines = new Float32Array([
  25,  50,   0, 0,
  25, 150,   0, 0,
  90,  50,   0, 0,
  90, 150,   0, 0,
 125,  50,   0, 0,
 125, 150,   0, 0,
 185,  50,   0, 0,
 185, 150,   0, 0,
 225,  50,   0, 0,
 225, 150,   0, 0,
])

export const createPoints = (size: number[], velocitySize: number[], num: number) => {
  const points = []
  for (let i = 0; i < num; i++) {
    points.push(
      rand(size[0]),
      rand(size[1]),
      rand(-velocitySize[0], velocitySize[0]),
      rand(-velocitySize[1], velocitySize[1]),
    )
  }
  return points
}
import { createCone, createCube, createPlaneVertices, createSphereVertices, createTriangle } from "../../util";
import { rand } from "../util";

const spheres = [
  createSphereVertices(0.5, 24, 12),
  createCube(1),
  createCone(0.5, 0, 1, 6, 1),
  createPlaneVertices(1, 1),
  createTriangle()
]

export const getItem = () => {
  const shpere = spheres[rand(spheres.length) | 0]
  const color: [number, number, number, number] = [rand(1), rand(1), rand(1), 1]
  return {
    shpere,
    color
  }
}
import { mat4 } from "gl-matrix";
import materials from "./materials.json";

const objectMaterials = Object.values(materials);
const numX = 5;
const numY = Number(objectMaterials.length / numX);
const content = 1.4;

const objectInitMatrixs = objectMaterials.map((_, i) => {
  const x = ((i % numX) - (numX - 1) / 2) * content;
  const y = (Math.floor(i / numX) - (numY - 1) / 2) * content;

  const mat = mat4.identity(mat4.create());
  mat4.translate(mat, mat, [x, y, 0]);

  return mat;
});

export { objectMaterials, objectInitMatrixs };

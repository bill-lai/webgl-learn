import { ReadonlyVec3, glMatrix, mat4, vec3 } from "gl-matrix";

const identity = mat4.identity(mat4.create());

export const translate = (v: ReadonlyVec3, mutMat: mat4 = identity) =>
  mat4.translate(mat4.create(), mutMat, v);

export const scale = (v: ReadonlyVec3, mutMat: mat4 = identity) =>
  mat4.scale(mat4.create(), mutMat, v);

export const rotate = (edg: number, v: ReadonlyVec3, mutMat: mat4 = identity) =>
  mat4.rotate(mat4.create(), mutMat, glMatrix.toRadian(edg), v);

export const multiply = (...mats: mat4[]): mat4 => {
  if (mats.length === 1) {
    return mats[0];
  }
  const nMat = mat4.multiply(mat4.create(), mats[0], mats[1]);
  if (mats.length === 2) {
    return nMat;
  }

  return multiply(nMat, ...mats.slice(2));
};

export const createTransform = (mutMat: mat4 = identity) => {
  const self = {
    translate: (v: ReadonlyVec3) => createTransform(translate(v, mutMat)),

    scale: (v: ReadonlyVec3) => createTransform(scale(v, mutMat)),

    rotate: (edg: number, v: ReadonlyVec3) =>
      createTransform(rotate(edg, v, mutMat)),

    rotateX: (edg: number) => createTransform(rotate(edg, [1, 0, 0], mutMat)),

    rotateY: (edg: number) => createTransform(rotate(edg, [0, 1, 0], mutMat)),

    rotateZ: (edg: number) => createTransform(rotate(edg, [0, 0, 1], mutMat)),

    multiply: (...mats: mat4[]) => createTransform(multiply(mutMat, ...mats)),

    get: () => mutMat,

    transform: (a: ReadonlyVec3) =>
      vec3.transformMat4(vec3.create(), a, mutMat),
  };
  return self;
};

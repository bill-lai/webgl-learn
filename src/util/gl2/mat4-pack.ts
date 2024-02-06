import { ReadonlyVec3, glMatrix, mat4, vec3 } from "gl-matrix";

const identity = mat4.identity(mat4.create());

export const translate = (
  v: ReadonlyVec3,
  mutMat: mat4 = identity,
  out = mat4.create()
) => mat4.translate(out, mutMat, v);

export const scale = (
  v: ReadonlyVec3,
  mutMat: mat4 = identity,
  out = mat4.create()
) => mat4.scale(out, mutMat, v);

export const rotate = (
  edg: number,
  v: ReadonlyVec3,
  mutMat: mat4 = identity,
  out = mat4.create()
) => mat4.rotate(out, mutMat, glMatrix.toRadian(edg), v);

export const multiply = (out = mat4.create(), ...mats: mat4[]): mat4 => {
  if (mats.length === 1) {
    return mats[0];
  }
  const nMat = mat4.multiply(out, mats[0], mats[1]);
  if (mats.length === 2) {
    return nMat;
  }

  return multiply(out, nMat, ...mats.slice(2));
};

export type CreateTransform = {
  initMutMat?: mat4;
  out?: mat4;
  reverse?: boolean;
  store?: ((mutMat: mat4) => mat4)[];
};
export const createTransform = (args: CreateTransform = {}) => {
  const initMutMat = args.initMutMat || identity;
  const out = args.out || mat4.copy(mat4.create(), initMutMat);
  const reverse = args.reverse === undefined ? false : !!args.reverse;
  const store = args.store || [];

  let mat: mat4;
  const push = (fn: (mutMat: mat4) => mat4) => {
    return createTransform({
      initMutMat: mat || initMutMat,
      out,
      reverse,
      store: [...store, fn],
    });
  };

  const self = {
    store,
    translate: (v: ReadonlyVec3) =>
      push((mutMat) => translate(v, mutMat, mutMat)),

    scale: (v: ReadonlyVec3) => push((mutMat) => scale(v, mutMat, mutMat)),

    rotate: (edg: number, v: ReadonlyVec3) =>
      push((mutMat) => rotate(edg, v, mutMat, mutMat)),

    rotateX: (edg: number) =>
      push((mutMat) => rotate(edg, [1, 0, 0], mutMat, mutMat)),

    rotateY: (edg: number) =>
      push((mutMat) => rotate(edg, [0, 1, 0], mutMat, mutMat)),

    rotateZ: (edg: number) =>
      push((mutMat) => rotate(edg, [0, 0, 1], mutMat, mutMat)),

    multiply: (...mats: mat4[]) =>
      push((mutMat) => multiply(mutMat, mutMat, ...mats)),

    get: () => {
      if (!mat) {
        if (!reverse) {
          mat = mat4.copy(mat4.create(), initMutMat);
          store.reduce((t, c) => c(t), mat);
          mat4.copy(out, mat);
        } else {
          mat = mat4.identity(mat4.create());
          store.reduceRight((t, c) => c(t), mat);
          multiply(mat, mat, initMutMat);
          mat4.copy(out, mat);
        }
        store.length = 0;
      }
      return mat;
    },

    gen: () => {
      self.get();
      return self;
    },

    getOut: () => {
      if (!mat) {
        self.get();
      }
      return out;
    },

    transform: (a: ReadonlyVec3, out = vec3.create()) =>
      vec3.transformMat4(out, a, self.get()),
  };
  return self;
};

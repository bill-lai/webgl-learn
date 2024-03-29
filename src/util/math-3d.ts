import { NumArr, lerp, v2 } from "./math-2d";
import {
  addVectors,
  cross,
  dot,
  normalVector,
  positionTransform,
  rotateY,
  scaleVector,
  subtractVectors,
} from "./mt4";

type Buffer = Float32Array | Uint32Array | Uint8Array | Uint16Array | number[];
type ModalArrays = { positions: NumArr; texcoords: NumArr; includes?: NumArr };

export const bufferPush = (
  buffer: Buffer,
  offsetIndex: number,
  data: number | NumArr
) => {
  const item = typeof data === "number" ? [data] : data;
  const range = item.length;
  const offset = offsetIndex * range;
  for (let i = 0; i < range; i++) {
    buffer[offset + i] = item[i];
  }
};

/**
 * 通过平面坐标生成模型，
 * 通过沿y轴旋转的方式
 */
export const getModelByPlanPoints = (
  points: NumArr[],
  startAngle: number,
  endAngle: number,
  numDivisions: number,
  capStart = false,
  capEnd = false,
  forward = true
) => {
  const vOffset = Number(capStart);
  const column = points.length + vOffset + Number(capEnd);
  const columnDown = column - 1;
  const vertexCount = column * (numDivisions + 1);
  const positions = new Float32Array(vertexCount * 3);
  const texcoords = new Float32Array(vertexCount * 2);
  const includes = new Uint16Array(numDivisions * columnDown * 6);
  const vcoors: number[] = [];

  let vlength = 0;
  for (let i = 0; i < points.length - 1; i++) {
    vcoors.push(vlength);
    vlength += v2.distance(points[i], points[i + 1]);
  }
  vcoors.push(vlength);
  vcoors.forEach((v, i) => (vcoors[i] = v / vlength));

  let index = 0;
  for (let i = 0; i <= numDivisions; i++) {
    const u = i / numDivisions;
    const angle = lerp(startAngle, endAngle, i / numDivisions) % (2 * Math.PI);
    const mt = rotateY(angle);

    if (capStart) {
      bufferPush(positions, index, [0, points[0][1], 0]);
      bufferPush(texcoords, index, [u, 0]);
      index++;
    }

    points.forEach((point, ndx) => {
      bufferPush(positions, index, positionTransform([...point, 0], mt));

      bufferPush(texcoords, index, [u, vcoors[ndx]]);
      index++;
    });

    if (capEnd) {
      bufferPush(positions, index, [0, points[points.length - 1][1], 0]);
      bufferPush(texcoords, index, [u, 1]);
      index++;
    }
  }

  index = 0;
  for (let i = 0; i < numDivisions; i++) {
    const currentColumn = column * i;
    const nextColumn = column * (i + 1);

    for (let j = 0; j < columnDown; j++) {
      const data = forward
        ? [
            currentColumn + j,
            currentColumn + j + 1,
            nextColumn + j,
            currentColumn + j + 1,
            nextColumn + j + 1,
            nextColumn + j,
          ]
        : [
            currentColumn + j,
            nextColumn + j,
            currentColumn + j + 1,
            currentColumn + j + 1,
            nextColumn + j,
            nextColumn + j + 1,
          ];

      bufferPush(includes, index++, data);
    }
  }

  return { positions, texcoords, includes };
};

// 顶点数据迭代器
export type VIInterator = {
  length: number;
  [Symbol.iterator](): Generator<number>;
  next(): number;
  reset(): void;
};
export const makeVertexIndiceInterator = (arrays: ModalArrays): VIInterator => {
  const getIndex =
    "includes" in arrays
      ? (ndx: number) => arrays.includes![ndx]
      : (ndx: number) => ndx;
  const length = arrays.includes
    ? arrays.includes.length
    : Math.floor(arrays.positions.length / 3);

  let ndx = 0;
  return {
    length,
    *[Symbol.iterator]() {
      for (let i = 0; i < length; i++) {
        yield getIndex(i);
      }
    },
    next() {
      return ndx >= length ? -1 : getIndex(ndx++);
    },
    reset() {
      ndx = 0;
    },
  };
};

// 获取模型所有面的法向量
export const getFaceNormals = (
  arrays: ModalArrays,
  numFaces = Math.floor(arrays.positions.length / 3),
  vertexIndices: VIInterator = makeVertexIndiceInterator(arrays)
) => {
  const faceNormals = new Float32Array(numFaces * 3);
  let index = 0;
  for (let i = 0; i < numFaces; i++) {
    const aoffset = vertexIndices.next() * 3;
    const boffset = vertexIndices.next() * 3;
    const coffset = vertexIndices.next() * 3;
    const a = arrays.positions.slice(aoffset, aoffset + 3);
    const b = arrays.positions.slice(boffset, boffset + 3);
    const c = arrays.positions.slice(coffset, coffset + 3);
    const ab = subtractVectors(a, b);
    const bc = subtractVectors(c, b);
    bufferPush(faceNormals, index++, normalVector(cross(bc, ab)));
  }
  vertexIndices.reset();
  return faceNormals;
};

// 顶点重复检查，返回原顶点索引includes
export const vertexDeduplication = (positions: NumArr) => {
  const tempVerts: { [key in string]: number } = {};
  let index = 0;
  const getVertIndex = ([x, y, z]: NumArr) => {
    const key = x + "," + y + "," + z;
    return key in tempVerts ? tempVerts[key] : (tempVerts[key] = index++);
  };

  const vertexNum = positions.length / 3;
  const includes = new Uint16Array(vertexNum);
  for (let i = 0; i < vertexNum; i++) {
    const offset = i * 3;
    bufferPush(includes, i, getVertIndex(positions.slice(offset, offset + 3)));
  }
  return includes;
};

// 通过不断加点生成模型
export const generateModalFactory = () => {
  let index = 0;
  const itemsArray: NumArr[][] = [];
  const includes: number[] = [];
  const verts: { [key in string]: number } = {};

  return {
    tempItemsArray: itemsArray,
    includes,
    setItem(...datas: NumArr[]) {
      if (!datas.length) return;
      const id = datas.map((item) => item.join(",")).join(",");

      if (!(id in verts)) {
        verts[id] = index++;
        for (let i = 0; i < datas.length; i++) {
          if (!itemsArray[i]) {
            itemsArray[i] = [];
          }
          itemsArray[i].push(datas[i]);
        }
      }
      includes.push(verts[id]);
    },
    get() {
      return {
        itemsArray: itemsArray.map((items) => {
          const array: number[] = [];
          items.forEach((item) => array.push(...item));
          return array;
        }),
        includes,
      };
    },
    getWhole() {
      const make = makeVertexIndiceInterator({ includes } as any);
      const result: NumArr[][] = [];
      itemsArray.forEach(() => {
        result.push([]);
      });
      for (const index of make) {
        itemsArray.forEach((items, i) => {
          result[i].push(items[index]);
        });
      }
      return {
        itemsArray: result,
        includes,
      };
    },
    appendGenerate(newItems: NumArr[]) {
      const factory = generateModalFactory();
      const data = this.getWhole().itemsArray;
      for (let i = 0; i < newItems.length; i++) {
        factory.setItem(...data.map((items) => items[i]), newItems[i]);
      }
      return factory;
    },
  };
};

// 生成模型法向量，并去除重复点，
// 给定最大角度，对于顶点多面法向量角度超过最大角度则求取平均值
export const generateNormals = (arrays: ModalArrays, maxAngle: number) => {
  const vertexIndices = makeVertexIndiceInterator(arrays);
  const numFaces = Math.floor(vertexIndices.length / 3);

  // 1.点去重，如果不去重会造成点顶点多面法向量角度不正确，记录每个点的新位置
  const vertIncludes = vertexDeduplication(arrays.positions);
  // 2.记录所有去重后顶点所在的面
  const vertexFaces: number[][] = [];
  for (let i = 0; i < numFaces; i++) {
    for (let j = 0; j < 3; j++) {
      const ndx = vertexIndices.next();
      const sharedNdx = vertIncludes[ndx];
      (vertexFaces[sharedNdx] || (vertexFaces[sharedNdx] = [])).push(i);
    }
  }
  vertexIndices.reset();

  // 3.计算所有面的法向量
  const faceNormals = getFaceNormals(arrays, numFaces, vertexIndices);
  const generateModal = generateModalFactory();

  // 4.计算顶点多个面的夹角是否超过指定值是否超过，找过则合并
  const maxAngleCos = Math.cos(maxAngle);
  for (let i = 0; i < numFaces; i++) {
    const thisFaceNormal = faceNormals.slice(i * 3, i * 3 + 3);
    for (let j = 0; j < 3; j++) {
      const ndx = vertexIndices.next();
      const sharedNdx = vertIncludes[ndx];
      const indexFaces = vertexFaces[sharedNdx];
      let normal: NumArr = [0, 0, 0];
      indexFaces.forEach((index) => {
        const otherFaceNormal = faceNormals.slice(index * 3, index * 3 + 3);
        // 点乘结果为cos值 方向相同为 1 相反为-1  方向值小于分割值则合并成为一个方向
        if (dot(thisFaceNormal, otherFaceNormal) > maxAngleCos) {
          addVectors(normal, otherFaceNormal, normal);
        }
      });
      normalVector(normal, normal);
      const poffset = ndx * 3;
      const toffset = ndx * 2;
      generateModal.setItem(
        arrays.positions.slice(poffset, poffset + 3),
        normal,
        arrays.texcoords.slice(toffset, toffset + 2)
      );
    }
  }

  const model = generateModal.get();
  return {
    positions: new Float32Array(model.itemsArray[0]),
    normal: new Float32Array(model.itemsArray[1]),
    texcoords: new Float32Array(model.itemsArray[2]),
    includes: new Uint16Array(model.includes),
  };
};

// 生成顶点切线
export const generateTangents = (arrays: ModalArrays) => {
  const vertexIndices = makeVertexIndiceInterator(arrays);
  const numFace = vertexIndices.length / 3;
  const tangents: NumArr[] = [];

  for (let i = 0; i < numFace; i++) {
    const n1 = vertexIndices.next();
    const n2 = vertexIndices.next();
    const n3 = vertexIndices.next();

    const p1 = arrays.positions.slice(n1 * 3, n1 * 3 + 3);
    const p2 = arrays.positions.slice(n2 * 3, n2 * 3 + 3);
    const p3 = arrays.positions.slice(n3 * 3, n3 * 3 + 3);

    const uv1 = arrays.texcoords.slice(n1 * 2, n1 * 2 + 2);
    const uv2 = arrays.texcoords.slice(n2 * 2, n2 * 2 + 2);
    const uv3 = arrays.texcoords.slice(n3 * 2, n3 * 2 + 2);

    const dp12 = subtractVectors(p2, p1);
    const dp13 = subtractVectors(p3, p1);
    const duv12 = v2.subtract(uv2, uv1);
    const duv13 = v2.subtract(uv3, uv1);

    const f = 1.0 / (duv12[0] * duv13[1] - duv13[0] * duv12[1]);
    const tangent = Number.isFinite(f)
      ? normalVector(
          scaleVector(
            subtractVectors(
              scaleVector(dp12, duv13[1]),
              scaleVector(dp13, duv12[1])
            ),
            f
          )
        )
      : [1, 0, 0];

    tangents.push(tangent, tangent, tangent);
  }
  return tangents;
};

// 获取positions的范围box
export const getPositionsBox = (
  array: NumArr | NumArr[],
  eBox: { max: number[]; min: number[] } = {
    max: [-Infinity, -Infinity, -Infinity],
    min: [Infinity, Infinity, Infinity],
  }
) => {
  const positionsArray = (
    typeof array[0] !== "number" ? array : [array]
  ) as NumArr[];

  const max = [...eBox.max];
  const min = [...eBox.min];

  for (let j = 0; j < positionsArray.length; j++) {
    const positions = positionsArray[j];
    for (let i = 0; i < positions.length; i += 3) {
      max[0] = Math.max(positions[i], max[0]);
      max[1] = Math.max(positions[i + 1], max[1]);
      max[2] = Math.max(positions[i + 2], max[2]);
      min[0] = Math.min(positions[i], min[0]);
      min[1] = Math.min(positions[i + 1], min[1]);
      min[2] = Math.min(positions[i + 2], min[2]);
    }
  }
  return { max, min };
};

// 通过box获取最佳视角
export const getCameraConfigOnBox = (
  box: { max: NumArr; min: NumArr },
  fieldOnView: number,
  padding = 0.2
) => {
  const midX = lerp(box.min[0], box.max[0], 0.5);
  const midY = lerp(box.min[1], box.max[1], 0.5);
  const midZ = lerp(box.min[2], box.max[2], 0.5);
  const zDis =
    ((box.max[1] - box.min[1]) * (0.5 + padding / 2)) /
    Math.tan(fieldOnView / 2);

  return {
    position: [midX, midY, zDis + midZ],
    target: [midX, midY, midZ],
    up: [0, 1, 0],
  };
};

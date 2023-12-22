import chroma from "chroma-js";
import { rand as baseRand, randInt } from "./util";
import { bufferPush, makeVertexIndiceInterator } from "../util";

/**
 * 创建球体
 * @param radius 半径
 * @param subdivisionsAxis x轴上的系分数
 * @returns {
 *  positions: 顶点
 *  normals: 法线
 *  texCoords: 贴图坐标
 *  includes: 所有eles的索引值
 * }
 */
export const createBall = (
  radius: number,
  subdivisionsAxis: number,
): ShapeAttrib => {
  const xSubdivisionsAxis = subdivisionsAxis
  const ySubdivisionsAxis = xSubdivisionsAxis / 2;

  const vertexCount = (xSubdivisionsAxis + 1) * (ySubdivisionsAxis + 1)
  const positions = new Float32Array(vertexCount * 3)
  const normals = new Float32Array(vertexCount * 3)
  const texCoords = new Float32Array(vertexCount * 2)

  let index = 0
  for (let x = 0; x <= xSubdivisionsAxis; x++) {
    for (let y = 0; y <= ySubdivisionsAxis; y++) {
      const u = x / xSubdivisionsAxis;
      const v = y / ySubdivisionsAxis;
      // X轴 z为0 方向的夹角
      const theta = 2 * Math.PI * u;
      //  Z轴与点方向方向夹角
      const phi = Math.PI * v
      // 单位化后的 x y z 
      const uz = Math.cos(phi)
      const uy = Math.sin(phi) * Math.sin(theta)
      const ux = Math.sin(phi) * Math.cos(theta)
      const offset = index * 3

      positions[offset + 0] = ux * radius
      positions[offset + 1] = uy * radius
      positions[offset + 2] = uz * radius
      normals[offset + 0] = ux
      normals[offset + 1] = uy
      normals[offset + 2] = uz
      texCoords[index * 2 + 0] = 1 - u
      texCoords[index * 2 + 1] = v
      index++
    }
  }

  const includes = new Uint16Array(xSubdivisionsAxis * ySubdivisionsAxis * 2 * 3)
  const rawCount = xSubdivisionsAxis + 1;
  index = 0;
  for (let x = 0; x < xSubdivisionsAxis; x++) {
    for (let y = 0; y < ySubdivisionsAxis; y++) {
      const offset = index * 6;
      includes[offset + 0] = y * rawCount + x
      includes[offset + 1] = y * rawCount + x + 1
      includes[offset + 2] = (y + 1) * rawCount + x

      includes[offset + 3] = (y + 1) * rawCount + x
      includes[offset + 4] = y * rawCount + x + 1
      includes[offset + 5] = (y + 1) * rawCount + x + 1
      index++
    }
  }

  let max = includes[0]
  for (let i = 0; i < includes.length; i++) {
    if (max < includes[i]) {
      max = includes[i]
    }
  }

  return {
    includes,
    positions,
    normals,
    texCoords
  }
}

/**
 * 创建三角形
 */
export const createTriangle = (): ShapeAttrib => ({
  includes: new Uint16Array([0, 1, 2]),
  positions: new Float32Array([
    0, -10, 0, 10, 10, 0, -10, 10, 0
  ]),
  normals: new Float32Array([
    0, 0, 1, 0, 0, 1, 0, 0, 1
  ]),
  texCoords: new Float32Array([
    0.5, 0, 1, 1, 0, 1
  ])
})

export const createRectangle = (): ShapeAttrib => ({
  includes: new Uint16Array([0, 1, 2, 2, 1, 3]),
  positions: new Float32Array([
    0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0
  ]),
  normals: new Float32Array([
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1
  ]),
  texCoords: new Float32Array([
    0, 0, 0, 1, 1, 0, 1, 1
  ])
})

// 创建立方体
export const createCube = (size: number): ShapeAttrib => {
  const k = size / 2;

  const CUBE_FACE_INDICES = [
    [3, 7, 5, 1], // right
    [6, 2, 0, 4], // left
    [6, 7, 3, 2], // ??
    [0, 1, 5, 4], // ??
    [7, 6, 4, 5], // front
    [2, 3, 1, 0], // back
  ];

  const cornerVertices = [
    [-k, -k, -k],
    [+k, -k, -k],
    [-k, +k, -k],
    [+k, +k, -k],
    [-k, -k, +k],
    [+k, -k, +k],
    [-k, +k, +k],
    [+k, +k, +k],
  ];

  const faceNormals = [
    [+1, +0, +0],
    [-1, +0, +0],
    [+0, +1, +0],
    [+0, -1, +0],
    [+0, +0, +1],
    [+0, +0, -1],
  ];

  const uvCoords = [
    [1, 0],
    [0, 0],
    [0, 1],
    [1, 1],
  ];

  const numVertices = 6 * 4;
  const positions = new Float32Array(3 * numVertices);
  const normals   = new Float32Array(3 * numVertices);
  const texCoords = new Float32Array(2 * numVertices);
  const indices   = new Uint16Array(3 * 6 * 2);

  let index = 0
  for (let f = 0; f < 6; ++f) {
    const faceIndices = CUBE_FACE_INDICES[f];
    for (let v = 0; v < 4; ++v) {
      const position = cornerVertices[faceIndices[v]];
      const normal = faceNormals[f];
      const uv = uvCoords[v];

      positions[index * 3] = position[0]
      positions[index * 3 + 1] = position[1]
      positions[index * 3 + 2] = position[2]
      normals[index * 3] = normal[0]
      normals[index * 3 + 1] = normal[1]
      normals[index * 3 + 2] = normal[2]
      texCoords[index * 2] = uv[0]
      texCoords[index * 2 + 1] = uv[1]
      index++
    }
    // Two triangles make a square face.
    const offset = 4 * f;
    indices[f * 6] = offset + 0
    indices[f * 6 + 1] = offset + 1
    indices[f * 6 + 2] = offset + 2
    indices[f * 6 + 3] = offset + 0
    indices[f * 6 + 4] = offset + 2
    indices[f * 6 + 5] = offset + 3
  }

  return {
    positions: positions,
    normals: normals,
    texCoords: texCoords,
    includes: indices,
  };

}


export const createCone = (
  bottomRadius: number,
  topRadius: number,
  height: number,
  radialSubdivisions: number,
  verticalSubdivisions: number,
): ShapeAttrib => {
  if (radialSubdivisions < 3) {
    throw Error('radialSubdivisions must be 3 or greater');
  }

  if (verticalSubdivisions < 1) {
    throw Error('verticalSubdivisions must be 1 or greater');
  }

  const topCap = true;
  const bottomCap = true;

  const extra = (topCap ? 2 : 0) + (bottomCap ? 2 : 0);

  const numVertices = (radialSubdivisions + 1) * (verticalSubdivisions + 1 + extra);
  const positions = new Float32Array(3 * numVertices);
  const normals   = new Float32Array(3 * numVertices);
  const texCoords = new Float32Array(2 * numVertices);
  const indices   = new Uint16Array(3 * radialSubdivisions * (verticalSubdivisions + extra) * 2)

  const vertsAroundEdge = radialSubdivisions + 1;

  // The slant of the cone is constant across its surface
  const slant = Math.atan2(bottomRadius - topRadius, height);
  const cosSlant = Math.cos(slant);
  const sinSlant = Math.sin(slant);

  const start = topCap ? -2 : 0;
  const end = verticalSubdivisions + (bottomCap ? 2 : 0);
  let index = 0

  for (let yy = start; yy <= end; ++yy) {
    let v = yy / verticalSubdivisions;
    let y = height * v;
    let ringRadius;
    if (yy < 0) {
      y = 0;
      v = 1;
      ringRadius = bottomRadius;
    } else if (yy > verticalSubdivisions) {
      y = height;
      v = 1;
      ringRadius = topRadius;
    } else {
      ringRadius = bottomRadius +
        (topRadius - bottomRadius) * (yy / verticalSubdivisions);
    }
    if (yy === -2 || yy === verticalSubdivisions + 2) {
      ringRadius = 0;
      v = 0;
    }
    y -= height / 2;
    for (let ii = 0; ii < vertsAroundEdge; ++ii) {
      const sin = Math.sin(ii * Math.PI * 2 / radialSubdivisions);
      const cos = Math.cos(ii * Math.PI * 2 / radialSubdivisions);
      positions[index * 3] = sin * ringRadius
      positions[index * 3 + 1] = y
      positions[index * 3 + 2] = cos * ringRadius
      normals[index * 3] =  (yy < 0 || yy > verticalSubdivisions) ? 0 : (sin * cosSlant)
      normals[index * 3 + 1] = (yy < 0) ? -1 : (yy > verticalSubdivisions ? 1 : sinSlant)
      normals[index * 3 + 2] = (yy < 0 || yy > verticalSubdivisions) ? 0 : (cos * cosSlant)
      texCoords[index * 2] = (ii / radialSubdivisions)
      texCoords[index * 2 + 1] = 1 - v
      index++
    }
  }

  index = 0
  for (let yy = 0; yy < verticalSubdivisions + extra; ++yy) {
    for (let ii = 0; ii < radialSubdivisions; ++ii) {
      indices[index * 6] = vertsAroundEdge * (yy + 0) + 0 + ii
      indices[index * 6 + 1] = vertsAroundEdge * (yy + 0) + 1 + ii
      indices[index * 6 + 2] = vertsAroundEdge * (yy + 1) + 1 + ii
      
      indices[index * 6 + 3] = vertsAroundEdge * (yy + 0) + 0 + ii
      indices[index * 6 + 4] = vertsAroundEdge * (yy + 1) + 1 + ii
      indices[index * 6 + 5] = vertsAroundEdge * (yy + 1) + 0 + ii

      index++
    }
  }

  return {
    positions: positions,
    normals: normals,
    texCoords: texCoords,
    includes: indices,
  };
}


export type ShapeAttrib = {
  positions: Float32Array;
  normals?: Float32Array;
  texCoords?: Float32Array;
  includes?: Uint16Array;
};

export const randColorBuffer = (shapeAttrib: ShapeAttrib) => {
  const interator = makeVertexIndiceInterator(shapeAttrib as any)
  const numElements = interator.length
  const vcolors = new Float32Array(4 * numElements)

  for (let i = 0; i < numElements; i+= 3) {
    const rgba = chroma.hsv(baseRand(120, 360), 1, 1).gl()
    for (let j = 0; j < 3; j++) {
      const index = interator.next()
      bufferPush(vcolors, index, rgba)
    }
  }
  return vcolors
  

}
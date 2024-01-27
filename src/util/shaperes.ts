import { NumArr, edgToRad, getImageData, identity } from ".";
import { bufferPush, generateNormals } from "./math-3d";

export type ShapeAttrib = {
  positions: Float32Array;
  normals: Float32Array;
  includes: Uint16Array;
  texcoords?:Float32Array; 
  texCoords: Float32Array;
};

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
  subdivisionsAxis: number
): ShapeAttrib => {
  const xSubdivisionsAxis = subdivisionsAxis;
  const ySubdivisionsAxis = xSubdivisionsAxis / 2;

  const vertexCount = (xSubdivisionsAxis + 1) * (ySubdivisionsAxis + 1);
  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const texCoords = new Float32Array(vertexCount * 2);

  let index = 0;
  for (let x = 0; x <= xSubdivisionsAxis; x++) {
    for (let y = 0; y <= ySubdivisionsAxis; y++) {
      const u = x / xSubdivisionsAxis;
      const v = y / ySubdivisionsAxis;
      // X轴 z为0 方向的夹角
      const theta = 2 * Math.PI * u;
      //  Z轴与点方向方向夹角
      const phi = Math.PI * v;
      // 单位化后的 x y z
      const uz = Math.cos(phi);
      const uy = Math.sin(phi) * Math.sin(theta);
      const ux = Math.sin(phi) * Math.cos(theta);
      const offset = index * 3;

      positions[offset + 0] = ux * radius;
      positions[offset + 1] = uy * radius;
      positions[offset + 2] = uz * radius;
      normals[offset + 0] = ux;
      normals[offset + 1] = uy;
      normals[offset + 2] = uz;
      texCoords[index * 2 + 0] = 1 - u;
      texCoords[index * 2 + 1] = v;
      index++;
    }
  }

  const includes = new Uint16Array(
    xSubdivisionsAxis * ySubdivisionsAxis * 2 * 3
  );
  const rawCount = xSubdivisionsAxis + 1;
  index = 0;
  for (let x = 0; x < xSubdivisionsAxis; x++) {
    for (let y = 0; y < ySubdivisionsAxis; y++) {
      const offset = index * 6;
      includes[offset + 0] = y * rawCount + x;
      includes[offset + 1] = y * rawCount + x + 1;
      includes[offset + 2] = (y + 1) * rawCount + x;

      includes[offset + 3] = (y + 1) * rawCount + x;
      includes[offset + 4] = y * rawCount + x + 1;
      includes[offset + 5] = (y + 1) * rawCount + x + 1;
      index++;
    }
  }

  let max = includes[0];
  for (let i = 0; i < includes.length; i++) {
    if (max < includes[i]) {
      max = includes[i];
    }
  }

  return {
    includes,
    positions,
    normals,
    texCoords,
  };
};

/**
 * 创建三角形
 */
export const createTriangle = (): ShapeAttrib => ({
  includes: new Uint16Array([0, 1, 2]),
  positions: new Float32Array([0, -1, 0, 1, 1, 0, -1, 1, 0]),
  normals: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]),
  texCoords: new Float32Array([0.5, 0, 1, 1, 0, 1]),
});

export const createRectangle = (): ShapeAttrib => ({
  includes: new Uint16Array([0, 1, 2, 2, 1, 3]),
  positions: new Float32Array([0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0]),
  normals: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]),
  texCoords: new Float32Array([0, 0, 0, 1, 1, 0, 1, 1]),
});

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
  const normals = new Float32Array(3 * numVertices);
  const texCoords = new Float32Array(2 * numVertices);
  const indices = new Uint16Array(3 * 6 * 2);

  let index = 0;
  for (let f = 0; f < 6; ++f) {
    const faceIndices = CUBE_FACE_INDICES[f];
    for (let v = 0; v < 4; ++v) {
      const position = cornerVertices[faceIndices[v]];
      const normal = faceNormals[f];
      const uv = uvCoords[v];

      positions[index * 3] = position[0];
      positions[index * 3 + 1] = position[1];
      positions[index * 3 + 2] = position[2];
      normals[index * 3] = normal[0];
      normals[index * 3 + 1] = normal[1];
      normals[index * 3 + 2] = normal[2];
      texCoords[index * 2] = uv[0];
      texCoords[index * 2 + 1] = uv[1];
      index++;
    }
    // Two triangles make a square face.
    const offset = 4 * f;
    indices[f * 6] = offset + 0;
    indices[f * 6 + 1] = offset + 1;
    indices[f * 6 + 2] = offset + 2;
    indices[f * 6 + 3] = offset + 0;
    indices[f * 6 + 4] = offset + 2;
    indices[f * 6 + 5] = offset + 3;
  }

  return {
    positions: positions,
    normals: normals,
    texcoords: texCoords,
    texCoords: texCoords,
    includes: indices,
  };
};

export const createCone = (
  bottomRadius: number,
  topRadius: number,
  height: number,
  radialSubdivisions: number,
  verticalSubdivisions: number
): ShapeAttrib => {
  if (radialSubdivisions < 3) {
    throw Error("radialSubdivisions must be 3 or greater");
  }

  if (verticalSubdivisions < 1) {
    throw Error("verticalSubdivisions must be 1 or greater");
  }

  const topCap = true;
  const bottomCap = true;

  const extra = (topCap ? 2 : 0) + (bottomCap ? 2 : 0);

  const numVertices =
    (radialSubdivisions + 1) * (verticalSubdivisions + 1 + extra);
  const positions = new Float32Array(3 * numVertices);
  const normals = new Float32Array(3 * numVertices);
  const texCoords = new Float32Array(2 * numVertices);
  const indices = new Uint16Array(
    3 * radialSubdivisions * (verticalSubdivisions + extra) * 2
  );

  const vertsAroundEdge = radialSubdivisions + 1;

  // The slant of the cone is constant across its surface
  const slant = Math.atan2(bottomRadius - topRadius, height);
  const cosSlant = Math.cos(slant);
  const sinSlant = Math.sin(slant);

  const start = topCap ? -2 : 0;
  const end = verticalSubdivisions + (bottomCap ? 2 : 0);
  let index = 0;

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
      ringRadius =
        bottomRadius + (topRadius - bottomRadius) * (yy / verticalSubdivisions);
    }
    if (yy === -2 || yy === verticalSubdivisions + 2) {
      ringRadius = 0;
      v = 0;
    }
    y -= height / 2;
    for (let ii = 0; ii < vertsAroundEdge; ++ii) {
      const sin = Math.sin((ii * Math.PI * 2) / radialSubdivisions);
      const cos = Math.cos((ii * Math.PI * 2) / radialSubdivisions);
      positions[index * 3] = sin * ringRadius;
      positions[index * 3 + 1] = y;
      positions[index * 3 + 2] = cos * ringRadius;
      normals[index * 3] =
        yy < 0 || yy > verticalSubdivisions ? 0 : sin * cosSlant;
      normals[index * 3 + 1] =
        yy < 0 ? -1 : yy > verticalSubdivisions ? 1 : sinSlant;
      normals[index * 3 + 2] =
        yy < 0 || yy > verticalSubdivisions ? 0 : cos * cosSlant;
      texCoords[index * 2] = ii / radialSubdivisions;
      texCoords[index * 2 + 1] = 1 - v;
      index++;
    }
  }

  index = 0;
  for (let yy = 0; yy < verticalSubdivisions + extra; ++yy) {
    for (let ii = 0; ii < radialSubdivisions; ++ii) {
      indices[index * 6] = vertsAroundEdge * (yy + 0) + 0 + ii;
      indices[index * 6 + 1] = vertsAroundEdge * (yy + 0) + 1 + ii;
      indices[index * 6 + 2] = vertsAroundEdge * (yy + 1) + 1 + ii;

      indices[index * 6 + 3] = vertsAroundEdge * (yy + 0) + 0 + ii;
      indices[index * 6 + 4] = vertsAroundEdge * (yy + 1) + 1 + ii;
      indices[index * 6 + 5] = vertsAroundEdge * (yy + 1) + 0 + ii;

      index++;
    }
  }

  return {
    positions: positions,
    normals: normals,
    texCoords: texCoords,
    includes: indices,
  };
};

export function createSphereVertices(
  radius: number,
  subdivisionsAxis: number,
  subdivisionsHeight: number,
  opt_startLatitudeInRadians?: number,
  opt_endLatitudeInRadians?: number,
  opt_startLongitudeInRadians?: number,
  opt_endLongitudeInRadians?: number
): ShapeAttrib {
  if (subdivisionsAxis <= 0 || subdivisionsHeight <= 0) {
    throw Error("subdivisionAxis and subdivisionHeight must be > 0");
  }

  opt_startLatitudeInRadians = opt_startLatitudeInRadians || 0;
  opt_endLatitudeInRadians = opt_endLatitudeInRadians || Math.PI;
  opt_startLongitudeInRadians = opt_startLongitudeInRadians || 0;
  opt_endLongitudeInRadians = opt_endLongitudeInRadians || Math.PI * 2;

  const latRange = opt_endLatitudeInRadians - opt_startLatitudeInRadians;
  const longRange = opt_endLongitudeInRadians - opt_startLongitudeInRadians;

  // We are going to generate our sphere by iterating through its
  // spherical coordinates and generating 2 triangles for each quad on a
  // ring of the sphere.
  const numVertices = (subdivisionsAxis + 1) * (subdivisionsHeight + 1);
  const positions = new Float32Array(3 * numVertices);
  const normals = new Float32Array(3 * numVertices);
  const texCoords = new Float32Array(2 * numVertices);

  // Generate the individual vertices in our vertex buffer.
  let index = 0;
  for (let y = 0; y <= subdivisionsHeight; y++) {
    for (let x = 0; x <= subdivisionsAxis; x++) {
      // Generate a vertex based on its spherical coordinates
      const u = x / subdivisionsAxis;
      const v = y / subdivisionsHeight;
      const theta = longRange * u + opt_startLongitudeInRadians;
      const phi = latRange * v + opt_startLatitudeInRadians;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);
      const ux = cosTheta * sinPhi;
      const uy = cosPhi;
      const uz = sinTheta * sinPhi;

      bufferPush(positions, index, [radius * ux, radius * uy, radius * uz]);
      bufferPush(normals, index, [ux, uy, uz]);
      bufferPush(texCoords, index, [1 - u, v]);
      index++;
    }
  }
  index = 0;
  const numVertsAround = subdivisionsAxis + 1;
  const indices = new Uint16Array(
    3 * subdivisionsAxis * subdivisionsHeight * 2
  );
  for (let x = 0; x < subdivisionsAxis; x++) {
    for (let y = 0; y < subdivisionsHeight; y++) {
      bufferPush(indices, index++, [
        (y + 0) * numVertsAround + x,
        (y + 0) * numVertsAround + x + 1,
        (y + 1) * numVertsAround + x,
        (y + 1) * numVertsAround + x,
        (y + 0) * numVertsAround + x + 1,
        (y + 1) * numVertsAround + x + 1,
      ]);
    }
  }
  return {
    positions: positions,
    normals: normals,
    texcoords: texCoords,
    texCoords: texCoords,
    includes: indices,
  };
}

export function createPlaneVertices(
  width?: number,
  depth?: number,
  subdivisionsWidth?: number,
  subdivisionsDepth?: number,
  matrix?: NumArr
) {
  width = width || 1;
  depth = depth || 1;
  subdivisionsWidth = subdivisionsWidth || 1;
  subdivisionsDepth = subdivisionsDepth || 1;
  matrix = matrix || identity();

  const numVertices = (subdivisionsWidth + 1) * (subdivisionsDepth + 1);
  const positions = new Float32Array(3 * numVertices);
  const normals = new Float32Array(3 * numVertices);
  const texcoords = new Float32Array(2 * numVertices);

  let index = 0;
  for (let z = 0; z <= subdivisionsDepth; z++) {
    for (let x = 0; x <= subdivisionsWidth; x++) {
      const u = x / subdivisionsWidth;
      const v = z / subdivisionsDepth;
      bufferPush(positions, index, [
        width * u - width * 0.5,
        0,
        depth * v - depth * 0.5,
      ]);
      bufferPush(normals, index, [0, 1, 0]);
      bufferPush(texcoords, index, [u, v]);
      index++;
    }
  }
  index = 0;

  const numVertsAcross = subdivisionsWidth + 1;
  const indices = new Uint16Array(
    3 * subdivisionsWidth * subdivisionsDepth * 2
  );

  for (let z = 0; z < subdivisionsDepth; z++) {
    for (let x = 0; x < subdivisionsWidth; x++) {
      bufferPush(indices, index++, [
        (z + 0) * numVertsAcross + x,
        (z + 1) * numVertsAcross + x,
        (z + 0) * numVertsAcross + x + 1,
        (z + 1) * numVertsAcross + x,
        (z + 1) * numVertsAcross + x + 1,
        (z + 0) * numVertsAcross + x + 1,
      ]);
    }
  }

  return {
    positions: positions,
    normals: normals,
    texcoords: texcoords,
    texCoords: texcoords,
    includes: indices,
  };
}



export function createXYPlaneVertices(
  width?: number,
  depth?: number,
  subdivisionsWidth?: number,
  subdivisionsDepth?: number,
  matrix?: NumArr
) {
  width = width || 1;
  depth = depth || 1;
  subdivisionsWidth = subdivisionsWidth || 1;
  subdivisionsDepth = subdivisionsDepth || 1;
  matrix = matrix || identity();

  const numVertices = (subdivisionsWidth + 1) * (subdivisionsDepth + 1);
  const positions = new Float32Array(3 * numVertices);
  const normals = new Float32Array(3 * numVertices);
  const texcoords = new Float32Array(2 * numVertices);

  let index = 0;
  for (let z = 0; z <= subdivisionsDepth; z++) {
    for (let x = 0; x <= subdivisionsWidth; x++) {
      const u = x / subdivisionsWidth;
      const v = z / subdivisionsDepth;
      bufferPush(positions, index, [
        width * u - width * 0.5,
        depth * v - depth * 0.5,
        0,
      ]);
      bufferPush(normals, index, [0, 0, 1]);
      bufferPush(texcoords, index, [u, v]);
      index++;
    }
  }
  index = 0;

  const numVertsAcross = subdivisionsWidth + 1;
  const indices = new Uint16Array(
    3 * subdivisionsWidth * subdivisionsDepth * 2
  );

  for (let z = 0; z < subdivisionsDepth; z++) {
    for (let x = 0; x < subdivisionsWidth; x++) {
      bufferPush(indices, index++, [
        (z + 0) * numVertsAcross + x,
        (z + 1) * numVertsAcross + x,
        (z + 0) * numVertsAcross + x + 1,
        (z + 1) * numVertsAcross + x,
        (z + 1) * numVertsAcross + x + 1,
        (z + 0) * numVertsAcross + x + 1,
      ]);
    }
  }

  return {
    positions: positions,
    normals: normals,
    texcoords: texcoords,
    texCoords: texcoords,
    includes: indices,
  };
}

export const createHeightPlaneVertices = async (url: string, maxHeight = 10, minHeight = 0) => {
  const { data, width, height } = await getImageData(url)
  const getHeight = (x: number, y: number) => minHeight + (data[(y * width + x) * 4] / 255) * (maxHeight - minHeight)

  const cellsDeep = width - 1;
  const cellsAcross = height - 1;

  const positions = new Float32Array(cellsDeep * cellsAcross * 5 * 3)
  const includes = new Uint16Array(cellsDeep * cellsAcross * 12)
  const texcoords = new Float32Array(cellsDeep * cellsAcross * 5 * 2)

  let index = 0;
  for (let z = 0; z < cellsDeep; z++) {
    for (let x = 0; x < cellsAcross; x++) {
      const zn = z + 1;
      const xn = x + 1;
      let h1 = getHeight(z, x),
        h2 = getHeight(z, xn),
        h3 = getHeight(zn, xn),
        h4 = getHeight(zn, x)

      const xc = (x + xn) / 2
      const zc = (z + zn) / 2
      const hc = (h1 + h2 + h3 + h4) / 4

      bufferPush(
        positions,
        index,
        [
          x, h1, z,
          xn, h2, z,
          xn, h3, zn,
          x, h4, zn,
          xc, hc, zc
        ]
      )
      bufferPush(
        texcoords,
        index,
        [
          x / cellsAcross, z / cellsDeep,
          xn / cellsAcross, z / cellsDeep,
          xn / cellsAcross, zn / cellsDeep,
          x / cellsAcross, zn / cellsDeep,
          xc / cellsAcross, zc / cellsDeep,
        ]
      )

      //         
      //      3----2 
      //      |\  /|
      //      | \/4|
      //      | /\ |
      //      |/  \|
      //      0----1 

      const offset = index * 5;
      bufferPush(
        includes,
        index,
        [

          // offset + 3, offset + 0, offset + 2,
          // offset + 2, offset + 0, offset + 1,

          offset + 3, offset + 0, offset + 4,
          offset + 3, offset + 4, offset + 2,
          offset + 2, offset + 4, offset + 1,
          offset + 4, offset + 0, offset + 1,
        ]
      );
      index++
    }
  }

  const modal = generateNormals({
    includes,
    positions,
    texcoords,
  }, edgToRad(10))

  return {
    width,
    height,
    texCoords: modal.texcoords,
    normals: modal.normal,
    ...modal
  }
}
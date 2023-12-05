import { NumArr } from "./math-2d";

export const identity = () => [
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1
]

// 转置矩阵
export const transpose = (m: number[]) => {
  return [
    m[0], m[4], m[8], m[12],
    m[1], m[5], m[9], m[13],
    m[2], m[6], m[10], m[14],
    m[3], m[7], m[11], m[15],
  ];
}

export const orthographic = (left: number, right: number, bottom: number, top: number, near: number, far: number) => {
  const dst = new Float32Array(16);

  dst[ 0] = 2 / (right - left);
  dst[ 1] = 0;
  dst[ 2] = 0;
  dst[ 3] = 0;
  dst[ 4] = 0;
  dst[ 5] = 2 / (top - bottom);
  dst[ 6] = 0;
  dst[ 7] = 0;
  dst[ 8] = 0;
  dst[ 9] = 0;
  dst[10] = 2 / (near - far);
  dst[11] = 0;
  dst[12] = (left + right) / (left - right);
  dst[13] = (bottom + top) / (bottom - top);
  dst[14] = (near + far) / (near - far);
  dst[15] = 1;

  return dst;
}

export const makeZToWMatrix = (fudgeFactor: number) => [
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, fudgeFactor,
  0, 0, 0, 1
]

export const translate = (tx: number, ty: number, tz: number) => [
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  tx, ty, tz, 1
]

export const rotateX = (angleInRadians: number) => {
  const s = Math.sin(angleInRadians)
  const c = Math.cos(angleInRadians)

  return [
    1, 0, 0, 0,
    0, c, s, 0,
    0, -s, c, 0,
    0, 0, 0, 1
  ]
}

export const rotateY = (angleInRadians: number) => {
  const s = Math.sin(angleInRadians)
  const c = Math.cos(angleInRadians)

  return [
    c, 0, -s, 0,
    0, 1, 0, 0,
    s, 0, c, 0,
    0, 0, 0, 1
  ]
}

export const rotateZ = (angleInRadians: number) => {
  const s = Math.sin(angleInRadians)
  const c = Math.cos(angleInRadians)

  return [
    c, s, 0, 0,
    -s, c, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ]
}

export const scale = (sx: number, sy: number, sz: number) => [
  sx, 0, 0, 0,
  0, sy, 0, 0,
  0, 0, sz, 0,
  0, 0, 0, 1
]

// 正交
export const projection = (width: number, height: number, depth: number) => [
  2 / width, 0,           0,         0,
  0,         -2 / height, 0,         0,
  0,         0,           2 / depth, 0,
  -1,        1,           0,         1,
]

// 根据三维bound转化，正交形式
export const orthogonal = (left: number, right: number, top: number, bottom: number, near: number, far: number) => [
  2 / (right - left),             0,                              0,           0,
  0,                              2 / (bottom - top),             0,                          0,
  0,                              0,                              2 / (far - near),           0,
  (left + right) / (left - right),(top + bottom) / (top - bottom),(far + near) / (near - far),1
]

export const perspective = (l: number, r: number, t: number, b: number, n: number, f: number) => [
  2*n/(r-l),   0,           0,           0,
  0,           2*n/(b-t),   0,           0,
  (l+r)/(l-r), (b+t)/(t-b), 2/(f-n),     1,
  0,           0,           -(f+n)/(n-f), 0
]

// 正中间投影 l r 和 t b对称
export const straightPerspective = (w: number, h: number, n: number, f: number) => {
  return  [
    2*n/w, 0,      0,           0,
    0,     -2*n/h, 0,           0,
    0,     0,      2/(f-n),     1,
    0,     0,      -(f+n)/(n-f), 0
  ]
}

/**
 * @param fieldOfViewInRadians 可视角度
 * @param aspect w / h 比例
 * @param near 近面
 * @param far 远面
 */
export const straightPerspective1 = (fieldOfViewInRadians: number, aspect: number, near: number, far: number) => {
  // const a = Math.atan((Math.PI  - fieldOfViewInRadians) / 2)

  // return [
  //   a/aspect, 0, 0,           0,
  //   0,  -a, 0,           0,
  //   0,   0, 1/(far-near),     1,
  //   0,   0, -(near)/(far-near), 0
  // ]
  var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
    var rangeInv = 1.0 / (near - far);

    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (near + far) * rangeInv, -1,
      0, 0, near * far * rangeInv * 2, 0
    ];
}


export const multiply =  (...matrixs: number[][]): number[] => {
  if (matrixs.length === 1) {
    return matrixs[0]
  }

  const radio = 4;
  const count = radio * radio
  const result: number[] = []

  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / radio)
    const column = i % radio; 

    let currentResult = 0;
    for (let offset = 0; offset < radio; offset++) {
      const rowIndex = row * radio + offset
      const columnIndex = column + offset * radio
      currentResult += matrixs[1][rowIndex] * matrixs[0][columnIndex]
    }
    result[i] = currentResult
  }

  if (matrixs.length === 2) {
    return result;
  } else {
    return multiply(result, ...matrixs.slice(2))
  }
}

export const positionTransform = (pos: NumArr, matrix: number[]) => {
  const radio = 4
  const w = pos[0] * matrix[3] + pos[1] * matrix[radio + 3] + pos[2] * matrix[radio * 2 + 3] + matrix[radio * 3 + 3]
  return [
    (pos[0] * matrix[0] + pos[1] * matrix[radio] + pos[2] * matrix[radio * 2] + matrix[radio * 3]) / w,
    (pos[0] * matrix[1] + pos[1] * matrix[radio + 1] + pos[2] * matrix[radio * 2 + 1] + matrix[radio * 3 + 1]) / w,
    (pos[0] * matrix[2] + pos[1] * matrix[radio + 2] + pos[2] * matrix[radio * 2 + 2] + matrix[radio * 3 + 2]) / w,
  ]
}

export const addVectors = (a: NumArr, b: NumArr, v: NumArr = []) => {
  v[0] = a[0] + b[0];
  v[1] = a[1] + b[1];
  v[2] = a[2] + b[2];
  return v
}

export const subtractVectors = (a: NumArr, b: NumArr) => 
  [a[0] - b[0], a[1] - b[1], a[2] - b[2]]

export const normalVector = (v: NumArr, cv: NumArr = []) => {
  const [x, y, z] = v
  const len = Math.sqrt(x*x + y*y + z*z)
  if (len > 0) {
    cv[0] = x / len
    cv[1] = y / len
    cv[2] = z / len
  } else {
    cv[0] = 0
    cv[1] = 0
    cv[2] = 0
  }
  return cv
}

// 向量叉乘，叉乘结果向量必然同事垂直两个向量
export const cross = (a: NumArr, b: NumArr) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0]
]


// 对准一个目标（实际上是制作一个矩阵，将target扭转到cameraPosition）
export const lookAt = (cameraPosition: number[], target: number[], up: number[]) => {
  // camera是正对-z轴的 所以需要反向
  const zAxis = normalVector(subtractVectors(cameraPosition, target))
  // 相对于zAxis做出x朝向，注意顺序不能反，因为三维有两个垂直朝向，通过叉乘通过顺序确认
  const xAxis = normalVector(cross(up, zAxis));
  const yAxis = normalVector(cross(zAxis, xAxis))

  return [
    ...xAxis, 0,
    ...yAxis, 0,
    ...zAxis, 0,
    ...cameraPosition, 1
  ]
}

export const dot = (v1: NumArr, v2: NumArr) => 
  v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2]


export const inverse = (m: number[]) => {
  var m00 = m[0 * 4 + 0];
  var m01 = m[0 * 4 + 1];
  var m02 = m[0 * 4 + 2];
  var m03 = m[0 * 4 + 3];
  var m10 = m[1 * 4 + 0];
  var m11 = m[1 * 4 + 1];
  var m12 = m[1 * 4 + 2];
  var m13 = m[1 * 4 + 3];
  var m20 = m[2 * 4 + 0];
  var m21 = m[2 * 4 + 1];
  var m22 = m[2 * 4 + 2];
  var m23 = m[2 * 4 + 3];
  var m30 = m[3 * 4 + 0];
  var m31 = m[3 * 4 + 1];
  var m32 = m[3 * 4 + 2];
  var m33 = m[3 * 4 + 3];
  var tmp_0  = m22 * m33;
  var tmp_1  = m32 * m23;
  var tmp_2  = m12 * m33;
  var tmp_3  = m32 * m13;
  var tmp_4  = m12 * m23;
  var tmp_5  = m22 * m13;
  var tmp_6  = m02 * m33;
  var tmp_7  = m32 * m03;
  var tmp_8  = m02 * m23;
  var tmp_9  = m22 * m03;
  var tmp_10 = m02 * m13;
  var tmp_11 = m12 * m03;
  var tmp_12 = m20 * m31;
  var tmp_13 = m30 * m21;
  var tmp_14 = m10 * m31;
  var tmp_15 = m30 * m11;
  var tmp_16 = m10 * m21;
  var tmp_17 = m20 * m11;
  var tmp_18 = m00 * m31;
  var tmp_19 = m30 * m01;
  var tmp_20 = m00 * m21;
  var tmp_21 = m20 * m01;
  var tmp_22 = m00 * m11;
  var tmp_23 = m10 * m01;

  var t0 = (tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31) -
      (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
  var t1 = (tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31) -
      (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
  var t2 = (tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31) -
      (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
  var t3 = (tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21) -
      (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);

  var d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);

  return [
    d * t0,
    d * t1,
    d * t2,
    d * t3,
    d * ((tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30) -
          (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30)),
    d * ((tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30) -
          (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30)),
    d * ((tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30) -
          (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30)),
    d * ((tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20) -
          (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20)),
    d * ((tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33) -
          (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33)),
    d * ((tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33) -
          (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33)),
    d * ((tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33) -
          (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33)),
    d * ((tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23) -
          (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23)),
    d * ((tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12) -
          (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22)),
    d * ((tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22) -
          (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02)),
    d * ((tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02) -
          (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12)),
    d * ((tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12) -
          (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02))
  ];
}
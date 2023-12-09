export const edgToRad = (d: number) => (d * Math.PI) / 180;

export type NumArr =
  | number[]
  | Float32Array
  | Uint16Array
  | Uint8Array
  | Uint32Array;

// 二维点辅助方法
export const v2 = {
  mult(v: NumArr, multiplier: number | NumArr) {
    if (typeof multiplier === "number") {
      return [v[0] * multiplier, v[1] * multiplier];
    } else {
      return [v[0] * multiplier[0], v[1] * multiplier[1]];
    }
  },
  add(...vs: NumArr[]) {
    const result = [0, 0];
    vs.forEach((v) => {
      result[0] += v[0];
      result[1] += v[1];
    });
    return result;
  },
  subtract(v1: NumArr, v2: NumArr) {
    return [v1[0] - v2[0], v1[1] - v2[1]];
  },
  dot(v1: NumArr, v2: NumArr) {
    return v1[0] * v2[0] + v1[1] * v2[1];
  },
  lerp(v1: NumArr, v2: NumArr, t: number) {
    return [v1[0] + (v2[0] - v1[0]) * t, v1[1] + (v2[1] - v1[1]) * t];
  },
  distanceSq(v1: NumArr, v2: NumArr) {
    const [x, y] = this.subtract(v1, v2);
    return x * x + y * y;
  },
  distance(v1: NumArr, v2: NumArr) {
    return Math.sqrt(this.distanceSq(v1, v2));
  },
  distanceToSegmentSq(p: NumArr, v1: NumArr, v2: NumArr) {
    const lSq = this.distanceSq(v1, v2);
    if (lSq === 0) {
      return this.distanceSq(p, v1);
    }
    // 对于相同起点，点乘可以算出投影中距离的平方，比如投影点为p1 比如下方点乘结果为 vp1距离的平方
    // 算出p1在[v1, v2]的百分比t
    let t = this.dot(this.subtract(p, v1), this.subtract(v2, v1)) / lSq;
    // 限定在vw线段上
    t = Math.min(1, Math.max(0, t));
    // 算出p距离最近的投影p1就算出离线段距离
    return this.distanceSq(p, this.lerp(v1, v2, t));
  },
};

// 贝塞尔曲线公式
// invT = (1 - t)
// P = P1 * invT^3 +
//     P2 * 3 * t * invT^2 +
//     P3 * 3 * invT * t^2 +
//     P4 * t^3
// 获取贝塞尔曲线上的点
export const getPointOnBazierCurver = (
  points: NumArr[],
  t: number,
  offset = 0
) => {
  const invT = 1 - t;
  return v2.add(
    v2.mult(points[offset + 0], Math.pow(invT, 3)),
    v2.mult(points[offset + 1], 3 * t * Math.pow(invT, 2)),
    v2.mult(points[offset + 3], 3 * invT * Math.pow(t, 2)),
    v2.mult(points[offset + 4], Math.pow(t, 3))
  );
};

// 获取贝塞尔曲线，返回点集合
export const getPointsOnBazierCuver = (
  points: NumArr[],
  numPoint: number,
  offset = 0
) => {
  const result: number[][] = [];
  for (let i = 0; i < numPoint; i++) {
    const t = (i * 1) / (numPoint - 1);
    result.push(getPointOnBazierCurver(points, t, offset));
  }
  return result;
};

// 获取贝塞尔曲线的平滑程度
// 对于比较锐化的曲线可以拆分曲线，返回锐化度
export const getBazierCuverFlatness = (points: NumArr[], offset = 0) => {
  const p1 = points[offset + 0];
  const p2 = points[offset + 1];
  const p3 = points[offset + 2];
  const p4 = points[offset + 3];

  let ux = 3 * p2[0] - 2 * p1[0] - p4[0];
  ux *= ux;
  let uy = 3 * p2[1] - 2 * p1[1] - p4[1];
  uy *= uy;
  let vx = 3 * p3[0] - 2 * p4[0] - p1[0];
  vx *= vx;
  let vy = 3 * p3[1] - 2 * p4[1] - p1[1];
  vy *= vy;

  if (ux < vx) {
    ux = vx;
  }

  if (uy < vy) {
    uy = vy;
  }

  return ux + uy;
};

// 通过锐化程度切分获取贝塞尔曲线，
export const getPointsOnBazierCurverBySplitting = (
  points: NumArr[],
  tolerance: number,
  offset = 0,
  newpoints: NumArr[] = []
) => {
  if (getBazierCuverFlatness(points, offset) < tolerance) {
    newpoints.push(points[offset], points[offset + 3]);
  } else {
    const t = 0.5;
    const p1 = points[offset + 0];
    const p2 = points[offset + 1];
    const p3 = points[offset + 2];
    const p4 = points[offset + 3];

    const q1 = v2.lerp(p1, p2, t);
    const q2 = v2.lerp(p2, p3, t);
    const q3 = v2.lerp(p3, p4, t);

    const r1 = v2.lerp(q1, q2, t);
    const r2 = v2.lerp(q2, q3, t);

    const target = v2.lerp(r1, r2, t);

    getPointsOnBazierCurverBySplitting(
      [p1, q1, r1, target],
      tolerance,
      0,
      newpoints
    );
    getPointsOnBazierCurverBySplitting(
      [target, r2, q3, p4],
      tolerance,
      0,
      newpoints
    );
  }
  return newpoints;
};

// 多条贝塞尔曲线通过锐化程度分割生成贝塞尔曲线点数据
export const getPointsOnBazierCurvers = (
  points: NumArr[],
  tolerance: number,
  curverOffset = 3
) => {
  const newpoints: number[][] = [];
  const offset = 4 - curverOffset;
  const count = (points.length - offset) / curverOffset;

  for (let i = 0; i < count; i++) {
    getPointsOnBazierCurverBySplitting(
      points,
      tolerance,
      i * curverOffset,
      newpoints
    );
  }
  return newpoints;
};

// 简单化点，对过于密集的点稀疏化，使用二分法
const _simplifyPoints = (
  points: NumArr[],
  epsilon: number,
  start = 0,
  end = points.length,
  newPoints: NumArr[] = []
) => {
  const s = points[start];
  const e = points[end - 1];
  let maxDistSq = 0;
  let maxIdx = 1;

  // 求出距离起点终点最远的点
  for (let i = start + 1; i < end; i++) {
    const distSq = v2.distanceToSegmentSq(points[i], s, e);
    if (distSq > maxDistSq) {
      maxDistSq = distSq;
      maxIdx = i;
    }
  }

  // 如果距离很远，则继续拆分子项
  if (Math.sqrt(maxDistSq) > epsilon) {
    _simplifyPoints(points, epsilon, start, maxIdx + 1, newPoints);
    _simplifyPoints(points, epsilon, maxIdx, end, newPoints);
  } else {
    newPoints.push(s, e);
  }
  return newPoints;
};

export const simplifyPoints = (
  points: NumArr[],
  epsilon: number,
  start = 0,
  end = points.length,
  repeat = true
) => {
  const newpoints = _simplifyPoints(points, epsilon, start, end);
  if (repeat) {
    return newpoints;
  }
  const outpoints = [newpoints[0]];
  for (let i = 1; i < newpoints.length - 1; i += 2) {
    outpoints.push(newpoints[i]);
  }
  return outpoints;
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

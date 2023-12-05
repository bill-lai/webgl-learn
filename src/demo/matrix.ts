export const identity = () => {
  return [
    1, 0, 0,
    0, 1, 0,
    0, 0, 1
  ]
}

export const translate = (tx: number, ty: number) => {
  return [
    1,  0,  0,
    0,  1,  0,
    tx, ty, 1
  ]
}

export const rotate = (angleInRadians: number) => {
  const s = Math.sin(angleInRadians)
  const c = Math.cos(angleInRadians)

  return [
    c, -s, 0,
    s,  c, 0,
    0,  0, 1
  ]
}

export const projection = (width: number, height: number) => {
  return [
    2 / width, 0, 0,
    0, -2 / height, 0,
    -1, 1, 1
  ]
}

export const scale = (sx: number, sy: number) => {
  return [
    sx, 0,  0,
    0,  sy, 0,
    0,  0,  1
  ]
}

export const multiply = (...matrixs: number[][]): number[] => {
  if (matrixs.length === 1) {
    return matrixs[0]
  }

  const [
    aa1, ab1, ac1,
    aa2, ab2, ac2,
    aa3, ab3, ac3
  ] = matrixs[1]
  const [
    ba1, bb1, bc1,
    ba2, bb2, bc2,
    ba3, bb3, bc3
  ] = matrixs[0]
  
  const result = [
    aa1 * ba1 + ab1 * ba2 + ac1 * ba3, aa1 * bb1 + ab1 * bb2 + ac1 * bb3,  aa1 * bc1 + ab1 * bc2 + ac1 * bc3,
    aa2 * ba1 + ab2 * ba2 + ac2 * ba3, aa2 * bb1 + ab2 * bb2 + ac2 * bb3,  aa2 * bc1 + ab2 * bc2 + ac2 * bc3,
    aa3 * ba1 + ab3 * ba2 + ac3 * ba3, aa3 * bb1 + ab3 * bb2 + ac3 * bb3,  aa3 * bc1 + ab3 * bc2 + ac3 * bc3,  
  ]
  
  if (matrixs.length === 2) {
    return result;
  } else {
    return multiply(result, ...matrixs.slice(2))
  }
}
import { ref, watch } from "vue"
import { NumArr, bindKeyboard, canvasBindMouse, edgToRad, multiply, rotateX, rotateY, rotateZ, scaleVector, translate, v2 } from "."

export const bindFPSCamera = (canvas: HTMLCanvasElement, initMatrix: NumArr) => {
  const move: [number, number, number] = [0, 0, 0]
  const angle: [number, number, number] = [0, 0, 0]

  const matrix = ref(initMatrix)
  const updateMatrix = () => {
    const mutMatrixs: NumArr[] = []
    if (move.filter(i => i !== 0).length > 0) {
      mutMatrixs.push(translate(...move))
    }

    angle[0] !== 0 && mutMatrixs.push(rotateX(angle[0]))
    angle[1] !== 0 && mutMatrixs.push(rotateY(angle[1]))
    angle[2] !== 0 && mutMatrixs.push(rotateZ(angle[2]))
    
    if (mutMatrixs.length > 0) {
      matrix.value = initMatrix = multiply(initMatrix, ...mutMatrixs)
      move.fill(0)
      angle.fill(0)
    }
  }

  // 监听y轴和x轴旋转 
  const range = Math.PI / 2
  const current = canvasBindMouse(canvas)
  watch(
    () => {
      if (current.value) {
        const direction = v2.subtract(current.value.start, current.value.end);
        return { 
          rotate: v2.mult(direction, [-2 / canvas.width * range, -2 / canvas.height * range]),
          moveZ: current.value.end[2] - current.value.start[2]
        }
      }
    },
    (setting) => {
      if (!setting) return;
      const { rotate, moveZ } = setting
      if (rotate[0] || rotate[1]) {
        angle[0] += rotate[1]
        angle[1] += rotate[0]
      }
      if (moveZ) {
        move[2] = moveZ * 0.05
      }
      updateMatrix()
    }
  )

  const moveSpeed = 6
  const rotateSpeed = edgToRad(40)
  bindKeyboard(document.documentElement, 'wsadqr', (keys, mis) => {
    for (const k of keys) {
        // 监听移动， W S A D 键
      if ('wsad'.includes(k)) {
        const directionMap: any = {
          // a: scaleVector(initMatrix.slice(0, 3), -1),
          // d: initMatrix.slice(0, 3),
          // w: initMatrix.slice(4, 7),
          // s: scaleVector(initMatrix.slice(4, 7), -1),
          a: scaleVector([1, 0, 0], -1),
          d: [1, 0, 0],
          w: [0, 1, 0],
          s: scaleVector([0, 1, 0], -1),
        }
        const currentMove = scaleVector(directionMap[k], moveSpeed * mis)
        move[0] += currentMove[0]
        move[1] += currentMove[1]
        move[2] += currentMove[2]
      }
      // z轴旋转
      if ('qr'.includes(k)) {
        angle[2] -= rotateSpeed * mis * ('q' === k ? -1 : 1);
      }
      updateMatrix()
    }
  })
  return matrix;
}